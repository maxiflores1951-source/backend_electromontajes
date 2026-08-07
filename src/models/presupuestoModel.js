const db = require('../../db');

const getConnection = async () => await db.getConnection();
const beginTransaction = async (connection) => await connection.beginTransaction();
const commit = async (connection) => await connection.commit();
const rollback = async (connection) => await connection.rollback();
const release = async (connection) => await connection.release();

const getLastCodigo = async (connection) => {
  const [result] = await connection.query('SELECT MAX(codigo) AS ultimo FROM presupuesto');
  return result.length > 0 ? result[0].ultimo : null;
};

const insertPresupuesto = async (connection, params) => {
  const {
    codigoPresupuesto, fecha, fecha_entrega, condicion_pago,
    moneda, ctz, id_servicio, id_cliente, id_contacto,
    id_razonsocial, importe, importe_sin_iva, iva21, observacion,
    validez_oferta, condiciones_oferta, estado, denominacion,
    tipo_presupuesto
  } = params;

  const query = `
    INSERT INTO presupuesto (
      codigo, fecha, fecha_entrega, condicion_pago,
      moneda, ctz, id_servicio, id_cliente, id_contacto,
      id_razonsocial, importe, importe_sin_iva, iva21, observacion,
      validez_oferta, condiciones_oferta, estado, denominacion,
      tipo_presupuesto, saldo, saldo_iva, saldo_sin_iva
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`;

  const values = [
    codigoPresupuesto,
    fecha,
    fecha_entrega || null,
    condicion_pago || null,
    moneda,
    ctz || 1,
    id_servicio || null,
    id_cliente,
    id_contacto || null,
    id_razonsocial,
    importe,
    importe_sin_iva,
    iva21 || 0,
    observacion || null,
    validez_oferta || null,
    condiciones_oferta || null,
    estado,
    denominacion || null,
    tipo_presupuesto ? 1 : 0,
    importe,
    importe,
    importe_sin_iva
  ];

  await connection.query(query, values);
};

const insertDetalle = async (connection, detalleData) => {
  const query = `
    INSERT INTO detalle_presupuesto (
      codigo_presupuesto, item, descripcion, cantidad, precio_unitario, importe
    ) VALUES ?`;
  await connection.query(query, [detalleData]);
};

const getPresupuestos = async () => {
  const [rows] = await db.query(`
    SELECT p.*,
           c.DENOMINACION AS nombre_cliente,
           c.CUIT AS cuit_cliente,
           c.IDSITFISCAL AS situacion_fiscal_cliente,
           rs.razon_social AS razon_social_empresa,
           rs.cuil AS cuit_razon_social,
           mon.nombre AS nombre_moneda,
           s.OBRA AS nombre_servicio,
           cc.nombre AS nombre_contacto
    FROM presupuesto p
    JOIN clientes c ON p.id_cliente = c.CODCLI
    JOIN razones_sociales rs ON p.id_razonsocial = rs.id
    JOIN moneda mon ON p.moneda = mon.codigo
    LEFT JOIN servicios s ON p.id_servicio = s.IDOBRA
    LEFT JOIN contacto_clientes cc ON p.id_contacto = cc.id_contacto
    ORDER BY p.codigo DESC
  `);
  return rows;
};

const getDetallePresupuesto = async (codigo) => {
  const [rows] = await db.query(`
    SELECT *
    FROM detalle_presupuesto
    WHERE codigo_presupuesto = ?
    ORDER BY item ASC
  `, [codigo]);
  return rows;
};

