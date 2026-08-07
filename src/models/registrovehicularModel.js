const db = require('../../db');

const getLastCodigo = async (connection) => {
  const [result] = await connection.query('SELECT MAX(codigo) AS ultimo FROM registro_vehicular');
  return result;
};

const insertRegistro = async (connection, values) => {
  const query = `
    INSERT INTO registro_vehicular (
      codigo, fecha_entrega, id_motivo, id_servicio, observacion
    ) VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await connection.query(query, values);
  return result;
};

const insertMovimiento = async (connection, values) => {
  const query = `
    INSERT INTO movimientos_registro_vehicular (
      codigo_registro_vehicular, id_movil, kilometraje_recorrido, kilometraje_final, horas
    ) VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await connection.query(query, values);
  return result;
};

const getRegistros = async () => {
  const query = `
    SELECT rv.*, 
           m.nombre AS nombre_motivo,
           s.OBRA AS nombre_obra
    FROM registro_vehicular rv
    LEFT JOIN motivos m ON rv.id_motivo = m.codigo
    LEFT JOIN servicios s ON rv.id_servicio = s.IDOBRA
    ORDER BY rv.fecha_entrega DESC
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getMovilesByRegistro = async (fechaEntrega, codigo) => {
  const query = `
    SELECT mrv.*, 
           mv.patente,
           mv.kilometraje,
           mv.tipo AS tipo_unidad,
           tum.descripcion AS tipo_unidad_descripcion,
           montos.monto_km,
           montos.monto_hora,
           (mrv.kilometraje_recorrido * montos.monto_km) AS total_km,
           (TIME_TO_SEC(mrv.horas)/3600 * montos.monto_hora) AS total_hora,
           ((mrv.kilometraje_recorrido * montos.monto_km) + (TIME_TO_SEC(mrv.horas)/3600 * montos.monto_hora)) AS total
    FROM movimientos_registro_vehicular mrv
    LEFT JOIN moviles mv ON mrv.id_movil = mv.nro_ident
    LEFT JOIN tipo_unidad_movil tum ON mv.tipo = tum.codigo
    LEFT JOIN montos ON montos.tipo_unidad = mv.tipo
         AND DATE_FORMAT(?, '%m/%Y') = montos.periodo
    WHERE mrv.codigo_registro_vehicular = ?
  `;
  const [rows] = await db.query(query, [fechaEntrega, codigo]);
  return rows;
};

module.exports = {
  getLastCodigo,
  insertRegistro,
  insertMovimiento,
  getRegistros,
  getMovilesByRegistro,
};
