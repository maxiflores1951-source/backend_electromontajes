const db = require('../../db');
const remitoventaModel = require('../models/remitoventaModel');

const generarCodigoRemitoVenta = async () => {
  const result = await remitoventaModel.getUltimoCodigo();
  const ultimoCodigo = result.length > 0 ? result[0].ultimo : null;

  const parte1 = 'RV00001';

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

const insertarRemitoVenta = async (data) => {
  const {
    fecha_pedido,
    fecha_entrega,
    id_solicitado,
    id_entregado,
    id_motivo,
    id_servicio,
    id_movil,
    observacion,
    articulos,
  } = data;

  const codigo = await generarCodigoRemitoVenta();

  const checkCodigo = await remitoventaModel.checkCodigo(codigo);
  if (checkCodigo[0].count > 0) {
    throw new Error('El código generado ya existe');
  }

  await remitoventaModel.insert({
    codigo,
    fecha_pedido,
    fecha_entrega,
    id_solicitado,
    id_entregado,
    id_motivo,
    id_servicio,
    id_movil,
    observacion,
  });

  for (const articulo of articulos) {
    let codigoFactura = null;
    let codigoNotaCredito = null;

    if (articulo.codigo_documento) {
      if (articulo.codigo_documento.startsWith('NCC')) {
        codigoNotaCredito = articulo.codigo_documento;
      } else if (articulo.codigo_documento.startsWith('FC')) {
        codigoFactura = articulo.codigo_documento;
      }
    }

    try {
      await remitoventaModel.insertMovimiento({
        codigo_remito_venta: codigo,
        id_articulo: articulo.id,
        cantidad: articulo.cantidad,
        precio: articulo.precio,
        codigo_factura_compra: codigoFactura,
        codigo_nota_credito_compra: codigoNotaCredito,
      });
    } catch (detalleError) {
      console.error('Error al insertar artículo en el remito:', detalleError);
      throw new Error(`Error al insertar el artículo ${articulo.id}`);
    }
  }

  return codigo;
};

const getRemitoByCodigo = async (codigo) => {
  const remito = await remitoventaModel.getRemitoByCodigo(codigo);

  if (remito.length === 0) {
    throw new Error('Remito no encontrado');
  }

  const movimientos = await remitoventaModel.getMovimientosByCodigo(codigo);

  return { remito: remito[0], movimientos };
};

const getObtenerRemitosVenta = async () => {
  const remitosVenta = await remitoventaModel.getRemitosVenta();

  const remitosConArticulos = await Promise.all(
    remitosVenta.map(async (remito) => {
      const articulos = await remitoventaModel.getArticulosByRemito(remito.codigo);

      const importe_total = articulos.reduce(
        (total, art) => total + Number(art.importe_calculado || 0),
        0
      );

      return {
        ...remito,
        articulos,
        importe_total,
      };
    })
  );

  return remitosConArticulos;
};

const getArticulosPorServicio = async (idServicio) => {
  return await remitoventaModel.getArticulosPorServicio(idServicio);
};

const getMovimientosArticulos = async (idMotivo, idServicio, idMovil) => {
  return await remitoventaModel.getMovimientosArticulos(idMotivo, idServicio, idMovil);
};

const actualizarPrecios = async (precios) => {
  if (!Array.isArray(precios) || precios.length === 0) {
    throw new Error('Datos inválidos o vacíos.');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const item of precios) {
      const { codigo_remito_venta, id_articulo, precio } = item;

      if (!codigo_remito_venta || !id_articulo || precio == null) {
        throw new Error('Faltan campos obligatorios.');
      }

      await remitoventaModel.updatePrecio(connection, codigo_remito_venta, id_articulo, precio);
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const getCostosRemitos = async (idServicio) => {
  return await remitoventaModel.getCostosRemitos(idServicio);
};

const actualizarRemitoVenta = async (codigo, data) => {
  const {
    fecha_pedido,
    fecha_entrega,
    id_solicitado,
    id_entregado,
    id_motivo,
    id_servicio,
    id_movil,
    observacion,
    articulos,
  } = data;

  const checkRemito = await remitoventaModel.getRemitoByCodigo(codigo);
  if (checkRemito.length === 0) {
    throw new Error('Remito no encontrado');
  }

  await remitoventaModel.updateRemito({
    codigo,
    fecha_pedido,
    fecha_entrega,
    id_solicitado,
    id_entregado,
    id_motivo,
    id_servicio,
    id_movil,
    observacion,
  });

  await remitoventaModel.deleteMovimientos(codigo);

  for (const articulo of articulos) {
    const codigoFactura = articulo.codigo_factura_compra?.trim() || null;

    await remitoventaModel.insertMovimientoActualizado({
      codigo_remito_venta: codigo,
      id_articulo: articulo.id_articulo ?? null,
      cantidad: articulo.cantidad ?? 0,
      precio: articulo.precio ?? 0,
      codigo_factura_compra: codigoFactura,
    });
  }

  return codigo;
};

module.exports = {
  insertarRemitoVenta,
  getRemitoByCodigo,
  getObtenerRemitosVenta,
  getArticulosPorServicio,
  getMovimientosArticulos,
  actualizarPrecios,
  getCostosRemitos,
  actualizarRemitoVenta,
};
