const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM plandecompra');
  return rows;
};

const create = async (data) => {
  const { codigo, descripcion } = data;
  const [result] = await db.execute(
    'INSERT INTO plandecompra (codigo, descripcion) VALUES (?, ?)',
    [codigo, descripcion]
  );
  return { codigo, descripcion };
};

const update = async (id, data) => {
  const { codigo, descripcion } = data;
  const [result] = await db.execute(
    'UPDATE plandecompra SET descripcion = ? WHERE codigo = ?',
    [descripcion, id]
  );
  return result;
};

const remove = async (id) => {
  const [result] = await db.execute('DELETE FROM plandecompra WHERE codigo = ?', [id]);
  return result;
};

module.exports = {
  getAll,
  create,
  update,
  remove,
};
