const movilesModel = require('../models/movilesModel');

const getAll = async () => {
  return await movilesModel.getAll();
};

const getByNroIdent = async (nro_ident) => {
  const movil = await movilesModel.getByNroIdent(nro_ident);
  if (!movil) throw new Error('Móvil no encontrado');
  return movil;
};

const create = async (data) => {
  if (!data.patente && !data.tipo) throw new Error('Faltan datos obligatorios: patente o tipo');

  const sanitizedData = {
    nro_ident: data.nro_ident ?? null,
    patente: data.patente ?? null,
    id_responsable: data.id_responsable ?? null,
    kilometraje: data.kilometraje ?? null,
    tipo: data.tipo ?? null,
    activo: data.activo ?? true,
    id_creado: data.id_creado ?? null,
    id_propietario: data.id_propietario ?? null,
    id_medida_bateria: data.id_medida_bateria ?? null,
    tamano_rodado: data.tamano_rodado ?? null,
    tipo_combustible: data.tipo_combustible ?? null,
  };

  const nroIdentGenerado = await movilesModel.insert(sanitizedData);
  if (!nroIdentGenerado) throw new Error('No se pudo crear el móvil');
  return movilesModel.getByNroIdent(nroIdentGenerado);
};

const update = async (nro_ident, data) => {
  const sanitizedData = {
    nro_ident: data.nro_ident ?? nro_ident,
    patente: data.patente ?? null,
    id_responsable: data.id_responsable ?? null,
    kilometraje: data.kilometraje ?? null,
    tipo: data.tipo ?? null,
    activo: data.activo ?? true,
    id_modificado: data.id_modificado ?? null,
    id_propietario: data.id_propietario ?? null,
    id_medida_bateria: data.id_medida_bateria ?? null,
    tamano_rodado: data.tamano_rodado ?? null,
    tipo_combustible: data.tipo_combustible ?? null,
  };
  const affected = await movilesModel.update(nro_ident, sanitizedData);
  if (affected === 0) throw new Error('Móvil no encontrado');
  return movilesModel.getByNroIdent(nro_ident);
};

const remove = async (nro_ident) => {
  const affected = await movilesModel.remove(nro_ident);
  if (affected === 0) throw new Error('Móvil no encontrado');
  return { nro_ident };
};

module.exports = {
  getAll,
  getByNroIdent,
  create,
  update,
  remove,
};
