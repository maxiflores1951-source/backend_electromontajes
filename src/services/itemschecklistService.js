const itemschecklistModel = require('../models/itemschecklistModel');

const getAll = async () => {
  return await itemschecklistModel.getAll();
};

const getByCodigoSeccion = async (codigo_seccion) => {
  return await itemschecklistModel.getByCodigoSeccion(codigo_seccion);
};

module.exports = {
  getAll,
  getByCodigoSeccion,
};
