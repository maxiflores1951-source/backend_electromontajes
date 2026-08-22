const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM tallas ORDER BY id');
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.query('SELECT * FROM tallas WHERE id = ?', [id]);
  return rows[0];
};

const insert = async (nombre) => {
  const [result] = await db.query('INSERT INTO tallas (nombre) VALUES (?)', [nombre]);
  return result.insertId;
};

const update = async (id, nombre) => {
  const [result] = await db.query('UPDATE tallas SET nombre = ? WHERE id = ?', [nombre, id]);
  return result.affectedRows;
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM tallas WHERE id = ?', [id]);
  return result.affectedRows;
};

module.exports = {
  getAll,
  getById,
  insert,
  update,
  remove,
};