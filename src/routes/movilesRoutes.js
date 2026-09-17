const express = require('express');
const router = express.Router();
const movilesController = require('../controllers/movilesController');

router.get('/', movilesController.getAll);
router.get('/:nro_ident', movilesController.getByNroIdent);
router.post('/agregar', movilesController.create);
router.put('/:nro_ident', movilesController.update);
router.delete('/:nro_ident', movilesController.remove);

module.exports = router;
