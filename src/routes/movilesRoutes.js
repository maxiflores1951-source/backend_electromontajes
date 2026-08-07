const express = require('express');
const router = express.Router();
const movilesController = require('../controllers/movilesController');

router.get('/', movilesController.getAll);

module.exports = router;
