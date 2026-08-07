const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM costosoperarios');
  return rows;
};

const insert = async (codigo, nombre, monto) => {
  const query = 'INSERT INTO costosoperarios (Codigo, Nombre, Monto) VALUES (?, ?, ?)';
  const [result] = await db.query(query, [codigo, nombre, monto]);
  return result.insertId;
};

const deleteByCodigo = async (codigo) => {
  const [result] = await db.query('DELETE FROM costosoperarios WHERE Codigo = ?', [codigo]);
  return result.affectedRows;
};

const update = async (codigo, nombre, monto) => {
  const query = 'UPDATE costosoperarios SET Nombre = ?, Monto = ? WHERE Codigo = ?';
  const [result] = await db.query(query, [nombre, monto, codigo]);
  return result.affectedRows;
};

module.exports = {
  getAll,
  insert,
  deleteByCodigo,
  update,
};
