const db = require('../../db');

const getLastCodigo = async () => {
  const [result] = await db.query('SELECT MAX(codigo) AS ultimo FROM reporte_iva_ventas');
  return result.length > 0 ? result[0].ultimo : null;
};

const insertReporteIvaVentas = async (connection, values) => {
  const query = `
    INSERT INTO reporte_iva_ventas (
      codigo, fecha, periodo, importe_total, iva21, iva27, iva10, razon_social
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await connection.query(query, values);
};

const insertMovimientos = async (connection, data) => {
  const query = `
    INSERT INTO movimientos_reportes_iva_ventas (
      codigo_reporte, codigo_factura
    ) VALUES ?
  `;
  await connection.query(query, [data]);
};

const updatePeriodoFacturaVenta = async (connection, periodo, items) => {
  const query = `
    UPDATE factura_venta
    SET periodo_iva = ?
    WHERE codigo IN (?)
  `;
  await connection.query(query, [periodo, items]);
};

const getReportes = async () => {
  const query = `
    SELECT r.*,
           rs.razon_social AS razon_social_reporte,
           rs.cuil AS cuil_reporte
    FROM reporte_iva_ventas r
    LEFT JOIN razones_sociales rs ON r.razon_social = rs.id
    ORDER BY r.fecha DESC;
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getMovimientosReporte = async (codigoReporte) => {
  const query = `
    SELECT codigo_factura FROM movimientos_reportes_iva_ventas WHERE codigo_reporte = ?
  `;
  const [rows] = await db.query(query, [codigoReporte]);
  return rows;
};

const getFacturasByCodigos = async (codigosFacturas) => {
  const query = `
    SELECT fv.*,
           c.DENOMINACION AS nombre_cliente,
           c.CUIT AS cuit_cliente,
           rsf.razon_social AS razon_social_factura,
           rsf.cuil AS cuil_factura,
           tc.descripcion AS tipo_comprobante,
           mon.nombre AS nombre_moneda,
           s.OBRA AS nombre_obra
      FROM factura_venta fv
      JOIN clientes c ON fv.id_cliente = c.CODCLI
      JOIN razones_sociales rsf ON fv.id_razonsocial = rsf.id
      JOIN tipocomprobante tc ON fv.tipoCmp = tc.codigo
      JOIN moneda mon ON fv.moneda = mon.codigo
      LEFT JOIN servicios s ON fv.id_servicio = s.IDOBRA
     WHERE fv.codigo IN (?)
  `;
  const [rows] = await db.query(query, [codigosFacturas]);
  return rows;
};

const getDetalleFactura = async (codigoFactura) => {
  const query = `
    SELECT id, codigo_factura_venta, descripcion, iva, importe
    FROM detalle_factura_venta
    WHERE codigo_factura_venta = ?
  `;
  const [rows] = await db.query(query, [codigoFactura]);
  return rows;
};

const getFormasPago = async (codigoFactura) => {
  const query = `
    SELECT fp.id, fp.codigo_factura_venta, fp.codigo_valor, v.descripcion AS descripcion_valor, fp.fecha, fp.importe
    FROM formas_pago_factura_venta fp
    JOIN valores v ON v.codigo = fp.codigo_valor
    WHERE fp.codigo_factura_venta = ?
  `;
  const [rows] = await db.query(query, [codigoFactura]);
  return rows;
};

const getOtrosImpuestos = async (codigoFactura) => {
  const query = `
    SELECT id, codigo_factura_venta, codigo_impuesto, nombre, valor
    FROM otros_impuestos_factura_venta
    WHERE codigo_factura_venta = ?
  `;
  const [rows] = await db.query(query, [codigoFactura]);
  return rows;
};

module.exports = {
  getLastCodigo,
  insertReporteIvaVentas,
  insertMovimientos,
  updatePeriodoFacturaVenta,
  getReportes,
  getMovimientosReporte,
  getFacturasByCodigos,
  getDetalleFactura,
  getFormasPago,
  getOtrosImpuestos,
};
