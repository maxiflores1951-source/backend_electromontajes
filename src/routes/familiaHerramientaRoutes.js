const express = require('express');
const router = express.Router();
const familiaHerramientaController = require('../controllers/familiaHerramientaController');

router.get('/', familiaHerramientaController.getAll);

module.exports = router;
