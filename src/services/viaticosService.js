const viaticosModel = require('../models/viaticosModel');

const getAll = async () => {
  return await viaticosModel.getAll();
};

module.exports = {
  getAll,
};
