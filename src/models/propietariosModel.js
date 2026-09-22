const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT id, nombre FROM propietarios ORDER BY nombre');
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.execute('SELECT id, nombre FROM propietarios WHERE id = ?', [id]);
  return rows[0];
};

const create = async (nombre) => {
  const [result] = await db.execute('INSERT INTO propietarios (nombre) VALUES (?)', [nombre]);
  return result.insertId;
};

const update = async (id, nombre) => {
  const [result] = await db.execute('UPDATE propietarios SET nombre = ? WHERE id = ?', [nombre, id]);
  return result.affectedRows;
};

const remove = async (id) => {
  const [result] = await db.execute('DELETE FROM propietarios WHERE id = ?', [id]);
  return result.affectedRows;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
