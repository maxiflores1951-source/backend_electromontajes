const express = require('express');
const router = express.Router();
const familiaArticuloController = require('../controllers/familiaArticuloController');

router.get('/', familiaArticuloController.getAll);

module.exports = router;
