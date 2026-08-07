const tipocomprobanteModel = require('../models/tipocomprobanteModel');

const getAll = async () => {
  return await tipocomprobanteModel.getAll();
};

const getCompra = async () => {
  return await tipocomprobanteModel.getCompra();
};

module.exports = {
  getAll,
  getCompra,
};
