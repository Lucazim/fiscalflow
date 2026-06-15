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

      let result;

      if (
        usuario.tipo === "ADMIN" ||
        usuario.tipo === "CONTADOR"
      ) {
        result = await pool.query(`
          SELECT
            COUNT(*) FILTER (WHERE status = 'PENDENTE') AS pendentes,
            COUNT(*) FILTER (WHERE status = 'PAGO') AS pagas,
            COUNT(*) FILTER (WHERE status = 'ATRASADO') AS atrasadas,
            COUNT(*) AS total
          FROM obrigacoes
        `);
      } else {
        result = await pool.query(
          `
          SELECT
            COUNT(*) FILTER (WHERE o.status = 'PENDENTE') AS pendentes,
            COUNT(*) FILTER (WHERE o.status = 'PAGO') AS pagas,
            COUNT(*) FILTER (WHERE o.status = 'ATRASADO') AS atrasadas,
            COUNT(*) AS total
          FROM obrigacoes o
          INNER JOIN empresa_usuarios eu
            ON eu.empresa_id = o.empresa_id
          WHERE eu.usuario_id = $1
          `,
          [usuario.id]
        );
      }

      return res.json(result.rows[0]);

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao carregar dashboard",
      });
    }
  }
);

router.get(
  "/proximos-vencimentos",
  authMiddleware,
  async (req, res) => {
    try {
      const usuario = (req as any).usuario;

      let result;

      if (
        usuario.tipo === "ADMIN" ||
        usuario.tipo === "CONTADOR"
      ) {
        result = await pool.query(`
          SELECT
            o.id,
            e.razao_social,
            o.tipo,
            o.vencimento,
            o.status
          FROM obrigacoes o
          INNER JOIN empresas e
            ON e.id = o.empresa_id
          WHERE
            o.status = 'PENDENTE'
            AND o.vencimento BETWEEN CURRENT_DATE
            AND CURRENT_DATE + INTERVAL '7 days'
          ORDER BY o.vencimento
        `);
      } else {
        result = await pool.query(
          `
          SELECT
            o.id,
            e.razao_social,
            o.tipo,
            o.vencimento,
            o.status
          FROM obrigacoes o
          INNER JOIN empresas e
            ON e.id = o.empresa_id
          INNER JOIN empresa_usuarios eu
            ON eu.empresa_id = e.id
          WHERE
            eu.usuario_id = $1
            AND o.status = 'PENDENTE'
            AND o.vencimento BETWEEN CURRENT_DATE
            AND CURRENT_DATE + INTERVAL '7 days'
          ORDER BY o.vencimento
          `,
          [usuario.id]
        );
      }

      return res.json(result.rows);

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao buscar próximos vencimentos",
      });
    }
  }
);

export default router;