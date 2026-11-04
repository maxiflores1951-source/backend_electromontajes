const db = require('../../db');

const getConnection = async () => await db.getConnection();
const beginTransaction = async (connection) => await connection.beginTransaction();
const commit = async (connection) => await connection.commit();
const rollback = async (connection) => await connection.rollback();
const release = async (connection) => await connection.release();

const getLastCodigo = async (connection) => {
  const [result] = await connection.query('SELECT MAX(codigo) AS ultimo FROM nota_credito_compra');
  return result.length > 0 ? result[0].ultimo : null;
};

const insertNotaCredito = async (connection, params) => {
  const {
    codigoNotaCredito, fecha, tipoCmp, codigoletra, ptoVta, NroCmp, moneda, ctz,
    id_proveedor, id_plancompra, id_motivo, id_servicio, id_movil,
    id_responsable, id_razonsocial, totalIVA21, totalIVA27, totalIVA10,
    bonificacion, periodoiva, importe, observacion, estado, saldoFinalNota, pagada,
    id_factura_compra, id_creado
  } = params;

  const query = `
    INSERT INTO nota_credito_compra (
      codigo, fecha, tipoCmp, codigoletra, ptoVta, NroCmp, moneda, ctz,
      id_proveedor, id_plancompra, id_motivo, id_servicio, id_movil,
      id_responsable, id_razonsocial, totalIVA21, totalIVA27, totalIVA10,
      bonificacion, periodoiva, importe, observacion, anulada, estado, saldo, pagada,
      id_factura_compra, id_creado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`;

  const values = [
    codigoNotaCredito, fecha, tipoCmp, codigoletra, ptoVta, NroCmp, moneda, ctz || 1,
    id_proveedor, id_plancompra, id_motivo, id_servicio || null, id_movil || null,
    id_responsable || null, id_razonsocial,
    totalIVA21 || 0, totalIVA27 || 0, totalIVA10 || 0,
    bonificacion || 0.00,
    null,
    importe, observacion || null,
    estado || 'Completa',
    saldoFinalNota ?? 0,
    pagada ?? 0,
    id_factura_compra || null,
    id_creado || null
  ];

  await connection.query(query, values);
};

const getNotaCreditoByCodigo = async (connection, codigo) => {
  const [rows] = await connection.query('SELECT codigo FROM nota_credito_compra WHERE codigo = ?', [codigo]);
  return rows;
};

const getFacturaByCodigo = async (connection, codigo) => {
  const [rows] = await connection.query('SELECT codigo FROM factura_compra WHERE codigo = ?', [codigo]);
  return rows;
};

const insertMovimientos = async (connection, codigoNotaCredito, movimientosData) => {
  const query = `
    INSERT INTO movimientos_nota_credito_compra (
      codigo_nota_credito_compra, tipo_movimiento,
      id_articulo, id_concepto, id_herramienta, id_epp,
      unidad, nombre, cantidad, precio, descuento, precio_final,
      importe, codigo_orden, iva_compras, codigo_remito,
      activo, cantidad_remitos, saldo
    ) VALUES ?`;
  await connection.query(query, [movimientosData]);
};

const insertOtrosImpuestos = async (connection, codigoNotaCredito, impuestosData) => {
  const query = `
    INSERT INTO otros_impuestos_nota_credito_compra (
      codigo_nota_credito_compra, codigo_impuesto, valor
    ) VALUES ?`;
  await connection.query(query, [impuestosData]);
};

const insertFormasPago = async (connection, codigoNotaCredito, formasPagoData) => {
  const query = `
    INSERT INTO formas_pago_nota_credito_compra (
      codigo_nota_credito_compra, codigo_valor, fecha, importe
    ) VALUES ?`;
  await connection.query(query, [formasPagoData]);
};

