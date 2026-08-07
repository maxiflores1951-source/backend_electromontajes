const db = require('../../db');

const getUltimoCodigo = async (connection) => {
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [rows] = await exec('SELECT MAX(codigo) AS ultimo FROM factura_venta');
  return rows;
};

const insert = async (connection, data) => {
  const {
    codigo,
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
  } = data;

  const query = `
    INSERT INTO factura_venta (
      codigo, fecha, periodo_iva, moneda, ctz, id_cliente,
      id_razonsocial, importe, iva21, iva27, iva105, observacion,
      tipoCmp, codigoletra, ptoVta, NroCmp, saldo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    codigo,
    fecha,
    periodo_iva,
    moneda,
    ctz || 1,
    id_cliente,
    id_razonsocial,
    importe,
    iva21 || 0,
    iva27 || 0,
    iva105 || 0,
    observacion || null,
    tipoCmp,
    codigoletra,
    ptoVta,
    NroCmp,
    saldo,
  ];

  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, values);
};

const updatePresupuestoSaldoAM = async (connection, saldoIvaRestar, saldoSinIvaRestar, codigoPresupuesto) => {
  const query = `
    UPDATE presupuesto
    SET saldo_iva = saldo_iva - ?,
        saldo_sin_iva = saldo_sin_iva - ?
    WHERE codigo = ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [saldoIvaRestar, saldoSinIvaRestar, codigoPresupuesto]);
};

const updatePresupuestoSaldoOther = async (connection, importeTotalFactura, saldoIvaRestar, codigoPresupuesto) => {
  const query = `
    UPDATE presupuesto
    SET saldo_sin_iva = saldo_sin_iva - ?,
        saldo_iva = saldo_iva - ?
    WHERE codigo = ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [importeTotalFactura, saldoIvaRestar, codigoPresupuesto]);
};

const insertDetalle = async (connection, detalleData) => {
  const query = `
    INSERT INTO detalle_factura_venta (
      codigo_factura_venta, codigo_presupuesto, descripcion, iva, importe
    ) VALUES ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [detalleData]);
};

const insertDetalleSinPresupuesto = async (connection, detalleData) => {
  const query = `
    INSERT INTO detalle_factura_venta (codigo_factura_venta, descripcion, iva, importe) VALUES ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [detalleData]);
};

const insertOtrosImpuestos = async (connection, impuestosData) => {
  const query = `
    INSERT INTO otros_impuestos_factura_venta (
      codigo_factura_venta, codigo_impuesto, nombre, valor
    ) VALUES ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [impuestosData]);
};

const insertFormasPago = async (connection, pagosData) => {
  const query = `
    INSERT INTO formas_pago_factura_venta (
      codigo_factura_venta, codigo, descripcion, fecha, importe
    ) VALUES ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [pagosData]);
};

const update = async (connection, data) => {
  const {
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
  } = data;

  const query = `
    UPDATE factura_venta SET
      fecha = ?, periodo_iva = ?, moneda = ?, ctz = ?, id_servicio = ?, id_cliente = ?,
      id_razonsocial = ?, importe = ?, iva21 = ?, iva27 = ?, iva105 = ?, observacion = ?,
      tipoCmp = ?, codigoletra = ?, ptoVta = ?, NroCmp = ?
    WHERE codigo = ?
  `;

  const values = [
    fecha,
    periodo_iva,
    moneda,
    ctz || 1,
    id_servicio || null,
    id_cliente,
    id_razonsocial,
    importe,
    iva21 || 0,
    iva27 || 0,
    iva105 || 0,
    observacion || null,
    tipoCmp,
    codigoletra,
    ptoVta,
    NroCmp,
    codigo,
  ];

  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, values);
};

const deleteDetalle = async (connection, codigo) => {
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec('DELETE FROM detalle_factura_venta WHERE codigo_factura_venta = ?', [codigo]);
};

const deleteOtrosImpuestos = async (connection, codigo) => {
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec('DELETE FROM otros_impuestos_factura_venta WHERE codigo_factura_venta = ?', [codigo]);
};

const deleteFormasPago = async (connection, codigo) => {
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec('DELETE FROM formas_pago_factura_venta WHERE codigo_factura_venta = ?', [codigo]);
};

const updateSaldo = async (connection, saldo, codigo) => {
  const query = `
    UPDATE factura_venta SET saldo = ? WHERE codigo = ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [saldo, codigo]);
};

