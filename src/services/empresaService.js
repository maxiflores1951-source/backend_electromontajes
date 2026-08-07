const empresaModel = require('../models/empresaModel');

const getAll = async () => {
  return await empresaModel.getAll();
};

const getById = async (id) => {
  const empresa = await empresaModel.getById(id);
  if (!empresa) throw new Error('Empresa no encontrada');
  return empresa;
};

module.exports = {
  getAll,
  getById,
};
