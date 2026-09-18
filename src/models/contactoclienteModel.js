const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM contacto_clientes');
  return rows;
};

const getByCliente = async (idCliente, connection) => {
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [rows] = await exec('SELECT * FROM contacto_clientes WHERE id_cliente = ?', [idCliente]);
  return rows;
};

const getById = async (idContacto) => {
  const [rows] = await db.query('SELECT * FROM contacto_clientes WHERE id_contacto = ?', [idContacto]);
  return rows;
};

const insert = async (data, connection) => {
  const { id_cliente, nombre, puesto, telefono, email, id_creado } = data;
  const query = `
    INSERT INTO contacto_clientes 
    (id_cliente, nombre, puesto, telefono, email, id_creado) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [id_cliente, nombre, puesto || null, telefono || null, email || null, id_creado || null];
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [result] = await exec(query, values);
  return result.insertId;
};

const update = async (idContacto, data, connection) => {
  const { nombre, puesto, telefono, email, id_modificado } = data;
  const query = `
    UPDATE contacto_clientes 
    SET nombre = ?, puesto = ?, telefono = ?, email = ?, id_modificado = ? 
    WHERE id_contacto = ?
  `;
  const values = [nombre, puesto || null, telefono || null, email || null, id_modificado || null, idContacto];
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, values);
};

const remove = async (idContacto) => {
  await db.query('DELETE FROM contacto_clientes WHERE id_contacto = ?', [idContacto]);
};

const removeByIds = async (ids, connection) => {
  if (!ids || ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(`DELETE FROM contacto_clientes WHERE id_contacto IN (${placeholders})`, ids);
};

const removeByCliente = async (idCliente) => {
  await db.query('DELETE FROM contacto_clientes WHERE id_cliente = ?', [idCliente]);
};

module.exports = {
  getAll,
  getByCliente,
  getById,
  insert,
  update,
  remove,
  removeByIds,
  removeByCliente,
};
