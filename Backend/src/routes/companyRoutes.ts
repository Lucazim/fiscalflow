import { Router } from "express";
import { pool } from "../database/connection";
import { v4 as uuidv4 } from "uuid";
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
      razao_social,
      nome_fantasia,
      cnpj,
      regime_tributario,
    } = req.body;

    const id = uuidv4();

    await pool.query(
      `
      INSERT INTO empresas
      (
        id,
        razao_social,
        nome_fantasia,
        cnpj,
        regime_tributario
      )
      VALUES
      ($1, $2, $3, $4, $5)
      `,
      [
        id,
        razao_social,
        nome_fantasia,
        cnpj,
        regime_tributario,
      ]
    );

    res.status(201).json({
      message: "Empresa criada com sucesso",
      id,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erro ao criar empresa",
    });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const empresas = await pool.query(
      "SELECT * FROM empresas ORDER BY created_at DESC"
    );

    res.json(empresas.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erro ao listar empresas",
    });
  }
});

export default router;