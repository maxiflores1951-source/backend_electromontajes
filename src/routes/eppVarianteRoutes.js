const express = require('express');
const router = express.Router();
const eppVarianteController = require('../controllers/eppVarianteController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.get('/', eppVarianteController.getAll);
router.get('/:id', eppVarianteController.getById);
router.post('/', authMiddleware, resolvePersonal, eppVarianteController.create);
router.put('/:id', eppVarianteController.update);
router.delete('/:id', eppVarianteController.remove);

module.exports = router;