const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM familiaunidad ORDER BY Cod_Unidad');
  return rows;
};

const getByCodigo = async (codigo) => {
  const [rows] = await db.execute('SELECT * FROM familiaunidad WHERE Cod_Unidad = ?', [codigo]);
  return rows[0];
};

const insert = async (data) => {
  const { Cod_Unidad, Descripcion, id_creado } = data;
  const query = 'INSERT INTO familiaunidad (Cod_Unidad, Descripcion, id_creado) VALUES (?, ?, ?)';
  const [result] = await db.execute(query, [Cod_Unidad, Descripcion, id_creado || null]);
  return result.affectedRows;
};

const update = async (codigo, data) => {
  const { Descripcion, id_modificado } = data;
  const query = 'UPDATE familiaunidad SET Descripcion = ?, id_modificado = ? WHERE Cod_Unidad = ?';
  const [result] = await db.execute(query, [Descripcion, id_modificado || null, codigo]);
  return result.affectedRows;
};

const remove = async (codigo) => {
  const [result] = await db.execute('DELETE FROM familiaunidad WHERE Cod_Unidad = ?', [codigo]);
  return result.affectedRows;
};

module.exports = { getAll, getByCodigo, insert, update, remove };
