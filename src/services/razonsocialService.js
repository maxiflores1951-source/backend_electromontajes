const razonsocialModel = require('../models/razonsocialModel');

const getAll = async () => {
  return await razonsocialModel.getAll();
};

module.exports = {
  getAll,
};
