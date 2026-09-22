const propietariosModel = require('../models/propietariosModel');

const getAll = async () => {
  return await propietariosModel.getAll();
};

const getById = async (id) => {
  const propietario = await propietariosModel.getById(id);
  if (!propietario) throw new Error('Propietario no encontrado');
  return propietario;
};

const create = async (nombre) => {
  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    throw new Error('Faltan datos obligatorios: nombre');
  }
  const id = await propietariosModel.create(nombre.trim());
  return propietariosModel.getById(id);
};

const update = async (id, nombre) => {
  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    throw new Error('Faltan datos obligatorios: nombre');
  }
  const affected = await propietariosModel.update(id, nombre.trim());
  if (affected === 0) throw new Error('Propietario no encontrado');
  return propietariosModel.getById(id);
};

const remove = async (id) => {
  const affected = await propietariosModel.remove(id);
  if (affected === 0) throw new Error('Propietario no encontrado');
  return { id };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
