const preciosModel = require('../models/preciosModel');

const create = async (data) => {
  const { cod_articulo, cod_precio = 'PC0', precio, fecha } = data;
  if (!cod_articulo || !precio) throw new Error('Faltan datos obligatorios');
  const id = await preciosModel.insert({ cod_articulo, cod_precio, precio, fecha });
  return id;
};

module.exports = {
  create,
};