const getNotasCredito = async () => {
  const [rows] = await db.query(`
    SELECT ncc.*,
           p.Nombre_Prov AS nombre_proveedor,
           p.Razon_Social AS razon_social_proveedor,
           p.Cuilt AS cuit_proveedor,
           m.nombre AS nombre_motivo,
           pl.descripcion AS nombre_plan,
           rs.razon_social AS razon_social_empresa,
           rs.cuil AS cuit_razon_social,
           tc.descripcion AS tipo_comprobante,
           mon.nombre AS nombre_moneda,
           s.OBRA AS nombre_obra,
           mv.patente AS patente_movil,
           mv.kilometraje AS kilometraje_movil,
           fc.codigo AS factura_relacionada_codigo,
           fc.fecha AS factura_fecha,
           fc.NroCmp AS factura_nro_comprobante,
           pc.NOMBRE AS creado_por,
           pm.NOMBRE AS modificado_por
    FROM nota_credito_compra ncc
    LEFT JOIN proveedor p ON ncc.id_proveedor = p.Cod_Proveedor
    LEFT JOIN motivos m ON ncc.id_motivo = m.codigo
    LEFT JOIN plandecompra pl ON ncc.id_plancompra = pl.codigo
    LEFT JOIN razones_sociales rs ON ncc.id_razonsocial = rs.id
    LEFT JOIN tipocomprobante tc ON LPAD(ncc.tipoCmp, 3, '0') = tc.codigo
    LEFT JOIN moneda mon ON ncc.moneda = mon.codigo
    LEFT JOIN servicios s ON ncc.id_servicio = s.IDOBRA
    LEFT JOIN moviles mv ON ncc.id_movil = mv.nro_ident
    LEFT JOIN factura_compra fc ON ncc.id_factura_compra = fc.codigo
    LEFT JOIN personal pc ON pc.ID = ncc.id_creado
    LEFT JOIN personal pm ON pm.ID = ncc.id_modificado
    WHERE ncc.anulada = 0
    ORDER BY ncc.codigo DESC
  `);
  return rows.map((row) =>
    row.tipoCmp === null || row.tipoCmp === undefined
      ? row
      : { ...row, tipoCmp: String(row.tipoCmp).trim().padStart(3, '0') }
  );
};

const getMovimientosNotaCredito = async (codigo) => {
  const [rows] = await db.query(
    `SELECT * FROM movimientos_nota_credito_compra
     WHERE codigo_nota_credito_compra = ?`,
    [codigo]
  );
  return rows;
};

const getOtrosImpuestosNotaCredito = async (codigo) => {
  const [rows] = await db.query(
    `SELECT oi.*, imp.nombre AS nombre_impuesto
     FROM otros_impuestos_nota_credito_compra oi
     JOIN otros_impuestos imp ON oi.codigo_impuesto = imp.codigo
     WHERE oi.codigo_nota_credito_compra = ?`,
    [codigo]
  );
  return rows;
};

const getFormasPagoNotaCredito = async (codigo) => {
  const [rows] = await db.query(
    `SELECT fp.*, v.descripcion AS descripcion_valor
     FROM formas_pago_nota_credito_compra fp
     JOIN valores v ON fp.codigo_valor = v.codigo
     WHERE fp.codigo_nota_credito_compra = ?`,
    [codigo]
  );
  return rows;
};

let tablaImputacionAsegurada = false;

/**
 * Crea (una sola vez por proceso) la tabla que relaciona una nota de crédito
 * con las facturas de compra / notas de débito contra las que se imputa.
 */
const ensureDetalleImputacionTable = async (connection) => {
  if (tablaImputacionAsegurada) return;
  await connection.query(`
    CREATE TABLE IF NOT EXISTS detalle_nota_credito_compra (
      id INT(11) NOT NULL AUTO_INCREMENT,
      codigo_nota_credito_compra VARCHAR(20) NOT NULL,
      codigo_factura_compra VARCHAR(20) DEFAULT NULL,
      codigo_notadebito_compra VARCHAR(20) DEFAULT NULL,
      importe DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_nc (codigo_nota_credito_compra),
      KEY idx_fc (codigo_factura_compra),
      KEY idx_nd (codigo_notadebito_compra)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  tablaImputacionAsegurada = true;
};

const insertDetalleImputacion = async (
  connection,
  codigoNotaCredito,
  codigoFacturaCompra,
  codigoNotaDebitoCompra,
  importe
) => {
  await connection.query(
    `INSERT INTO detalle_nota_credito_compra
       (codigo_nota_credito_compra, codigo_factura_compra, codigo_notadebito_compra, importe)
     VALUES (?, ?, ?, ?)`,
    [
      codigoNotaCredito,
      codigoFacturaCompra || null,
      codigoNotaDebitoCompra || null,
      importe,
    ]
  );
};

const getDetalleImputaciones = async () => {
  const connection = await getConnection();
  try {
    await ensureDetalleImputacionTable(connection);
    const [rows] = await connection.query(
      `SELECT codigo_nota_credito_compra,
              codigo_factura_compra,
              codigo_notadebito_compra,
              importe,
              fecha_creacion
       FROM detalle_nota_credito_compra
       ORDER BY id DESC`
    );
    return rows;
  } finally {
    await release(connection);
  }
};

module.exports = {
  getConnection,
  beginTransaction,
  commit,
  rollback,
  release,
  getLastCodigo,
  insertNotaCredito,
  getNotaCreditoByCodigo,
  getFacturaByCodigo,
  insertMovimientos,
  insertOtrosImpuestos,
  insertFormasPago,
  getNotasCredito,
  getMovimientosNotaCredito,
  getOtrosImpuestosNotaCredito,
  getFormasPagoNotaCredito,
  ensureDetalleImputacionTable,
  insertDetalleImputacion,
  getDetalleImputaciones,
};
