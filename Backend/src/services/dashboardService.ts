import { pool } from "../database/connection";

export async function getDashboardResumo() {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'PENDENTE') AS pendentes,
      COUNT(*) FILTER (WHERE status = 'PAGO') AS pagas,
      COUNT(*) FILTER (WHERE status = 'ATRASADO') AS atrasadas,
      COUNT(*) AS total
    FROM obrigacoes
  `);

  return result.rows[0];
}