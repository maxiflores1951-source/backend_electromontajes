const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT id, codigo_amperaje FROM medidas_baterias ORDER BY codigo_amperaje');
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.execute('SELECT id, codigo_amperaje FROM medidas_baterias WHERE id = ?', [id]);
  return rows[0];
};

const create = async (codigo_amperaje) => {
  const [result] = await db.execute('INSERT INTO medidas_baterias (codigo_amperaje) VALUES (?)', [codigo_amperaje]);
  return result.insertId;
};

const update = async (id, codigo_amperaje) => {
  const [result] = await db.execute('UPDATE medidas_baterias SET codigo_amperaje = ? WHERE id = ?', [codigo_amperaje, id]);
  return result.affectedRows;
};

const remove = async (id) => {
  const [result] = await db.execute('DELETE FROM medidas_baterias WHERE id = ?', [id]);
  return result.affectedRows;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
