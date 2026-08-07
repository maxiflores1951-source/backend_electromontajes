const db = require('../../db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM contacto_clientes');
  return rows;
};

const getByCliente = async (idCliente) => {
  const [rows] = await db.query('SELECT * FROM contacto_clientes WHERE id_cliente = ?', [idCliente]);
  return rows;
};

const getById = async (idContacto) => {
  const [rows] = await db.query('SELECT * FROM contacto_clientes WHERE id_contacto = ?', [idContacto]);
  return rows;
};

const insert = async (data) => {
  const { id_cliente, nombre, puesto, telefono, email } = data;
  const query = `
    INSERT INTO contacto_clientes 
    (id_cliente, nombre, puesto, telefono, email) 
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(query, [id_cliente, nombre, puesto || null, telefono || null, email || null]);
  return result.insertId;
};

const update = async (idContacto, data) => {
  const { nombre, puesto, telefono, email } = data;
  const query = `
    UPDATE contacto_clientes 
    SET nombre = ?, puesto = ?, telefono = ?, email = ? 
    WHERE id_contacto = ?
  `;
  await db.query(query, [nombre, puesto || null, telefono || null, email || null, idContacto]);
};

const remove = async (idContacto) => {
  await db.query('DELETE FROM contacto_clientes WHERE id_contacto = ?', [idContacto]);
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
  removeByCliente,
};
