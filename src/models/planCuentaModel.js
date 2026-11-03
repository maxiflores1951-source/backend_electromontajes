const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM plancuenta ORDER BY codigo');
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.query('SELECT * FROM plancuenta WHERE id_plan_cuenta = ?', [id]);
  return rows[0] || null;
};

const insert = async (planData, connection) => {
  const { codigo, nombre, tipo_cuenta, activo = true, id_creado } = planData;

  const query = `
    INSERT INTO plancuenta 
    (codigo, nombre, tipo_cuenta, activo, id_creado)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [codigo, nombre, tipo_cuenta, activo ? 1 : 0, id_creado || null];

  const exec = connection ? connection.execute.bind(connection) : db.execute;
  const [result] = await exec(query, values);
  return result.insertId;
};

const updateById = async (id, planData, connection) => {
  const { codigo, nombre, tipo_cuenta, activo, id_modificado } = planData;

  const query = `
    UPDATE plancuenta 
    SET
      codigo = ?,
      nombre = ?,
      tipo_cuenta = ?,
      activo = ?,
      id_modificado = ?
    WHERE id_plan_cuenta = ?
  `;
  const values = [codigo, nombre, tipo_cuenta, activo ? 1 : 0, id_modificado || null, id];

  const exec = connection ? connection.execute.bind(connection) : db.execute;
  const [result] = await exec(query, values);
  return result.affectedRows;
};

const deleteById = async (id, connection) => {
  const query = 'DELETE FROM plancuenta WHERE id_plan_cuenta = ?';
  const exec = connection ? connection.execute.bind(connection) : db.execute;
  const [result] = await exec(query, [id]);
  return result.affectedRows;
};

module.exports = { getAll, getById, insert, updateById, deleteById };