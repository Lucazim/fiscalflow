import { Router } from "express";
import { pool } from "../database/connection";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get(
  "/obrigacoes/exportar",
  authMiddleware,
  async (req, res) => {
    try {
      const { status } = req.query;

      let query = `
        SELECT
          e.razao_social,
          o.tipo,
          o.competencia,
          o.vencimento,
          o.status
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

      query += ` ORDER BY o.vencimento`;

      const result = await pool.query(
        query,
        params
      );

      let csv =
        "Empresa,Tipo,Competencia,Vencimento,Status\n";

      result.rows.forEach((row) => {
        csv +=
          `${row.razao_social},` +
          `${row.tipo},` +
          `${row.competencia},` +
          `${new Date(row.vencimento)
            .toISOString()
            .split("T")[0]},` +
          `${row.status}\n`;
      });

      res.setHeader(
        "Content-Type",
        "text/csv"
      );

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=obrigacoes.csv"
      );

      return res.send(csv);

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao exportar relatório",
      });
    }
  }
);

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