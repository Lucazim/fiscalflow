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
        result = await pool.query(
          `
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
          ORDER BY o.vencimento
          `
        );
      } else {
        result = await pool.query(
          `
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
          INNER JOIN empresa_usuarios eu
            ON eu.empresa_id = e.id
          WHERE eu.usuario_id = $1
          ORDER BY o.vencimento
          `,
          [usuario.id]
        );
      }

      return res.json(result.rows);

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao listar obrigações",
      });
    }
  }
);

export default router;