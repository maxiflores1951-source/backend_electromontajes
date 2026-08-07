const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM vehiculos');
  return rows;
};

const getByExcluded = async (codigos) => {
  const placeholders = codigos.map(() => '?').join(',');
  const query = `SELECT * FROM vehiculos WHERE codigo NOT IN (${placeholders})`;
  const [rows] = await db.query(query, codigos);
  return rows;
};

module.exports = {
  getAll,
  getByExcluded,
};
