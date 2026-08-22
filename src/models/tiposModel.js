const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM tipos_elementos');
  return rows;
};

const getByCodigo = async (codigo) => {
  const [rows] = await db.query('SELECT * FROM tipos_elementos WHERE codigo = ?', [codigo]);
  return rows[0];
};

module.exports = {
  getAll,
  getByCodigo,
};
