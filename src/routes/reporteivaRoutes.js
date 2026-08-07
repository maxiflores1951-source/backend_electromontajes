const express = require('express');
const router = express.Router();
const reporteivaController = require('../controllers/reporteivaController');

router.post('/reporteiva', reporteivaController.create);
router.get('/reporteiva', reporteivaController.getAll);

module.exports = router;
