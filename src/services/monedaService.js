const monedaModel = require('../models/monedaModel');

const getAll = async () => {
  return await monedaModel.getAll();
};

module.exports = {
  getAll,
};
