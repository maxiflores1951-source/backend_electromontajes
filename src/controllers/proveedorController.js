const proveedorService = require('../services/proveedorService');

const getProveedores = async (req, res) => {
  try {
    const proveedores = await proveedorService.getAllProveedores();
    res.json(proveedores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const insertProveedor = async (req, res) => {
  try {
    const newId = await proveedorService.createProveedor(req.body, req.idPersonal);
    res.status(201).json({
      message: 'Proveedor insertado exitosamente',
      id: newId
    });
  } catch (err) {
    const status = err.message.includes('requeridos') || err.message.includes('ya existe') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

const updateProveedor = async (req, res) => {
  const { id } = req.params;
  try {
    const affected = await proveedorService.updateProveedor(id, req.body, req.idPersonal);
    res.status(200).json({
      message: 'Proveedor actualizado correctamente',
      updated: affected
    });
  } catch (err) {
    if (err.message.includes('No se encontró')) {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Falta el ID')) {
      res.status(400).json({ message: err.message });
    } else {
      console.error('Error al actualizar proveedor:', err.message);
      res.status(500).json({ error: 'Error al actualizar proveedor', detail: err.message });
    }
  }
};

module.exports = { getProveedores, insertProveedor, updateProveedor };
