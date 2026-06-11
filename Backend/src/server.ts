import express from "express";
import { pool } from "./database/connection";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import testRoutes from "./routes/testRoutes";
import companyRoutes from "./routes/companyRoutes";

const app = express();

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/usuarios", userRoutes);
app.use("/teste", testRoutes);
app.use("/empresas", companyRoutes);

app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");

  res.json({
    message: "FiscalFlow API Online",
    database: "Conectado",
    horarioBanco: result.rows[0],
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});