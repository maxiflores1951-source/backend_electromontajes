const db = require('../../db');
const registrovehicularModel = require('../models/registrovehicularModel');

const generarCodigoRegistroVehicular = async (connection) => {
  const result = await registrovehicularModel.getLastCodigo(connection);
  const ultimoCodigo = result.length > 0 ? result[0].ultimo : null;

  const parteFija = 'RM00001';

  if (!ultimoCodigo) {
    return `${parteFija}-00000001`;
  } else {
    const partes = ultimoCodigo.split('-');
    const parte2 = partes.length > 1 ? partes[1] : '00000000';
    const numero = parseInt(parte2, 10);
    const nuevoNumero = isNaN(numero) ? 1 : numero + 1;
    return `${parteFija}-${nuevoNumero.toString().padStart(8, '0')}`;
  }
};

const create = async (data) => {
  const {
    fecha_entrega,
    id_motivo,
    id_servicio,
    observacion,
    moviles,
  } = data;

  if (!fecha_entrega || !id_motivo || !Array.isArray(moviles) || moviles.length === 0) {
    throw new Error('Faltan datos obligatorios');
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const codigo = await generarCodigoRegistroVehicular(connection);

    await registrovehicularModel.insertRegistro(connection, [
      codigo,
      fecha_entrega,
      id_motivo,
      id_servicio || null,
      observacion || null,
    ]);

    for (const movil of moviles) {
      try {
        await registrovehicularModel.insertMovimiento(connection, [
          codigo,
          movil.id_movil,
          movil.kilometraje_recorrido,
          movil.kilometraje_final || 0,
          movil.horas,
        ]);
      } catch (detalleError) {
        console.error('Error al insertar movimiento:', detalleError);
        throw new Error(`Error al insertar el movimiento para el móvil ${movil.id_movil}`);
      }
    }

    await connection.commit();

    return codigo;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getMovimientos = async () => {
  const registros = await registrovehicularModel.getRegistros();

  const registrosConMoviles = await Promise.all(
    registros.map(async (registro) => {
      const moviles = await registrovehicularModel.getMovilesByRegistro(registro.fecha_entrega, registro.codigo);

      return {
        ...registro,
        moviles,
      };
    })
  );

  return registrosConMoviles;
};

module.exports = {
  create,
  getMovimientos,
};
