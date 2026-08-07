const contactoclienteService = require('../services/contactoclienteService');

const getAll = async (req, res) => {
  try {
    const rows = await contactoclienteService.getAll();
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener contactos:', error);
    res.status(500).json({ error: 'Error al obtener contactos' });
  }
};

const getByCliente = async (req, res) => {
  try {
    const rows = await contactoclienteService.getByCliente(req.params.id_cliente);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener contactos por cliente:', error);
    res.status(500).json({ error: 'Error al obtener contactos del cliente' });
  }
};

const create = async (req, res) => {
  try {
    const contacto = await contactoclienteService.create(req.body);
    res.status(201).json({
      message: 'Contacto creado exitosamente',
      contacto,
    });
  } catch (error) {
    if (error.message.includes('obligatorios')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al crear contacto:', error);
    res.status(500).json({ error: 'Error al crear contacto' });
  }
};

const update = async (req, res) => {
  try {
    const contacto = await contactoclienteService.update(req.params.id_contacto, req.body);
    res.json({
      message: 'Contacto actualizado exitosamente',
      contacto,
    });
  } catch (error) {
    if (error.message.includes('obligatorio')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al actualizar contacto:', error);
    res.status(500).json({ error: 'Error al actualizar contacto' });
  }
};

const remove = async (req, res) => {
  try {
    const contacto = await contactoclienteService.remove(req.params.id_contacto);
    res.json({
      message: 'Contacto eliminado exitosamente',
      contacto_eliminado: contacto,
    });
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al eliminar contacto:', error);
    res.status(500).json({ error: 'Error al eliminar contacto' });
  }
};

const removeByCliente = async (req, res) => {
  try {
    const contactos = await contactoclienteService.removeByCliente(req.params.id_cliente);
    res.json({
      message: `Se eliminaron ${contactos.length} contactos del cliente`,
      contactos_eliminados: contactos,
    });
  } catch (error) {
    if (error.message.includes('No se encontraron contactos')) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al eliminar contactos del cliente:', error);
    res.status(500).json({ error: 'Error al eliminar contactos del cliente' });
  }
};

module.exports = {
  getAll,
  getByCliente,
  create,
  update,
  remove,
  removeByCliente,
};
