const movimientostockeModel = require('../models/movimientostockeModel');

const generarCodigo = async () => {
  const ultimoCodigo = await movimientostockeModel.getLastCodigo();
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

  const codigo = await generarCodigo();

  const existe = await movimientostockeModel.codigoExists(codigo);
  if (existe) {
    throw new Error('El código generado ya existe');
  }

  const movimiento_id = await movimientostockeModel.insert({
    codigo,
    fecha_registro,
    tipo_operacion,
    responsable_id: idPersonal || responsable_id,
    observacion,
  });

  for (const detalle of epp) {
    try {
      await movimientostockeModel.insertDetalle({
        codigo,
        codigoepp: detalle.codigo,
        stock: detalle.stock,
      });
    } catch (detalleError) {
      console.error('Error al insertar detalle EPP:', detalleError);
      throw new Error(`Error al insertar el detalle EPP con código ${detalle.codigo}`);
    }
  }

  return { codigo, movimiento_id };
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
