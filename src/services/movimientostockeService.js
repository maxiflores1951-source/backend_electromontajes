const movimientostockeModel = require('../models/movimientostockeModel');

const generarCodigo = async (connection) => {
  const [rows] = await connection.query(
    'SELECT MAX(codigo) AS ultimo FROM movimiento_stock_epp FOR UPDATE'
  );
  const ultimoCodigo = rows[0]?.ultimo;
  const parte1 = 'ME00001';

  if (!ultimoCodigo) {
    return `${parte1}-00000001`;
  }

  const partes = ultimoCodigo.split('-');
  const parte2 = partes.length > 1 ? partes[1] : '00000000';
  const numero = parseInt(parte2, 10);
  const nuevoNumero = isNaN(numero) ? 1 : numero + 1;
  return `${parte1}-${nuevoNumero.toString().padStart(8, '0')}`;
};

const create = async (data, idPersonal) => {
  const { fecha_registro, tipo_operacion, responsable_id, observacion, epp } = data;

  if (!fecha_registro || !tipo_operacion) {
    throw new Error('fecha_registro y tipo_operacion son requeridos');
  }

  if (!epp || epp.length === 0) {
    throw new Error('Debe incluir al menos un detalle de EPP');
  }

  const connection = await movimientostockeModel.getConnection();
  let codigo;
  let intentos = 0;
  const MAX_INTENTOS = 5;

  try {
    await movimientostockeModel.beginTransaction(connection);

    while (intentos < MAX_INTENTOS) {
      codigo = await generarCodigo(connection);
      const existe = await movimientostockeModel.codigoExists(connection, codigo);
      if (existe) {
        intentos++;
        continue;
      }
      try {
        const movimiento_id = await movimientostockeModel.insert(connection, {
          codigo,
          fecha_registro,
          tipo_operacion,
          responsable_id: idPersonal || responsable_id,
          observacion,
        });
        break;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          intentos++;
          continue;
        }
        throw err;
      }
    }

    if (intentos >= MAX_INTENTOS) {
      throw new Error('No se pudo generar un código único después de varios intentos');
    }

    for (const detalle of epp) {
      try {
        await movimientostockeModel.insertDetalle(connection, {
          codigo,
          codigoepp: detalle.codigo,
          stock: detalle.stock,
        });
      } catch (detalleError) {
        console.error('Error al insertar detalle EPP:', detalleError);
        throw new Error(`Error al insertar el detalle EPP con código ${detalle.codigo}`);
      }
    }

    await movimientostockeModel.commit(connection);
    return { codigo, movimiento_id };
  } catch (error) {
    await movimientostockeModel.rollback(connection);
    throw error;
  } finally {
    await movimientostockeModel.release(connection);
  }
};

const getAll = async () => {
  const movimientos = await movimientostockeModel.getMovimientos();

  const movimientosConDetalles = await Promise.all(
    movimientos.map(async (movimiento) => {
      const detalles = await movimientostockeModel.getDetallesMovimiento(movimiento.codigo);
      return { ...movimiento, detalles };
    })
  );

  return movimientosConDetalles;
};

module.exports = {
  create,
  getAll,
};
