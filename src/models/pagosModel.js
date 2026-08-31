const db = require('../../db');

const getLastCodigo = async (connection) => {
  const [result] = await connection.query('SELECT MAX(codigo) AS ultimo FROM orden_pago');
  return result[0]?.ultimo;
};

const insertOrdenPago = async (connection, values) => {
  const query = `
    INSERT INTO orden_pago (
      codigo, fecha, moneda, ctz,
      id_proveedor, id_razonsocial,
      importe, id_creado, fecha_creacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP())
  `;
  await connection.query(query, values);
};

const insertDetalleOrdenPago = async (connection, values) => {
  const query = `
    INSERT INTO detalle_orden_pago (
      codigo_orden_pago,
      codigo_factura_compra,
      codigo_notacredito_compra,
      importe
    ) VALUES (?, ?, ?, ?)
  `;
  await connection.query(query, values);
};

const updateSaldoNotaCredito = async (connection, importeNum, codigo) => {
  const query = `
    UPDATE nota_credito_compra
    SET saldo = saldo - ?,
        pagada = IF(saldo - ? <= 0, 1, 0)
    WHERE codigo = ?
  `;
  await connection.query(query, [importeNum, importeNum, codigo]);
};

const updateSaldoFactura = async (connection, importeNum, codigo) => {
  const query = `
    UPDATE factura_compra
    SET saldo = saldo - ?,
        pagada = IF(saldo - ? <= 0, 1, 0)
    WHERE codigo = ?
  `;
  await connection.query(query, [importeNum, importeNum, codigo]);
};

const insertOtrosImpuestos = async (connection, data) => {
  const query = `
    INSERT INTO otros_impuestos_orden_pago
    (codigo_orden_pago, codigo_impuesto, valor)
    VALUES ?
  `;
  await connection.query(query, [data]);
};

const insertFormasPago = async (connection, data) => {
  const query = `
    INSERT INTO formas_pago_orden_pago
    (codigo_orden_pago, codigo_valor, fecha, importe)
    VALUES ?
  `;
  await connection.query(query, [data]);
};

const getOrdenesPago = async (connection) => {
  const query = `
    SELECT 
      op.codigo,
      op.fecha,
      op.moneda,
      mon.nombre AS nombre_moneda,
      op.ctz,
      op.id_proveedor,
      prov.*,
      op.id_razonsocial,
      rs.razon_social AS nombre_razon_social,
      op.importe,
      op.fecha_creacion,
      op.id_creado,
      p.NOMBRE AS nombre_creador
    FROM orden_pago op
    JOIN proveedor prov ON prov.Cod_Proveedor = op.id_proveedor
    JOIN razones_sociales rs ON rs.id = op.id_razonsocial
    JOIN moneda mon ON mon.codigo = op.moneda
    JOIN usuarios u ON u.id = op.id_creado
    JOIN personal p ON p.ID = u.id_personal
    ORDER BY op.fecha_creacion DESC
  `;
  const [rows] = await connection.query(query);
  return rows;
};

const getFacturasByOrdenPago = async (connection, codigoOrdenPago) => {
  const query = `
    SELECT 
      fc.codigo,
      fc.fecha,
      fc.moneda,
      fc.importe,
      fc.saldo,
      fc.pagada,
      fc.NroCmp,
      fc.tipoCmp,
      tc.descripcion AS descripcion_comprobante,
      fc.codigoletra,
      fc.ptoVta,
      dop.importe AS importe_pagado
    FROM detalle_orden_pago dop
    JOIN factura_compra fc 
      ON fc.codigo = dop.codigo_factura_compra
    JOIN tipocomprobante tc 
      ON fc.tipoCmp = tc.codigo
    WHERE dop.codigo_orden_pago = ?
  `;
  const [rows] = await connection.query(query, [codigoOrdenPago]);
  return rows;
};

const getNotasCreditoByOrdenPago = async (connection, codigoOrdenPago) => {
  const query = `
    SELECT 
      nc.codigo,
      nc.fecha,
      nc.moneda,
      nc.importe,
      nc.saldo,
      nc.pagada,
      nc.NroCmp,
      nc.tipoCmp,
      tc.descripcion AS descripcion_comprobante,
      nc.codigoletra,
      nc.ptoVta,
      dop.importe AS importe_aplicado
    FROM detalle_orden_pago dop
    JOIN nota_credito_compra nc 
      ON nc.codigo = dop.codigo_notacredito_compra
    JOIN tipocomprobante tc 
      ON nc.tipoCmp = tc.codigo
    WHERE dop.codigo_orden_pago = ?
  `;
  const [rows] = await connection.query(query, [codigoOrdenPago]);
  return rows;
};

