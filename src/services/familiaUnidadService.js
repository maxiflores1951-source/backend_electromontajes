const familiaUnidadModel = require('../models/familiaUnidadModel');

const getAll = async () => {
  return await familiaUnidadModel.getAll();
};

const getByCodigo = async (codigo) => {
  if (!codigo) throw new Error('El código de unidad es requerido');
  const unidad = await familiaUnidadModel.getByCodigo(codigo);
  if (!unidad) throw new Error(`No se encontró unidad con código: ${codigo}`);
  return unidad;
};

const create = async (data, idUsuario) => {
  if (!data.Cod_Unidad) throw new Error('El código de unidad es requerido');
  if (!data.Descripcion) throw new Error('La descripción es requerida');

  const existente = await familiaUnidadModel.getByCodigo(data.Cod_Unidad);
  if (existente) throw new Error(`El código '${data.Cod_Unidad}' ya existe`);

  data.id_creado = idUsuario;
  return await familiaUnidadModel.insert(data);
};

const update = async (codigo, data, idUsuario) => {
  if (!codigo) throw new Error('El código de unidad es requerido');
  if (!data.Descripcion) throw new Error('La descripción es requerida');

  const existente = await familiaUnidadModel.getByCodigo(codigo);
  if (!existente) throw new Error(`No se encontró unidad con código: ${codigo}`);

  data.id_modificado = idUsuario;
  return await familiaUnidadModel.update(codigo, data);
};

const remove = async (codigo) => {
  if (!codigo) throw new Error('El código de unidad es requerido');

  const existente = await familiaUnidadModel.getByCodigo(codigo);
  if (!existente) throw new Error(`No se encontró unidad con código: ${codigo}`);

  return await familiaUnidadModel.remove(codigo);
};

module.exports = { getAll, getByCodigo, create, update, remove };
