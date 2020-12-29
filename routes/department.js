const express = require('express');
const department = require('../controllers/department.js');
const router = express.Router();

router.post('/signup', department.signup);
router.post('/departlogin', department.departlogin);
router.post('/registerLand', department.registerLand);
router.post('/validateLand', department.validateLand);
router.post('/getallLandbyStatus', department.getallLandbyStatus);
router.post('/getIssuedLand', department.getIssuedLand);
module.exports = router
