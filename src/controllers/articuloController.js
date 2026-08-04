const articuloService = require('../services/articuloService');

const getAll = async (req, res) => {
  try {
    const articulos = await articuloService.getAll();
    res.json(articulos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getByProveedor = async (req, res) => {
  try {
    const articulos = await articuloService.getByProveedor(req.params.codProveedor);
    res.json(articulos);
  } catch (err) {
    if (err.message.includes('No se encontraron')) {
      res.status(404).json({ message: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

const getByCodigo = async (req, res) => {
  try {
    const articulo = await articuloService.getByCodigo(req.params.codArticulo);
    res.json(articulo);
  } catch (err) {
    if (err.message.includes('No se encontró')) {
      res.status(404).json({ message: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

const create = async (req, res) => {
  try {
    const affected = await articuloService.create(req.body, req.idPersonal);
    res.status(201).json({ message: 'Artículo agregado exitosamente', affected });
  } catch (err) {
    const status = err.message.includes('requeridos') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const affected = await articuloService.update(req.params.codArticulo, req.body, req.idPersonal);
    res.status(200).json({ message: 'Artículo actualizado correctamente', updated: affected });
  } catch (err) {
    if (err.message.includes('No se encontró')) {
      res.status(404).json({ message: err.message });
    } else if (err.message.includes('Falta el código')) {
      res.status(400).json({ message: err.message });
    } else {
      console.error('Error al actualizar artículo:', err.message);
      res.status(500).json({ error: 'Error al actualizar artículo', detail: err.message });
    }
  }
};

const ajustarStock = async (req, res) => {
  const { codArticulo } = req.params;
  const { cantidad, tipo_operacion, id_lugar } = req.body;
  try {
    const result = await articuloService.ajustarStock(codArticulo, cantidad, tipo_operacion, id_lugar);
    res.status(200).json({
      message: `Stock actualizado correctamente en ${result.nombreLugar} (${tipo_operacion}).`,
      lugar: result.lugar,
      nombre_lugar: result.nombreLugar,
      nuevo_stock: result.nuevaCantidad
    });
  } catch (err) {
    if (err.message.includes('No se encontró')) {
      res.status(404).json({ error: err.message });
    } else if (err.message.includes('suficiente') || err.message.includes('inválido') || err.message.includes('debe ser')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = { getAll, getByProveedor, getByCodigo, create, update, ajustarStock };
