const rolModel = require('../models/rolModel');

const getAll = async () => {
  return await rolModel.getAll();
};

const getById = async (id) => {
  const rol = await rolModel.getById(id);
  if (!rol) throw new Error(`No se encontró rol con ID: ${id}`);
  return rol;
};

module.exports = { getAll, getById };
