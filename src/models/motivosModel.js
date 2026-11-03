const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM motivos');
  return rows;
};

const create = async (data) => {
  const { codigo, nombre } = data;
  const [result] = await db.execute(
    'INSERT INTO motivos (codigo, nombre) VALUES (?, ?)',
    [codigo || null, nombre]
  );
  return { codigo, nombre, ...data };
};

const update = async (id, data) => {
  const { codigo, nombre } = data;
  const [result] = await db.execute(
    'UPDATE motivos SET codigo = ?, nombre = ? WHERE codigo = ?',
    [codigo || null, nombre, id]
  );
  return result;
};

const remove = async (id) => {
  const [result] = await db.execute('DELETE FROM motivos WHERE codigo = ?', [id]);
  return result;
};

module.exports = {
  getAll,
  create,
  update,
  remove,
};
