const marcaModel = require('../models/marcaModel');

const getAll = async () => {
  return await marcaModel.getAll();
};

const create = async (data, idUsuario) => {
  if (!data.nombre) {
    throw new Error('El nombre de la marca es requerido');
  }
  data.id_creado = idUsuario;
  return await marcaModel.insert(data);
};

module.exports = { getAll, create };
