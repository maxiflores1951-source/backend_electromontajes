const ordencompraService = require('../services/ordencompraService');

const create = async (req, res) => {
  try {
    const codigoOrden = await ordencompraService.create(req.body);
    res.status(201).json({ message: 'Orden de compra y movimientos registrados con éxito', codigoOrden });
  } catch (error) {
    console.error('Error al procesar la orden de compra:', error);
    if (error.message.includes('códigos de concepto no existen')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al registrar la orden de compra y los movimientos' });
  }
};

const getAll = async (req, res) => {
  try {
    const ordenesConMovimientosYRemitos = await ordencompraService.getAll();
    res.json(ordenesConMovimientosYRemitos);
  } catch (error) {
    console.error('Error al obtener las órdenes de compra, movimientos y remitos/facturas:', error);
    res.status(500).json({ error: 'Error al obtener las órdenes de compra, movimientos y remitos/facturas' });
  }
};

const getNoAfectadas = async (req, res) => {
  try {
    const ordenesConMovimientosYRemitos = await ordencompraService.getNoAfectadas();
    res.json(ordenesConMovimientosYRemitos);
  } catch (error) {
    console.error('Error al obtener las órdenes de compra no afectadas:', error);
    res.status(500).json({ error: 'Error al obtener las órdenes de compra no afectadas' });
  }
};

const update = async (req, res) => {
  const codigoOrden = req.params.codigo;
  try {
    await ordencompraService.update(codigoOrden, req.body);
    res.status(200).json({
      message: 'Orden de compra y movimientos actualizados con éxito',
      codigoOrden
    });
  } catch (error) {
    console.error('Error al actualizar la orden de compra:', error);
    if (error.message.includes('códigos de concepto no existen')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'No se pudo actualizar la orden de compra' });
  }
};

const getOrdenRelaciones = async (req, res) => {
  const codigoOrden = req.params.codigo;
  try {
    const rows = await ordencompraService.getOrdenRelaciones(codigoOrden);
    res.json(rows);
  } catch (error) {
    console.error('Error en la consulta', error);
    res.status(500).json({ error: 'Error al obtener la orden' });
  }
};

const getResumen = async (req, res) => {
  try {
    const resultado = await ordencompraService.getResumen();
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ error: 'Error al obtener el resumen de órdenes de compra' });
  }
};

const eliminarRelacion = async (req, res) => {
  const { tipo, codigo } = req.params;
  try {
    const tipoEliminado = await ordencompraService.eliminarRelacion(tipo, codigo);
    res.json({ message: `Relación de ${tipoEliminado} eliminada correctamente.` });
  } catch (error) {
    if (error.message.includes('Tipo inválido')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('No se encontró')) {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error eliminando relación:', error);
    res.status(500).json({ error: 'Error al eliminar la relación.' });
  }
};

const crearRelacion = async (req, res) => {
  try {
    const { tipo, insertId } = await ordencompraService.crearRelacion(req.body);
    res.json({ message: `Relación de ${tipo} creada correctamente.`, id: insertId });
  } catch (error) {
    if (error.message.includes('Faltan datos obligatorios') || error.message.includes('Tipo inválido')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creando relación:', error);
    res.status(500).json({ error: 'Error al crear la relación.' });
  }
};

module.exports = {
  create,
  getAll,
  getNoAfectadas,
  update,
  getOrdenRelaciones,
  getResumen,
  eliminarRelacion,
  crearRelacion,
};
