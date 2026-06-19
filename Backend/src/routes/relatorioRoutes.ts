import { Router } from "express";
import ExcelJS from "exceljs";
import { pool } from "../database/connection";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get(
  "/obrigacoes/excel",
  authMiddleware,
  async (req, res) => {
    try {
      const { status } = req.query;

      let query = `
        SELECT
          e.razao_social,
          t.nome AS tipo,
          o.competencia,
          o.vencimento,
          o.status
        FROM obrigacoes o
        INNER JOIN empresas e
          ON e.id = o.empresa_id
        INNER JOIN tipos_obrigacao t
          ON t.id = o.tipo_obrigacao_id
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

      const workbook = new ExcelJS.Workbook();

      const worksheet =
        workbook.addWorksheet("Obrigacoes");

      worksheet.columns = [
        {
          header: "Empresa",
          key: "empresa",
          width: 40
        },
        {
          header: "Tipo",
          key: "tipo",
          width: 20
        },
        {
          header: "Competência",
          key: "competencia",
          width: 20
        },
        {
          header: "Vencimento",
          key: "vencimento",
          width: 20
        },
        {
          header: "Status",
          key: "status",
          width: 20
        }
      ];

      result.rows.forEach((row) => {
        worksheet.addRow({
          empresa: row.razao_social,
          tipo: row.tipo,
          competencia: row.competencia,
          vencimento: new Date(row.vencimento)
            .toISOString()
            .split("T")[0],
          status: row.status
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=obrigacoes.xlsx"
      );

      await workbook.xlsx.write(res);

      res.end();

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao exportar Excel",
      });
    }
  }
);

router.get(
  "/obrigacoes/exportar",
  authMiddleware,
  async (req, res) => {
    try {
      const { status } = req.query;

      let query = `
        SELECT
          e.razao_social,
          t.nome AS tipo,
          o.competencia,
          o.vencimento,
          o.status
        FROM obrigacoes o
        INNER JOIN empresas e
          ON e.id = o.empresa_id
        INNER JOIN tipos_obrigacao t
          ON t.id = o.tipo_obrigacao_id
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
          t.nome AS tipo,
          o.competencia,
          o.vencimento,
          o.status,
          e.razao_social
        FROM obrigacoes o
        INNER JOIN empresas e
          ON e.id = o.empresa_id
        INNER JOIN tipos_obrigacao t
          ON t.id = o.tipo_obrigacao_id
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