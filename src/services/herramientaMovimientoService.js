const db = require('../../db');
const herramientaMovimientoModel = require('../models/herramientaMovimientoModel');

const generarCodigo = async () => {
  const ultimoCodigo = await herramientaMovimientoModel.getLastId();
  const parte1 = 'MH00001';

  if (!ultimoCodigo) {
    return `${parte1}-00000001`;
  }

  const partes = ultimoCodigo.split('-');
  const parte2 = partes.length > 1 ? partes[1] : '00000000';
  const numero = parseInt(parte2, 10);
  const nuevoNumero = isNaN(numero) ? 1 : numero + 1;
  return `${parte1}-${nuevoNumero.toString().padStart(8, '0')}`;
};

const create = async (data) => {
  const { fecha_registro, responsable, tipo_operacion, observacion, herramientas } = data;

  if (!fecha_registro || !responsable || !tipo_operacion || !herramientas || herramientas.length === 0) {
    throw new Error('Faltan datos requeridos');
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const codigoMovimiento = await generarCodigo();

    await herramientaMovimientoModel.insertMovimiento(connection, {
      id: codigoMovimiento,
      fecha_registro,
      responsable,
      tipo_operacion,
      observacion,
    });

    for (const { codigoHerramienta } of herramientas) {
      let codigoRelacion = null;
      if (tipo_operacion === 'Devolucion') {
        const movimientoEntrega = await herramientaMovimientoModel.getUltimoEntrega(connection, codigoHerramienta);
        if (movimientoEntrega.length > 0) {
          codigoRelacion = movimientoEntrega[0].movimiento_id;
          await herramientaMovimientoModel.actualizarEntregaAnterior(
            connection,
            codigoMovimiento,
            codigoRelacion,
            codigoHerramienta
          );
        }
      }
      await herramientaMovimientoModel.insertMovimientoHerramienta(connection, {
        movimiento_id: codigoMovimiento,
        codigoHerramienta,
        actual: tipo_operacion === 'Entrega' ? 1 : 0,
        relacion: codigoRelacion,
      });
    }

    await connection.commit();
    return codigoMovimiento;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getAll = async () => {
  return await herramientaMovimientoModel.getAll();
};

module.exports = { create, getAll };
