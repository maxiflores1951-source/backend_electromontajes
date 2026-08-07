const familiaconceptoModel = require('../models/familiaconceptoModel');

const getAll = async () => {
  return await familiaconceptoModel.getAll();
};

module.exports = {
  getAll,
};
