const plandecompraModel = require('../models/plandecompraModel');

const getAll = async () => {
  return await plandecompraModel.getAll();
};

module.exports = {
  getAll,
};
