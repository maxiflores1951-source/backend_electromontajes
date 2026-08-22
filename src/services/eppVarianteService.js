const eppVarianteModel = require('../models/eppVarianteModel');
const eppModel = require('../models/eppModel');
const colorModel = require('../models/coloresModel');
const tallaModel = require('../models/tallaModel');
const marcaModel = require('../models/marcaModel');
const tipoModel = require('../models/tiposModel');

const getAll = async () => {
  return await eppVarianteModel.getAll();
};

const getById = async (id) => {
  return await eppVarianteModel.getById(id);
};

const validateData = async (data) => {
  const { codigo_epp } = data;

  const eppExiste = await eppModel.getByCodigo(codigo_epp);
  if (!eppExiste) throw new Error(`EPP con código ${codigo_epp} no existe`);
};

const create = async (data, idUsuario) => {
  const {
    codigo_epp,
    id_color,
    id_talla,
    id_marca,
    codigo_tipo,
    cantidad,
  } = data;

  if (!codigo_epp || !codigo_tipo) {
    throw new Error('codigo_epp y codigo_tipo son obligatorios');
  }

  await validateData(data);

  data.id_creado = idUsuario;
  const insertedId = await eppVarianteModel.create(data);
  return insertedId;
};

const update = async (id, data, idUsuario) => {
  await eppVarianteModel.update(id, data);
  return await eppVarianteModel.getById(id);
};

const remove = async (id) => {
  return await eppVarianteModel.remove(id);
};

const upsertFromRemito = async (data, idUsuario) => {
  const {
    id_epp,
    id_marca,
    id_color,
    id_talla,
    codigo_tipo_epp,
    nombre,
    unidad,
    cantidad,
  } = data;

  if (!id_epp || !codigo_tipo_epp) {
    throw new Error('id_epp y codigo_tipo_epp son obligatorios');
  }

  const eppExiste = await eppModel.getByCodigo(id_epp);
  if (!eppExiste) throw new Error(`EPP con código ${id_epp} no existe`);

  const cantidadNum = cantidad || 1;

  // Si ya existe una variante con las mismas claves, sumamos la cantidad
  const existente = await eppVarianteModel.getByCodigoYTipos(
    id_epp,
    id_color || null,
    id_talla || null,
    id_marca || null,
    codigo_tipo_epp
  );

  if (existente) {
    await eppVarianteModel.sumarCantidad(existente.id, cantidadNum);
    return existente.id;
  }

  // Si no existe, creamos una nueva variante
  const dataParaCrear = {
    codigo_epp: id_epp,
    id_color: id_color || null,
    id_talla: id_talla || null,
    id_marca: id_marca || null,
    codigo_tipo: codigo_tipo_epp,
    cantidad: cantidadNum,
  };

  const insertedId = await eppVarianteModel.create(dataParaCrear, idUsuario);
  return insertedId;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  upsertFromRemito,
};