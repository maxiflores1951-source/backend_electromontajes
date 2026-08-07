const db = require('../../db');
const checklistModel = require('../models/checklistModel');

const generarCodigo = async (connection) => {
  const ultimoCodigo = await checklistModel.getLastCodigo(connection);
  const parte1 = 'CHK00001';

  if (!ultimoCodigo) {
    return `${parte1}-00000001`;
  }

  const partes = ultimoCodigo.split('-');
  const parte2 = partes.length > 1 ? partes[1] : '00000000';
  const numero = parseInt(parte2, 10);
  const nuevoNumero = isNaN(numero) ? 1 : numero + 1;
  return `${parte1}-${nuevoNumero.toString().padStart(8, '0')}`;
};

const getItemsConSecciones = async () => {
  return await checklistModel.getItemsConSecciones();
};

const create = async (data, idPersonal) => {
  const {
    id_movil,
    fecha,
    kilometraje_actual,
    respuestas,
    observaciones_por_seccion,
    observacion,
  } = data;

  if (!id_movil || !fecha || !kilometraje_actual || !respuestas || respuestas.length === 0) {
    throw new Error('Faltan datos obligatorios del checklist');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const nuevoCodigo = await generarCodigo(connection);

    await checklistModel.insertCabecera(connection, {
      codigo: nuevoCodigo,
      id_movil,
      fecha,
      id_responsable: idPersonal || data.id_responsable,
      kilometraje_actual,
      observaciones_mecanicas: observacion || '',
    });

    if (Array.isArray(respuestas) && respuestas.length > 0) {
      const respuestasData = respuestas.map(({ codigo_item, valor }) => [
        nuevoCodigo,
        codigo_item,
        valor,
      ]);

      await checklistModel.insertRespuestas(connection, respuestasData);
    }

    if (Array.isArray(observaciones_por_seccion) && observaciones_por_seccion.length > 0) {
      const obsData = observaciones_por_seccion.map(({ codigo_seccion, observacion }) => [
        nuevoCodigo,
        codigo_seccion,
        observacion,
      ]);

      await checklistModel.insertObservacionesSeccion(connection, obsData);
    }

    await connection.commit();

    return nuevoCodigo;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAll = async () => {
  const connection = await db.getConnection();

  try {
    const checklists = await checklistModel.getChecklists(connection);

    const codigos = checklists.map(c => c.codigo);
    if (codigos.length === 0) return [];

    const respuestas = await checklistModel.getRespuestas(connection, codigos);
    const observaciones = await checklistModel.getObservaciones(connection, codigos);

    return checklists.map(chk => ({
      ...chk,
      respuestas: respuestas
        .filter(r => r.codigo_checklist === chk.codigo)
        .map(r => ({
          codigo_item: r.codigo_item,
          nombre_item: r.nombre_item,
          codigo_seccion: r.codigo_seccion,
          nombre_seccion: r.nombre_seccion,
          valor: r.valor,
        })),
      observaciones_por_seccion: observaciones
        .filter(o => o.codigo_checklist === chk.codigo)
        .map(o => ({
          codigo_seccion: o.codigo_seccion,
          nombre_seccion: o.nombre_seccion,
          observacion: o.observacion,
        })),
    }));
  } finally {
    connection.release();
  }
};

module.exports = {
  getItemsConSecciones,
  create,
  getAll,
};
