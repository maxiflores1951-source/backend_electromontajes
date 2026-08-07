const db = require('../../db');

const getUltimoCodigo = async (connection) => {
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [rows] = await exec('SELECT MAX(codigo) AS ultimo FROM recibo');
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
    observacion,
    NroCmp,
  } = data;

  const query = `
    INSERT INTO recibo (
      codigo, fecha, periodo_iva, moneda, ctz, id_cliente, id_razonsocial,
      importe, observacion, fecha_creacion, NroCmp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(), ?)
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
    observacion || null,
    NroCmp,
  ];

  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, values);
};

const insertDetalle = async (connection, detalleData) => {
  const query = `
    INSERT INTO detalle_recibo (
      codigo_recibo, codigo_factura_venta, codigo_nota_credito, pago
    ) VALUES ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [detalleData]);
};

const getComprobanteSaldo = async (connection, tabla, codigo) => {
  const query = `SELECT codigo, saldo FROM ${tabla} WHERE codigo = ?`;
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [rows] = await exec(query, [codigo]);
  return rows;
};

const getComprobanteLike = async (connection, tabla, codigo) => {
  const query = `SELECT codigo, saldo FROM ${tabla} WHERE codigo LIKE ?`;
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [rows] = await exec(query, [`%${codigo}%`]);
  return rows;
};

const updateComprobanteSaldo = async (connection, tabla, nuevoSaldo, estado, codigo) => {
  const query = `
    UPDATE ${tabla}
    SET saldo = ?, estado = ?
    WHERE codigo = ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [nuevoSaldo, estado, codigo]);
};

const insertOtrosImpuestos = async (connection, impuestosData) => {
  const query = `
    INSERT INTO otros_impuestos_recibo (
      codigo_recibo, codigo_impuesto, valor
    ) VALUES ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [impuestosData]);
};

const insertFormasPago = async (connection, pagosData) => {
  const query = `
    INSERT INTO formas_pago_recibo (
      codigo_recibo, codigo_valor, fecha, importe
    ) VALUES ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [pagosData]);
};

const getRecibos = async (connection) => {
  const query = `
    SELECT 
      r.codigo,
      r.fecha,
      r.periodo_iva,
      r.moneda,
      r.ctz,
      r.id_cliente,
      
      cli.CODCLI AS cliente_id,
      cli.DENOMINACION AS cliente_nombre,
      cli.DIRECCION AS cliente_direccion,
      cli.IDSITFISCAL AS cliente_situacion_fiscal,
      cli.CUIT AS cliente_cuit,
      cli.EMAIL AS cliente_email,
      cli.TELEFONO AS cliente_telefono,
      cli.otros AS cliente_otros,

      r.id_razonsocial,
      rs.razon_social AS nombre_razon_social,

      r.importe,
      r.observacion,
      r.NroCmp,
      r.fecha_creacion,

      mon.nombre AS nombre_moneda,
      
      de.id AS empresa_id,
      de.razon_social AS empresa_razon_social,
      de.cuit AS empresa_cuit,
      de.fecha_inicio_actividad AS empresa_inicio_actividad,
      de.ingresos_brutos AS empresa_ingresos_brutos,
      de.direccion_comercial AS empresa_direccion,
      de.telefono AS empresa_telefono,
      de.correo AS empresa_correo,
      de.tipo_responsable_codigo AS empresa_tipo_responsable

    FROM recibo r
    JOIN clientes cli ON cli.CODCLI = r.id_cliente
    JOIN razones_sociales rs ON rs.id = r.id_razonsocial
    JOIN moneda mon ON r.moneda = mon.codigo
    JOIN datos_empresa de ON de.id = r.id_razonsocial
    ORDER BY r.fecha_creacion DESC
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [rows] = await exec(query);
  return rows;
};

