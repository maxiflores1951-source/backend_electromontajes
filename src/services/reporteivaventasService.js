const reporteivaventasModel = require('../models/reporteivaventasModel');
const db = require('../../db');

const generarCodigoReporteIVAVentas = async () => {
  const ultimoCodigo = await reporteivaventasModel.getLastCodigo();
  const parte1 = 'RIV00001';

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

  if (!id_razonsocial || !periodo || !items || items.length === 0) {
    throw new Error('Faltan datos obligatorios o facturas seleccionadas');
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const codigoReporte = await generarCodigoReporteIVAVentas();

    await reporteivaventasModel.insertReporteIvaVentas(connection, [
      codigoReporte,
      new Date(),
      periodo,
      importe_total || 0,
      iva21 || 0,
      iva27 || 0,
      iva10 || 0,
      id_razonsocial,
    ]);

    const movimientos = items.map((codigo_factura) => [
      codigoReporte,
      codigo_factura,
    ]);

    await reporteivaventasModel.insertMovimientos(connection, movimientos);

    await reporteivaventasModel.updatePeriodoFacturaVenta(connection, periodo, items);

    await connection.commit();
    return codigoReporte;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const getAll = async () => {
  const reportes = await reporteivaventasModel.getReportes();

  const reportesConFacturas = await Promise.all(
    reportes.map(async (reporte) => {
      const movimientos = await reporteivaventasModel.getMovimientosReporte(reporte.codigo);
      const codigosFacturas = movimientos.map(mov => mov.codigo_factura);

      if (codigosFacturas.length === 0) {
        return { ...reporte, facturas: [] };
      }

      const facturas = await reporteivaventasModel.getFacturasByCodigos(codigosFacturas);

      const facturasCompletas = await Promise.all(
        facturas.map(async (factura) => {
          const detalle = await reporteivaventasModel.getDetalleFactura(factura.codigo);
          const formasPago = await reporteivaventasModel.getFormasPago(factura.codigo);
          const otrosImpuestos = await reporteivaventasModel.getOtrosImpuestos(factura.codigo);

          return {
            ...factura,
            detalle,
            formasPago,
            otrosImpuestos,
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
