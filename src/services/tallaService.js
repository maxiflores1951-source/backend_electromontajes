const tallaModel = require('../models/tallaModel');

const getAll = async () => {
  return await tallaModel.getAll();
};

const getById = async (id) => {
  const talla = await tallaModel.getById(id);
  if (!talla) throw new Error('Talla no encontrada');
  return talla;
};

const create = async (data) => {
  if (!data.nombre) throw new Error('Faltan datos obligatorios');
  const nombre = data.nombre.trim().toUpperCase();
  const id = await tallaModel.insert(nombre);
  return { id, nombre };
};

const update = async (id, data) => {
  if (!data.nombre) throw new Error('Faltan datos obligatorios');
  const nombre = data.nombre.trim().toUpperCase();
  const affected = await tallaModel.update(id, nombre);
  if (affected === 0) throw new Error('Talla no encontrada');
  return { id, nombre };
};

const remove = async (id) => {
  const affected = await tallaModel.remove(id);
  if (affected === 0) throw new Error('Talla no encontrada');
  return id;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
