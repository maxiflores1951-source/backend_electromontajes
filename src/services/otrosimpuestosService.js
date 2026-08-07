const otrosimpuestosModel = require('../models/otrosimpuestosModel');

const getAll = async () => {
  return await otrosimpuestosModel.getAll();
};

module.exports = {
  getAll,
};
