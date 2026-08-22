const db = require('../../db');

const getConnection = async () => await db.getConnection();
const beginTransaction = async (connection) => await connection.beginTransaction();
const commit = async (connection) => await connection.commit();
const rollback = async (connection) => await connection.rollback();
const release = async (connection) => await connection.release();

const getLastCodigo = async (connection) => {
  const runner = connection || db;
  const [result] = await runner.query('SELECT MAX(codigo) AS ultimo FROM orden_compra');
  return result.length > 0 ? result[0].ultimo : null;
};

const insertOrden = async (connection, params) => {
  const {
    codigoOrden, fecha_pedido, fecha_entrega, id_solicitado, id_entregado,
    id_proveedor, id_motivo, id_servicio, id_movil, activo, id_razon_social, observacion, id_creado
  } = params;


  const query = `
    INSERT INTO orden_compra (codigo, fecha_pedido, fecha_entrega, id_solicitado, id_entregado, id_proveedor, id_motivo, id_servicio, id_movil, activo, id_razon_social, observacion, id_creado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  await connection.query(query, [
    codigoOrden,
    fecha_pedido,
    fecha_entrega,
    id_solicitado,
    id_entregado,
    id_proveedor,
    id_motivo,
    id_servicio,
    id_movil,
    activo,
    id_razon_social,
    observacion,
    id_creado ?? null
  ]);
};

const insertMovimientos = async (connection, movimientosData) => {
  const query = `
    INSERT INTO movimientos_compras (codigo_orden_compra, tipo_movimiento, id_articulo, id_concepto, unidad, nombre, cantidad, activo, codigo_epp, codigo_tipo_epp)
    VALUES ?`;
  await connection.query(query, [movimientosData]);
};

const getOrdenesCompra = async () => {
  const [rows] = await db.query(`
    SELECT oc.*,
           p.Nombre_Prov AS nombre_proveedor,
           p.Razon_Social AS razon_social_proveedor,
           p.Cuilt AS cuil_proveedor,
           p.Cuenta_Corriente AS cuenta_corriente_proveedor,
           m.nombre AS nombre_motivo,
           ps.NOMBRE AS nombre_solicitado,
           pe.NOMBRE AS nombre_entregado,
           rs.razon_social,
           rs.cuil,
           s.OBRA AS nombre_obra,
           pc.NOMBRE AS creado_por,
           pm.NOMBRE AS modificado_por
    FROM orden_compra oc
    JOIN proveedor p ON oc.id_proveedor = p.Cod_Proveedor
    LEFT JOIN motivos m ON oc.id_motivo = m.codigo
    LEFT JOIN personal ps ON oc.id_solicitado = ps.ID
    LEFT JOIN personal pe ON oc.id_entregado = pe.ID
    LEFT JOIN razones_sociales rs ON oc.id_razon_social = rs.id
    LEFT JOIN servicios s ON oc.id_servicio = s.IDOBRA
    LEFT JOIN personal pc ON oc.id_creado = pc.ID
    LEFT JOIN personal pm ON oc.id_modificado = pm.ID
    ORDER BY oc.codigo DESC;
  `);
  return rows;
};

const getMovimientosOrden = async (codigo) => {
  const [rows] = await db.query(`
    SELECT mc.*,
           a.Nombre_Art AS nombre_articulo,
           c.nombre AS nombre_concepto,
           COALESCE(c.iva_compras, a.Iva_Compras) AS iva_compras,
           te.tipo AS nombre_tipo_epp
    FROM movimientos_compras mc
    LEFT JOIN articulo a ON mc.id_articulo = a.Cod_Articulo
    LEFT JOIN concepto c ON mc.id_concepto = c.codigo
    LEFT JOIN tipos_elementos te ON mc.codigo_tipo_epp = te.codigo
    WHERE mc.codigo_orden_compra = ?
  `, [codigo]);
  return rows;
};

const getRemitosFacturasOrden = async (codigo) => {
  const [rows] = await db.query(`
    SELECT ro.remito, ro.factura
    FROM remito_orden ro
    WHERE ro.orden_compra = ?
  `, [codigo]);
  return rows;
};

const getOrdenesNoAfectadas = async () => {
  const [rows] = await db.query(`
    SELECT oc.*,
           p.Nombre_Prov AS nombre_proveedor,
           m.nombre AS nombre_motivo,
           ps.NOMBRE AS nombre_solicitado,
           pe.NOMBRE AS nombre_entregado,
           rs.razon_social,
           rs.cuil,
           s.OBRA AS nombre_obra,
           pc.NOMBRE AS creado_por,
           pm.NOMBRE AS modificado_por
    FROM orden_compra oc
    JOIN proveedor p ON oc.id_proveedor = p.Cod_Proveedor
    LEFT JOIN motivos m ON oc.id_motivo = m.codigo
    LEFT JOIN personal ps ON oc.id_solicitado = ps.ID
    LEFT JOIN personal pe ON oc.id_entregado = pe.ID
    LEFT JOIN razones_sociales rs ON oc.id_razon_social = rs.id
    LEFT JOIN servicios s ON oc.id_servicio = s.IDOBRA
    LEFT JOIN personal pc ON oc.id_creado = pc.ID
    LEFT JOIN personal pm ON oc.id_modificado = pm.ID
    WHERE oc.activo = 1
      AND NOT EXISTS (
        SELECT 1
        FROM remito_orden ro
        WHERE ro.orden_compra = oc.codigo
      )
      AND NOT EXISTS (
        SELECT 1
        FROM remito_orden ro
        WHERE ro.orden_compra = oc.codigo
          AND TRIM(COALESCE(ro.factura, '')) != ''
      )
  `);
  return rows;
};

const getRemitosOrden = async (codigo) => {
  const [rows] = await db.query(`
    SELECT ro.remito
    FROM remito_orden ro
    WHERE ro.orden_compra = ?
  `, [codigo]);
  return rows;
};

const updateOrden = async (connection, params) => {
  const {
    codigoOrden, fecha_pedido, fecha_entrega, id_solicitado, id_entregado,
    id_proveedor, id_motivo, id_servicio, id_movil, activo, id_razon_social, observacion, id_modificado
  } = params;

  const fechaEntregaFinal = fecha_entrega || fecha_pedido || new Date();
  const idEntregadoFinal = id_entregado || id_solicitado || null;

  const query = `
    UPDATE orden_compra
    SET  fecha_pedido      = ?,
         fecha_entrega     = ?,
         id_solicitado     = ?,
         id_entregado      = ?,
         id_proveedor      = ?,
         id_motivo         = ?,
         id_servicio       = ?,
         id_movil          = ?,
         activo            = ?,
         id_razon_social   = ?,
         observacion       = ?,
         id_modificado     = ?,
         fecha_modificacion = NOW()
    WHERE codigo = ?`;

  await connection.query(query, [
    fecha_pedido,
    fechaEntregaFinal,
    id_solicitado,
    idEntregadoFinal,
    id_proveedor,
    id_motivo,
    id_servicio,
    id_movil,
    activo,
    id_razon_social,
    observacion,
    id_modificado ?? null,
    codigoOrden
  ]);
};

const deleteMovimientosOrden = async (connection, codigo) => {
  await connection.query('DELETE FROM movimientos_compras WHERE codigo_orden_compra = ?', [codigo]);
};

const insertMovimientosUpdate = async (connection, movimientosData) => {
  const query = `
    INSERT INTO movimientos_compras
      (codigo_orden_compra, tipo_movimiento, id_articulo, id_concepto,
       unidad, nombre, cantidad, activo, codigo_epp, codigo_tipo_epp)
    VALUES ?`;
  await connection.query(query, [movimientosData]);
};

const getOrdenRelaciones = async (codigo) => {
  const [rows] = await db.query(`
    SELECT
      'remito' AS tipo,
      rc.codigo,
      rc.remito AS numero,
      rc.fecha_entrega AS fecha,
      rc.id_solicitado AS id_usuario,
      rc.id_proveedor,
      p.Nombre_Prov AS nombre_proveedor,
      rc.id_motivo,
      rc.id_servicio,
      rc.id_movil,
      rc.activo,
      rc.id_razon_social,
      rs.razon_social AS razon_social,
      rc.observacion,
      NULL AS tipoCmp,
      NULL AS codigoletra,
      NULL AS ptoVta,
      NULL AS NroCmp,
      NULL AS moneda,
      NULL AS ctz,
      NULL AS id_plancompra,
      NULL AS id_responsable,
      NULL AS totalIVA21,
      NULL AS totalIVA27,
      NULL AS totalIVA10,
      NULL AS importe,
      NULL AS fecha_creacion_factura,
      NULL AS anulada,
      NULL AS bonificacion,
      NULL AS periodoiva,
      NULL AS estado,
      NULL AS saldo
    FROM remito_orden ro
    JOIN remito_compra rc ON ro.remito = rc.codigo
    LEFT JOIN proveedor p ON rc.id_proveedor = p.Cod_Proveedor
    LEFT JOIN razones_sociales rs ON rc.id_razon_social = rs.id
    WHERE ro.orden_compra = ?

    UNION ALL

    SELECT
      'factura' AS tipo,
      fc.codigo,
      fc.NroCmp AS numero,
      fc.fecha,
      NULL AS id_usuario,
      fc.id_proveedor,
      p.Nombre_Prov AS nombre_proveedor,
      fc.id_motivo,
      fc.id_servicio,
      fc.id_movil,
      NULL AS activo,
      fc.id_razonsocial,
      rs.razon_social AS razon_social,
      fc.observacion,
      fc.tipoCmp,
      fc.codigoletra,
      fc.ptoVta,
      fc.NroCmp,
      fc.moneda,
      fc.ctz,
      fc.id_plancompra,
      fc.id_responsable,
      fc.totalIVA21,
      fc.totalIVA27,
      fc.totalIVA10,
      fc.importe,
      fc.fecha_creacion,
      fc.anulada,
      fc.bonificacion,
      fc.periodoiva,
      fc.estado,
      fc.saldo
    FROM remito_orden ro
    JOIN factura_compra fc ON ro.factura = fc.codigo
    LEFT JOIN proveedor p ON fc.id_proveedor = p.Cod_Proveedor
    LEFT JOIN razones_sociales rs ON fc.id_razonsocial = rs.id
    WHERE ro.orden_compra = ?
  `, [codigo, codigo]);
  return rows;
};

const getResumenOrdenes = async () => {
  const [rows] = await db.query(`
    SELECT
      COUNT(*) AS cantidad_total_ordenes,
      SUM(CASE WHEN oc.activo = 0 THEN 1 ELSE 0 END) AS cantidad_anuladas,
      SUM(CASE WHEN oc.activo = 1 AND EXISTS (
            SELECT 1
            FROM remito_orden ro
            WHERE ro.orden_compra = oc.codigo
              AND (
                (ro.remito  IS NOT NULL AND ro.remito  <> '')
                OR
                (ro.factura IS NOT NULL AND ro.factura <> '')
              )
        ) THEN 1 ELSE 0 END) AS cantidad_afectadas,
      SUM(CASE WHEN oc.activo = 1 AND NOT EXISTS (
            SELECT 1
            FROM remito_orden ro
            WHERE ro.orden_compra = oc.codigo
              AND (
                (ro.remito  IS NOT NULL AND ro.remito  <> '')
                OR
                (ro.factura IS NOT NULL AND ro.factura <> '')
              )
        ) THEN 1 ELSE 0 END) AS cantidad_no_afectadas
    FROM orden_compra oc
  `);
  return rows;
};

const getOrdenesPorMotivo = async () => {
  const [rows] = await db.query(`
    SELECT m.nombre AS motivo, COUNT(*) AS cantidad
    FROM orden_compra oc
    LEFT JOIN motivos m ON oc.id_motivo = m.codigo
    GROUP BY m.nombre
    ORDER BY cantidad DESC
  `);
  return rows;
};

const deleteRelacionRemito = async (codigo) => {
  const [result] = await db.query('DELETE FROM remito_orden WHERE remito = ?', [codigo]);
  return result.affectedRows;
};

const deleteRelacionFactura = async (codigo) => {
  const [result] = await db.query('DELETE FROM remito_orden WHERE factura = ?', [codigo]);
  return result.affectedRows;
};

const insertRelacionRemito = async (orden_compra, codigo) => {
  const [result] = await db.query('INSERT INTO remito_orden (orden_compra, remito) VALUES (?, ?)', [orden_compra, codigo]);
  return result.insertId;
};

const insertRelacionFactura = async (orden_compra, codigo) => {
  const [result] = await db.query('INSERT INTO remito_orden (orden_compra, factura) VALUES (?, ?)', [orden_compra, codigo]);
  return result.insertId;
};

module.exports = {
  getConnection,
  beginTransaction,
  commit,
  rollback,
  release,
  getLastCodigo,
  insertOrden,
  insertMovimientos,
  getOrdenesCompra,
  getMovimientosOrden,
  getRemitosFacturasOrden,
  getOrdenesNoAfectadas,
  getRemitosOrden,
  updateOrden,
  deleteMovimientosOrden,
  insertMovimientosUpdate,
  getOrdenRelaciones,
  getResumenOrdenes,
  getOrdenesPorMotivo,
  deleteRelacionRemito,
  deleteRelacionFactura,
  insertRelacionRemito,
  insertRelacionFactura,
};
