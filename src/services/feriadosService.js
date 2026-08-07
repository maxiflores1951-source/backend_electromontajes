const feriadosModel = require('../models/feriadosModel');

const getAll = async (query) => {
  return await feriadosModel.getAll(query.year, query.anios);
};

const create = async (feriados) => {
  if (!Array.isArray(feriados)) {
    throw new Error('Se esperaba un array de feriados');
  }
  return await feriadosModel.bulkUpsert(feriados);
};

const remove = async (year) => {
  if (!year) throw new Error('Parámetro year es requerido');
  return await feriadosModel.deleteByYear(year);
};

module.exports = {
  getAll,
  create,
  remove,
};
