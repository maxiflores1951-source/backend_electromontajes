const valoresModel = require('../models/valoresModel');

const getAll = async () => {
  return await valoresModel.getAll();
};

const getExceptoCodigo1 = async () => {
  return await valoresModel.getExceptoCodigo1();
};

module.exports = {
  getAll,
  getExceptoCodigo1,
};
