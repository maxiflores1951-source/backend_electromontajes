const movimientoModel = require('../models/movimientoModel');

const generarCodigo = async () => {
  const ultimoCodigo = await movimientoModel.getLastId();
  const parte1 = 'MA001';

  if (!ultimoCodigo) {
    return `${parte1}-00000001`;
  }

  const partes = ultimoCodigo.split('-');
  const parte2 = partes[1];
  const numero = parseInt(parte2, 10);
  const nuevoNumero = isNaN(numero) ? 1 : numero + 1;
  return `${parte1}-${nuevoNumero.toString().padStart(8, '0')}`;
};

const create = async (data) => {
  const { fecha_registro, tipo_operacion, responsable, id_lugar, observacion, articulos } = data;

  if (!fecha_registro || !tipo_operacion || !responsable) {
    throw new Error('fecha_registro, tipo_operacion y responsable son requeridos');
  }
  if (!articulos || articulos.length === 0) {
    throw new Error('Debe incluir al menos un artículo');
  }

  const codigo = await generarCodigo();

  await movimientoModel.insert({
    id: codigo,
    fecha_registro,
    tipo_operacion,
    responsable,
    id_lugar,
    observacion
  });

  for (const articulo of articulos) {
    await movimientoModel.insertArticulo({
      movimiento_id: codigo,
      articulo_id: articulo.articulo_id,
      stock: articulo.stock
    });
  }

  return codigo;
};

const getAll = async () => {
  return await movimientoModel.getAll();
};

module.exports = { create, getAll };
