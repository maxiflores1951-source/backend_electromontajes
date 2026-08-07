const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM datos_empresa');
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.query('SELECT * FROM datos_empresa WHERE id = ?', [id]);
  return rows[0] || null;
};

module.exports = {
  getAll,
  getById,
};
