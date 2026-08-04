const sitfiscalModel = require('../models/sitfiscalModel');

const getAll = async () => {
  return await sitfiscalModel.getAll();
};

module.exports = { getAll };
