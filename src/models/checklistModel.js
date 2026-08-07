const db = require('../../db');

const getItemsConSecciones = async () => {
  const [rows] = await db.execute(`
    SELECT 
        i.codigo AS codigo_item,
        i.nombre AS nombre_item,
        s.codigo AS codigo_seccion,
        s.nombre AS nombre_seccion
    FROM 
        items_checklist i
    JOIN 
        secciones_checklist s ON i.codigo_seccion = s.codigo
    ORDER BY 
        s.codigo, i.codigo
  `);
  return rows;
};

const getLastCodigo = async (connection) => {
  const [rows] = await connection.query('SELECT MAX(codigo) AS ultimo FROM checklist_unidad_movil');
  return rows[0].ultimo;
};

const insertCabecera = async (connection, data) => {
  const { codigo, id_movil, fecha, id_responsable, kilometraje_actual, observaciones_mecanicas } = data;
  await connection.query(
    `INSERT INTO checklist_unidad_movil (
       codigo, id_movil, fecha, id_responsable, kilometraje_actual, observaciones_mecanicas
     ) VALUES (?, ?, ?, ?, ?, ?)`,
    [codigo, id_movil, fecha, id_responsable, kilometraje_actual, observaciones_mecanicas]
  );
};

const insertRespuestas = async (connection, respuestasData) => {
  await connection.query(
    `INSERT INTO respuestas_checklist (codigo_checklist, codigo_item, valor) VALUES ?`,
    [respuestasData]
  );
};

const insertObservacionesSeccion = async (connection, obsData) => {
  await connection.query(
    `INSERT INTO observaciones_por_seccion (codigo_checklist, codigo_seccion, observacion) VALUES ?`,
    [obsData]
  );
};

const getChecklists = async (connection) => {
  const [rows] = await connection.query(`
    SELECT 
      c.codigo,
      c.id_movil,
      c.fecha,
      c.kilometraje_actual,
      c.id_responsable,
      p.NOMBRE AS nombre_responsable,
      c.fecha_creacion
    FROM 
      checklist_unidad_movil c
    LEFT JOIN 
      personal p ON c.id_responsable = p.ID
    ORDER BY c.fecha DESC
  `);
  return rows;
};

const getRespuestas = async (connection, codigos) => {
  const [rows] = await connection.query(`
    SELECT 
      r.codigo_checklist,
      r.codigo_item,
      r.valor,
      i.nombre AS nombre_item,
      s.codigo AS codigo_seccion,
      s.nombre AS nombre_seccion
    FROM 
      respuestas_checklist r
    JOIN 
      items_checklist i ON r.codigo_item = i.codigo
    JOIN 
      secciones_checklist s ON i.codigo_seccion = s.codigo
    WHERE 
      r.codigo_checklist IN (?)
  `, [codigos]);
  return rows;
};

const getObservaciones = async (connection, codigos) => {
  const [rows] = await connection.query(`
    SELECT 
      o.codigo_checklist,
      o.codigo_seccion,
      o.observacion,
      s.nombre AS nombre_seccion
    FROM 
      observaciones_por_seccion o
    JOIN 
      secciones_checklist s ON o.codigo_seccion = s.codigo
    WHERE 
      o.codigo_checklist IN (?)
  `, [codigos]);
  return rows;
};

module.exports = {
  getItemsConSecciones,
  getLastCodigo,
  insertCabecera,
  insertRespuestas,
  insertObservacionesSeccion,
  getChecklists,
  getRespuestas,
  getObservaciones,
};
