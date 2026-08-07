const db = require('../../db');

const getByPeriodoTipo = async (periodo, tipo) => {
  const query = `
    SELECT tipo_unidad, periodo, monto_km, monto_hora
    FROM montos
    WHERE periodo = ? AND tipo_unidad = ?
  `;
  const [rows] = await db.execute(query, [periodo, tipo]);
  return rows[0] || null;
};

module.exports = {
  getByPeriodoTipo,
};