const getImpuestosByOrdenPago = async (connection, codigoOrdenPago) => {
  const query = `
    SELECT 
      oiop.codigo_impuesto,
      oi.nombre,
      oiop.valor
    FROM otros_impuestos_orden_pago oiop
    JOIN otros_impuestos oi 
      ON oi.codigo = oiop.codigo_impuesto
    WHERE oiop.codigo_orden_pago = ?
  `;
  const [rows] = await connection.query(query, [codigoOrdenPago]);
  return rows;
};

const getFormasPagoByOrdenPago = async (connection, codigoOrdenPago) => {
  const query = `
    SELECT 
      fpop.codigo_valor,
      v.descripcion,
      fpop.fecha,
      fpop.importe
    FROM formas_pago_orden_pago fpop
    JOIN valores v 
      ON v.codigo = fpop.codigo_valor
    WHERE fpop.codigo_orden_pago = ?
  `;
  const [rows] = await connection.query(query, [codigoOrdenPago]);
  return rows;
};

const getOrdenesPagoByProveedor = async (idProveedor, idRazonSocial) => {
  const query = `
    SELECT 
      op.codigo,
      op.fecha,
      op.moneda,
      mon.nombre AS nombre_moneda,
      op.ctz,
      op.id_proveedor,
      prov.Nombre_Prov AS nombre_proveedor,
      prov.Razon_Social AS razon_social_proveedor,
      prov.Cuilt AS cuit_proveedor,
      op.id_razonsocial,
      rs.razon_social AS razon_social_empresa,
      rs.cuil AS cuit_razon_social,
      op.importe,
      op.fecha_creacion
    FROM orden_pago op
    JOIN proveedor prov ON prov.Cod_Proveedor = op.id_proveedor
    JOIN razones_sociales rs ON rs.id = op.id_razonsocial
    JOIN moneda mon ON op.moneda = mon.codigo
    WHERE op.id_proveedor = ?
      AND op.id_razonsocial = ?
    ORDER BY op.fecha_creacion DESC
  `;
  const [rows] = await db.query(query, [idProveedor, idRazonSocial]);
  return rows;
};

const getFacturasByPago = async (codigo) => {
  const query = `
    SELECT 
      fc.codigo,
      fc.fecha,
      fc.moneda,
      fc.importe,
      fc.saldo,
      fc.pagada,
      fc.NroCmp,
      fc.tipoCmp,
      tc.descripcion AS descripcion_comprobante,
      fc.codigoletra,
      fc.ptoVta,
      dop.importe AS importe_pagado
    FROM detalle_orden_pago dop
    JOIN factura_compra fc ON fc.codigo = dop.codigo_factura_compra
    JOIN tipocomprobante tc ON fc.tipoCmp = tc.codigo
    WHERE dop.codigo_orden_pago = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

const getImpuestosByPago = async (codigo) => {
  const query = `
    SELECT 
      oiop.codigo_impuesto,
      oi.nombre,
      oiop.valor
    FROM otros_impuestos_orden_pago oiop
    JOIN otros_impuestos oi ON oi.codigo = oiop.codigo_impuesto
    WHERE oiop.codigo_orden_pago = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

const getFormasPagoByPago = async (codigo) => {
  const query = `
    SELECT 
      fpop.codigo_valor,
      v.descripcion,
      fpop.fecha,
      fpop.importe
    FROM formas_pago_orden_pago fpop
    JOIN valores v ON v.codigo = fpop.codigo_valor
    WHERE fpop.codigo_orden_pago = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

module.exports = {
  getLastCodigo,
  insertOrdenPago,
  insertDetalleOrdenPago,
  updateSaldoNotaCredito,
  updateSaldoFactura,
  insertOtrosImpuestos,
  insertFormasPago,
  getOrdenesPago,
  getFacturasByOrdenPago,
  getNotasCreditoByOrdenPago,
  getImpuestosByOrdenPago,
  getFormasPagoByOrdenPago,
  getOrdenesPagoByProveedor,
  getFacturasByPago,
  getImpuestosByPago,
  getFormasPagoByPago,
};
