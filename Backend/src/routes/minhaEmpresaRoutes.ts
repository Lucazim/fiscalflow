import { Router } from "express";
import { pool } from "../database/connection";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const usuario = (req as any).usuario;

      const result = await pool.query(
        `
        SELECT
          e.id,
          e.razao_social,
          e.nome_fantasia,
          e.cnpj
        FROM empresas e
        INNER JOIN empresa_usuarios eu
          ON eu.empresa_id = e.id
        WHERE eu.usuario_id = $1
        `,
        [usuario.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Usuário não possui empresa vinculada"
        });
      }

      return res.json(result.rows[0]);

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao buscar empresa"
      });
    }
  }
);

export default router;