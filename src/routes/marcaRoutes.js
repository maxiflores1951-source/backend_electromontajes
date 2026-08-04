const express = require('express');
const router = express.Router();
const marcaController = require('../controllers/marcaController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.get('/', marcaController.getAll);
router.post('/', authMiddleware, resolvePersonal, marcaController.create);

module.exports = router;
