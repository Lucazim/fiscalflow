import { Router } from "express";
import { pool } from "../database/connection";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          nome,
          descricao,
          ativo
        FROM tipos_obrigacao
        ORDER BY nome
      `);

      return res.json(result.rows);

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao buscar tipos de obrigação"
      });
    }
  }
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const {
        nome,
        descricao
      } = req.body;

      const result = await pool.query(
        `
        INSERT INTO tipos_obrigacao
        (
          nome,
          descricao
        )
        VALUES
        (
          $1,
          $2
        )
        RETURNING id
        `,
        [
          nome,
          descricao
        ]
      );

      return res.status(201).json({
        message: "Tipo criado com sucesso",
        id: result.rows[0].id
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao criar tipo"
      });
    }
  }
);

export default router;