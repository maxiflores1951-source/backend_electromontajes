const clientesService = require('../services/clientesService');

const getAll = async (req, res) => {
  try {
    const clientes = await clientesService.getAll();
    res.json(clientes);
  } catch (err) {
    console.error('Error al consultar datos:', err);
    res.status(500).send('Error en la consulta');
  }
};

const create = async (req, res) => {
  try {
    const clienteId = await clientesService.create(req.body);
    res.status(201).json({ message: 'Cliente agregado correctamente', clienteId });
  } catch (err) {
    if (err.message.includes('obligatorios')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error al insertar cliente:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  try {
    const affected = await clientesService.update(id, req.body);
    res.status(200).json({
      message: 'Cliente actualizado correctamente',
      updated: affected
    });
  } catch (err) {
    if (err.message.includes('Cliente no encontrado')) {
      return res.status(404).json({ message: err.message });
    }
    if (err.message.includes('Falta el ID') || err.message.includes('obligatorios')) {
      return res.status(400).json({ message: err.message });
    }
    console.error('Error al actualizar cliente:', err);
    res.status(500).json({ error: 'Error al actualizar cliente', detalle: err.message });
  }
};

const getVentas = async (req, res) => {
  try {
    const clienteCompleto = await clientesService.getVentasCliente(req.params.id);
    res.status(200).json(clienteCompleto);
  } catch (err) {
    if (err.message.includes('Cliente no encontrado')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error al obtener cliente con ventas:', err);
    res.status(500).json({
      error: 'Error al obtener cliente con ventas',
      detalles: err.message,
    });
  }
};

const getById = async (req, res) => {
  try {
    const cliente = await clientesService.getById(req.params.id);
    res.json(cliente);
  } catch (err) {
    if (err.message.includes('Cliente no encontrado')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('Error al obtener cliente:', err);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
};

const getEstadosObra = async (req, res) => {
  try {
    const results = await clientesService.getEstadosObra();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAll,
  create,
  update,
  getVentas,
  getById,
  getEstadosObra,
};
