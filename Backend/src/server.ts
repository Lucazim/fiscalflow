import express from "express";
import { pool } from "./database/connection";

const app = express();

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "FiscalFlow API Online",
      database: "Conectado",
      horarioBanco: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao conectar ao banco",
      error,
    });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});