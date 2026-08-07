const db = require('../../db');
const notacreditoventaModel = require('../models/notacreditoventaModel');

const generarCodigoNotaCreditoVenta = async (connection) => {
  const result = await notacreditoventaModel.getUltimoCodigo(connection);

  const ultimoCodigo = result.length > 0 ? result[0].ultimo : null;
  const parte1 = 'NCV0001';

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
    fecha,
    moneda,
    ctz,
    id_cliente,
    id_razonsocial,
    importe,
    iva21,
    iva27,
    iva105,
    observacion,
    tipoCmp,
    codigoletra,
    ptoVta,
    NroCmp,
    estado,
    saldo,
    detalle,
    codigo_factura_venta,
    otros,
    formasDePago,
  } = data;

  if (
    !fecha || !moneda || !id_cliente || !id_razonsocial ||
    !importe || !tipoCmp || !codigoletra || !ptoVta || !NroCmp
  ) {
    throw new Error('Faltan datos obligatorios');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const periodo_iva = fecha.substring(0, 7);
    const saldoFinal = saldo || importe;

    const codigoNotaCredito = await generarCodigoNotaCreditoVenta(connection);

    await notacreditoventaModel.insert(connection, {
      codigo: codigoNotaCredito,
      fecha,
      periodo_iva,
      moneda,
      ctz,
      id_cliente,
      id_razonsocial,
      importe,
      iva21,
      iva27,
      iva105,
      observacion,
      tipoCmp,
      codigoletra,
      ptoVta,
      NroCmp,
      estado,
      saldo: saldoFinal,
    });

    let detallesInsertados = 0;
    if (detalle && detalle.length > 0) {
      const detallesData = detalle.map((item) => [
        codigoNotaCredito,
        item.codigo || codigo_factura_venta,
        item.descripcion,
        item.iva || null,
        item.importe,
      ]);

      await notacreditoventaModel.insertDetalles(connection, detallesData);
      detallesInsertados = detalle.length;
    }

    if (otros && otros.length > 0) {
      const otrosImpuestosData = otros.map(({ codigo, nombre, valor }) => [
        codigoNotaCredito,
        codigo,
        nombre,
        valor,
      ]);

      await notacreditoventaModel.insertOtrosImpuestos(connection, otrosImpuestosData);
    }

    if (formasDePago && formasDePago.length > 0) {
      const formasPagoData = formasDePago.map(({ codigo, descripcion, fecha, importe }) => [
        codigoNotaCredito,
        codigo,
        descripcion,
        fecha,
        importe,
      ]);

      await notacreditoventaModel.insertFormasPago(connection, formasPagoData);
    }

    await connection.commit();

    return {
      codigoNotaCredito,
      detallesInsertados,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const getByCodigo = async (codigo) => {
  const notaCredito = await notacreditoventaModel.getByCodigo(codigo);

  if (notaCredito.length === 0) {
    throw new Error('Nota de crédito no encontrada');
  }

  const detalles = await notacreditoventaModel.getDetallesByCodigo(codigo);

  return {
    ...notaCredito[0],
    detalles,
  };
};

const getAll = async () => {
  const notasCredito = await notacreditoventaModel.getAll();

  const notasCreditoCompletas = await Promise.all(
    notasCredito.map(async (notaCredito) => {
      const detalle = await notacreditoventaModel.getDetalleCompleto(notaCredito.codigo);
      const otrosImpuestos = await notacreditoventaModel.getOtrosImpuestos(notaCredito.codigo);
      const formasPago = await notacreditoventaModel.getFormasPago(notaCredito.codigo);

      return {
        ...notaCredito,
        detalle,
        otrosImpuestos,
        formasPago,
      };
    })
  );

  return notasCreditoCompletas;
};

module.exports = {
  create,
  getByCodigo,
  getAll,
};
