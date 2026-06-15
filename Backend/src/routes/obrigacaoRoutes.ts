import { Router } from "express";
import { pool } from "../database/connection";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "CONTADOR"]),
  async (req, res) => {
    try {
      const {
        empresaId,
        tipo,
        competencia,
        vencimento,
        observacao,
      } = req.body;

      const empresa = await pool.query(
        "SELECT id FROM empresas WHERE id = $1",
        [empresaId]
      );

      if (empresa.rows.length === 0) {
        return res.status(404).json({
          message: "Empresa não encontrada",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO obrigacoes
        (
          empresa_id,
          tipo,
          competencia,
          vencimento,
          observacao
        )
        VALUES
        ($1, $2, $3, $4, $5)
        RETURNING id
        `,
        [
          empresaId,
          tipo,
          competencia,
          vencimento,
          observacao,
        ]
      );

      return res.status(201).json({
        message: "Obrigação criada com sucesso",
        id: result.rows[0].id,
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao criar obrigação",
      });
    }
  }
);

export default router;