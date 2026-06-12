import { Router } from "express";
import { pool } from "../database/connection";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const usuarioToken = (req as any).usuario;

      const usuarioResult = await pool.query(
        `
        SELECT
          id,
          nome,
          email,
          tipo,
          ativo
        FROM usuarios
        WHERE id = $1
        `,
        [usuarioToken.id]
      );

      if (usuarioResult.rows.length === 0) {
        return res.status(404).json({
          message: "Usuário não encontrado",
        });
      }

      const empresaResult = await pool.query(
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
        [usuarioToken.id]
      );

      return res.json({
        usuario: usuarioResult.rows[0],
        empresa: empresaResult.rows[0] || null,
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao buscar dados do usuário",
      });
    }
  }
);

export default router;