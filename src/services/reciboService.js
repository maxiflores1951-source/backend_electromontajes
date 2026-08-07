const db = require('../../db');
const reciboModel = require('../models/reciboModel');

const generarCodigoRecibo = async (connection) => {
  const result = await reciboModel.getUltimoCodigo(connection);
  const ultimoCodigo = result.length > 0 ? result[0].ultimo : null;
  const parte1 = 'REC00001';

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
    observacion,
    detalle,
    otrosimpuestos,
    formasDePago,
    NroCmp,
  } = data;

  if (!fecha || !moneda || !id_cliente || !id_razonsocial || !importe || !NroCmp) {
    throw new Error('Faltan datos obligatorios en el recibo');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const periodo_iva = fecha.substring(0, 7);
    const codigoRecibo = await generarCodigoRecibo(connection);

    await reciboModel.insert(connection, {
      codigo: codigoRecibo,
      fecha,
      periodo_iva,
      moneda,
      ctz,
      id_cliente,
      id_razonsocial,
      importe,
      observacion,
      NroCmp,
    });

    if (detalle && detalle.length > 0) {
      const detalleData = detalle.map(item => {
        const pagoNum = parseFloat(item.pago.toString().replace(/\./g, '').replace(',', '.'));

        let codigo = item.codigo_factura_venta || item.codigo_nota_credito;

        if (!codigo) {
          throw new Error('Falta código de comprobante en el detalle');
        }

        if (codigo.startsWith('NCV')) {
          return [
            codigoRecibo,
            null,
            codigo,
            pagoNum,
          ];
        } else if (codigo.startsWith('FV')) {
          return [
            codigoRecibo,
            codigo,
            null,
            pagoNum,
          ];
        } else {
          throw new Error(`Código de comprobante no reconocido: ${codigo}`);
        }
      });

      await reciboModel.insertDetalle(connection, detalleData);

      for (const item of detalle) {
        const pagoNum = parseFloat(item.pago.toString().replace(/\./g, '').replace(',', '.'));

        let codigo = item.codigo_factura_venta || item.codigo_nota_credito;
        let tabla = '';
        let campo = 'codigo';

        if (codigo.startsWith('NCV')) {
          tabla = 'nota_credito_venta';
        } else if (codigo.startsWith('FV')) {
          tabla = 'factura_venta';
        } else {
          throw new Error(`Código de comprobante no reconocido: ${codigo}`);
        }

        const rows = await reciboModel.getComprobanteSaldo(connection, tabla, codigo);

        if (rows.length === 0) {
          const rowsLike = await reciboModel.getComprobanteLike(connection, tabla, codigo);
          throw new Error(`Comprobante no encontrado en ${tabla}: ${codigo}`);
        }

        const saldoActual = parseFloat(rows[0].saldo);
        const nuevoSaldo = saldoActual - pagoNum;

        await reciboModel.updateComprobanteSaldo(
          connection,
          tabla,
          nuevoSaldo,
          nuevoSaldo <= 0 ? 1 : 0,
          codigo
        );
      }
    }

    if (otrosimpuestos && otrosimpuestos.length > 0) {
      const impuestosData = otrosimpuestos.map(({ codigo_impuesto, valor }) => [
        codigoRecibo,
        codigo_impuesto,
        parseFloat(valor),
      ]);

      await reciboModel.insertOtrosImpuestos(connection, impuestosData);
    }

    if (formasDePago && formasDePago.length > 0) {
      const pagosData = formasDePago.map(({ codigo_valor, fecha, importe }) => [
        codigoRecibo,
        codigo_valor,
        fecha,
        parseFloat(importe),
      ]);

      await reciboModel.insertFormasPago(connection, pagosData);
    }

    await connection.commit();
    return codigoRecibo;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const getAll = async () => {
  const connection = await db.getConnection();

  try {
    const recibos = await reciboModel.getRecibos(connection);

    for (const recibo of recibos) {
      const facturas = await reciboModel.getFacturasDetalle(connection, recibo.codigo);
      const notasCredito = await reciboModel.getNotasCreditoDetalle(connection, recibo.codigo);

      recibo.comprobantes = [...facturas, ...notasCredito];
      recibo.otros_impuestos = await reciboModel.getImpuestos(connection, recibo.codigo);
      recibo.formas_pago = await reciboModel.getPagos(connection, recibo.codigo);
    }

    return recibos;
  } finally {
    connection.release();
  }
};

const getImpuestosPorRazon = async (idRazonSocial, desde, hasta) => {
  if (!idRazonSocial || !desde || !hasta) {
    throw new Error('Faltan datos: idRazonSocial, desde o hasta');
  }

  const desdeCompleto = `${desde} 00:00:00`;
  const hastaCompleto = `${hasta} 23:59:59`;

  return await reciboModel.getImpuestosPorRazon(idRazonSocial, desdeCompleto, hastaCompleto);
};

const getImpuestosPorFecha = async (desde, hasta) => {
  if (!desde || !hasta) {
    throw new Error('Faltan datos: desde o hasta');
  }

  const desdeCompleto = `${desde} 00:00:00`;
  const hastaCompleto = `${hasta} 23:59:59`;

  return await reciboModel.getImpuestosPorFecha(desdeCompleto, hastaCompleto);
};

const filtrar = async (desde, hasta) => {
  if (!desde || !hasta) {
    throw new Error('Faltan las fechas desde y hasta');
  }

  const desdeCompleto = `${desde} 00:00:00`;
  const hastaCompleto = `${hasta} 23:59:59`;

  const connection = await db.getConnection();

  try {
    const recibos = await reciboModel.getRecibosFiltrados(connection, desdeCompleto, hastaCompleto);

    for (const recibo of recibos) {
      const facturas = await reciboModel.getFacturasDetalle(connection, recibo.codigo);
      const notasCredito = await reciboModel.getNotasCreditoDetalle(connection, recibo.codigo);

      recibo.comprobantes = [...facturas, ...notasCredito];
      recibo.otros_impuestos = await reciboModel.getImpuestos(connection, recibo.codigo);
      recibo.formas_pago = await reciboModel.getPagos(connection, recibo.codigo);
    }

    return {
      desde,
      hasta,
      totalRecibos: recibos.length,
      recibos,
    };
  } finally {
    connection.release();
  }
};

module.exports = {
  create,
  getAll,
  getImpuestosPorRazon,
  getImpuestosPorFecha,
  filtrar,
};
