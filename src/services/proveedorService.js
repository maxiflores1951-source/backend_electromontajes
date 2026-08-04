const db = require('../../db');
const proveedorModel = require('../models/proveedorModel');

const getAllProveedores = async () => {
  const proveedores = await proveedorModel.getAll();
  const contactos = await proveedorModel.getAllContactos();
  const contactosMap = {};
  for (const c of contactos) {
    if (!contactosMap[c.Cod_Proveedor]) contactosMap[c.Cod_Proveedor] = [];
    contactosMap[c.Cod_Proveedor].push({
      id_contacto: c.id_contacto,
      nombre: c.nombre,
      apellido: c.apellido,
      puesto: c.puesto,
      telefono: c.telefono,
      email: c.email
    });
  }
  for (const p of proveedores) {
    p.contactos = contactosMap[p.Cod_Proveedor] || [];
  }
  return proveedores;
};

const createProveedor = async (proveedorData, idUsuario) => {
  if (!proveedorData.Cuilt || !proveedorData.Razon_Social || !proveedorData.Nombre_Prov || !proveedorData.IDSITFISCAL) {
    throw new Error('Cuilt, Razon_Social, Nombre_Prov e IDSITFISCAL son requeridos');
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    proveedorData.id_creado = idUsuario;
    const newId = await proveedorModel.insert(proveedorData, connection);

    const contactos = proveedorData.contactos;
    if (contactos && contactos.length > 0) {
      await proveedorModel.insertContactos(newId, contactos, idUsuario, connection);
    }

    await connection.commit();
    return newId;
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      throw new Error('El CUILT ya existe en la base de datos');
    }
    throw err;
  } finally {
    connection.release();
  }
};

const updateProveedor = async (id, proveedorData, idUsuario) => {
  if (!id) throw new Error('Falta el ID del proveedor');

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    proveedorData.id_modificado = idUsuario;
    const affectedRows = await proveedorModel.updateById(id, proveedorData, connection);
    if (affectedRows === 0) {
      throw new Error(`No se encontró proveedor con ID: ${id}`);
    }

    if (proveedorData.contactos !== undefined) {
      const existing = await proveedorModel.getContactosByProveedorId(id);
      const existingIds = new Set(existing.map(c => c.id_contacto));
      const incomingIds = new Set(proveedorData.contactos.filter(c => c.id_contacto).map(c => c.id_contacto));

      const idsToDelete = [...existingIds].filter(x => !incomingIds.has(x));
      if (idsToDelete.length > 0) {
        await proveedorModel.deleteContactosByIds(idsToDelete, connection);
      }

      const nuevos = [];
      for (const c of proveedorData.contactos) {
        if (c.id_contacto && existingIds.has(c.id_contacto)) {
          await proveedorModel.updateContacto(c.id_contacto, c, idUsuario, connection);
        } else {
          nuevos.push(c);
        }
      }

      if (nuevos.length > 0) {
        await proveedorModel.insertContactos(id, nuevos, idUsuario, connection);
      }
    }

    await connection.commit();
    return affectedRows;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

module.exports = { getAllProveedores, createProveedor, updateProveedor };
