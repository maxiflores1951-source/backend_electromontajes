const db = require('../../db');
const facturaventaModel = require('../models/facturaventaModel');

const generarCodigoFacturaVenta = async (connection) => {
  const result = await facturaventaModel.getUltimoCodigo(connection);
  const ultimoCodigo = result.length > 0 ? result[0].ultimo : null;
  const parte1 = 'FV00001';

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

const enriquecerFactura = async (factura) => {
  const detalle = await facturaventaModel.getDetalle(factura.codigo);
  const otrosImpuestos = await facturaventaModel.getOtrosImpuestos(factura.codigo);
  const formasPago = await facturaventaModel.getFormasPago(factura.codigo);
  return {
    ...factura,
    detalle,
    otrosImpuestos,
    formasPago,
  };
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
    detalle,
    otrosimpuestos,
    formasDePago,
    tipoCmp,
    codigoletra,
    ptoVta,
    NroCmp,
  } = data;

  if (!fecha || !moneda || !id_cliente || !id_razonsocial || !importe || !tipoCmp || !codigoletra || !ptoVta || !NroCmp) {
    throw new Error('Faltan datos obligatorios en la factura de venta');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const periodo_iva = fecha.substring(0, 7);
    const codigoFactura = await generarCodigoFacturaVenta(connection);

    let saldo = 0;
    if (formasDePago && formasDePago.some(fp => fp.codigo_valor === 'CC')) {
      saldo = importe;
    }

    await facturaventaModel.insert(connection, {
      codigo: codigoFactura,
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
      saldo,
    });

    if (detalle && detalle.length > 0) {
      for (const item of detalle) {
        const codigoPresupuesto = item.codigo;
        const importeTotalFactura = parseFloat(importe) || 0;

        if (codigoletra === 'A' || codigoletra === 'M') {
          const saldoSinIvaRestar = importeTotalFactura / 1.21;
          const saldoIvaRestar = importeTotalFactura;

          await facturaventaModel.updatePresupuestoSaldoAM(
            connection,
            saldoIvaRestar,
            saldoSinIvaRestar,
            codigoPresupuesto
          );
        } else {
          const saldoIvaRestar = importeTotalFactura * 1.21;

          await facturaventaModel.updatePresupuestoSaldoOther(
            connection,
            importeTotalFactura,
            saldoIvaRestar,
            codigoPresupuesto
          );
        }
      }
    }

    if (detalle && detalle.length > 0) {
      const detalleData = detalle.map((item) => [
        codigoFactura,
        item.codigo,
        item.descripcion,
        item.iva || 0,
        item.importe,
      ]);

      await facturaventaModel.insertDetalle(connection, detalleData);
    }

    if (otrosimpuestos && otrosimpuestos.length > 0) {
      const impuestosData = otrosimpuestos.map(({ codigo_impuesto, nombre, valor }) => [
        codigoFactura,
        codigo_impuesto,
        nombre,
        valor,
      ]);

      await facturaventaModel.insertOtrosImpuestos(connection, impuestosData);
    }

    if (formasDePago && formasDePago.length > 0) {
      const pagosData = formasDePago.map(({ codigo_valor, fecha, importe }) => [
        codigoFactura,
        codigo_valor,
        fecha,
        importe,
      ]);

      await facturaventaModel.insertFormasPago(connection, pagosData);
    }

    await connection.commit();

    return {
      codigo: codigoFactura,
      presupuestos_vinculados: detalle ? detalle.map(d => d.codigo) : [],
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const getAll = async () => {
  const facturasVenta = await facturaventaModel.getAll();
  const facturasCompletas = await Promise.all(facturasVenta.map(enriquecerFactura));
  return facturasCompletas;
};

const getByRazonSocial = async (id, periodo) => {
  const facturasVenta = await facturaventaModel.getByRazonSocial(id, periodo);
  const facturasCompletas = await Promise.all(facturasVenta.map(enriquecerFactura));
  return facturasCompletas;
};

const update = async (codigo, data) => {
  const {
    fecha,
    moneda,
    ctz,
    id_servicio,
    id_cliente,
    id_razonsocial,
    importe,
    iva21,
    iva27,
    iva105,
    observacion,
    detalle,
    otrosimpuestos,
    formasDePago,
    tipoCmp,
    codigoletra,
    ptoVta,
    NroCmp,
  } = data;

  if (!fecha || !moneda || !id_cliente || !id_razonsocial || !importe || !tipoCmp || !codigoletra || !ptoVta || !NroCmp) {
    throw new Error('Faltan datos obligatorios en la factura de venta');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const periodo_iva = fecha.substring(0, 7);

    await facturaventaModel.update(connection, {
      fecha,
      periodo_iva,
      moneda,
      ctz,
      id_servicio,
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
      codigo,
    });

    await facturaventaModel.deleteDetalle(connection, codigo);
    await facturaventaModel.deleteOtrosImpuestos(connection, codigo);
    await facturaventaModel.deleteFormasPago(connection, codigo);

    if (detalle && detalle.length > 0) {
      const detalleData = detalle.map(({ descripcion, iva, importe }) => [
        codigo,
        descripcion,
        iva,
        importe,
      ]);
      await facturaventaModel.insertDetalleSinPresupuesto(connection, detalleData);
    }

    if (otrosimpuestos && otrosimpuestos.length > 0) {
      const impuestosData = otrosimpuestos.map(({ codigo_impuesto, nombre, valor }) => [
        codigo,
        codigo_impuesto,
        nombre,
        valor,
      ]);
      await facturaventaModel.insertOtrosImpuestos(connection, impuestosData);
    }

    if (formasDePago && formasDePago.length > 0) {
      const pagosData = formasDePago.map(({ codigo_valor, fecha: fechaPago, importe: impPago }) => [
        codigo,
        codigo_valor,
        fechaPago,
        impPago,
      ]);
      await facturaventaModel.insertFormasPago(connection, pagosData);
    }

    let saldo = 0;
    if (formasDePago && formasDePago.some(fp => fp.codigo_valor === 'CC')) {
      saldo = importe;
    }

    await facturaventaModel.updateSaldo(connection, saldo, codigo);

    await connection.commit();
    return codigo;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const filtrar = async (desde, hasta) => {
  if (!desde || !hasta) {
    throw new Error('Faltan las fechas desde y hasta');
  }

  const desdeCompleto = `${desde} 00:00:00`;
  const hastaCompleto = `${hasta} 23:59:59`;

  const facturasVenta = await facturaventaModel.getFiltradas(desdeCompleto, hastaCompleto);

  const facturasCompletas = await Promise.all(facturasVenta.map(enriquecerFactura));

  return {
    desde,
    hasta,
    total: facturasCompletas.length,
    facturas: facturasCompletas,
  };
};

const getByCliente = async (idCliente) => {
  const facturasVenta = await facturaventaModel.getByCliente(idCliente);
  const facturasCompletas = await Promise.all(facturasVenta.map(enriquecerFactura));
  return facturasCompletas;
};

const getPorClienteRazonSocial = async (idCliente, idRazonSocial) => {
  const facturasVenta = await facturaventaModel.getByClienteYRazonSocial(idCliente, idRazonSocial);
  const notasCreditoVenta = await facturaventaModel.getNotasCreditoByClienteYRazonSocial(idCliente, idRazonSocial);

  const documentosCompletos = [];

  for (const factura of facturasVenta) {
    const detalle = await facturaventaModel.getDetalle(factura.codigo);
    const otrosImpuestos = await facturaventaModel.getOtrosImpuestos(factura.codigo);
    const formasPago = await facturaventaModel.getFormasPago(factura.codigo);

    documentosCompletos.push({
      ...factura,
      detalle,
      otrosImpuestos,
      formasPago,
    });
  }

  for (const notaCredito of notasCreditoVenta) {
    const detalle = await facturaventaModel.getDetalleNotaCredito(notaCredito.codigo);
    const otrosImpuestos = await facturaventaModel.getOtrosImpuestosNotaCredito(notaCredito.codigo);
    const formasPago = await facturaventaModel.getFormasPagoNotaCredito(notaCredito.codigo);

    documentosCompletos.push({
      ...notaCredito,
      detalle,
      otrosImpuestos,
      formasPago,
    });
  }

  documentosCompletos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  return documentosCompletos;
};

const getCalendario = async () => {
  const facturasVenta = await facturaventaModel.getCalendario();
  const facturasCompletas = await Promise.all(facturasVenta.map(enriquecerFactura));
  return facturasCompletas;
};

module.exports = {
  create,
  getAll,
  getByRazonSocial,
  update,
  filtrar,
  getByCliente,
  getPorClienteRazonSocial,
  getCalendario,
};
