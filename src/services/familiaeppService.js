const familiaeppModel = require('../models/familiaeppModel');

const getAll = async () => {
  return await familiaeppModel.getAll();
};

module.exports = { getAll };
