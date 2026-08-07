const otropagosModel = require('../models/otropagosModel');
const db = require('../../db');

const generarCodigoOtrosPagos = async (connection) => {
  const ultimoCodigo = await otropagosModel.getLastCodigo(connection);
  const base = 'OTP00001';

  if (!ultimoCodigo) {
    return `${base}-00000001`;
  } else {
    const partes = ultimoCodigo.split('-');
    const numero = parseInt(partes[1] || '0', 10) + 1;
    return `${base}-${numero.toString().padStart(8, '0')}`;
  }
};

const create = async (data, idResponsable) => {
  const {
    fecha,
    moneda,
    ctz,
    id_motivo,
    id_servicio,
    id_movil,
    id_razonsocial,
    id_plancompra,
    id_proveedor,
    importe,
    observacion,
    items,
    formasDePago,
  } = data;

  if (!fecha || !moneda || !id_motivo || !id_razonsocial || !importe) {
    throw new Error('Faltan campos obligatorios en otros pagos');
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const codigoOtrosPagos = await generarCodigoOtrosPagos(connection);

    await otropagosModel.insertOtrosPagos(connection, [
      codigoOtrosPagos,
      fecha,
      moneda,
      ctz || 1,
      id_motivo,
      id_servicio || null,
      id_movil || null,
      idResponsable || null,
      id_razonsocial,
      id_plancompra || null,
      id_proveedor || null,
      importe,
      observacion || null,
    ]);

    if (items && items.length > 0) {
      const detalleData = items.map(({ descripcion, importe }) => {
        if (!descripcion || importe === undefined) {
          throw new Error(`Datos incompletos en detalle: ${JSON.stringify({ descripcion, importe })}`);
        }
        return [codigoOtrosPagos, descripcion, importe];
      });

      await otropagosModel.insertDetalles(connection, detalleData);
    }

    if (formasDePago && formasDePago.length > 0) {
      const formasPagoData = formasDePago.map(({ codigo, fecha, importe }) => {
        if (!codigo || !fecha || importe === undefined) {
          throw new Error(`Datos incompletos en forma de pago: ${JSON.stringify({ codigo, fecha, importe })}`);
        }
        return [codigoOtrosPagos, codigo, fecha, importe];
      });

      await otropagosModel.insertFormasPago(connection, formasPagoData);
    }

    await connection.commit();
    return codigoOtrosPagos;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAll = async () => {
  const connection = await db.getConnection();
  try {
    const otrosPagos = await otropagosModel.getAll(connection);

    for (const pago of otrosPagos) {
      pago.detalles = await otropagosModel.getDetalles(connection, pago.codigo);
      pago.formas_pago = await otropagosModel.getFormasPago(connection, pago.codigo);
    }

    return otrosPagos;
  } finally {
    connection.release();
  }
};

const getByCodigo = async (codigo) => {
  const connection = await db.getConnection();
  try {
    const otrosPagos = await otropagosModel.getByCodigo(connection, codigo);

    if (otrosPagos.length === 0) {
      throw new Error('Pago no encontrado');
    }

    const pago = otrosPagos[0];
    pago.detalles = await otropagosModel.getDetalles(connection, codigo);
    pago.formas_pago = await otropagosModel.getFormasPago(connection, codigo);

    return pago;
  } finally {
    connection.release();
  }
};

const update = async (codigo, data, idResponsable) => {
  const {
    fecha,
    moneda,
    ctz,
    id_motivo,
    id_servicio,
    id_movil,
    id_razonsocial,
    id_plancompra,
    id_proveedor,
    importe,
    observacion,
    items,
    formasDePago,
  } = data;

  if (!fecha || !moneda || !id_motivo || !id_razonsocial || !importe) {
    throw new Error('Faltan campos obligatorios en otros pagos');
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await otropagosModel.updateOtrosPagos(connection, [
      fecha,
      moneda,
      ctz || 1,
      id_motivo,
      id_servicio || null,
      id_movil || null,
      idResponsable || null,
      id_razonsocial,
      id_plancompra || null,
      id_proveedor || null,
      importe,
      observacion || null,
      codigo,
    ]);

    await otropagosModel.deleteDetalles(connection, codigo);
    await otropagosModel.deleteFormasPago(connection, codigo);

    if (items && items.length > 0) {
      const detalleData = items.map(({ descripcion, importe }) => {
        if (!descripcion || importe === undefined) {
          throw new Error(`Datos incompletos en detalle: ${JSON.stringify({ descripcion, importe })}`);
        }
        return [codigo, descripcion, importe];
      });

      await otropagosModel.insertDetalles(connection, detalleData);
    }

    if (formasDePago && formasDePago.length > 0) {
      const formasPagoData = formasDePago.map(({ codigo: codigo_valor, fecha, importe }) => {
        if (!codigo_valor || !fecha || importe === undefined) {
          throw new Error(`Datos incompletos en forma de pago: ${JSON.stringify({ codigo_valor, fecha, importe })}`);
        }
        return [codigo, codigo_valor, fecha, importe];
      });

      await otropagosModel.insertFormasPago(connection, formasPagoData);
    }

    await connection.commit();
    return codigo;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  create,
  getAll,
  getByCodigo,
  update,
};
