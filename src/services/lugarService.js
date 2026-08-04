const lugarModel = require('../models/lugarModel');

const getAll = async () => {
  return await lugarModel.getAll();
};

module.exports = { getAll };
