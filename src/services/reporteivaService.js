const reporteivaModel = require('../models/reporteivaModel');
const db = require('../../db');

const generarCodigoReporteIVA = async () => {
  const ultimoCodigo = await reporteivaModel.getLastCodigo();
  const parte1 = 'RI00001';

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
    id_razonsocial,
    periodo,
    importe_total,
    iva21,
    iva10,
    iva27,
    items,
  } = data;

  if (!id_razonsocial || !periodo || !Array.isArray(items) || items.length === 0) {
    throw new Error('Datos obligatorios faltantes');
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const codigoReporte = await generarCodigoReporteIVA();

    await reporteivaModel.insertReporteIva(connection, [
      codigoReporte,
      periodo,
      importe_total || 0,
      iva21 || 0,
      iva27 || 0,
      iva10 || 0,
      id_razonsocial,
    ]);

    const movimientos = items.map(codigo => {
      if (codigo.startsWith('FC')) {
        return [codigoReporte, codigo, null];
      }
      if (codigo.startsWith('NC')) {
        return [codigoReporte, null, codigo];
      }
      throw new Error(`Código inválido: ${codigo}`);
    });

    await reporteivaModel.insertMovimientos(connection, movimientos);

    const facturas = items.filter(c => c.startsWith('FC'));
    const notasCredito = items.filter(c => c.startsWith('NC'));

    if (facturas.length > 0) {
      await reporteivaModel.updatePeriodoFacturas(connection, periodo, facturas);
    }

    if (notasCredito.length > 0) {
      await reporteivaModel.updatePeriodoNotas(connection, periodo, notasCredito);
    }

    await connection.commit();
    return codigoReporte;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAll = async () => {
  const reportes = await reporteivaModel.getReportes();

  const reportesConFacturas = await Promise.all(
    reportes.map(async (reporte) => {
      const movimientosReporte = await reporteivaModel.getMovimientosReporte(reporte.codigo);
      const codigosFacturas = movimientosReporte.map(m => m.codigo_factura);

      if (codigosFacturas.length === 0) {
        return { ...reporte, facturas: [] };
      }

      const facturas = await reporteivaModel.getFacturasByCodigos(codigosFacturas);

      const facturasCompletas = await Promise.all(
        facturas.map(async (factura) => {
          const movimientos = await reporteivaModel.getMovimientosFactura(factura.codigo);
          const otrosImpuestos = await reporteivaModel.getOtrosImpuestosFactura(factura.codigo);
          const formasPago = await reporteivaModel.getFormasPagoFactura(factura.codigo);

          const notasCredito = await reporteivaModel.getNotasCreditoByFactura(factura.codigo);

          const notasCreditoCompletas = await Promise.all(
            notasCredito.map(async (nc) => {
              const movimientosNC = await reporteivaModel.getMovimientosNotaCredito(nc.codigo);
              const otrosImpuestosNC = await reporteivaModel.getOtrosImpuestosNotaCredito(nc.codigo);
              const formasPagoNC = await reporteivaModel.getFormasPagoNotaCredito(nc.codigo);

              return {
                ...nc,
                movimientos: movimientosNC,
                otrosImpuestos: otrosImpuestosNC,
                formasPago: formasPagoNC,
              };
            })
          );

          return {
            ...factura,
            movimientos,
            otrosImpuestos,
            formasPago,
            notasCredito: notasCreditoCompletas,
          };
        })
      );

      return {
        ...reporte,
        facturas: facturasCompletas,
      };
    })
  );

  return reportesConFacturas;
};

module.exports = {
  create,
  getAll,
};
