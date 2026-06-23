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
  result = await pool.query(
    `
    SELECT
      o.id,
      t.nome AS tipo,
      e.razao_social,
      o.vencimento
    FROM obrigacoes o
    INNER JOIN empresas e
      ON e.id = o.empresa_id
    INNER JOIN tipos_obrigacao t
      ON t.id = o.tipo_obrigacao_id
    WHERE
      o.status = 'PENDENTE'
      AND o.vencimento BETWEEN CURRENT_DATE
      AND CURRENT_DATE + INTERVAL '3 days'
    ORDER BY o.vencimento
    `
  );
} else {
  result = await pool.query(
    `
    SELECT
      o.id,
      t.nome AS tipo,
      e.razao_social,
      o.vencimento
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
      AND CURRENT_DATE + INTERVAL '3 days'
    ORDER BY o.vencimento
    `,
    [usuario.id]
  );
}

const notificacoes = result.rows.map((item) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(item.vencimento);
  vencimento.setHours(0, 0, 0, 0);

  const diferencaMs =
    vencimento.getTime() - hoje.getTime();

  const diasRestantes = Math.round(
    diferencaMs / (1000 * 60 * 60 * 24)
  );

  let titulo: string;
  let prioridade: string;

if (diasRestantes === 0) {
  titulo = `${item.tipo} vence hoje`;
  prioridade = "URGENTE";
} else if (diasRestantes === 1) {
  titulo = `${item.tipo} vence amanhã`;
  prioridade = "URGENTE";
} else if (diasRestantes === 2) {
  titulo = `${item.tipo} vence em 2 dias`;
  prioridade = "ATENCAO";
} else {
  titulo = `${item.tipo} vence em ${diasRestantes} dias`;
  prioridade = "NORMAL";
}

  return {
    titulo,
    mensagem:
      `A obrigação ${item.tipo} da empresa ` +
      `${item.razao_social} vence em ` +
      `${vencimento.toISOString().split("T")[0]}`,
    prioridade,
    diasRestantes,
    obrigacaoId: item.id,
  };
});

return res.json(notificacoes);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao listar notificações",
      });
    }
  }
);

export default router;