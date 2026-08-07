const db = require('../../db');

const getLastCodigo = async (connection) => {
  const [result] = await connection.query('SELECT MAX(codigo) AS ultimo FROM historial_vehicular');
  return result;
};

const insertHistorial = async (connection, values) => {
  const query = `
    INSERT INTO historial_vehicular (
      codigo,
      fecha,
      descripcion,
      causa,
      id_movil,
      id_proveedor,
      id_responsable,
      kilometraje,
      horometro,
      observacion,
      importe,
      id_creado
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await connection.query(query, values);
  return result;
};

const insertRepuestos = async (connection, data) => {
  const query = `
    INSERT INTO historial_vehicular_detalle (
      codigo_historial,
      codigo_seccion,
      codigo_item,
      descripcion,
      cantidad,
      precio,
      importe
    ) VALUES ?
  `;
  const [result] = await connection.query(query, [data]);
  return result;
};

const insertTrabajos = async (connection, data) => {
  const query = `
    INSERT INTO historial_vehicular_trabajos (
      codigo_historial,
      detalle,
      importe
    ) VALUES ?
  `;
  const [result] = await connection.query(query, [data]);
  return result;
};

const insertInsumos = async (connection, data) => {
  const query = `
    INSERT INTO historial_vehicular_insumos (
      codigo_historial,
      tipo_insumo,
      id_articulo,
      id_concepto,
      nombre,
      unidad,
      iva_compras,
      cantidad,
      precio,
      importe,
      asignado,
      activo
    ) VALUES ?
  `;
  const [result] = await connection.query(query, [data]);
  return result;
};

const getAll = async () => {
  const query = `
    SELECT 
      hv.*,

      p.Nombre_Prov AS nombre_proveedor,
      p.Razon_Social AS razon_social_proveedor,
      p.Cuilt AS cuit_proveedor,

      mv.patente AS patente_movil,

      per.NOMBRE AS nombre_responsable,

      hv.kilometraje AS kilometraje_historial,
      hv.horometro AS horometro_historial

    FROM historial_vehicular hv

    LEFT JOIN proveedor p 
      ON hv.id_proveedor = p.Cod_Proveedor

    LEFT JOIN moviles mv 
      ON hv.id_movil = mv.nro_ident

    LEFT JOIN personal per
      ON hv.id_responsable = per.ID

    ORDER BY hv.fecha DESC, hv.codigo DESC
  `;
  const [rows] = await db.query(query);
  return rows;
};

const getRepuestosByCodigo = async (codigoHistorial) => {
  const query = `
    SELECT 
      hvd.*,
      sc.nombre AS nombre_seccion,
      ic.nombre AS nombre_item
    FROM historial_vehicular_detalle hvd
    LEFT JOIN secciones_checklist sc 
      ON hvd.codigo_seccion = sc.codigo
    LEFT JOIN items_checklist ic
      ON hvd.codigo_item = ic.codigo
    WHERE hvd.codigo_historial = ?
  `;
  const [rows] = await db.query(query, [codigoHistorial]);
  return rows;
};

const getTrabajosByCodigo = async (codigoHistorial) => {
  const query = `
    SELECT *
    FROM historial_vehicular_trabajos
    WHERE codigo_historial = ?
  `;
  const [rows] = await db.query(query, [codigoHistorial]);
  return rows;
};

const getInsumosByCodigo = async (codigoHistorial) => {
  const query = `
    SELECT *
    FROM historial_vehicular_insumos
    WHERE codigo_historial = ?
  `;
  const [rows] = await db.query(query, [codigoHistorial]);
  return rows;
};

module.exports = {
  getLastCodigo,
  insertHistorial,
  insertRepuestos,
  insertTrabajos,
  insertInsumos,
  getAll,
  getRepuestosByCodigo,
  getTrabajosByCodigo,
  getInsumosByCodigo,
};
