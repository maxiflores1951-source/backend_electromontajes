const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM valores');
  return rows;
};

const getExceptoCodigo1 = async () => {
  const [rows] = await db.execute('SELECT * FROM valores WHERE codigo <> ?', ['1']);
  return rows;
};

const create = async (data) => {
  const { codigo, descripcion } = data;
  const [result] = await db.execute(
    'INSERT INTO valores (codigo, descripcion) VALUES (?, ?)',
    [codigo || null, descripcion]
  );
  return { codigo, descripcion, ...data };
};

const update = async (id, data) => {
  const { codigo, descripcion } = data;
  const [result] = await db.execute(
    'UPDATE valores SET codigo = ?, descripcion = ? WHERE codigo = ?',
    [codigo || null, descripcion, id]
  );
  return result;
};

const remove = async (id) => {
  const [result] = await db.execute('DELETE FROM valores WHERE codigo = ?', [id]);
  return result;
};

module.exports = {
  getAll,
  getExceptoCodigo1,
  create,
  update,
  remove,
};
