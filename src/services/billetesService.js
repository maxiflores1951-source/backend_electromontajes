const billetesModel = require('../models/billetesModel');

const getAll = async () => {
  return await billetesModel.getAll();
};

module.exports = {
  getAll,
};
