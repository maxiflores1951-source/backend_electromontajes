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

const create = async (data, idUsuario) => {
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
      id_creado: idUsuario,
    });

    for (const item of herramientas) {
      const codigoHerramienta = item.codigoHerramienta ?? item.CodigoHerramienta;
      if (!codigoHerramienta) throw new Error('Faltan datos requeridos');
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

const update = async (movimientoId, data, idUsuario) => {
  if (!movimientoId) throw new Error('Movimiento requerido');
  const { fecha_registro, responsable, tipo_operacion, observacion, herramientas } = data;

  if (!fecha_registro || !responsable || !tipo_operacion || !herramientas || herramientas.length === 0) {
    throw new Error('Faltan datos requeridos');
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const existing = await herramientaMovimientoModel.getMovimiento(connection, movimientoId);
    if (!existing) throw new Error('Movimiento no encontrado');

    const tipo = existing.tipo_operacion;

    const actuales = await herramientaMovimientoModel.getHerramientasMovimiento(connection, movimientoId);
    const codigosActuales = actuales.map((a) => a.codigoHerramienta);
    const codigosNuevos = herramientas.map((h) => h.codigoHerramienta ?? h.CodigoHerramienta);
    if (codigosNuevos.some((c) => !c)) throw new Error('Faltan datos requeridos');

    const removidas = codigosActuales.filter((c) => !codigosNuevos.includes(c));
    for (const codigo of removidas) {
      await herramientaMovimientoModel.deleteHerramientaMovimiento(connection, movimientoId, codigo);
      await herramientaMovimientoModel.updateCondicionHerramienta(connection, codigo, 'Disponible');
    }

    const agregadas = codigosNuevos.filter((c) => !codigosActuales.includes(c));
    for (const codigo of agregadas) {
      let codigoRelacion = null;
      if (tipo === 'Devolucion') {
        const entrega = await herramientaMovimientoModel.getUltimoEntrega(connection, codigo);
        if (entrega.length > 0) {
          codigoRelacion = entrega[0].movimiento_id;
          await herramientaMovimientoModel.actualizarEntregaAnterior(connection, movimientoId, codigoRelacion, codigo);
        }
        await herramientaMovimientoModel.updateCondicionHerramienta(connection, codigo, 'Disponible');
      } else {
        await herramientaMovimientoModel.updateCondicionHerramienta(connection, codigo, 'En Uso');
      }
      await herramientaMovimientoModel.insertMovimientoHerramienta(connection, {
        movimiento_id: movimientoId,
        codigoHerramienta: codigo,
        actual: tipo === 'Entrega' ? 1 : 0,
        relacion: codigoRelacion,
      });
    }

    await herramientaMovimientoModel.updateMovimiento(connection, movimientoId, {
      fecha_registro,
      responsable,
      tipo_operacion,
      observacion,
      id_modificado: idUsuario,
    });

    await connection.commit();
    return movimientoId;
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

module.exports = { create, update, getAll };
