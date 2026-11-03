const valoresModel = require('../models/valoresModel');

const getAll = async () => {
  return await valoresModel.getAll();
};

const getExceptoCodigo1 = async () => {
  return await valoresModel.getExceptoCodigo1();
};

const create = async (data) => {
  return await valoresModel.create(data);
};

const update = async (id, data) => {
  return await valoresModel.update(id, data);
};

const remove = async (id) => {
  return await valoresModel.remove(id);
};

module.exports = {
  getAll,
  getExceptoCodigo1,
  create,
  update,
  remove,
};
