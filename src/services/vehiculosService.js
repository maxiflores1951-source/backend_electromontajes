const vehiculosModel = require('../models/vehiculosModel');

const getExclude = async (codigo) => {
  if (!codigo) {
    return await vehiculosModel.getAll();
  }
  const codigosExcluidos = codigo.split(',');
  return await vehiculosModel.getByExcluded(codigosExcluidos);
};

module.exports = {
  getExclude,
};
