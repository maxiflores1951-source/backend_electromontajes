const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const { validateProveedor } = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.get('/', proveedorController.getProveedores);
router.post('/insert', authMiddleware, resolvePersonal, validateProveedor, proveedorController.insertProveedor);
router.put('/:id', authMiddleware, resolvePersonal, proveedorController.updateProveedor);

module.exports = router;
