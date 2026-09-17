const tipoUnidadMovilModel = require('../models/tipoUnidadMovilModel');

const getAll = async () => {
  return await tipoUnidadMovilModel.getAll();
};

const getByCodigo = async (codigo) => {
  const tipo = await tipoUnidadMovilModel.getByCodigo(codigo);
  if (!tipo) throw new Error('Tipo de unidad móvil no encontrado');
  return tipo;
};

const create = async (data) => {
  if (!data.codigo || !data.descripcion) {
    throw new Error('Faltan datos obligatorios: codigo y descripcion');
  }
  const affected = await tipoUnidadMovilModel.insert(
    data.codigo.toUpperCase(),
    data.descripcion.toUpperCase(),
    data.id_creado || null
  );
  if (affected === 0) throw new Error('No se pudo crear el tipo de unidad móvil');
  return { codigo: data.codigo.toUpperCase(), descripcion: data.descripcion.toUpperCase() };
};

const update = async (codigo, data) => {
  if (!data.descripcion) throw new Error('Falta la descripcion');
  const affected = await tipoUnidadMovilModel.update(
    codigo,
    data.descripcion.toUpperCase(),
    data.id_modificado || null
  );
  if (affected === 0) throw new Error('Tipo de unidad móvil no encontrado');
  return { codigo, descripcion: data.descripcion.toUpperCase() };
};

const remove = async (codigo) => {
  const affected = await tipoUnidadMovilModel.remove(codigo);
  if (affected === 0) throw new Error('Tipo de unidad móvil no encontrado');
  return { codigo };
};

module.exports = {
  getAll,
  getByCodigo,
  create,
  update,
  remove,
};
