const db = require('../../db');

const getLastCodigo = async () => {
  const [result] = await db.query('SELECT MAX(codigo) AS ultimo FROM reporte_iva');
  return result.length > 0 ? result[0].ultimo : null;
};

const insertReporteIva = async (connection, values) => {
  const query = `
    INSERT INTO reporte_iva (
      codigo, fecha, periodo, importe_total, iva21, iva27, iva10, razon_social
    ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?)
  `;
  await connection.query(query, values);
};

const insertMovimientos = async (connection, data) => {
  const query = `
    INSERT INTO movimientos_reportes_iva (
      codigo_reporte,
      codigo_factura,
      codigo_nota_credito
    ) VALUES ?
  `;
  await connection.query(query, [data]);
};

const updatePeriodoFacturas = async (connection, periodo, facturas) => {
  const query = `
    UPDATE factura_compra
    SET periodoiva = ?
    WHERE codigo IN (?)
  `;
  await connection.query(query, [periodo, facturas]);
};

const updatePeriodoNotas = async (connection, periodo, notasCredito) => {
  const query = `
    UPDATE nota_credito_compra
    SET periodoiva = ?
    WHERE codigo IN (?)
  `;
  await connection.query(query, [periodo, notasCredito]);
};

const getReportes = async () => {
  const query = `
    SELECT r.*,
           rs.razon_social AS razon_social_reporte,
           rs.cuil AS cuil_reporte
    FROM reporte_iva r
    LEFT JOIN razones_sociales rs ON r.razon_social = rs.id
    ORDER BY r.fecha DESC
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getMovimientosReporte = async (codigoReporte) => {
  const query = `
    SELECT codigo_factura
    FROM movimientos_reportes_iva
    WHERE codigo_reporte = ?
  `;
  const [rows] = await db.query(query, [codigoReporte]);
  return rows;
};

const getFacturasByCodigos = async (codigosFacturas) => {
  const query = `
    SELECT fc.*,
           p.Nombre_Prov AS nombre_proveedor,
           p.Razon_Social AS razon_social_proveedor,
           p.Cuilt AS cuit_proveedor,
           p.IDSITFISCAL AS id_situacion_fiscal,
           m.nombre AS nombre_motivo,
           pl.descripcion AS nombre_plan,
           rsf.razon_social AS razon_social_factura,
           rsf.cuil AS cuil_factura,
           tc.descripcion AS tipo_comprobante,
           mon.nombre AS nombre_moneda,
           s.OBRA AS nombre_obra,
           mv.patente AS patente_movil,
           mv.kilometraje AS kilometraje_movil
    FROM factura_compra fc
    JOIN proveedor p ON fc.id_proveedor = p.Cod_Proveedor
    JOIN motivos m ON fc.id_motivo = m.codigo
    JOIN plandecompra pl ON fc.id_plancompra = pl.codigo
    JOIN razones_sociales rsf ON fc.id_razonsocial = rsf.id
    JOIN tipocomprobante tc ON fc.tipoCmp = tc.codigo
    JOIN moneda mon ON fc.moneda = mon.codigo
    LEFT JOIN servicios s ON fc.id_servicio = s.IDOBRA
    LEFT JOIN moviles mv ON fc.id_movil = mv.nro_ident
    WHERE fc.codigo IN (?)
  `;
  const [rows] = await db.query(query, [codigosFacturas]);
  return rows;
};

const getMovimientosFactura = async (codigoFactura) => {
  const query = `
    SELECT *
    FROM movimientos_factura_compras
    WHERE codigo_factura_compra = ?
  `;
  const [rows] = await db.query(query, [codigoFactura]);
  return rows;
};

const getOtrosImpuestosFactura = async (codigoFactura) => {
  const query = `
    SELECT oi.*, imp.nombre AS nombre_impuesto
    FROM otros_impuestos_factura_compra oi
    JOIN otros_impuestos imp ON oi.codigo_impuesto = imp.codigo
    WHERE oi.codigo_factura_compra = ?
  `;
  const [rows] = await db.query(query, [codigoFactura]);
  return rows;
};

const getFormasPagoFactura = async (codigoFactura) => {
  const query = `
    SELECT fp.*, v.descripcion AS descripcion_valor
    FROM formas_pago_factura_compra fp
    JOIN valores v ON fp.codigo_valor = v.codigo
    WHERE fp.codigo_factura_compra = ?
  `;
  const [rows] = await db.query(query, [codigoFactura]);
  return rows;
};

const getNotasCreditoByFactura = async (codigoFactura) => {
  const query = `
    SELECT nc.*,
           p.Nombre_Prov AS nombre_proveedor,
           p.Razon_Social AS razon_social_proveedor,
           p.Cuilt AS cuit_proveedor,
           m.nombre AS nombre_motivo,
           pl.descripcion AS nombre_plan,
           rs.razon_social AS razon_social_nc,
           rs.cuil AS cuil_nc,
           tc.descripcion AS tipo_comprobante,
           mon.nombre AS nombre_moneda,
           s.OBRA AS nombre_obra,
           mv.patente AS patente_movil
    FROM nota_credito_compra nc
    JOIN proveedor p ON nc.id_proveedor = p.Cod_Proveedor
    JOIN motivos m ON nc.id_motivo = m.codigo
    JOIN plandecompra pl ON nc.id_plancompra = pl.codigo
    JOIN razones_sociales rs ON nc.id_razonsocial = rs.id
    JOIN tipocomprobante tc ON nc.tipoCmp = tc.codigo
    JOIN moneda mon ON nc.moneda = mon.codigo
    LEFT JOIN servicios s ON nc.id_servicio = s.IDOBRA
    LEFT JOIN moviles mv ON nc.id_movil = mv.nro_ident
    WHERE nc.id_factura_compra = ?
  `;
  const [rows] = await db.query(query, [codigoFactura]);
  return rows;
};

const getMovimientosNotaCredito = async (codigoNotaCredito) => {
  const query = `
    SELECT *
    FROM movimientos_nota_credito_compra
    WHERE codigo_nota_credito_compra = ?
  `;
  const [rows] = await db.query(query, [codigoNotaCredito]);
  return rows;
};

const getOtrosImpuestosNotaCredito = async (codigoNotaCredito) => {
  const query = `
    SELECT oinc.*, imp.nombre AS nombre_impuesto
    FROM otros_impuestos_nota_credito_compra oinc
    JOIN otros_impuestos imp ON oinc.codigo_impuesto = imp.codigo
    WHERE oinc.codigo_nota_credito_compra = ?
  `;
  const [rows] = await db.query(query, [codigoNotaCredito]);
  return rows;
};

const getFormasPagoNotaCredito = async (codigoNotaCredito) => {
  const query = `
    SELECT fpnc.*, v.descripcion AS descripcion_valor
    FROM formas_pago_nota_credito_compra fpnc
    JOIN valores v ON fpnc.codigo_valor = v.codigo
    WHERE fpnc.codigo_nota_credito_compra = ?
  `;
  const [rows] = await db.query(query, [codigoNotaCredito]);
  return rows;
};

module.exports = {
  getLastCodigo,
  insertReporteIva,
  insertMovimientos,
  updatePeriodoFacturas,
  updatePeriodoNotas,
  getReportes,
  getMovimientosReporte,
  getFacturasByCodigos,
  getMovimientosFactura,
  getOtrosImpuestosFactura,
  getFormasPagoFactura,
  getNotasCreditoByFactura,
  getMovimientosNotaCredito,
  getOtrosImpuestosNotaCredito,
  getFormasPagoNotaCredito,
};
