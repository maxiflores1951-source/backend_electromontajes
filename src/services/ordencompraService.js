const ordencompraModel = require('../models/ordencompraModel');

const generarCodigoMovimiento = async (connection) => {
  const ultimoCodigo = await ordencompraModel.getLastCodigo(connection);
  const parte1 = 'OC00001';

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
  console.log('[ORDEN COMPRA - CREATE] Datos recibidos:', JSON.stringify(data, null, 2));

  const {
    fecha_pedido,
    fecha_entrega,
    id_solicitado,
    id_entregado,
    id_proveedor,
    id_motivo,
    id_servicio,
    id_movil,
    activo,
    id_razon_social,
    item,
    observacion,
    id_creado
  } = data;

  const connection = await ordencompraModel.getConnection();

  try {
    await ordencompraModel.beginTransaction(connection);

    const codigoOrden = await generarCodigoMovimiento(connection);

    await ordencompraModel.insertOrden(connection, {
      codigoOrden,
      fecha_pedido,
      fecha_entrega: fecha_entrega || fecha_pedido,
      id_solicitado,
      id_entregado: id_entregado || id_solicitado,
      id_proveedor,
      id_motivo,
      id_servicio,
      id_movil,
      activo,
      id_razon_social,
      observacion,
      id_creado
    });

    const movimientosData = (item || []).map(({ id_articulo, id_concepto, tipo_operacion, nombre, unidad, cantidad }) => [
      codigoOrden,
      tipo_operacion === 'articulo' ? 'articulo' : 'concepto',
      id_articulo,
      id_concepto,
      unidad,
      nombre,
      cantidad,
      1
    ]);

    if (movimientosData.length > 0) {
      await ordencompraModel.insertMovimientos(connection, movimientosData);
    }

    await ordencompraModel.commit(connection);
    return codigoOrden;
  } catch (error) {
    await ordencompraModel.rollback(connection);
    throw error;
  } finally {
    await ordencompraModel.release(connection);
  }
};

const getAll = async () => {
  const ordenesCompra = await ordencompraModel.getOrdenesCompra();

  const ordenesConMovimientosYRemitos = await Promise.all(ordenesCompra.map(async (orden) => {
    const movimientos = await ordencompraModel.getMovimientosOrden(orden.codigo);
    const remitosFacturas = await ordencompraModel.getRemitosFacturasOrden(orden.codigo);

    return {
      ...orden,
      movimientos,
      remitos: remitosFacturas.map(r => r.remito).filter(r => r !== null),
      facturas: remitosFacturas.map(r => r.factura).filter(f => f !== null),
      remitos_facturas: remitosFacturas
    };
  }));

  return ordenesConMovimientosYRemitos;
};

const getNoAfectadas = async () => {
  const ordenesCompraNoAfectadas = await ordencompraModel.getOrdenesNoAfectadas();

  const ordenesConMovimientosYRemitos = await Promise.all(
    ordenesCompraNoAfectadas.map(async (orden) => {
      const movimientos = await ordencompraModel.getMovimientosOrden(orden.codigo);
      const remitos = await ordencompraModel.getRemitosOrden(orden.codigo);

      return {
        ...orden,
        movimientos,
        remitos: remitos.map(r => r.remito)
      };
    })
  );

  return ordenesConMovimientosYRemitos;
};

const update = async (codigoOrden, data) => {
  console.log(`[ORDEN COMPRA - UPDATE] Codigo: ${codigoOrden}, Datos recibidos:`, JSON.stringify(data, null, 2));

  const {
    fecha_pedido,
    fecha_entrega,
    id_solicitado,
    id_entregado,
    id_proveedor,
    id_motivo,
    id_servicio,
    id_movil,
    activo,
    id_razon_social,
    observacion,
    id_modificado,
    item
  } = data;

  const connection = await ordencompraModel.getConnection();

  try {
    await ordencompraModel.beginTransaction(connection);

    await ordencompraModel.updateOrden(connection, {
      codigoOrden,
      fecha_pedido,
      fecha_entrega,
      id_solicitado,
      id_entregado,
      id_proveedor,
      id_motivo,
      id_servicio,
      id_movil,
      activo,
      id_razon_social,
      observacion,
      id_modificado
    });

    await ordencompraModel.deleteMovimientosOrden(connection, codigoOrden);

    const movimientosData = (item || []).map(({ id_articulo, id_concepto, tipo_movimiento, nombre, unidad, cantidad }) => [
      codigoOrden,
      tipo_movimiento,
      id_articulo,
      id_concepto,
      unidad,
      nombre,
      cantidad,
      1
    ]);

    if (movimientosData.length) {
      await ordencompraModel.insertMovimientosUpdate(connection, movimientosData);
    }

    await ordencompraModel.commit(connection);
    return codigoOrden;
  } catch (error) {
    await ordencompraModel.rollback(connection);
    throw error;
  } finally {
    await ordencompraModel.release(connection);
  }
};

const getOrdenRelaciones = async (codigo) => {
  return await ordencompraModel.getOrdenRelaciones(codigo);
};

const getResumen = async () => {
  const resumenRows = await ordencompraModel.getResumenOrdenes();

  const resumen = resumenRows && resumenRows[0] ? resumenRows[0] : {
    cantidad_total_ordenes: 0,
    cantidad_anuladas: 0,
    cantidad_afectadas: 0,
    cantidad_no_afectadas: 0
  };

  const ordenesPorMotivo = await ordencompraModel.getOrdenesPorMotivo();

  return { resumen, ordenes_por_motivo: ordenesPorMotivo };
};

const eliminarRelacion = async (tipo, codigo) => {
  if (tipo !== 'remito' && tipo !== 'factura') {
    throw new Error('Tipo inválido. Debe ser "remito" o "factura".');
  }

  let affectedRows;
  if (tipo === 'remito') {
    affectedRows = await ordencompraModel.deleteRelacionRemito(codigo);
  } else {
    affectedRows = await ordencompraModel.deleteRelacionFactura(codigo);
  }

  if (affectedRows === 0) {
    throw new Error('No se encontró la relación a eliminar.');
  }

  return tipo;
};

const crearRelacion = async (data) => {
  const { tipo, codigo, orden_compra } = data;

  if (!tipo || !codigo || !orden_compra) {
    throw new Error('Faltan datos obligatorios.');
  }

  if (tipo !== 'remito' && tipo !== 'factura') {
    throw new Error('Tipo inválido. Debe ser "remito" o "factura".');
  }

  let insertId;
  if (tipo === 'remito') {
    insertId = await ordencompraModel.insertRelacionRemito(orden_compra, codigo);
  } else {
    insertId = await ordencompraModel.insertRelacionFactura(orden_compra, codigo);
  }

  return { tipo, insertId };
};

module.exports = {
  create,
  getAll,
  getNoAfectadas,
  update,
  getOrdenRelaciones,
  getResumen,
  eliminarRelacion,
  crearRelacion,
};
