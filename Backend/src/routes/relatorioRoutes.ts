import { Router } from "express";
import { pool } from "../database/connection";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get(
  "/obrigacoes",
  authMiddleware,
  async (req, res) => {
    try {
      const { status, empresaId } = req.query;

      let query = `
        SELECT
          o.id,
          o.tipo,
          o.competencia,
          o.vencimento,
          o.status,
          e.razao_social
        FROM obrigacoes o
        INNER JOIN empresas e
          ON e.id = o.empresa_id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (status) {
        params.push(status);
        query += ` AND o.status = $${params.length}`;
      }

      if (empresaId) {
        params.push(empresaId);
        query += ` AND o.empresa_id = $${params.length}`;
      }

      query += ` ORDER BY o.vencimento`;

      const result = await pool.query(
        query,
        params
      );

      return res.json(result.rows);

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao gerar relatório",
      });
    }
  }
);

export default router;