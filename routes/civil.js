var express = require('express');
var civil = require('../controllers/civil.js');
var router = express.Router();

router.post('/register', civil.register);
router.post('/validateCivil', civil.validateCivil);
router.post('/registerCivil', civil.registerCivil);
router.post('/getallCivilbyType', civil.getallCivilbyType);
router.post('/getIssuedCertificate', civil.getIssuedCertificate);

module.exports = router
