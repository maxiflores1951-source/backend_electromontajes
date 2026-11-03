const motivosModel = require('../models/motivosModel');

const getAll = async () => {
  return await motivosModel.getAll();
};

const create = async (data) => {
  return await motivosModel.create(data);
};

const update = async (id, data) => {
  return await motivosModel.update(id, data);
};

const remove = async (id) => {
  return await motivosModel.remove(id);
};

module.exports = {
  getAll,
  create,
  update,
  remove,
};
