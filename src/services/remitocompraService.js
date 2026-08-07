const remitocompraModel = require('../models/remitocompraModel');

const generarCodigoMovimiento = async () => {
  const ultimoCodigo = await remitocompraModel.getLastCodigo();
  const parte1 = 'RC00001';

  if (!ultimoCodigo) {
    return `${parte1}-00000001`;
  } else {
    const partes = ultimoCodigo.split('-');
    const parte2 = partes.length > 1 ? partes[1] : '00000000';

    const numero = parseInt(parte2, 10);
    const nuevoNumero = isNaN(numero) ? 1 : numero + 1;

    return `${parte1}-${nuevoNumero.toString().padStart(8, '0')}`;
  }
};

const create = async (data) => {
  const {
    fecha_entrega,
    remito,
    id_solicitado,
    id_proveedor,
    id_motivo,
    id_servicio,
    id_movil,
    activo,
    id_razon_social,
    item,
    observacion,
    relacion
  } = data;

  if (!remito || !id_solicitado || !id_proveedor || !id_motivo ||
      (activo === undefined || activo === null) || !id_razon_social) {
    throw new Error('Faltan datos obligatorios en el remito de compra.');
  }

  if (activo !== 0 && activo !== 1) {
    throw new Error('El campo "activo" debe ser 0 o 1.');
  }

  const codigoOrden = await generarCodigoMovimiento();

  const existeRemito = await remitocompraModel.getRemitoByCodigo(codigoOrden);
  if (existeRemito.length > 0) {
    return { codigoOrden, existe: true };
  }

  await remitocompraModel.insertRemito({
    codigoOrden,
    remito,
    fecha_entrega,
    id_solicitado,
    id_proveedor,
    id_motivo,
    id_servicio,
    id_movil,
    activo,
    id_razon_social,
    observacion
  });

  const movimientosData = (item || []).map(({ nombre, unidad, cantidad, tipo_operacion, id_articulo, id_herramienta, id_epp, id_concepto }) => {
    if (!nombre || !unidad || !cantidad) {
      throw new Error(`Datos incompletos para el item: ${JSON.stringify({ nombre, unidad, cantidad, tipo_operacion })}`);
    }

    return [
      codigoOrden,
      tipo_operacion,
      tipo_operacion === 'articulo' ? id_articulo : null,
      tipo_operacion === 'herramienta' ? id_herramienta : null,
      tipo_operacion === 'epp' ? id_epp : null,
      tipo_operacion === 'concepto' ? id_concepto : null,
      unidad,
      nombre,
      cantidad,
      0
    ];
  });

  if (movimientosData.length > 0) {
    await remitocompraModel.insertMovimientos(codigoOrden, movimientosData);
  }

  if (Array.isArray(relacion) && relacion.length > 0) {
    for (const codigoRelacion of relacion) {
      await remitocompraModel.insertRemitoOrden(codigoRelacion, codigoOrden);
    }
  }

  return { codigoOrden, existe: false };
};

const getAll = async () => {
  const remitosCompra = await remitocompraModel.getRemitosCompra();

  const remitosConMovimientos = await Promise.all(remitosCompra.map(async (remito) => {
    const movimientos = await remitocompraModel.getMovimientosRemito(remito.codigo);
    return { ...remito, movimientos };
  }));

  return remitosConMovimientos;
};

const getPorServicio = async (idServicio) => {
  return await remitocompraModel.getRemitosPorServicio(idServicio);
};

const getSinOrden = async () => {
  const remitosCompra = await remitocompraModel.getRemitosSinOrden();

  const remitosConMovimientos = await Promise.all(remitosCompra.map(async (remito) => {
    const movimientos = await remitocompraModel.getMovimientosRemitoSimple(remito.codigo);
    return { ...remito, movimientos };
  }));

  return remitosConMovimientos;
};

const getResumen = async () => {
  const resumenRows = await remitocompraModel.getResumenRemitos();

  const resumen = resumenRows && resumenRows[0] ? resumenRows[0] : {
    cantidad_total_remitos: 0,
    cantidad_afectados: 0,
    cantidad_no_afectados: 0
  };

  const remitosPorMotivo = await remitocompraModel.getRemitosPorMotivo();

  return { resumen, remitos_por_motivo: remitosPorMotivo };
};

const update = async (codigo, data) => {
  const {
    fecha_entrega,
    remito,
    id_solicitado,
    id_proveedor,
    id_motivo,
    id_servicio,
    id_movil,
    activo,
    id_razon_social,
    item,
    observacion,
    relacion
  } = data;

  if (!remito || !id_solicitado || !id_proveedor || !id_motivo ||
      (activo === undefined || activo === null) || !id_razon_social) {
    throw new Error('Faltan datos obligatorios en el remito de compra.');
  }

  if (activo !== 0 && activo !== 1) {
    throw new Error('El campo "activo" debe ser 0 o 1.');
  }

  await remitocompraModel.updateRemito({
    codigo,
    remito,
    fecha_entrega,
    id_solicitado,
    id_proveedor,
    id_motivo,
    id_servicio,
    id_movil,
    activo,
    id_razon_social,
    observacion
  });

  await remitocompraModel.deleteMovimientosRemito(codigo);

  if (Array.isArray(item) && item.length > 0) {
    const movimientosData = item.map(({ nombre, unidad, cantidad, tipo_operacion, id_articulo, id_herramienta, id_epp, id_concepto }) => {
      if (!nombre || !unidad || !cantidad) {
        throw new Error(`Datos incompletos para el item: ${JSON.stringify({ nombre, unidad, cantidad, tipo_operacion })}`);
      }

      return [
        codigo,
        tipo_operacion,
        tipo_operacion === 'articulo' ? id_articulo : null,
        tipo_operacion === 'herramienta' ? id_herramienta : null,
        tipo_operacion === 'epp' ? id_epp : null,
        tipo_operacion === 'concepto' ? id_concepto : null,
        unidad,
        nombre,
        cantidad,
        0
      ];
    });

    await remitocompraModel.insertMovimientos(codigo, movimientosData);
  }

  await remitocompraModel.deleteRelacionesRemito(codigo);

  if (Array.isArray(relacion) && relacion.length > 0) {
    for (const codigoRelacion of relacion) {
      await remitocompraModel.insertRemitoOrdenRelacion(codigoRelacion, codigo);
    }
  }

  return codigo;
};

const getSinFactura = async () => {
  const remitosCompra = await remitocompraModel.getRemitosSinFactura();

  const remitosConMovimientos = await Promise.all(remitosCompra.map(async (remito) => {
    const movimientos = await remitocompraModel.getMovimientosRemito(remito.codigo);
    return { ...remito, movimientos };
  }));

  return remitosConMovimientos;
};

module.exports = {
  create,
  getAll,
  getPorServicio,
  getSinOrden,
  getResumen,
  update,
  getSinFactura,
};
