const express = require('express');
const router = express.Router();
const lugarController = require('../controllers/lugarController');

router.get('/', lugarController.getAll);

module.exports = router;
