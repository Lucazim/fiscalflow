import { Router } from "express";
import { pool } from "../database/connection";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const { empresaId, usuarioId } = req.body;

      const empresa = await pool.query(
        "SELECT id FROM empresas WHERE id = $1",
        [empresaId]
      );

      if (empresa.rows.length === 0) {
        return res.status(404).json({
          message: "Empresa não encontrada",
        });
      }

      const usuario = await pool.query(
        "SELECT id FROM usuarios WHERE id = $1",
        [usuarioId]
      );

      if (usuario.rows.length === 0) {
        return res.status(404).json({
          message: "Usuário não encontrado",
        });
      }

      await pool.query(
        `
        INSERT INTO empresa_usuarios
        (
          empresa_id,
          usuario_id
        )
        VALUES
        ($1, $2)
        `,
        [empresaId, usuarioId]
      );

      return res.status(201).json({
        message: "Vínculo criado com sucesso",
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao criar vínculo",
      });
    }
  }
);

export default router;