const costosModel = require('../models/costosModel');

const getAll = async () => {
  return await costosModel.getAll();
};

const create = async (data) => {
  const { codigo, nombre, monto } = data;
  if (!codigo || !nombre || monto == null) throw new Error('Faltan datos obligatorios');
  const id = await costosModel.insert(codigo, nombre, monto);
  return id;
};

const remove = async (codigo) => {
  if (!codigo) throw new Error('Código requerido');
  await costosModel.deleteByCodigo(codigo);
};

const update = async (codigo, data) => {
  const { nombre, monto } = data;
  if (codigo == null || !nombre || monto == null) throw new Error('Faltan datos obligatorios');
  await costosModel.update(codigo, nombre, monto);
};

module.exports = {
  getAll,
  create,
  remove,
  update,
};
