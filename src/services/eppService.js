const eppModel = require('../models/eppModel');

const getAll = async () => {
  return await eppModel.getAll();
};

const getVariantes = async () => {
  return await eppModel.getVariantes();
};

const validarReferencias = async (data) => {
  if (data.codigo_familia) {
    const existe = await eppModel.familiaEppExists(data.codigo_familia);
    if (!existe) throw new Error(`El código de familia '${data.codigo_familia}' no existe`);
  }
  if (data.Cod_Proveedor) {
    const existe = await eppModel.proveedorExists(data.Cod_Proveedor);
    if (!existe) throw new Error(`El proveedor con código ${data.Cod_Proveedor} no existe`);
  }
};

const create = async (data, idUsuario) => {
  const {
    nombre,
    codigo_familia,
    cantidad,
    estado,
    iva_compras,
    certificado,
    codigo_tipo,
  } = data;

  if (
    !nombre ||
    !codigo_familia ||
    cantidad == null ||
    !estado ||
    iva_compras == null ||
    certificado == null ||
    !codigo_tipo
  ) {
    throw new Error('Faltan datos obligatorios');
  }

  await validarReferencias(data);

  data.id_creado = idUsuario;
  const insertedId = await eppModel.insert(data);
  return insertedId;
};

const updateCantidad = async (codEpp, cantidad, tipo_operacion) => {
  if (!codEpp) throw new Error('Código de EPP requerido');

  const operacionesValidas = ['Entrega', 'Reposicion'];
  if (!operacionesValidas.includes(tipo_operacion)) {
    throw new Error('Tipo de operación inválido. Debe ser "Entrega" o "Reposicion".');
  }

  const operacion = tipo_operacion === 'Reposicion' ? '+' : '-';
  const affected = await eppModel.updateCantidad(codEpp, cantidad, operacion);
  if (affected === 0) throw new Error('EPP no encontrado');
  return affected;
};

const updateCantidadFactura = async (codEpp, cantidad) => {
  if (!codEpp) throw new Error('Código de EPP requerido');

  const cantidadNum = Number(cantidad);
  if (isNaN(cantidadNum) || cantidadNum <= 0) {
    throw new Error('La cantidad debe ser un número mayor a 0.');
  }

  const affected = await eppModel.updateCantidad(codEpp, cantidadNum, '+');
  if (affected === 0) throw new Error('EPP no encontrado.');

  const nuevaCantidad = await eppModel.getCantidad(codEpp);
  return nuevaCantidad;
};

module.exports = {
  getAll,
  getVariantes,
  create,
  updateCantidad,
  updateCantidadFactura,
};
