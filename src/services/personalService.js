const personalModel = require('../models/personalModel');

const getAll = async () => {
  return await personalModel.getAll();
};

const getById = async (id) => {
  const personal = await personalModel.getById(id);
  if (!personal) throw new Error(`No se encontró personal con ID: ${id}`);
  return personal;
};

const create = async (data, idUsuario) => {
  if (!data.NOMBRE || !data.DNI) {
    throw new Error('NOMBRE y DNI son requeridos');
  }
  data.id_creado = idUsuario;
  return await personalModel.insert(data);
};

const update = async (id, data, idUsuario) => {
  if (!id) throw new Error('Falta el ID del personal');
  data.id_modificado = idUsuario;
  const affected = await personalModel.updateById(id, data);
  if (affected === 0) throw new Error(`No se encontró personal con ID: ${id}`);
  return affected;
};

module.exports = { getAll, getById, create, update };
