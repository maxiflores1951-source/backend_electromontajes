const tiposModel = require('../models/tiposModel');

const getAll = async () => {
  return await tiposModel.getAll();
};

module.exports = {
  getAll,
};
