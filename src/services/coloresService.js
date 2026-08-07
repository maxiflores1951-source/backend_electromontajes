const coloresModel = require('../models/coloresModel');

const getAll = async () => {
  return await coloresModel.getAll();
};

const getById = async (id) => {
  const color = await coloresModel.getById(id);
  if (!color) throw new Error('Color no encontrado');
  return color;
};

const create = async (data) => {
  if (!data.nombre) throw new Error('Faltan datos obligatorios');
  const nombre = data.nombre.trim().toUpperCase();
  const id = await coloresModel.insert(nombre);
  return { id, nombre };
};

module.exports = {
  getAll,
  getById,
  create,
};
