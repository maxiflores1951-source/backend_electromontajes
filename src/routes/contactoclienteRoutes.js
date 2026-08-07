const express = require('express');
const router = express.Router();
const contactoclienteController = require('../controllers/contactoclienteController');

router.get('/', contactoclienteController.getAll);
router.get('/:id_cliente', contactoclienteController.getByCliente);
router.post('/', contactoclienteController.create);
router.put('/:id_contacto', contactoclienteController.update);
router.delete('/:id_contacto', contactoclienteController.remove);
router.delete('/cliente/:id_cliente', contactoclienteController.removeByCliente);

module.exports = router;
