const db = require('../../db');
const devolucionventaModel = require('../models/devolucionventaModel');

const generarCodigoDevolucionVenta = async () => {
  const result = await devolucionventaModel.getUltimoCodigo();
  const ultimoCodigo = result.length > 0 ? result[0].ultimo : null;

  const parte1 = 'DV00001';

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

const insertarDevolucionVenta = async (data) => {
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
    codigo_nota_credito,
  } = data;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const codigo = await generarCodigoDevolucionVenta();

    const checkCodigo = await devolucionventaModel.checkCodigo(connection, codigo);
    if (checkCodigo[0].count > 0) {
      throw new Error('El código generado ya existe');
    }

    await devolucionventaModel.insert(connection, {
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

    for (const articulo of articulos || []) {
      try {
        await devolucionventaModel.insertMovimiento(connection, {
          codigo_devolucion_venta: codigo,
          id_articulo: articulo.id_articulo,
          cantidad: articulo.cantidad,
          precio: articulo.precio || 0,
          codigo_nc_compra: articulo.codigo_documento || null,
        });
      } catch (detalleError) {
        console.error('Error al insertar artículo en la devolución:', detalleError);
        throw new Error(`Error al insertar el artículo ${articulo.id_articulo}`);
      }
    }

    await connection.commit();
    return { codigo, codigo_nota_credito };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const getRemitosArticulosPorServicio = async (idServicio) => {
  return await devolucionventaModel.getRemitosArticulosPorServicio(idServicio);
};

const getDevolucionesArticulosPorServicio = async (idServicio) => {
  return await devolucionventaModel.getDevolucionesArticulosPorServicio(idServicio);
};

const getObtenerDevolucionesVenta = async () => {
  const devoluciones = await devolucionventaModel.getDevoluciones();

  const devolucionesConArticulos = await Promise.all(
    devoluciones.map(async (devolucion) => {
      const articulos = await devolucionventaModel.getArticulosByDevolucion(devolucion.codigo);

      const importe_total = articulos.reduce(
        (total, art) => total + Number(art.importe_calculado || 0),
        0
      );

      return {
        ...devolucion,
        articulos,
        importe_total,
      };
    })
  );

  return devolucionesConArticulos;
};

const actualizarDevolucionVenta = async (codigo, data) => {
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

  const checkDevolucion = await devolucionventaModel.getDevolucionByCodigo(codigo);

  if (checkDevolucion.length === 0) {
    throw new Error('Devolución no encontrada');
  }

  await devolucionventaModel.updateDevolucion({
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

  await devolucionventaModel.deleteMovimientos(codigo);

  for (const articulo of articulos) {
    await devolucionventaModel.insertMovimientoActualizado({
      codigo_devolucion_venta: codigo,
      id_articulo: articulo.id_articulo ?? null,
      cantidad: articulo.cantidad ?? 0,
      precio: articulo.precio ?? 0,
    });
  }

  return codigo;
};

module.exports = {
  insertarDevolucionVenta,
  getRemitosArticulosPorServicio,
  getDevolucionesArticulosPorServicio,
  getObtenerDevolucionesVenta,
  actualizarDevolucionVenta,
};
