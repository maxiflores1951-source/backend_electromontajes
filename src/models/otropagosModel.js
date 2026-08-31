const db = require('../../db');

const getLastCodigo = async (connection) => {
  const [result] = await connection.query('SELECT MAX(codigo) AS ultimo FROM otros_pagos');
  return result.length > 0 ? result[0].ultimo : null;
};

const insertOtrosPagos = async (connection, values) => {
  const query = `
    INSERT INTO otros_pagos (
      codigo, fecha, moneda, ctz,
      id_motivo, id_servicio, id_movil, id_responsable,
      id_razonsocial, id_plancompra, id_proveedor,
      importe, observacion, fecha_creacion, anulada
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)
  `;
  await connection.query(query, values);
};

const insertDetalles = async (connection, data) => {
  const query = `
    INSERT INTO detalle_otros_pagos (
      codigo_otros_pagos, detalle, importe
    ) VALUES ?
  `;
  await connection.query(query, [data]);
};

const insertFormasPago = async (connection, data) => {
  const query = `
    INSERT INTO formas_pago_otros_pagos (
      codigo_otros_pagos, codigo_valor, fecha, importe
    ) VALUES ?
  `;
  await connection.query(query, [data]);
};

const getAll = async (connection) => {
  const query = `
    SELECT 
      op.*,
      m.nombre AS nombre_moneda,
      mo.nombre AS nombre_motivo,
      s.OBRA AS nombre_servicio,
      mv.patente AS patente_movil,
      mv.kilometraje AS kilometraje_movil,
      r.razon_social AS razon_social,
      r.cuil AS cuil_razon_social,
      pc.descripcion AS nombre_plan,
      p.NOMBRE AS nombre_responsable,
      p.DNI AS dni_responsable
    FROM 
      otros_pagos op
      LEFT JOIN moneda m ON op.moneda = m.codigo
      LEFT JOIN motivos mo ON op.id_motivo = mo.codigo
      LEFT JOIN servicios s ON op.id_servicio = s.IDOBRA
      LEFT JOIN moviles mv ON op.id_movil = mv.nro_ident
      LEFT JOIN razones_sociales r ON op.id_razonsocial = r.id
      LEFT JOIN plandecompra pc ON op.id_plancompra = pc.codigo
      LEFT JOIN personal p ON op.id_responsable = p.ID
    ORDER BY 
      op.codigo DESC;
  `;
  const [rows] = await connection.query(query);
  return rows;
};

const getByCodigo = async (connection, codigo) => {
  const query = `
    SELECT 
      op.*,
      m.nombre AS nombre_moneda,
      mo.nombre AS nombre_motivo,
      s.OBRA AS nombre_servicio,
      mv.patente AS patente_movil,
      mv.kilometraje AS kilometraje_movil,
      r.razon_social AS razon_social,
      r.cuil AS cuil_razon_social,
      pc.descripcion AS nombre_plan,
      p.NOMBRE AS nombre_responsable,
      p.DNI AS dni_responsable
    FROM otros_pagos op
      LEFT JOIN moneda m ON op.moneda = m.codigo
      LEFT JOIN motivos mo ON op.id_motivo = mo.codigo
      LEFT JOIN servicios s ON op.id_servicio = s.IDOBRA
      LEFT JOIN moviles mv ON op.id_movil = mv.nro_ident
      LEFT JOIN razones_sociales r ON op.id_razonsocial = r.id
      LEFT JOIN plandecompra pc ON op.id_plancompra = pc.codigo
      LEFT JOIN personal p ON op.id_responsable = p.ID
    WHERE op.codigo = ?
    LIMIT 1
  `;
  const [rows] = await connection.query(query, [codigo]);
  return rows;
};

const getDetalles = async (connection, codigo) => {
  const query = `
    SELECT * 
    FROM detalle_otros_pagos 
    WHERE codigo_otros_pagos = ?
  `;
  const [rows] = await connection.query(query, [codigo]);
  return rows;
};

const getFormasPago = async (connection, codigo) => {
  const query = `
    SELECT fpop.*, v.descripcion AS descripcion_valor
    FROM formas_pago_otros_pagos fpop
      LEFT JOIN valores v ON fpop.codigo_valor = v.codigo
    WHERE fpop.codigo_otros_pagos = ?
  `;
  const [rows] = await connection.query(query, [codigo]);
  return rows;
};

const updateOtrosPagos = async (connection, values) => {
  const query = `
    UPDATE otros_pagos SET
      fecha = ?, moneda = ?, ctz = ?,
      id_motivo = ?, id_servicio = ?, id_movil = ?, id_responsable = ?,
      id_razonsocial = ?, id_plancompra = ?, id_proveedor = ?,
      importe = ?, observacion = ?
    WHERE codigo = ?
  `;
  await connection.query(query, values);
};

const deleteDetalles = async (connection, codigo) => {
  await connection.query('DELETE FROM detalle_otros_pagos WHERE codigo_otros_pagos = ?', [codigo]);
};

const deleteFormasPago = async (connection, codigo) => {
  await connection.query('DELETE FROM formas_pago_otros_pagos WHERE codigo_otros_pagos = ?', [codigo]);
};

module.exports = {
  getLastCodigo,
  insertOtrosPagos,
  insertDetalles,
  insertFormasPago,
  getAll,
  getByCodigo,
  getDetalles,
  getFormasPago,
  updateOtrosPagos,
  deleteDetalles,
  deleteFormasPago,
};
