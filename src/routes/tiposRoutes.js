const express = require('express');
const router = express.Router();
const tiposController = require('../controllers/tiposController');

router.get('/', tiposController.getAll);

module.exports = router;
