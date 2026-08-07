const devolucioncompraModel = require('../models/devolucioncompraModel');

const generarCodigoDevolucion = async (connection) => {
  const ultimoCodigo = await devolucioncompraModel.getLastCodigo(connection);
  const parte1 = 'DC00001';

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
    fecha_pedido,
    fecha_entrega,
    id_solicitado,
    id_entregado,
    id_motivo,
    id_servicio,
    id_movil,
    observacion,
    id_proveedor,
    articulos
  } = data;

  const connection = await devolucioncompraModel.getConnection();

  try {
    await devolucioncompraModel.beginTransaction(connection);

    const codigoDevolucion = await generarCodigoDevolucion(connection);

    const existe = await devolucioncompraModel.checkCodigoExists(connection, codigoDevolucion);
    if (existe) {
      throw new Error('El código generado ya existe');
    }

    await devolucioncompraModel.insertDevolucion(connection, {
      codigoDevolucion,
      fecha_pedido,
      id_solicitado,
      id_proveedor,
      id_motivo,
      id_servicio,
      id_movil,
      observacion
    });

    for (const articulo of articulos || []) {
      await devolucioncompraModel.insertMovimiento(connection, { codigoDevolucion, articulo });
    }

    await devolucioncompraModel.commit(connection);
    return codigoDevolucion;
  } catch (error) {
    await devolucioncompraModel.rollback(connection);
    throw error;
  } finally {
    await devolucioncompraModel.release(connection);
  }
};

const getAll = async () => {
  const devolucionesCompra = await devolucioncompraModel.getDevolucionesCompra();

  const devolucionesConMovimientos = await Promise.all(devolucionesCompra.map(async (devolucion) => {
    const movimientos = await devolucioncompraModel.getMovimientosDevolucion(devolucion.codigo);
    return { ...devolucion, movimientos };
  }));

  return devolucionesConMovimientos;
};

module.exports = {
  create,
  getAll,
};
