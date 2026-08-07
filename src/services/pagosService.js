const pagosModel = require('../models/pagosModel');
const db = require('../../db');

const generarCodigoOrdenPago = async (connection) => {
  const ultimoCodigo = await pagosModel.getLastCodigo(connection);
  const parte1 = 'OP00001';

  if (!ultimoCodigo) {
    return `${parte1}-00000001`;
  }

  const numero = parseInt(ultimoCodigo.split('-')[1], 10) + 1;
  return `${parte1}-${numero.toString().padStart(8, '0')}`;
};

const create = async (data, idUsuario) => {
  const {
    fecha,
    moneda,
    ctz,
    id_proveedor,
    id_razonsocial,
    importe,
    detalle,
    otrosimpuestos,
    formasDePago,
  } = data;

  if (!fecha || !moneda || !id_proveedor || !id_razonsocial || !importe) {
    throw new Error('Faltan datos obligatorios en la orden de pago');
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const codigoOrdenPago = await generarCodigoOrdenPago(connection);

    await pagosModel.insertOrdenPago(connection, [
      codigoOrdenPago,
      fecha,
      moneda,
      ctz || 1,
      id_proveedor,
      id_razonsocial,
      importe,
      idUsuario || null,
    ]);

    if (Array.isArray(detalle) && detalle.length > 0) {
      for (const item of detalle) {
        const codigo = item.codigo_factura_compra;
        const importeNum = Number(item.importe);
        const esNotaCredito = codigo.startsWith('NCC');

        await pagosModel.insertDetalleOrdenPago(connection, [
          codigoOrdenPago,
          esNotaCredito ? null : codigo,
          esNotaCredito ? codigo : null,
          importeNum,
        ]);

        if (esNotaCredito) {
          await pagosModel.updateSaldoNotaCredito(connection, importeNum, codigo);
        } else {
          await pagosModel.updateSaldoFactura(connection, importeNum, codigo);
        }
      }
    }

    if (otrosimpuestos?.length) {
      const data = otrosimpuestos.map(i => [
        codigoOrdenPago,
        i.codigo_impuesto,
        i.valor,
      ]);
      await pagosModel.insertOtrosImpuestos(connection, data);
    }

    if (formasDePago?.length) {
      const pagos = formasDePago.map(p => [
        codigoOrdenPago,
        p.codigo_valor,
        p.fecha,
        p.importe,
      ]);
      await pagosModel.insertFormasPago(connection, pagos);
    }

    await connection.commit();
    return codigoOrdenPago;
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
    const ordenesPago = await pagosModel.getOrdenesPago(connection);

    for (const ordenPago of ordenesPago) {
      ordenPago.facturas_compra = await pagosModel.getFacturasByOrdenPago(connection, ordenPago.codigo);
      ordenPago.notas_credito_compra = await pagosModel.getNotasCreditoByOrdenPago(connection, ordenPago.codigo);
      ordenPago.otros_impuestos = await pagosModel.getImpuestosByOrdenPago(connection, ordenPago.codigo);
      ordenPago.formas_pago = await pagosModel.getFormasPagoByOrdenPago(connection, ordenPago.codigo);
    }

    return ordenesPago;
  } finally {
    connection.release();
  }
};

const getByProveedor = async (idProveedor, idRazonSocial) => {
  const ordenesPago = await pagosModel.getOrdenesPagoByProveedor(idProveedor, idRazonSocial);

  const pagosCompletos = await Promise.all(
    ordenesPago.map(async (pago) => {
      const facturas = await pagosModel.getFacturasByPago(pago.codigo);
      const impuestos = await pagosModel.getImpuestosByPago(pago.codigo);
      const formasPago = await pagosModel.getFormasPagoByPago(pago.codigo);
      return {
        ...pago,
        facturas,
        impuestos,
        formasPago,
      };
    })
  );

  return pagosCompletos;
};

module.exports = {
  create,
  getAll,
  getByProveedor,
};
