const seccionesModel = require('../models/seccionesModel');

const getAll = async () => {
  return await seccionesModel.getAll();
};

module.exports = {
  getAll,
};
