const express = require('express');
const roomController = require('../controllers/rooms');

const router = express.Router();

router.get('/', roomController.getIndex);

router.post('/room', roomController.postCreateRoom);

router.get('/:room', roomController.getRoom);

router.get('/userRoom/:username', roomController.getUserRoom);

module.exports = router;
