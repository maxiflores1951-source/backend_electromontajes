const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.post('/', authMiddleware, resolvePersonal, pagosController.create);
router.get('/', pagosController.getAll);
router.get('/pagos/proveedor', pagosController.getByProveedor);

module.exports = router;
