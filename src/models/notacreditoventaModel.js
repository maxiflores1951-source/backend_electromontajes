const db = require('../../db');

const getUltimoCodigo = async (connection) => {
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [rows] = await exec('SELECT MAX(codigo) AS ultimo FROM nota_credito_venta');
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
    estado,
    saldo,
  } = data;

  const query = `
    INSERT INTO nota_credito_venta (
      codigo, fecha, periodo_iva, moneda, ctz, id_cliente, id_razonsocial,
      importe, iva21, iva27, iva105, observacion, tipoCmp, codigoletra,
      ptoVta, NroCmp, estado, saldo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    codigo,
    fecha,
    periodo_iva,
    moneda,
    ctz || 1.0000,
    id_cliente,
    id_razonsocial,
    importe,
    iva21 || 0.00,
    iva27 || 0.00,
    iva105 || 0.00,
    observacion || null,
    tipoCmp,
    codigoletra,
    ptoVta,
    NroCmp,
    estado || 0,
    saldo,
  ];

  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, values);
};

const insertDetalles = async (connection, detallesData) => {
  const query = `
    INSERT INTO detalle_nota_credito_venta (
      codigo_nota_credito_venta, codigo_factura_venta, descripcion, iva, importe
    ) VALUES ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [detallesData]);
};

const insertOtrosImpuestos = async (connection, otrosImpuestosData) => {
  const query = `
    INSERT INTO otros_impuestos_nota_credito_venta (
      codigo_nota_credito_venta, codigo_impuesto, nombre, valor
    ) VALUES ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [otrosImpuestosData]);
};

const insertFormasPago = async (connection, formasPagoData) => {
  const query = `
    INSERT INTO formas_pago_nota_credito_venta (
      codigo_nota_credito_venta, codigo, descripcion, fecha, importe
    ) VALUES ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [formasPagoData]);
};

const getByCodigo = async (codigo) => {
  const query = `
    SELECT ncv.*, c.DENOMINACION as nombre_cliente, rs.razon_social
    FROM nota_credito_venta ncv
    LEFT JOIN clientes c ON ncv.id_cliente = c.CODCLI
    LEFT JOIN razones_sociales rs ON ncv.id_razonsocial = rs.id
    WHERE ncv.codigo = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

const getDetallesByCodigo = async (codigo) => {
  const query = `
    SELECT * FROM detalle_nota_credito_venta WHERE codigo_nota_credito_venta = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

const getAll = async () => {
  const query = `
    SELECT ncv.*, 
           c.DENOMINACION AS nombre_cliente,
           c.CUIT AS cuit_cliente,
           rs.razon_social AS razon_social_empresa,
           rs.cuil AS cuit_razon_social,
           mon.nombre AS nombre_moneda,
           tc.descripcion AS descripcion_tipo_comprobante,
           tc.letra AS letra_tipo_comprobante,
           tc.clasificacion AS clasificacion_tipo_comprobante
    FROM nota_credito_venta ncv
    JOIN clientes c ON ncv.id_cliente = c.CODCLI
    JOIN razones_sociales rs ON ncv.id_razonsocial = rs.id
    JOIN moneda mon ON ncv.moneda = mon.codigo
    JOIN tipocomprobante tc ON ncv.tipoCmp = tc.codigo
    ORDER BY ncv.codigo DESC
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getDetalleCompleto = async (codigo) => {
  const query = `
    SELECT 
      dncv.*, 
      fv.codigo AS codigo_factura_relacionada,
      fv.ptoVta AS ptoVta_factura,
      fv.NroCmp AS NroCmp_factura,
      fv.tipoCmp AS tipoCmp_factura,
      fv.codigoletra AS letra_factura,
      fv.fecha AS fecha_factura,
      fv.importe AS importe_factura,
      fv.iva21 AS iva21_factura,
      fv.iva27 AS iva27_factura,
      fv.iva105 AS iva105_factura,
      fv.moneda AS moneda_factura,
      fv.ctz AS ctz_factura,
      tc_fv.descripcion AS descripcion_tipo_comprobante_factura,
      tc_fv.letra AS letra_tipo_comprobante_factura,
      tc_fv.clasificacion AS clasificacion_tipo_comprobante_factura
    FROM detalle_nota_credito_venta dncv
    LEFT JOIN factura_venta fv ON dncv.codigo_factura_venta = fv.codigo
    LEFT JOIN tipocomprobante tc_fv ON fv.tipoCmp = tc_fv.codigo
    WHERE dncv.codigo_nota_credito_venta = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

const getOtrosImpuestos = async (codigo) => {
  const query = `
    SELECT oi.*, imp.nombre AS nombre_impuesto
    FROM otros_impuestos_nota_credito_venta oi
    JOIN otros_impuestos imp ON oi.codigo_impuesto = imp.codigo
    WHERE oi.codigo_nota_credito_venta = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

const getFormasPago = async (codigo) => {
  const query = `
    SELECT fp.*, v.descripcion AS descripcion_valor
    FROM formas_pago_nota_credito_venta fp
    JOIN valores v ON fp.codigo = v.codigo
    WHERE fp.codigo_nota_credito_venta = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

module.exports = {
  getUltimoCodigo,
  insert,
  insertDetalles,
  insertOtrosImpuestos,
  insertFormasPago,
  getByCodigo,
  getDetallesByCodigo,
  getAll,
  getDetalleCompleto,
  getOtrosImpuestos,
  getFormasPago,
};
