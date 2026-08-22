const remitocompraModel = require('../models/remitocompraModel');
const articuloService = require('./articuloService');
const eppVarianteService = require('./eppVarianteService');

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

const create = async (data = {}, idUsuario) => {
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
    item = [],
    observacion,
    relacion,
    id_lugar
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

  // Paso 1: Hacer upsert de todas las variantes de EPP y obtener sus IDs
  const varianteIds = [];
  for (let i = 0; i < (item || []).length; i++) {
    const it = item[i];
    if (it.tipo_operacion === 'epp' && it.id_epp) {
      try {
        const varianteId = await eppVarianteService.upsertFromRemito({
          id_epp: it.id_epp,
          id_marca: it.id_marca,
          id_color: it.id_color,
          id_talla: it.id_talla,
          codigo_tipo_epp: it.codigo_tipo_epp,
          nombre: it.nombre,
          unidad: it.unidad,
          cantidad: it.cantidad,
        }, idUsuario);
        varianteIds[i] = { index: i, varianteId };
      } catch (err) {
        console.error('Error upserting EPP variante for item', i, err.message);
        throw new Error(`Error al crear la variante de EPP (item ${i}, id_epp ${it.id_epp}): ${err.message}`);
      }
    } else {
      varianteIds[i] = null;
    }
  }

  // Paso 2: Construir los datos de movimiento con los IDs de variante
  const movimientosData = (item || []).map((it, index) => {
    if (it.tipo_operacion === 'epp') {
      const varianteInfo = varianteIds.find(v => v && v.index === index);
      if (!varianteInfo) {
        throw new Error(`No se pudo crear la variante de EPP para el item índice ${index} (id_epp: ${it.id_epp})`);
      }
      const id_epp_variante = varianteInfo.varianteId;
      return [
        codigoOrden,
        'epp',
        null,
        null,
        id_epp_variante,
        it.id_concepto,
        it.unidad,
        it.nombre,
        it.cantidad,
        0
      ];
    }
    return [
      codigoOrden,
      it.tipo_operacion,
      it.tipo_operacion === 'articulo' ? it.id_articulo : null,
      it.tipo_operacion === 'herramienta' ? it.id_herramienta : null,
      it.tipo_operacion === 'epp' ? 0 : null,
      it.tipo_operacion === 'concepto' ? it.id_concepto : null,
      it.unidad,
      it.nombre,
      it.cantidad,
      0
    ];
  });

  if (movimientosData.length > 0) {
    await remitocompraModel.insertMovimientos(codigoOrden, movimientosData);
  }

  for (const it of item || []) {
    if (it.tipo_operacion === 'articulo' && it.id_articulo) {
      await articuloService.ajustarStock(it.id_articulo, it.cantidad, 'Entrada', id_lugar || 'TQ');
    }
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
    item = [],
    observacion,
    relacion,
    id_lugar
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

  const movimientosViejos = await remitocompraModel.getMovimientosRemito(codigo);

  for (const mov of movimientosViejos) {
    if (mov.tipo_movimiento === 'articulo' && mov.id_articulo) {
      await articuloService.ajustarStock(mov.id_articulo, mov.cantidad, 'Salida', id_lugar || 'TQ');
    }
  }

  await remitocompraModel.deleteMovimientosRemito(codigo);

  if (Array.isArray(item) && item.length > 0) {
    const varianteIds = [];
    for (let i = 0; i < (item || []).length; i++) {
      const it = item[i];
      if (it.tipo_operacion === 'epp' && it.id_epp) {
        try {
          const varianteId = await eppVarianteService.upsertFromRemito({
            id_epp: it.id_epp,
            id_marca: it.id_marca,
            id_color: it.id_color,
            id_talla: it.id_talla,
            codigo_tipo_epp: it.codigo_tipo_epp,
            nombre: it.nombre,
            unidad: it.unidad,
            cantidad: it.cantidad,
          });
          varianteIds[i] = { index: i, varianteId };
        } catch (err) {
          console.error('Error upserting EPP variante for item', i, err.message);
          throw new Error(`Error al crear la variante de EPP (item ${i}, id_epp ${it.id_epp}): ${err.message}`);
        }
      } else {
        varianteIds[i] = null;
      }
    }

    const movimientosData = (item || []).map((it, index) => {
      if (!it.nombre || !it.unidad || !it.cantidad) {
        throw new Error(`Datos incompletos para el item: ${JSON.stringify({ nombre: it.nombre, unidad: it.unidad, cantidad: it.cantidad, tipo_operacion: it.tipo_operacion })}`);
      }

      if (it.tipo_operacion === 'epp') {
        const varianteInfo = varianteIds.find(v => v && v.index === index);
        if (!varianteInfo) {
          throw new Error(`No se pudo crear la variante de EPP para el item índice ${index} (id_epp: ${it.id_epp})`);
        }
        return [
          codigo,
          'epp',
          null,
          null,
          varianteInfo.varianteId,
          it.id_concepto,
          it.unidad,
          it.nombre,
          it.cantidad,
          0
        ];
      }

      return [
        codigo,
        it.tipo_operacion,
        it.tipo_operacion === 'articulo' ? it.id_articulo : null,
        it.tipo_operacion === 'herramienta' ? it.id_herramienta : null,
        it.tipo_operacion === 'epp' ? 0 : null,
        it.tipo_operacion === 'concepto' ? it.id_concepto : null,
        it.unidad,
        it.nombre,
        it.cantidad,
        0
      ];
    });

    await remitocompraModel.insertMovimientos(codigo, movimientosData);
  }

  for (const it of item || []) {
    if (it.tipo_operacion === 'articulo' && it.id_articulo) {
      await articuloService.ajustarStock(it.id_articulo, it.cantidad, 'Entrada', id_lugar || 'TQ');
    }
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