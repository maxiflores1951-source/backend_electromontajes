const express = require('express');
const router = express.Router();
const notadebitocompraController = require('../controllers/notadebitocompraController');
const authMiddleware = require('../middlewares/authMiddleware');
const resolvePersonal = require('../middlewares/resolvePersonalMiddleware');

router.post('/', authMiddleware, resolvePersonal, notadebitocompraController.create);
router.get('/', notadebitocompraController.getAll);

module.exports = router;
