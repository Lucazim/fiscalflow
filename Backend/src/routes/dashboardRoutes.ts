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
            t.nome AS tipo,
            o.vencimento,
            o.status
          FROM obrigacoes o
          INNER JOIN empresas e
            ON e.id = o.empresa_id
          INNER JOIN tipos_obrigacao t
            ON t.id = o.tipo_obrigacao_id
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
            t.nome AS tipo,
            o.vencimento,
            o.status
          FROM obrigacoes o
          INNER JOIN empresas e
            ON e.id = o.empresa_id
          INNER JOIN tipos_obrigacao t
            ON t.id = o.tipo_obrigacao_id
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

router.post(
  "/processar-atrasadas",
  authMiddleware,
  async (req, res) => {
    try {
      const usuario = (req as any).usuario;

      if (
        usuario.tipo !== "ADMIN" &&
        usuario.tipo !== "CONTADOR"
      ) {
        return res.status(403).json({
          message: "Acesso negado",
        });
      }

      const result = await pool.query(
        `
        UPDATE obrigacoes
        SET status = 'ATRASADO'
        WHERE
          status = 'PENDENTE'
          AND vencimento < CURRENT_DATE
        RETURNING id
        `
      );

      return res.json({
        message: "Processamento concluído",
        obrigacoesAtualizadas: result.rowCount
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao processar obrigações atrasadas",
      });
    }
  }
);

router.get(
  "/atrasadas",
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
            t.nome AS tipo,
            o.competencia,
            o.vencimento,
            o.status
          FROM obrigacoes o
          INNER JOIN empresas e
            ON e.id = o.empresa_id
          INNER JOIN tipos_obrigacao t
            ON t.id = o.tipo_obrigacao_id
          WHERE o.status = 'ATRASADO'
          ORDER BY o.vencimento
        `);
      } else {
        result = await pool.query(
          `
          SELECT
            o.id,
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
          INNER JOIN empresa_usuarios eu
            ON eu.empresa_id = e.id
          WHERE
            eu.usuario_id = $1
            AND o.status = 'ATRASADO'
          ORDER BY o.vencimento
          `,
          [usuario.id]
        );
      }

      return res.json(result.rows);

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao buscar obrigações atrasadas",
      });
    }
  }
);

export default router;