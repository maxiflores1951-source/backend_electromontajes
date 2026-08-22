const db = require('../../db');

const getLastCodigo = async () => {
  const [result] = await db.query('SELECT MAX(codigo) AS ultimo FROM remito_compra');
  return result.length > 0 ? result[0].ultimo : null;
};

const getRemitoByCodigo = async (codigo) => {
  const [rows] = await db.query('SELECT codigo FROM remito_compra WHERE codigo = ?', [codigo]);
  return rows;
};

const insertRemito = async (params) => {
  const {
    codigoOrden, remito, fecha_entrega, id_solicitado, id_proveedor,
    id_motivo, id_servicio, id_movil, activo, id_razon_social, observacion
  } = params;

  const query = `
    INSERT INTO remito_compra
    (codigo, remito, fecha_entrega, id_solicitado, id_proveedor, id_motivo, id_servicio, id_movil, activo, id_razon_social, observacion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  await db.query(query, [
    codigoOrden,
    remito,
    fecha_entrega,
    id_solicitado,
    id_proveedor,
    id_motivo,
    id_servicio || null,
    id_movil || null,
    activo,
    id_razon_social,
    observacion
  ]);
};

const insertMovimientos = async (codigoOrden, movimientosData) => {
  const query = `
    INSERT INTO movimientos_remito_compras
    (codigo_remito_compra, tipo_movimiento, id_articulo, id_herramienta, id_epp_variante, id_concepto, unidad, nombre, cantidad, activo)
    VALUES ?`;
  await db.query(query, [movimientosData]);
};

const insertRemitoOrden = async (codigoRelacion, codigoOrden) => {
  const query = `
    INSERT INTO remito_orden (orden_compra, remito)
    SELECT ?, ?
    WHERE NOT EXISTS (
      SELECT 1 FROM remito_orden WHERE orden_compra = ? AND remito = ?
    )`;
  await db.query(query, [codigoRelacion, codigoOrden, codigoRelacion, codigoOrden]);
};

const getRemitosCompra = async () => {
  const [rows] = await db.query(`
    SELECT rc.*,
           p.Nombre_Prov AS nombre_proveedor,
           p.Cuilt AS cuil_proveedor,
           m.nombre AS nombre_motivo,
           ps.NOMBRE AS nombre_solicitado,
           rs.razon_social,
           rs.cuil,
           s.OBRA AS nombre_obra,
           rf.factura AS factura_asociada
    FROM remito_compra rc
    JOIN proveedor p ON rc.id_proveedor = p.Cod_Proveedor
    LEFT JOIN motivos m ON rc.id_motivo = m.codigo
    LEFT JOIN personal ps ON rc.id_solicitado = ps.ID
    LEFT JOIN razones_sociales rs ON rc.id_razon_social = rs.id
    LEFT JOIN servicios s ON rc.id_servicio = s.IDOBRA
    LEFT JOIN remito_factura rf ON rc.codigo = rf.remito
    ORDER BY rc.codigo DESC;
  `);
  return rows;
};

const getMovimientosRemito = async (codigo) => {
  const [rows] = await db.query(`
    SELECT
      mrc.*,
      ev.*,
      mrc.cantidad AS cantidad,
      mrc.nombre AS nombre,
      ev.codigo_tipo AS codigo_tipo_epp,
      col.nombre AS nombre_color,
      ta.nombre AS nombre_talla,
      ma.nombre AS nombre_marca,
      te.tipo AS nombre_tipo_epp,
      e.iva_compras,
      CASE
        WHEN mrc.tipo_movimiento = 'articulo' THEN a.Iva_Compras
        WHEN mrc.tipo_movimiento = 'herramienta' THEN h.IVACompras
        WHEN mrc.tipo_movimiento = 'epp' THEN e.iva_compras
        ELSE NULL
      END AS iva_compras
    FROM movimientos_remito_compras mrc
    LEFT JOIN articulo a
      ON mrc.id_articulo = a.Cod_Articulo
      AND mrc.tipo_movimiento = 'articulo'
    LEFT JOIN herramienta h
      ON mrc.id_herramienta = h.CodigoHerramienta
      AND mrc.tipo_movimiento = 'herramienta'
    LEFT JOIN epp_variantes ev
      ON mrc.id_epp_variante = ev.id
      AND mrc.tipo_movimiento = 'epp'
    LEFT JOIN epp e
      ON ev.codigo_epp = e.codigo
    LEFT JOIN colores col
      ON ev.id_color = col.id
    LEFT JOIN tallas ta
      ON ev.id_talla = ta.id
    LEFT JOIN marcas ma
      ON ev.id_marca = ma.id
    LEFT JOIN tipos_elementos te
      ON ev.codigo_tipo = te.codigo
    WHERE mrc.codigo_remito_compra = ?
  `, [codigo]);
  return rows;
};

const getRemitosPorServicio = async (idServicio) => {
  const [rows] = await db.query(`
    SELECT
       rc.*,
       p.Nombre_Prov AS nombre_proveedor,
           p.Cuilt AS cuil_proveedor,
       s.OBRA AS nombre_obra
     FROM remito_compra rc
     JOIN proveedor p ON rc.id_proveedor = p.Cod_Proveedor
     JOIN servicios s ON rc.id_servicio = s.IDOBRA
     WHERE rc.id_servicio = ?
     ORDER BY rc.id_proveedor
  `, [idServicio]);
  return rows;
};

const getRemitosSinOrden = async () => {
  const [rows] = await db.query(`
    SELECT rc.*,
           p.Nombre_Prov AS nombre_proveedor,
           p.Cuilt AS cuil_proveedor,
           m.nombre AS nombre_motivo,
           ps.NOMBRE AS nombre_solicitado,
           rs.razon_social,
           rs.cuil,
           s.OBRA AS nombre_obra,
           rf.factura AS factura_asociada
    FROM remito_compra rc
    JOIN proveedor p ON rc.id_proveedor = p.Cod_Proveedor
    LEFT JOIN motivos m ON rc.id_motivo = m.codigo
    LEFT JOIN personal ps ON rc.id_solicitado = ps.ID
    LEFT JOIN razones_sociales rs ON rc.id_razon_social = rs.id
    LEFT JOIN servicios s ON rc.id_servicio = s.IDOBRA
    LEFT JOIN remito_factura rf ON rc.codigo = rf.remito
    WHERE rc.codigo NOT IN (
      SELECT remito
      FROM remito_orden
      WHERE remito IS NOT NULL
    )
    ORDER BY rc.codigo DESC;
  `);
  return rows;
};

const getMovimientosRemitoSimple = async (codigo) => {
  const [rows] = await db.query(`
    SELECT mrc.*,
           a.Nombre_Art AS nombre_articulo,
           a.Iva_Compras AS iva_compras,
           c.nombre AS nombre_concepto
    FROM movimientos_remito_compras mrc
    LEFT JOIN articulo a ON mrc.id_articulo = a.Cod_Articulo
    LEFT JOIN concepto c ON mrc.id_concepto = c.codigo
    WHERE mrc.codigo_remito_compra = ?
  `, [codigo]);
  return rows;
};

const getResumenRemitos = async () => {
  const [rows] = await db.query(`
    SELECT
      COUNT(*) AS cantidad_total_remitos,
      COALESCE(SUM(CASE WHEN EXISTS (
            SELECT 1
            FROM remito_factura rf
            WHERE rf.remito = rc.codigo
          ) THEN 1 ELSE 0 END), 0) AS cantidad_afectados,
      COALESCE(SUM(CASE WHEN NOT EXISTS (
            SELECT 1
            FROM remito_factura rf
            WHERE rf.remito = rc.codigo
          ) THEN 1 ELSE 0 END), 0) AS cantidad_no_afectados
    FROM remito_compra rc
  `);
  return rows;
};

const getRemitosPorMotivo = async () => {
  const [rows] = await db.query(`
    SELECT m.nombre AS motivo, COUNT(*) AS cantidad
    FROM remito_compra rc
    LEFT JOIN motivos m ON rc.id_motivo = m.codigo
    GROUP BY m.nombre
    ORDER BY cantidad DESC
  `);
  return rows;
};

const updateRemito = async (params) => {
  const {
    codigo, remito, fecha_entrega, id_solicitado, id_proveedor,
    id_motivo, id_servicio, id_movil, activo, id_razon_social, observacion
  } = params;

  const query = `
    UPDATE remito_compra
    SET remito = ?, fecha_entrega = ?, id_solicitado = ?, id_proveedor = ?,
        id_motivo = ?, id_servicio = ?, id_movil = ?, activo = ?,
        id_razon_social = ?, observacion = ?
    WHERE codigo = ?`;

  await db.query(query, [
    remito,
    fecha_entrega,
    id_solicitado,
    id_proveedor,
    id_motivo,
    id_servicio || null,
    id_movil || null,
    activo,
    id_razon_social,
    observacion,
    codigo
  ]);
};

const deleteMovimientosRemito = async (codigo) => {
  await db.query('DELETE FROM movimientos_remito_compras WHERE codigo_remito_compra = ?', [codigo]);
};

const deleteRelacionesRemito = async (codigo) => {
  await db.query('DELETE FROM remito_orden WHERE remito = ?', [codigo]);
};

const insertRemitoOrdenRelacion = async (codigoRelacion, codigo) => {
  await db.query('INSERT INTO remito_orden (orden_compra, remito) VALUES (?, ?)', [codigoRelacion, codigo]);
};

const getRemitosSinFactura = async () => {
  const [rows] = await db.query(`
    SELECT rc.*,
           p.Nombre_Prov AS nombre_proveedor,
           p.Cuilt AS cuil_proveedor,
           m.nombre AS nombre_motivo,
           ps.NOMBRE AS nombre_solicitado,
           rs.razon_social,
           rs.cuil,
           s.OBRA AS nombre_obra
    FROM remito_compra rc
    JOIN proveedor p ON rc.id_proveedor = p.Cod_Proveedor
    LEFT JOIN motivos m ON rc.id_motivo = m.codigo
    LEFT JOIN personal ps ON rc.id_solicitado = ps.ID
    LEFT JOIN razones_sociales rs ON rc.id_razon_social = rs.id
    LEFT JOIN servicios s ON rc.id_servicio = s.IDOBRA
    WHERE rc.codigo NOT IN (
      SELECT remito
      FROM remito_factura
      WHERE remito IS NOT NULL
    )
    ORDER BY rc.codigo DESC;
  `);
  return rows;
};

module.exports = {
  getLastCodigo,
  getRemitoByCodigo,
  insertRemito,
  insertMovimientos,
  insertRemitoOrden,
  getRemitosCompra,
  getMovimientosRemito,
  getRemitosPorServicio,
  getRemitosSinOrden,
  getMovimientosRemitoSimple,
  getResumenRemitos,
  getRemitosPorMotivo,
  updateRemito,
  deleteMovimientosRemito,
  deleteRelacionesRemito,
  insertRemitoOrdenRelacion,
  getRemitosSinFactura,
};
