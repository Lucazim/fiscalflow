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
      o.vencimento,
      o.status
    FROM obrigacoes o
    INNER JOIN empresas e
      ON e.id = o.empresa_id
    INNER JOIN tipos_obrigacao t
      ON t.id = o.tipo_obrigacao_id
    WHERE
    (
      o.status = 'ATRASADO'
    OR (
      o.status = 'PENDENTE'
      AND o.vencimento BETWEEN CURRENT_DATE
      AND CURRENT_DATE + INTERVAL '3 days'
    )
  )
    ORDER BY
      CASE
        WHEN o.status = 'ATRASADO' THEN 0
        ELSE 1
      END,
      o.vencimento
    `
  );
} else {
  result = await pool.query(
    `
    SELECT
      o.id,
      t.nome AS tipo,
      e.razao_social,
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
    AND (
      o.status = 'ATRASADO'
    OR (
      o.status = 'PENDENTE'
      AND o.vencimento BETWEEN CURRENT_DATE
      AND CURRENT_DATE + INTERVAL '3 days'
    )
  )
    ORDER BY
      CASE
        WHEN o.status = 'ATRASADO' THEN 0
        ELSE 1
      END,
      o.vencimento
    `,
    [usuario.id]
  );
}

for (const item of result.rows) {
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

  if (item.status === "ATRASADO") {
    titulo = `${item.tipo} está atrasado`;
  } else if (diasRestantes === 0) {
    titulo = `${item.tipo} vence hoje`;
  } else if (diasRestantes === 1) {
    titulo = `${item.tipo} vence amanhã`;
  } else {
    titulo = `${item.tipo} vence em ${diasRestantes} dias`;
  }

  const mensagem =
    item.status === "ATRASADO"
      ? `A obrigação ${item.tipo} da empresa ` +
        `${item.razao_social} venceu há ${Math.abs(diasRestantes)} dia(s), em ` +
        `${vencimento.toISOString().split("T")[0]}`
      : `A obrigação ${item.tipo} da empresa ` +
        `${item.razao_social} vence em ` +
        `${vencimento.toISOString().split("T")[0]}`;

  await pool.query(
    `
    INSERT INTO notificacoes
    (
      usuario_id,
      obrigacao_id,
      titulo,
      mensagem
    )
    VALUES
    ($1, $2, $3, $4)
    ON CONFLICT (usuario_id, obrigacao_id)
    DO NOTHING
    `,
    [
      usuario.id,
      item.id,
      titulo,
      mensagem,
    ]
  );
}

const notificacoes = await pool.query(
  `
  SELECT
    n.id,
    n.titulo,
    n.mensagem,
    n.lida,
    n.criada_em,
    n.obrigacao_id AS "obrigacaoId"
  FROM notificacoes n
  WHERE n.usuario_id = $1
  ORDER BY n.criada_em DESC
  `,
  [usuario.id]
);

return res.json(notificacoes.rows);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao listar notificações",
      });
    }
  }
);

router.patch(
  "/:id/lida",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const usuario = (req as any).usuario;

      const result = await pool.query(
        `
        UPDATE notificacoes
        SET lida = true
        WHERE
          id = $1
          AND usuario_id = $2
        RETURNING
          id,
          titulo,
          mensagem,
          lida,
          criada_em,
          obrigacao_id AS "obrigacaoId"
        `,
        [id, usuario.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Notificação não encontrada",
        });
      }

      return res.json({
        message: "Notificação marcada como lida",
        notificacao: result.rows[0],
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message: "Erro ao marcar notificação como lida",
      });
    }
  }
);

export default router;