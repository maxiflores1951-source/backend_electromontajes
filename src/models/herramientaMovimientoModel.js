const db = require('../../db');

const getLastId = async () => {
  const [result] = await db.query('SELECT MAX(id) AS ultimo FROM movimientosstockherramientas');
  return result[0].ultimo;
};

const insertMovimiento = async (conn, data) => {
  const { id, fecha_registro, responsable, tipo_operacion, observacion, id_creado } = data;
  const query = `
    INSERT INTO movimientosstockherramientas
    (id, fecha_registro, responsable, tipo_operacion, observacion, id_creado)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await conn.execute(query, [
    id, fecha_registro, responsable, tipo_operacion, observacion, id_creado ?? null
  ]);
  return result.affectedRows;
};

const getUltimoEntrega = async (conn, codigoHerramienta) => {
  const query = `
    SELECT movimiento_id FROM movimiento_herramientas
    WHERE codigoHerramienta = ? AND actual = 1
    ORDER BY id DESC LIMIT 1
  `;
  const [rows] = await conn.execute(query, [codigoHerramienta]);
  return rows;
};

const actualizarEntregaAnterior = async (conn, codigoMovimiento, movimientoId, codigoHerramienta) => {
  const query = `
    UPDATE movimiento_herramientas
    SET actual = 0, relacion = ?
    WHERE movimiento_id = ? AND codigoHerramienta = ?
  `;
  const [result] = await conn.execute(query, [
    codigoMovimiento, movimientoId, codigoHerramienta
  ]);
  return result.affectedRows;
};

const insertMovimientoHerramienta = async (conn, data) => {
  const { movimiento_id, codigoHerramienta, actual, relacion } = data;
  const query = `
    INSERT INTO movimiento_herramientas
    (movimiento_id, codigoHerramienta, actual, relacion)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await conn.execute(query, [
    movimiento_id ?? null, codigoHerramienta ?? null, actual ?? null, relacion ?? null
  ]);
  return result.affectedRows;
};

const getMovimiento = async (conn, movimientoId) => {
  const [rows] = await conn.execute(
    'SELECT id, fecha_registro, responsable, tipo_operacion, observacion FROM movimientosstockherramientas WHERE id = ?',
    [movimientoId]
  );
  return rows[0];
};

const getHerramientasMovimiento = async (conn, movimientoId) => {
  const [rows] = await conn.execute(
    'SELECT id, codigoHerramienta FROM movimiento_herramientas WHERE movimiento_id = ?',
    [movimientoId]
  );
  return rows;
};

const deleteHerramientaMovimiento = async (conn, movimientoId, codigoHerramienta) => {
  const [result] = await conn.execute(
    'DELETE FROM movimiento_herramientas WHERE movimiento_id = ? AND codigoHerramienta = ?',
    [movimientoId, codigoHerramienta]
  );
  return result.affectedRows;
};

const updateCondicionHerramienta = async (conn, codigoHerramienta, condicion) => {
  const [result] = await conn.execute(
    'UPDATE herramienta SET Condicion = ?, FechaModificacion = NOW() WHERE CodigoHerramienta = ?',
    [condicion, codigoHerramienta]
  );
  return result.affectedRows;
};

const updateMovimiento = async (conn, movimientoId, data) => {
  const { fecha_registro, responsable, tipo_operacion, observacion, id_modificado } = data;
  const [result] = await conn.execute(
    `UPDATE movimientosstockherramientas
     SET fecha_registro = ?, responsable = ?, tipo_operacion = ?, observacion = ?, id_modificado = ?
     WHERE id = ?`,
    [fecha_registro, responsable, tipo_operacion, observacion, id_modificado ?? null, movimientoId]
  );
  return result.affectedRows;
};

const getAll = async () => {
  const query = `
    SELECT
      msh.id AS movimiento_id,
      msh.fecha_registro,
      p.NOMBRE AS responsable,
      msh.tipo_operacion,
      msh.observacion,
      msh.created_at,
      msh.updated_at,
      msh.id_creado,
      pc.NOMBRE AS creado_por,
      msh.id_modificado,
      pm.NOMBRE AS modificado_por,
      mh.id AS id_movimiento_herramienta,
      mh.movimiento_id AS id_movimiento,
      mh.codigoHerramienta,
      h.nombre AS nombreHerramienta,
      mh.actual,
      mh.relacion,
      fh.Nom_Familia AS familiaHerramienta
    FROM movimientosstockherramientas msh
    JOIN movimiento_herramientas mh ON msh.id = mh.movimiento_id
    JOIN herramienta h ON mh.codigoHerramienta = h.codigoHerramienta
    JOIN personal p ON msh.responsable = p.ID
    LEFT JOIN familiaherramienta fh ON h.CodigoFamilia = fh.Cod_Familia
    LEFT JOIN personal pc ON msh.id_creado = pc.ID
    LEFT JOIN personal pm ON msh.id_modificado = pm.ID
    ORDER BY msh.fecha_registro DESC, msh.id DESC
  `;
  const [rows] = await db.query(query);

  const movimientos = new Map();
  for (const r of rows) {
    if (!movimientos.has(r.movimiento_id)) {
      movimientos.set(r.movimiento_id, {
        movimiento_id: r.movimiento_id,
        fecha_registro: r.fecha_registro,
        responsable: r.responsable,
        tipo_operacion: r.tipo_operacion,
        observacion: r.observacion,
        created_at: r.created_at,
        updated_at: r.updated_at,
        id_creado: r.id_creado,
        creado_por: r.creado_por,
        id_modificado: r.id_modificado,
        modificado_por: r.modificado_por,
        herramientas: [],
      });
    }
    movimientos.get(r.movimiento_id).herramientas.push({
      id_movimiento_herramienta: r.id_movimiento_herramienta,
      id_movimiento: r.id_movimiento,
      codigoHerramienta: r.codigoHerramienta,
      nombreHerramienta: r.nombreHerramienta,
      familiaHerramienta: r.familiaHerramienta,
      actual: r.actual,
      relacion: r.relacion,
      estado: r.actual === 1 ? 'Sin devolucion' : 'Devuelto',
    });
  }
  return Array.from(movimientos.values());
};

module.exports = {
  getLastId,
  insertMovimiento,
  getUltimoEntrega,
  actualizarEntregaAnterior,
  insertMovimientoHerramienta,
  getMovimiento,
  getHerramientasMovimiento,
  deleteHerramientaMovimiento,
  updateCondicionHerramienta,
  updateMovimiento,
  getAll,
};
