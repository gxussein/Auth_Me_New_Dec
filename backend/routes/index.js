// backend/routes/index.js
const express = require('express');
const router = express.Router();
const apiRouter = require('./api');

// router.get('/hello/world', function(req, res) {
//   res.cookie('XSRF-TOKEN', req.csrfToken());
//   res.send('Hello World!');
// });

// GET /api/restore-user
const { restoreUser } = require('../utils/auth.js');

router.use(restoreUser);






module.exports = router;