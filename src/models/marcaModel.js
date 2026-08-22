const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM marcas');
  return rows;
};

const insert = async (data) => {
  const { nombre, id_creado } = data;
  const query = 'INSERT INTO marcas (nombre, id_creado) VALUES (?, ?)';
  const [result] = await db.execute(query, [nombre, id_creado || null]);
  return result.insertId;
};

const getById = async (id) => {
  const [rows] = await db.query('SELECT * FROM marcas WHERE id = ?', [id]);
  return rows[0];
};

module.exports = { getAll, getById, insert };
