const db = require('../../db');

const insertContactos = async (proveedorId, contactos, idUsuario, connection) => {
  if (!contactos || contactos.length === 0) return;

  const values = contactos.map(c => [
    proveedorId,
    c.nombre,
    c.apellido,
    c.puesto || null,
    c.telefono || null,
    c.email || null,
    idUsuario || null
  ]);

  const query = `
    INSERT INTO contacto_proveedores 
    (Cod_Proveedor, nombre, apellido, puesto, telefono, email, id_creado)
    VALUES ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [values]);
};

const getAll = async () => {
  const query = `
    SELECT 
      p.*,
      s.Descripcion AS SituacionFiscal,
      c.NOMBRE AS creado_por,
      m.NOMBRE AS modificado_por
    FROM proveedor p
    LEFT JOIN sitfiscal s ON p.IDSITFISCAL = s.IDSITFISCAL
    LEFT JOIN personal c ON p.id_creado = c.ID
    LEFT JOIN personal m ON p.id_modificado = m.ID
  `;
  const [rows] = await db.query(query);
  return rows;
};

const insert = async (proveedorData, connection) => {
  const {
    Cuilt,
    Razon_Social,
    Nombre_Prov,
    IDSITFISCAL,
    Direccion,
    Correo,
    Telefono,
    Cuenta_Corriente,
    id_creado
  } = proveedorData;

  const query = `
    INSERT INTO proveedor 
    (Cuilt, Razon_Social, Nombre_Prov, IDSITFISCAL, Direccion, Correo, Telefono, Cuenta_Corriente, id_creado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    Cuilt,
    Razon_Social,
    Nombre_Prov,
    IDSITFISCAL,
    Direccion || null,
    Correo || null,
    Telefono || null,
    Cuenta_Corriente ? 1 : 0,
    id_creado || null
  ];

  const exec = connection ? connection.query.bind(connection) : db.query;
  const [result] = await exec(query, values);
  return result.insertId;
};

const updateById = async (id, proveedorData, connection) => {
  const {
    Cuilt,
    Razon_Social,
    Nombre_Prov,
    IDSITFISCAL,
    Direccion,
    Correo,
    Telefono,
    Cuenta_Corriente,
    id_modificado
  } = proveedorData;

  const query = `
    UPDATE proveedor 
    SET
      Cuilt = ?,
      Razon_Social = ?,
      Nombre_Prov = ?,
      IDSITFISCAL = ?,
      Direccion = ?,
      Correo = ?,
      Telefono = ?,
      Cuenta_Corriente = ?,
      id_modificado = ?
    WHERE Cod_Proveedor = ?
  `;
  const values = [
    Cuilt,
    Razon_Social,
    Nombre_Prov,
    IDSITFISCAL,
    Direccion,
    Correo,
    Telefono,
    Cuenta_Corriente,
    id_modificado || null,
    id
  ];

  const exec = connection ? connection.execute.bind(connection) : db.execute;
  const [result] = await exec(query, values);
  return result.affectedRows;
};

const getContactosByProveedorId = async (proveedorId) => {
  const query = `
    SELECT id_contacto, nombre, apellido, puesto, telefono, email
    FROM contacto_proveedores
    WHERE Cod_Proveedor = ?
    ORDER BY id_contacto
  `;
  const [rows] = await db.query(query, [proveedorId]);
  return rows;
};

const getAllContactos = async () => {
  const query = `
    SELECT id_contacto, Cod_Proveedor, nombre, apellido, puesto, telefono, email
    FROM contacto_proveedores
    ORDER BY Cod_Proveedor, id_contacto
  `;
  const [rows] = await db.query(query);
  return rows;
};

const updateContacto = async (idContacto, contactoData, idUsuario, connection) => {
  const { nombre, apellido, puesto, telefono, email } = contactoData;
  const query = `
    UPDATE contacto_proveedores
    SET nombre = ?, apellido = ?, puesto = ?, telefono = ?, email = ?, id_modificado = ?, fecha_modificacion = NOW()
    WHERE id_contacto = ?
  `;
  const values = [nombre, apellido, puesto || null, telefono || null, email || null, idUsuario || null, idContacto];
  const exec = connection ? connection.execute.bind(connection) : db.execute;
  const [result] = await exec(query, values);
  return result.affectedRows;
};

const deleteContactosByIds = async (ids, connection) => {
  if (!ids || ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  const query = `DELETE FROM contacto_proveedores WHERE id_contacto IN (${placeholders})`;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, ids);
};

const deleteContactosByProveedorId = async (proveedorId, connection) => {
  const query = 'DELETE FROM contacto_proveedores WHERE Cod_Proveedor = ?';
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [proveedorId]);
};

module.exports = { getAll, insert, updateById, insertContactos, getContactosByProveedorId, getAllContactos, deleteContactosByProveedorId, updateContacto, deleteContactosByIds };
