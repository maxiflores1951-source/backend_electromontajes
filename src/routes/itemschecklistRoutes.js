const express = require('express');
const router = express.Router();
const itemschecklistController = require('../controllers/itemschecklistController');

router.get('/', itemschecklistController.getAll);
router.get('/:codigo_seccion', itemschecklistController.getByCodigoSeccion);

module.exports = router;
