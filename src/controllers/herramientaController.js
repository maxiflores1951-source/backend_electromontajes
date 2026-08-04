const herramientaService = require('../services/herramientaService');

const getAll = async (req, res) => {
  try {
    const herramientas = await herramientaService.getAll(req.query.estado);
    res.status(200).json(herramientas);
  } catch (err) {
    console.error('Error al obtener las herramientas:', err.message);
    res.status(500).json({ message: 'Error al obtener las herramientas' });
  }
};

const getDisponibles = async (req, res) => {
  try {
    const herramientas = await herramientaService.getDisponibles();
    res.status(200).json(herramientas);
  } catch (err) {
    console.error('Error al obtener las herramientas disponibles:', err.message);
    res.status(500).json({ message: 'Error al obtener las herramientas disponibles' });
  }
};

const getNextCode = async (req, res) => {
  try {
    const nextCode = await herramientaService.getNextCode(req.params.familyCode);
    res.json({ nextCode });
  } catch (err) {
    if (err.message.includes('Formato de código no válido')) {
      return res.status(400).json({ message: 'Formato de código no válido' });
    }
    console.error('Error al consultar la base de datos:', err.message);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const create = async (req, res) => {
  try {
    const insertedId = await herramientaService.create(req.body);
    res.status(201).json({
      message: 'Herramienta insertada correctamente',
      insertedId,
    });
  } catch (err) {
    if (err.message.includes('Faltan campos obligatorios')) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    console.error('Error al insertar herramienta:', err.message);
    res.status(500).json({ message: 'Error al insertar herramienta' });
  }
};

const updateCondicion = async (req, res) => {
  try {
    const nuevaCondicion = await herramientaService.updateCondicion(
      req.params.codigoHerramienta,
      req.body.tipo_operacion
    );
    res.status(200).json({
      message: `Condición de herramienta actualizada a '${nuevaCondicion}' correctamente.`,
    });
  } catch (err) {
    if (err.message.includes('Operación inválida')) {
      return res.status(400).json({ error: err.message });
    }
    if (err.message.includes('Herramienta no encontrada')) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }
    res.status(500).json({ error: 'Error al actualizar la condición de la herramienta', details: err.message });
  }
};

const getByResponsable = async (req, res) => {
  try {
    const rows = await herramientaService.getByResponsable(req.params.idResponsable);
    res.status(200).json(rows);
  } catch (err) {
    if (err.message.includes('No se encontraron herramientas')) {
      return res.status(404).json({ message: 'No se encontraron herramientas para este responsable' });
    }
    console.error('Error al obtener herramientas por responsable:', err.message);
    res.status(500).json({ message: 'Error al obtener herramientas por responsable' });
  }
};

const updateNombreCondicion = async (req, res) => {
  try {
    await herramientaService.updateNombreCondicion(
      req.params.codigoHerramienta,
      req.body.Nombre,
      req.body.Condicion
    );
    res.status(200).json({ message: 'Nombre y condición de la herramienta actualizados correctamente.' });
  } catch (err) {
    if (err.message.includes('El nombre de la herramienta es obligatorio')) {
      return res.status(400).json({ error: 'El nombre de la herramienta es obligatorio.' });
    }
    if (err.message.includes('La condición de la herramienta es obligatoria')) {
      return res.status(400).json({ error: 'La condición de la herramienta es obligatoria.' });
    }
    if (err.message.includes('Herramienta no encontrada')) {
      return res.status(404).json({ error: 'Herramienta no encontrada' });
    }
    res.status(500).json({ error: 'Error al actualizar el nombre y la condición de la herramienta', details: err.message });
  }
};

module.exports = {
  getAll,
  getDisponibles,
  getNextCode,
  create,
  updateCondicion,
  getByResponsable,
  updateNombreCondicion,
};