const getAll = async () => {
  const query = `
    SELECT fv.*, 
           c.DENOMINACION AS nombre_cliente,
           c.CUIT AS cuit_cliente,
           rs.razon_social AS razon_social_empresa,
           rs.cuil AS cuit_razon_social,
           mon.nombre AS nombre_moneda,
           tc.descripcion AS descripcion_tipo_comprobante,
           tc.letra AS letra_tipo_comprobante,
           tc.clasificacion AS clasificacion_tipo_comprobante
    FROM factura_venta fv
    JOIN clientes c ON fv.id_cliente = c.CODCLI
    JOIN razones_sociales rs ON fv.id_razonsocial = rs.id
    JOIN moneda mon ON fv.moneda = mon.codigo
    JOIN tipocomprobante tc ON fv.tipoCmp = tc.codigo
    ORDER BY fv.codigo DESC
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getDetalle = async (codigo) => {
  const query = `
    SELECT * FROM detalle_factura_venta
    WHERE codigo_factura_venta = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

const getOtrosImpuestos = async (codigo) => {
  const query = `
    SELECT oi.*, imp.nombre AS nombre_impuesto
    FROM otros_impuestos_factura_venta oi
    JOIN otros_impuestos imp ON oi.codigo_impuesto = imp.codigo
    WHERE oi.codigo_factura_venta = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

const getFormasPago = async (codigo) => {
  const query = `
    SELECT fp.*, v.descripcion AS descripcion_valor
    FROM formas_pago_factura_venta fp
    JOIN valores v ON fp.codigo = v.codigo
    WHERE fp.codigo_factura_venta = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

const getByRazonSocial = async (idRazonSocial, periodo) => {
  let query = `
    SELECT fv.*, 
           c.DENOMINACION AS nombre_cliente,
           c.CUIT AS cuit_cliente,    
           rs.razon_social AS razon_social_empresa,
           rs.cuil AS cuit_razon_social,
           mon.nombre AS nombre_moneda,
           tc.descripcion AS descripcion_tipo_comprobante,
           tc.letra AS letra_tipo_comprobante,
           tc.clasificacion AS clasificacion_tipo_comprobante
    FROM factura_venta fv
    JOIN clientes c ON fv.id_cliente = c.CODCLI
    JOIN razones_sociales rs ON fv.id_razonsocial = rs.id
    JOIN moneda mon ON fv.moneda = mon.codigo
    JOIN tipocomprobante tc ON fv.tipoCmp = tc.codigo
    WHERE fv.id_razonsocial = ?
  `;

  const queryParams = [idRazonSocial];

  if (periodo) {
    query += ` AND fv.periodo_iva = ?`;
    queryParams.push(periodo);
  }

  query += ` ORDER BY fv.codigo DESC`;

  const [rows] = await db.query(query, queryParams);
  return rows;
};

const getFiltradas = async (desdeCompleto, hastaCompleto) => {
  const query = `
    SELECT 
      fv.*,
      c.DENOMINACION AS nombre_cliente,
      c.otros AS otros_cliente,
      rs.razon_social AS razon_social_empresa,
      rs.cuil AS cuit_razon_social,
      mon.nombre AS nombre_moneda,
      tc.descripcion AS descripcion_tipo_comprobante,
      tc.letra AS letra_tipo_comprobante,
      tc.clasificacion AS clasificacion_tipo_comprobante,
      s.OBRA AS nombre_servicio
    FROM factura_venta fv
    JOIN clientes c ON fv.id_cliente = c.CODCLI
    JOIN razones_sociales rs ON fv.id_razonsocial = rs.id
    JOIN moneda mon ON fv.moneda = mon.codigo
    JOIN tipocomprobante tc ON fv.tipoCmp = tc.codigo
    LEFT JOIN (
      SELECT CODCLI, MAX(OBRA) AS OBRA
      FROM servicios
      GROUP BY CODCLI
    ) s ON s.CODCLI = fv.id_cliente
    WHERE fv.fecha BETWEEN ? AND ?
    ORDER BY fv.fecha DESC
  `;
  const [rows] = await db.query(query, [desdeCompleto, hastaCompleto]);
  return rows;
};

const getByCliente = async (idCliente) => {
  const query = `
    SELECT fv.*, 
           c.DENOMINACION AS nombre_cliente,
           rs.razon_social AS razon_social_empresa,
           rs.cuil AS cuit_razon_social,
           mon.nombre AS nombre_moneda,
           tc.descripcion AS descripcion_tipo_comprobante,
           tc.letra AS letra_tipo_comprobante,
           tc.clasificacion AS clasificacion_tipo_comprobante
    FROM factura_venta fv
    JOIN clientes c ON fv.id_cliente = c.CODCLI
    JOIN razones_sociales rs ON fv.id_razonsocial = rs.id
    JOIN moneda mon ON fv.moneda = mon.codigo
    JOIN tipocomprobante tc ON fv.tipoCmp = tc.codigo
    WHERE fv.id_cliente = ?
    ORDER BY fv.codigo DESC
  `;
  const [rows] = await db.query(query, [idCliente]);
  return rows;
};

const getByClienteYRazonSocial = async (idCliente, idRazonSocial) => {
  const query = `
    SELECT DISTINCT 
      fv.codigo, fv.fecha, fv.periodo_iva, fv.moneda, fv.ctz,
      fv.id_cliente, fv.id_razonsocial, fv.importe, fv.iva21, fv.iva27, fv.iva105,
      fv.observacion, fv.fecha_creacion, fv.tipoCmp, fv.codigoletra, fv.ptoVta,
      fv.NroCmp, fv.estado, fv.saldo,
      c.DENOMINACION AS nombre_cliente,
      rs.razon_social AS razon_social_empresa,
      rs.cuil AS cuit_razon_social,
      mon.nombre AS nombre_moneda,
      tc.descripcion AS descripcion_tipo_comprobante,
      tc.letra AS letra_tipo_comprobante,
      tc.clasificacion AS clasificacion_tipo_comprobante,
      'factura' AS tipo_documento
    FROM factura_venta fv
    JOIN clientes c ON fv.id_cliente = c.CODCLI
    JOIN razones_sociales rs ON fv.id_razonsocial = rs.id
    JOIN moneda mon ON fv.moneda = mon.codigo
    JOIN tipocomprobante tc ON fv.tipoCmp = tc.codigo
    JOIN formas_pago_factura_venta fp ON fp.codigo_factura_venta = fv.codigo
    WHERE fv.id_cliente = ?
      AND fv.id_razonsocial = ?
      AND fv.estado = 0
      AND fp.codigo = 'CC'
    ORDER BY fv.fecha ASC
  `;
  const [rows] = await db.query(query, [idCliente, idRazonSocial]);
  return rows;
};

const getNotasCreditoByClienteYRazonSocial = async (idCliente, idRazonSocial) => {
  const query = `
    SELECT 
      ncv.codigo, ncv.fecha, ncv.periodo_iva, ncv.moneda, ncv.ctz,
      ncv.id_cliente, ncv.id_razonsocial, ncv.importe, ncv.iva21, ncv.iva27, ncv.iva105,
      ncv.observacion, ncv.tipoCmp, ncv.codigoletra, ncv.ptoVta,
      ncv.NroCmp, ncv.estado, ncv.saldo,
      c.DENOMINACION AS nombre_cliente,
      rs.razon_social AS razon_social_empresa,
      rs.cuil AS cuit_razon_social,
      mon.nombre AS nombre_moneda,
      tc.descripcion AS descripcion_tipo_comprobante,
      tc.letra AS letra_tipo_comprobante,
      tc.clasificacion AS clasificacion_tipo_comprobante,
      'nota_credito' AS tipo_documento
    FROM nota_credito_venta ncv
    JOIN clientes c ON ncv.id_cliente = c.CODCLI
    JOIN razones_sociales rs ON ncv.id_razonsocial = rs.id
    JOIN moneda mon ON ncv.moneda = mon.codigo
    JOIN tipocomprobante tc ON ncv.tipoCmp = tc.codigo
    WHERE ncv.id_cliente = ?
      AND ncv.id_razonsocial = ?
      AND ncv.estado = 0
    ORDER BY ncv.fecha ASC
  `;
  const [rows] = await db.query(query, [idCliente, idRazonSocial]);
  return rows;
};

const getDetalleNotaCredito = async (codigo) => {
  const [rows] = await db.query(
    'SELECT * FROM detalle_nota_credito_venta WHERE codigo_nota_credito_venta = ?',
    [codigo]
  );
  return rows;
};

const getOtrosImpuestosNotaCredito = async (codigo) => {
  const query = `
    SELECT oi.*, imp.nombre AS nombre_impuesto
    FROM otros_impuestos_nota_credito_venta oi
    JOIN otros_impuestos imp ON oi.codigo_impuesto = imp.codigo
    WHERE oi.codigo_nota_credito_venta = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

const getFormasPagoNotaCredito = async (codigo) => {
  const query = `
    SELECT fp.*, v.descripcion AS descripcion_valor
    FROM formas_pago_nota_credito_venta fp
    JOIN valores v ON fp.codigo = v.codigo
    WHERE fp.codigo_nota_credito_venta = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

const getCalendario = async () => {
  const query = `
    SELECT DISTINCT fv.*, 
           c.DENOMINACION AS nombre_cliente,
           rs.razon_social AS razon_social_empresa,
           rs.cuil AS cuit_razon_social,
           mon.nombre AS nombre_moneda,
           tc.descripcion AS descripcion_tipo_comprobante,
           tc.letra AS letra_tipo_comprobante,
           tc.clasificacion AS clasificacion_tipo_comprobante
    FROM factura_venta fv
    JOIN clientes c ON fv.id_cliente = c.CODCLI
    JOIN razones_sociales rs ON fv.id_razonsocial = rs.id
    JOIN moneda mon ON fv.moneda = mon.codigo
    JOIN tipocomprobante tc ON fv.tipoCmp = tc.codigo
    JOIN formas_pago_factura_venta fp ON fv.codigo = fp.codigo_factura_venta
    WHERE fp.codigo = 'CC'
      AND fv.saldo <> 0
    ORDER BY fv.codigo DESC
  `;
  const [rows] = await db.query(query);
  return rows;
};

module.exports = {
  getUltimoCodigo,
  insert,
  updatePresupuestoSaldoAM,
  updatePresupuestoSaldoOther,
  insertDetalle,
  insertDetalleSinPresupuesto,
  insertOtrosImpuestos,
  insertFormasPago,
  update,
  deleteDetalle,
  deleteOtrosImpuestos,
  deleteFormasPago,
  updateSaldo,
  getAll,
  getDetalle,
  getOtrosImpuestos,
  getFormasPago,
  getByRazonSocial,
  getFiltradas,
  getByCliente,
  getByClienteYRazonSocial,
  getNotasCreditoByClienteYRazonSocial,
  getDetalleNotaCredito,
  getOtrosImpuestosNotaCredito,
  getFormasPagoNotaCredito,
  getCalendario,
};
