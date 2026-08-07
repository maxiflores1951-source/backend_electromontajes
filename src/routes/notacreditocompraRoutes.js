const express = require('express');
const router = express.Router();
const notacreditocompraController = require('../controllers/notacreditocompraController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.post('/', authMiddleware, resolvePersonal, notacreditocompraController.create);
router.get('/', notacreditocompraController.getAll);

module.exports = router;