const getRecibosFiltrados = async (connection, desdeCompleto, hastaCompleto) => {
  const query = `
    SELECT 
      r.codigo,
      r.fecha,
      r.periodo_iva,
      r.moneda,
      r.ctz,
      r.id_cliente,
      
      cli.CODCLI AS cliente_id,
      cli.DENOMINACION AS cliente_nombre,
      cli.DIRECCION AS cliente_direccion,
      cli.IDSITFISCAL AS cliente_situacion_fiscal,
      cli.CUIT AS cliente_cuit,
      cli.EMAIL AS cliente_email,
      cli.TELEFONO AS cliente_telefono,
      cli.otros AS cliente_otros,

      r.id_razonsocial,
      rs.razon_social AS nombre_razon_social,

      r.importe,
      r.observacion,
      r.NroCmp,
      r.fecha_creacion,

      mon.nombre AS nombre_moneda,
      
      de.id AS empresa_id,
      de.razon_social AS empresa_razon_social,
      de.cuit AS empresa_cuit,
      de.fecha_inicio_actividad AS empresa_inicio_actividad,
      de.ingresos_brutos AS empresa_ingresos_brutos,
      de.direccion_comercial AS empresa_direccion,
      de.telefono AS empresa_telefono,
      de.correo AS empresa_correo,
      de.tipo_responsable_codigo AS empresa_tipo_responsable

    FROM recibo r
    JOIN clientes cli ON cli.CODCLI = r.id_cliente
    JOIN razones_sociales rs ON rs.id = r.id_razonsocial
    JOIN moneda mon ON r.moneda = mon.codigo
    JOIN datos_empresa de ON de.id = r.id_razonsocial
    WHERE r.fecha BETWEEN ? AND ?
    ORDER BY r.fecha_creacion DESC
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [rows] = await exec(query, [desdeCompleto, hastaCompleto]);
  return rows;
};

const getFacturasDetalle = async (connection, codigoRecibo) => {
  const query = `
    SELECT 
      f.codigo,
      f.fecha,
      f.moneda,
      f.NroCmp,
      f.tipoCmp,
      tc.descripcion AS descripcion_comprobante,
      f.codigoletra,
      f.ptoVta,
      dr.pago AS importe,
      f.importe AS importe_factura,
      f.saldo,
      'factura' AS tipo_comprobante
    FROM detalle_recibo dr
    JOIN factura_venta f ON f.codigo = dr.codigo_factura_venta
    JOIN tipocomprobante tc ON tc.codigo = f.tipoCmp
    WHERE dr.codigo_recibo = ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [rows] = await exec(query, [codigoRecibo]);
  return rows;
};

const getNotasCreditoDetalle = async (connection, codigoRecibo) => {
  const query = `
    SELECT 
      nc.codigo,
      nc.fecha,
      nc.moneda,
      nc.NroCmp,
      nc.tipoCmp,
      tc.descripcion AS descripcion_comprobante,
      nc.codigoletra,
      nc.ptoVta,
      dr.pago AS importe,
      nc.importe AS importe_factura,
      nc.saldo,
      'nota_credito' AS tipo_comprobante
    FROM detalle_recibo dr
    JOIN nota_credito_venta nc ON nc.codigo = dr.codigo_nota_credito
    JOIN tipocomprobante tc ON tc.codigo = nc.tipoCmp
    WHERE dr.codigo_recibo = ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [rows] = await exec(query, [codigoRecibo]);
  return rows;
};

const getImpuestos = async (connection, codigoRecibo) => {
  const query = `
    SELECT 
      oir.codigo_impuesto,
      oi.nombre,
      oir.valor
    FROM otros_impuestos_recibo oir
    JOIN otros_impuestos oi ON oi.codigo = oir.codigo_impuesto
    WHERE oir.codigo_recibo = ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [rows] = await exec(query, [codigoRecibo]);
  return rows;
};

const getPagos = async (connection, codigoRecibo) => {
  const query = `
    SELECT 
      fpr.codigo_valor,
      v.descripcion,
      fpr.fecha,
      fpr.importe
    FROM formas_pago_recibo fpr
    JOIN valores v ON v.codigo = fpr.codigo_valor
    WHERE fpr.codigo_recibo = ?
  `;
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [rows] = await exec(query, [codigoRecibo]);
  return rows;
};

