const express = require('express');
const router = express.Router();
const familiaconceptoController = require('../controllers/familiaconceptoController');

router.get('/', familiaconceptoController.getAll);

module.exports = router;
