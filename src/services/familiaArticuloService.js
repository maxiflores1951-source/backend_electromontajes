const familiaArticuloModel = require('../models/familiaArticuloModel');

const getAll = async () => {
  return await familiaArticuloModel.getAll();
};

module.exports = { getAll };
