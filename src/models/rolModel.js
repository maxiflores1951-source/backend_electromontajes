const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT id, nombre, descripcion FROM roles ORDER BY id');
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.query('SELECT id, nombre, descripcion FROM roles WHERE id = ?', [id]);
  return rows[0];
};

module.exports = { getAll, getById };
