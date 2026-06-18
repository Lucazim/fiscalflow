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

      const {
        inicio,
        fim,
        empresaId,
        status
      } = req.query;

      let query = `
        SELECT
          o.id,
          e.razao_social,
          o.tipo,
          o.competencia,
          o.vencimento,
          o.status
        FROM obrigacoes o
        INNER JOIN empresas e
          ON e.id = o.empresa_id
      `;

      const params: any[] = [];

      if (usuario.tipo === "CLIENTE") {
        query += `
          INNER JOIN empresa_usuarios eu
            ON eu.empresa_id = e.id
        `;
      }

      query += ` WHERE 1=1 `;

      if (usuario.tipo === "CLIENTE") {
        params.push(usuario.id);

        query += `
          AND eu.usuario_id = $${params.length}
        `;
      }

      if (inicio) {
        params.push(inicio);

        query += `
          AND o.vencimento >= $${params.length}
        `;
      }

      if (fim) {
        params.push(fim);

        query += `
          AND o.vencimento <= $${params.length}
        `;
      }

      if (empresaId) {
        params.push(empresaId);

        query += `
          AND o.empresa_id = $${params.length}
        `;
      }

      if (status) {
        params.push(status);

        query += `
          AND o.status = $${params.length}
        `;
      }

      query += `
        ORDER BY o.vencimento
      `;

      const result = await pool.query(
        query,
        params
      );

      return res.json(result.rows);

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao carregar agenda fiscal"
      });
    }
  }
);

export default router;