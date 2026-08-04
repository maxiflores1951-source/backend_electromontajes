const familiaHerramientaModel = require('../models/familiaHerramientaModel');

const getAll = async () => {
  return await familiaHerramientaModel.getAll();
};

module.exports = { getAll };
