const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.execute('SELECT * FROM tipo_unidad_movil');
  return rows;
};

const getByCodigo = async (codigo) => {
  const [rows] = await db.execute('SELECT * FROM tipo_unidad_movil WHERE codigo = ?', [codigo]);
  return rows[0];
};

const insert = async (codigo, descripcion, id_creado) => {
  const [result] = await db.execute(
    'INSERT INTO tipo_unidad_movil (codigo, descripcion, id_creado) VALUES (?, ?, ?)',
    [codigo, descripcion, id_creado || null]
  );
  return result.affectedRows;
};

const update = async (codigo, descripcion, id_modificado) => {
  const [result] = await db.execute(
    'UPDATE tipo_unidad_movil SET descripcion = ?, id_modificado = ? WHERE codigo = ?',
    [descripcion, id_modificado || null, codigo]
  );
  return result.affectedRows;
};

const remove = async (codigo) => {
  const [result] = await db.execute('DELETE FROM tipo_unidad_movil WHERE codigo = ?', [codigo]);
  return result.affectedRows;
};

module.exports = {
  getAll,
  getByCodigo,
  insert,
  update,
  remove,
};