const getPresupuestosFacturar = async (params) => {
  let query = `
    SELECT p.*,
           c.DENOMINACION AS nombre_cliente,
           c.CUIT AS cuit_cliente,
           c.IDSITFISCAL AS situacion_fiscal_cliente,
           rs.razon_social AS razon_social_empresa,
           rs.cuil AS cuit_razon_social,
           mon.nombre AS nombre_moneda,
           s.OBRA AS nombre_servicio
    FROM presupuesto p
    JOIN clientes c ON p.id_cliente = c.CODCLI
    JOIN razones_sociales rs ON p.id_razonsocial = rs.id
    JOIN moneda mon ON p.moneda = mon.codigo
    LEFT JOIN servicios s ON p.id_servicio = s.IDOBRA
    WHERE 1=1
  `;

  const values = [];

  if (params.id_cliente) {
    query += ' AND p.id_cliente = ? ';
    values.push(params.id_cliente);
  }

  if (params.id_servicio) {
    query += ' AND p.id_servicio = ? ';
    values.push(params.id_servicio);
  }

  query += ' ORDER BY p.codigo DESC ';

  const [rows] = await db.query(query, values);
  return rows;
};

const getPresupuestosActivos = async (id_cliente) => {
  let query = `
    SELECT p.*,
           c.DENOMINACION AS nombre_cliente,
           c.CUIT AS cuit_cliente,
           c.IDSITFISCAL AS situacion_fiscal_cliente,
           rs.razon_social AS razon_social_empresa,
           rs.cuil AS cuit_razon_social,
           mon.nombre AS nombre_moneda,
           s.OBRA AS nombre_servicio
    FROM presupuesto p
    JOIN clientes c ON p.id_cliente = c.CODCLI
    JOIN razones_sociales rs ON p.id_razonsocial = rs.id
    JOIN moneda mon ON p.moneda = mon.codigo
    LEFT JOIN servicios s ON p.id_servicio = s.IDOBRA
    WHERE  ( p.saldo_iva <> 0 OR p.saldo_sin_iva <> 0)
      AND p.estado = 1
      AND p.id_servicio IS NOT NULL
  `;

  const values = [];

  if (id_cliente && id_cliente !== 'null' && id_cliente !== 'undefined') {
    query += ' AND p.id_cliente = ? ';
    values.push(id_cliente);
  }

  query += ' ORDER BY p.codigo DESC ';

  const [rows] = await db.query(query, values);
  return rows;
};

const getPresupuestosConFacturas = async () => {
  const [rows] = await db.query(`
    SELECT p.*,
           c.DENOMINACION AS nombre_cliente,
           c.CUIT AS cuit_cliente,
           c.IDSITFISCAL AS situacion_fiscal_cliente,
           rs.razon_social AS razon_social_empresa,
           rs.cuil AS cuit_razon_social,
           mon.nombre AS nombre_moneda,
           s.OBRA AS nombre_servicio,
           cc.nombre AS nombre_contacto
    FROM presupuesto p
    JOIN clientes c ON p.id_cliente = c.CODCLI
    JOIN razones_sociales rs ON p.id_razonsocial = rs.id
    JOIN moneda mon ON p.moneda = mon.codigo
    LEFT JOIN servicios s ON p.id_servicio = s.IDOBRA
    LEFT JOIN contacto_clientes cc ON p.id_contacto = cc.id_contacto
    WHERE p.tipo_presupuesto = 0
    ORDER BY p.codigo DESC
  `);
  return rows;
};

const getFacturasPresupuesto = async (codigo) => {
  const [rows] = await db.query(`
    SELECT DISTINCT
           fv.codigo,
           fv.fecha,
           fv.periodo_iva,
           fv.moneda,
           fv.ctz,
           fv.importe,
           fv.iva21,
           fv.iva27,
           fv.iva105,
           fv.tipoCmp,
           fv.codigoletra,
           fv.ptoVta,
           fv.NroCmp,
           fv.estado,
           fv.saldo,
           fv.observacion
    FROM factura_venta fv
    INNER JOIN detalle_factura_venta dfv ON fv.codigo = dfv.codigo_factura_venta
    WHERE dfv.codigo_presupuesto = ?
    ORDER BY fv.fecha DESC
  `, [codigo]);
  return rows;
};

module.exports = {
  getConnection,
  beginTransaction,
  commit,
  rollback,
  release,
  getLastCodigo,
  insertPresupuesto,
  insertDetalle,
  getPresupuestos,
  getDetallePresupuesto,
  getPresupuestosFacturar,
  getPresupuestosActivos,
  getPresupuestosConFacturas,
  getFacturasPresupuesto,
};
