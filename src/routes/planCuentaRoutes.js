const express = require('express');
const router = express.Router();
const planCuentaController = require('../controllers/planCuentaController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.get('/', planCuentaController.getAll);
router.post('/insert', authMiddleware, resolvePersonal, planCuentaController.create);
router.put('/:id', authMiddleware, resolvePersonal, planCuentaController.update);
router.delete('/:id', authMiddleware, resolvePersonal, planCuentaController.remove);

module.exports = router;