import { Router } from "express";
import { pool } from "../database/connection";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { nome, email, senha, tipo } = req.body;
    const senhaHash = await bcrypt.hash(senha, 10);

    const id = uuidv4();

    await pool.query(
      `
      INSERT INTO usuarios
      (id, nome, email, senha_hash, tipo)
      VALUES
      ($1, $2, $3, $4, $5)
      `,
      [id, nome, email, senhaHash, tipo]
    );

    res.status(201).json({
      message: "Usuário criado com sucesso",
      id,
    });
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
});

export default router;