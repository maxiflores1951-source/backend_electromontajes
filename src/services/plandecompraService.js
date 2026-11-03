const plandecompraModel = require('../models/plandecompraModel');

const getAll = async () => {
  return await plandecompraModel.getAll();
};

const create = async (data) => {
  return await plandecompraModel.create(data);
};

const update = async (id, data) => {
  return await plandecompraModel.update(id, data);
};

const remove = async (id) => {
  return await plandecompraModel.remove(id);
};

module.exports = {
  getAll,
  create,
  update,
  remove,
};
