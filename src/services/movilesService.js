const movilesModel = require('../models/movilesModel');

const getAll = async () => {
  return await movilesModel.getAll();
};

module.exports = {
  getAll,
};
