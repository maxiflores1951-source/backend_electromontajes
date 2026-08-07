const contactoclienteModel = require('../models/contactoclienteModel');

const getAll = async () => {
  return await contactoclienteModel.getAll();
};

const getByCliente = async (idCliente) => {
  return await contactoclienteModel.getByCliente(idCliente);
};

const create = async (data) => {
  const { id_cliente, nombre } = data;

  if (!id_cliente || !nombre) {
    throw new Error('El id_cliente y nombre son obligatorios');
  }

  const insertId = await contactoclienteModel.insert(data);
  const rows = await contactoclienteModel.getById(insertId);
  return rows[0];
};

const update = async (idContacto, data) => {
  const { nombre } = data;

  if (!nombre) {
    throw new Error('El nombre es obligatorio');
  }

  const existing = await contactoclienteModel.getById(idContacto);
  if (existing.length === 0) {
    throw new Error('Contacto no encontrado');
  }

  await contactoclienteModel.update(idContacto, data);
  const rows = await contactoclienteModel.getById(idContacto);
  return rows[0];
};

const remove = async (idContacto) => {
  const existing = await contactoclienteModel.getById(idContacto);
  if (existing.length === 0) {
    throw new Error('Contacto no encontrado');
  }

  await contactoclienteModel.remove(idContacto);
  return existing[0];
};

const removeByCliente = async (idCliente) => {
  const existing = await contactoclienteModel.getByCliente(idCliente);
  if (existing.length === 0) {
    throw new Error('No se encontraron contactos para este cliente');
  }

  await contactoclienteModel.removeByCliente(idCliente);
  return existing;
};

module.exports = {
  getAll,
  getByCliente,
  create,
  update,
  remove,
  removeByCliente,
};