const getImpuestosPorRazon = async (idRazonSocial, desdeCompleto, hastaCompleto) => {
  const query = `
    SELECT 
        fc.fecha AS fecha,
        fc.codigo AS codigo,
        oi.codigo AS codigo_impuesto,
        oi.nombre AS nombre_impuesto,
        oifc.valor AS importe,
        CASE 
            WHEN oi.codigo = 'IMP-005' THEN 'RECURSOS HUMANOS'
            ELSE 'IMPUESTOS'
        END AS nombre_motivo,
        CASE 
            WHEN oi.codigo = 'IMP-005' THEN 'RRH'
            ELSE 'IMP'
        END AS codigo_motivo
    FROM factura_compra fc
    JOIN otros_impuestos_factura_compra oifc ON fc.codigo = oifc.codigo_factura_compra
    JOIN otros_impuestos oi ON oifc.codigo_impuesto = oi.codigo
    WHERE fc.id_razonsocial = ?
      AND fc.fecha BETWEEN ? AND ?

    UNION ALL

    SELECT 
        r.fecha AS fecha,
        r.codigo AS codigo,
        oi.codigo AS codigo_impuesto,
        oi.nombre AS nombre_impuesto,
        oir.valor AS importe,
        CASE 
            WHEN oi.codigo = 'IMP-005' THEN 'RECURSOS HUMANOS'
            ELSE 'IMPUESTOS'
        END AS nombre_motivo,
        CASE 
            WHEN oi.codigo = 'IMP-005' THEN 'RRH'
            ELSE 'IMP'
        END AS codigo_motivo
    FROM recibo r
    JOIN otros_impuestos_recibo oir ON r.codigo = oir.codigo_recibo
    JOIN otros_impuestos oi ON oir.codigo_impuesto = oi.codigo
    WHERE r.id_razonsocial = ?
      AND r.fecha BETWEEN ? AND ?

    ORDER BY fecha DESC, nombre_impuesto ASC
  `;

  const [rows] = await db.query(query, [
    idRazonSocial, desdeCompleto, hastaCompleto,
    idRazonSocial, desdeCompleto, hastaCompleto,
  ]);
  return rows;
};

const getImpuestosPorFecha = async (desdeCompleto, hastaCompleto) => {
  const query = `
    SELECT 
        fc.fecha AS fecha,
        fc.codigo AS codigo,
        oi.codigo AS codigo_impuesto,
        oi.nombre AS nombre_impuesto,
        oifc.valor AS importe,
        CASE 
            WHEN oi.codigo = 'IMP-005' THEN 'RECURSOS HUMANOS'
            ELSE 'IMPUESTOS'
        END AS nombre_motivo,
        CASE 
            WHEN oi.codigo = 'IMP-005' THEN 'RRH'
            ELSE 'IMP'
        END AS codigo_motivo
    FROM factura_compra fc
    JOIN otros_impuestos_factura_compra oifc ON fc.codigo = oifc.codigo_factura_compra
    JOIN otros_impuestos oi ON oifc.codigo_impuesto = oi.codigo
    WHERE fc.fecha BETWEEN ? AND ?

    UNION ALL

    SELECT 
        r.fecha AS fecha,
        r.codigo AS codigo,
        oi.codigo AS codigo_impuesto,
        oi.nombre AS nombre_impuesto,
        oir.valor AS importe,
        CASE 
            WHEN oi.codigo = 'IMP-005' THEN 'RECURSOS HUMANOS'
            ELSE 'IMPUESTOS'
        END AS nombre_motivo,
        CASE 
            WHEN oi.codigo = 'IMP-005' THEN 'RRH'
            ELSE 'IMP'
        END AS codigo_motivo
    FROM recibo r
    JOIN otros_impuestos_recibo oir ON r.codigo = oir.codigo_recibo
    JOIN otros_impuestos oi ON oir.codigo_impuesto = oi.codigo
    WHERE r.fecha BETWEEN ? AND ?

    ORDER BY fecha DESC, nombre_impuesto ASC
  `;

  const [rows] = await db.query(query, [
    desdeCompleto, hastaCompleto,
    desdeCompleto, hastaCompleto,
  ]);
  return rows;
};

module.exports = {
  getUltimoCodigo,
  insert,
  insertDetalle,
  getComprobanteSaldo,
  getComprobanteLike,
  updateComprobanteSaldo,
  insertOtrosImpuestos,
  insertFormasPago,
  getRecibos,
  getRecibosFiltrados,
  getFacturasDetalle,
  getNotasCreditoDetalle,
  getImpuestos,
  getPagos,
  getImpuestosPorRazon,
  getImpuestosPorFecha,
};
