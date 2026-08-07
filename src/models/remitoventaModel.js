const db = require('../../db');

const getUltimoCodigo = async () => {
  const [rows] = await db.query('SELECT MAX(codigo) AS ultimo FROM remito_venta');
  return rows;
};

const checkCodigo = async (codigo) => {
  const [rows] = await db.query(
    'SELECT COUNT(*) AS count FROM remito_venta WHERE codigo = ?',
    [codigo]
  );
  return rows;
};

const insert = async (data) => {
  const {
    codigo,
    fecha_pedido,
    fecha_entrega,
    id_solicitado,
    id_entregado,
    id_motivo,
    id_servicio,
    id_movil,
    observacion,
  } = data;

  const query = `
    INSERT INTO remito_venta (
      codigo, fecha_pedido, fecha_entrega, id_solicitado, id_entregado, id_motivo, id_servicio, id_movil, observacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await db.query(query, [
    codigo,
    fecha_pedido,
    fecha_entrega,
    id_solicitado,
    id_entregado,
    id_motivo,
    id_servicio,
    id_movil,
    observacion,
  ]);
};

const insertMovimiento = async (data) => {
  const {
    codigo_remito_venta,
    id_articulo,
    cantidad,
    precio,
    codigo_factura_compra,
    codigo_nota_credito_compra,
  } = data;

  const query = `
    INSERT INTO movimientos_remito_ventas (
      codigo_remito_venta, id_articulo, cantidad, precio, fecha, 
      codigo_factura_compra, codigo_nota_credito_compra
    ) VALUES (?, ?, ?, ?, NOW(), ?, ?)
  `;

  await db.query(query, [
    codigo_remito_venta,
    id_articulo,
    cantidad,
    precio,
    codigo_factura_compra,
    codigo_nota_credito_compra,
  ]);
};

const getRemitoByCodigo = async (codigo) => {
  const [rows] = await db.query('SELECT * FROM remito_venta WHERE codigo = ?', [codigo]);
  return rows;
};

const getMovimientosByCodigo = async (codigo) => {
  const [rows] = await db.query(
    'SELECT * FROM movimientos_remito_ventas WHERE codigo_remito_venta = ?',
    [codigo]
  );
  return rows;
};

const getRemitosVenta = async () => {
  const query = `
    SELECT rv.*, 
           ps.NOMBRE AS nombre_solicitado, 
           pe.NOMBRE AS nombre_entregado, 
           m.nombre AS nombre_motivo,
           s.OBRA AS nombre_obra
    FROM remito_venta rv
    LEFT JOIN personal ps ON rv.id_solicitado = ps.ID  
    LEFT JOIN personal pe ON rv.id_entregado = pe.ID  
    LEFT JOIN motivos m ON rv.id_motivo = m.codigo  
    LEFT JOIN servicios s ON rv.id_servicio = s.IDOBRA
    ORDER BY rv.codigo DESC
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getArticulosByRemito = async (codigo) => {
  const query = `
    SELECT mrv.*, 
           a.Nombre_Art AS nombre_articulo,
           a.Unidad,
           (mrv.cantidad * mrv.precio) AS importe_calculado
    FROM movimientos_remito_ventas mrv
    LEFT JOIN articulo a ON mrv.id_articulo = a.Cod_Articulo
    WHERE mrv.codigo_remito_venta = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

const getArticulosPorServicio = async (idServicio) => {
  const query = `
    SELECT 
      mrv.id_articulo,
      a.Nombre_Art AS nombre_articulo,
      a.Unidad,
      mrv.cantidad,
      rv.fecha_pedido,
      rv.codigo AS codigo_remito,
      COALESCE(mrv.precio, 0.00) AS precio_actual,
      p1.NOMBRE AS nombre_solicitado,
      p2.NOMBRE AS nombre_entregado
    FROM movimientos_remito_ventas mrv
    JOIN remito_venta rv ON mrv.codigo_remito_venta = rv.codigo
    JOIN articulo a ON mrv.id_articulo = a.Cod_Articulo
    LEFT JOIN personal p1 ON rv.id_solicitado = p1.ID
    LEFT JOIN personal p2 ON rv.id_entregado = p2.ID
    WHERE rv.id_servicio = ?
  `;
  const [rows] = await db.query(query, [idServicio]);
  return rows;
};

const getMovimientosArticulos = async (idMotivo, idServicio, idMovil) => {
  const query = `
    SELECT 
      'REMITO' AS tipo,
      mrv.id_articulo,
      a.Nombre_Art AS nombre_articulo,
      a.Unidad,
      mrv.cantidad,
      rv.fecha_pedido,
      rv.codigo AS codigo_movimiento,
      COALESCE(hp.precio, 0.00) AS precio_actual,
      p1.NOMBRE AS nombre_solicitado,
      p2.NOMBRE AS nombre_entregado,
      mrv.codigo_factura_compra AS codigo_factura
    FROM movimientos_remito_ventas mrv
    JOIN remito_venta rv ON mrv.codigo_remito_venta = rv.codigo
    JOIN articulo a ON mrv.id_articulo = a.Cod_Articulo
    LEFT JOIN personal p1 ON rv.id_solicitado = p1.ID
    LEFT JOIN personal p2 ON rv.id_entregado = p2.ID
    LEFT JOIN (
      SELECT hp1.Cod_Articulo, hp1.precio
      FROM historial_precios hp1
      INNER JOIN (
        SELECT Cod_Articulo, MAX(fecha) AS ultima_fecha
        FROM historial_precios
        GROUP BY Cod_Articulo
      ) hp2 
      ON hp1.Cod_Articulo = hp2.Cod_Articulo AND hp1.fecha = hp2.ultima_fecha
    ) hp ON a.Cod_Articulo = hp.Cod_Articulo
    WHERE rv.id_motivo = ?
      AND (? IS NULL OR rv.id_servicio = ?)
      AND (? IS NULL OR rv.id_movil = ?)

    UNION ALL

    SELECT 
      'DEVOLUCIÓN' AS tipo,
      mdv.id_articulo,
      a.Nombre_Art AS nombre_articulo,
      a.Unidad,
      mdv.cantidad,
      dv.fecha_pedido,
      dv.codigo AS codigo_movimiento,
      COALESCE(hp.precio, 0.00) AS precio_actual,
      p1.NOMBRE AS nombre_solicitado,
      p2.NOMBRE AS nombre_entregado,
      NULL AS codigo_factura
    FROM movimientos_devolucion_ventas mdv
    JOIN devolucion_venta dv ON mdv.codigo_devolucion_venta = dv.codigo
    JOIN articulo a ON mdv.id_articulo = a.Cod_Articulo
    LEFT JOIN personal p1 ON dv.id_solicitado = p1.ID
    LEFT JOIN personal p2 ON dv.id_entregado = p2.ID
    LEFT JOIN (
      SELECT hp1.Cod_Articulo, hp1.precio
      FROM historial_precios hp1
      INNER JOIN (
        SELECT Cod_Articulo, MAX(fecha) AS ultima_fecha
        FROM historial_precios
        GROUP BY Cod_Articulo
      ) hp2 
      ON hp1.Cod_Articulo = hp2.Cod_Articulo AND hp1.fecha = hp2.ultima_fecha
    ) hp ON a.Cod_Articulo = hp.Cod_Articulo
    WHERE dv.id_motivo = ?
      AND (? IS NULL OR dv.id_servicio = ?)
      AND (? IS NULL OR dv.id_movil = ?)
  `;

  const [rows] = await db.query(query, [
    idMotivo,
    idServicio, idServicio,
    idMovil, idMovil,
    idMotivo,
    idServicio, idServicio,
    idMovil, idMovil,
  ]);
  return rows;
};

const updatePrecio = async (connection, codigoRemitoVenta, idArticulo, precio) => {
  const query = `
    UPDATE movimientos_remito_ventas
    SET precio = ?
    WHERE codigo_remito_venta = ? AND id_articulo = ?
  `;
  const exec = connection ? connection.execute.bind(connection) : db.execute;
  const [result] = await exec(query, [precio, codigoRemitoVenta, idArticulo]);
  return result.affectedRows;
};

const getCostosRemitos = async (idServicio) => {
  const query = `
    SELECT 
      'REMITO' AS tipo,
      mrv.id_articulo,
      a.Nombre_Art AS nombre_articulo,
      a.Unidad,
      mrv.cantidad,
      rv.fecha_pedido,
      rv.codigo AS codigo_movimiento,
      COALESCE(mrv.precio, 0.00) AS precio_actual,
      p1.NOMBRE AS nombre_solicitado,
      p2.NOMBRE AS nombre_entregado
    FROM movimientos_remito_ventas mrv
    JOIN remito_venta rv ON mrv.codigo_remito_venta = rv.codigo
    JOIN articulo a ON mrv.id_articulo = a.Cod_Articulo
    LEFT JOIN personal p1 ON rv.id_solicitado = p1.ID
    LEFT JOIN personal p2 ON rv.id_entregado = p2.ID
    WHERE rv.id_servicio = ?

    UNION ALL

    SELECT 
      'DEVOLUCIÓN' AS tipo,
      mdv.id_articulo,
      a.Nombre_Art AS nombre_articulo,
      a.Unidad,
      mdv.cantidad,
      dv.fecha_pedido,
      dv.codigo AS codigo_movimiento,
      COALESCE(mdv.precio, 0.00) AS precio_actual,
      p1.NOMBRE AS nombre_solicitado,
      p2.NOMBRE AS nombre_entregado
    FROM movimientos_devolucion_ventas mdv
    JOIN devolucion_venta dv ON mdv.codigo_devolucion_venta = dv.codigo
    JOIN articulo a ON mdv.id_articulo = a.Cod_Articulo
    LEFT JOIN personal p1 ON dv.id_solicitado = p1.ID
    LEFT JOIN personal p2 ON dv.id_entregado = p2.ID
    WHERE dv.id_servicio = ?
  `;

  const [rows] = await db.query(query, [idServicio, idServicio]);
  return rows;
};

const updateRemito = async (data) => {
  const {
    codigo,
    fecha_pedido,
    fecha_entrega,
    id_solicitado,
    id_entregado,
    id_motivo,
    id_servicio,
    id_movil,
    observacion,
  } = data;

  const query = `
    UPDATE remito_venta SET
      fecha_pedido = ?,
      fecha_entrega = ?,
      id_solicitado = ?,
      id_entregado = ?,
      id_motivo = ?,
      id_servicio = ?,
      id_movil = ?,
      observacion = ?
    WHERE codigo = ?
  `;

  await db.query(query, [
    fecha_pedido,
    fecha_entrega,
    id_solicitado,
    id_entregado,
    id_motivo,
    id_servicio,
    id_movil,
    observacion,
    codigo,
  ]);
};

const deleteMovimientos = async (codigo) => {
  await db.query('DELETE FROM movimientos_remito_ventas WHERE codigo_remito_venta = ?', [codigo]);
};

const insertMovimientoActualizado = async (data) => {
  const {
    codigo_remito_venta,
    id_articulo,
    cantidad,
    precio,
    codigo_factura_compra,
  } = data;

  const query = `
    INSERT INTO movimientos_remito_ventas (
      codigo_remito_venta, id_articulo, cantidad, precio, fecha, codigo_factura_compra
    ) VALUES (?, ?, ?, ?, NOW(), ?)
  `;

  await db.query(query, [
    codigo_remito_venta,
    id_articulo,
    cantidad,
    precio,
    codigo_factura_compra,
  ]);
};

module.exports = {
  getUltimoCodigo,
  checkCodigo,
  insert,
  insertMovimiento,
  getRemitoByCodigo,
  getMovimientosByCodigo,
  getRemitosVenta,
  getArticulosByRemito,
  getArticulosPorServicio,
  getMovimientosArticulos,
  updatePrecio,
  getCostosRemitos,
  updateRemito,
  deleteMovimientos,
  insertMovimientoActualizado,
};
