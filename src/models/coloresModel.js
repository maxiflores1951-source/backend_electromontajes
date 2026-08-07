const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM colores');
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.query('SELECT * FROM colores WHERE id = ?', [id]);
  return rows[0];
};

const insert = async (nombre) => {
  const [result] = await db.query('INSERT INTO colores (nombre) VALUES (?)', [nombre]);
  return result.insertId;
};

module.exports = {
  getAll,
  getById,
  insert,
};
