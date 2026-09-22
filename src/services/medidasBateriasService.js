const medidasBateriasModel = require('../models/medidasBateriasModel');

const getAll = async () => {
  return await medidasBateriasModel.getAll();
};

const getById = async (id) => {
  const medida = await medidasBateriasModel.getById(id);
  if (!medida) throw new Error('Medida de batería no encontrada');
  return medida;
};

const create = async (codigo_amperaje) => {
  if (!codigo_amperaje || typeof codigo_amperaje !== 'string' || !codigo_amperaje.trim()) {
    throw new Error('Faltan datos obligatorios: codigo_amperaje');
  }
  const id = await medidasBateriasModel.create(codigo_amperaje.trim());
  return medidasBateriasModel.getById(id);
};

const update = async (id, codigo_amperaje) => {
  if (!codigo_amperaje || typeof codigo_amperaje !== 'string' || !codigo_amperaje.trim()) {
    throw new Error('Faltan datos obligatorios: codigo_amperaje');
  }
  const affected = await medidasBateriasModel.update(id, codigo_amperaje.trim());
  if (affected === 0) throw new Error('Medida de batería no encontrada');
  return medidasBateriasModel.getById(id);
};

const remove = async (id) => {
  const affected = await medidasBateriasModel.remove(id);
  if (affected === 0) throw new Error('Medida de batería no encontrada');
  return { id };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
