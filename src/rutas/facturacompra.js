const express = require('express');
const router = express.Router();
const db = require('../../db');
const { body, validationResult } = require('express-validator');

// Crear factura de compra
router.post('/facturacompra', [
  body('proveedor_id').isInt(),
  body('fecha').isDate(),
  body('total').isFloat()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { proveedor_id, fecha, total } = req.body;
  
  db.query(
    'INSERT INTO facturas_compra (proveedor_id, fecha, total) VALUES (?, ?, ?)',
    [proveedor_id, fecha, total],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Error al crear la factura' });
      }
      res.status(201).json({ id: results.insertId });
    }
  );
});

// Obtener todas las facturas
router.get('/facturacompra', (req, res) => {
  db.query('SELECT * FROM facturas_compra', (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error al obtener las facturas' });
    }
    res.json(results);
  });
});

module.exports = router;