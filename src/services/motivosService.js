const motivosModel = require('../models/motivosModel');

const getAll = async () => {
  return await motivosModel.getAll();
};

module.exports = {
  getAll,
};
