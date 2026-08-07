const express = require('express');
const router = express.Router();
const historialvehicularController = require('../controllers/historialvehicularController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.get('/', historialvehicularController.getAll);
router.post('/', authMiddleware, resolvePersonal, historialvehicularController.create);

module.exports = router;
