const db = require('../../db');

const getUltimoCodigo = async () => {
  const [rows] = await db.query('SELECT MAX(codigo) AS ultimo FROM devolucion_venta');
  return rows;
};

const checkCodigo = async (connection, codigo) => {
  const query = 'SELECT COUNT(*) AS count FROM devolucion_venta WHERE codigo = ?';
  const exec = connection ? connection.query.bind(connection) : db.query;
  const [rows] = await exec(query, [codigo]);
  return rows;
};

const insert = async (connection, data) => {
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
    INSERT INTO devolucion_venta (
      codigo, fecha_pedido, fecha_entrega, id_solicitado, id_entregado,
      id_motivo, id_servicio, id_movil, observacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    codigo,
    fecha_pedido,
    fecha_entrega,
    id_solicitado,
    id_entregado,
    id_motivo,
    id_servicio || null,
    id_movil || null,
    observacion || null,
  ];

  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, values);
};

const insertMovimiento = async (connection, data) => {
  const {
    codigo_devolucion_venta,
    id_articulo,
    cantidad,
    precio,
    codigo_nc_compra,
  } = data;

  const query = `
    INSERT INTO movimientos_devolucion_ventas (
      codigo_devolucion_venta, id_articulo, cantidad, precio, codigo_nc_compra
    ) VALUES (?, ?, ?, ?, ?)
  `;

  const exec = connection ? connection.query.bind(connection) : db.query;
  await exec(query, [codigo_devolucion_venta, id_articulo, cantidad, precio, codigo_nc_compra]);
};

const getRemitosArticulosPorServicio = async (idServicio) => {
  const query = `
    SELECT 
      mrv.id_articulo,
      a.Nombre_Art AS nombre_articulo,
      a.Unidad,
      mrv.cantidad,
      rv.fecha_pedido,
      rv.codigo AS codigo_remito,
      COALESCE(hp.precio, 0.00) AS precio_actual
    FROM movimientos_remito_ventas mrv
    JOIN remito_venta rv ON mrv.codigo_remito_venta = rv.codigo
    JOIN articulo a ON mrv.id_articulo = a.Cod_Articulo
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
    WHERE rv.id_servicio = ?
  `;
  const [rows] = await db.query(query, [idServicio]);
  return rows;
};

const getDevolucionesArticulosPorServicio = async (idServicio) => {
  const query = `
    SELECT 
      mdv.id_articulo,
      a.Nombre_Art AS nombre_articulo,
      a.Unidad,
      mdv.cantidad,
      dv.fecha_pedido,
      dv.codigo AS codigo_devolucion,
      COALESCE(hp.precio, 0.00) AS precio_actual,
      p1.NOMBRE AS nombre_solicitado,
      p2.NOMBRE AS nombre_entregado
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
    WHERE dv.id_servicio = ?
  `;
  const [rows] = await db.query(query, [idServicio]);
  return rows;
};

const getDevoluciones = async () => {
  const query = `
    SELECT dv.*, 
           ps.NOMBRE AS nombre_solicitado, 
           pe.NOMBRE AS nombre_entregado, 
           m.nombre AS nombre_motivo,
           s.OBRA AS nombre_obra
    FROM devolucion_venta dv
    LEFT JOIN personal ps ON dv.id_solicitado = ps.ID  
    LEFT JOIN personal pe ON dv.id_entregado = pe.ID  
    LEFT JOIN motivos m ON dv.id_motivo = m.codigo  
    LEFT JOIN servicios s ON dv.id_servicio = s.IDOBRA
    ORDER BY dv.codigo DESC
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getArticulosByDevolucion = async (codigo) => {
  const query = `
    SELECT mdv.*, 
           a.Nombre_Art AS nombre_articulo,
           a.Unidad,
           (mdv.cantidad * mdv.precio) AS importe_calculado
    FROM movimientos_devolucion_ventas mdv
    LEFT JOIN articulo a ON TRIM(mdv.id_articulo) = TRIM(a.Cod_Articulo)
    WHERE mdv.codigo_devolucion_venta = ?
  `;
  const [rows] = await db.query(query, [codigo]);
  return rows;
};

const getDevolucionByCodigo = async (codigo) => {
  const [rows] = await db.query('SELECT * FROM devolucion_venta WHERE codigo = ?', [codigo]);
  return rows;
};

const updateDevolucion = async (data) => {
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
    UPDATE devolucion_venta SET
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
  await db.query('DELETE FROM movimientos_devolucion_ventas WHERE codigo_devolucion_venta = ?', [codigo]);
};

const insertMovimientoActualizado = async (data) => {
  const {
    codigo_devolucion_venta,
    id_articulo,
    cantidad,
    precio,
  } = data;

  const query = `
    INSERT INTO movimientos_devolucion_ventas (
      codigo_devolucion_venta, id_articulo, cantidad, precio
    ) VALUES (?, ?, ?, ?)
  `;

  await db.query(query, [codigo_devolucion_venta, id_articulo, cantidad, precio]);
};

module.exports = {
  getUltimoCodigo,
  checkCodigo,
  insert,
  insertMovimiento,
  getRemitosArticulosPorServicio,
  getDevolucionesArticulosPorServicio,
  getDevoluciones,
  getArticulosByDevolucion,
  getDevolucionByCodigo,
  updateDevolucion,
  deleteMovimientos,
  insertMovimientoActualizado,
};
