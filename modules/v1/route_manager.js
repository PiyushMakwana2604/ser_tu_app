const express = require('express');
const router = express.Router();
const middleware = require('../../middleware/headerValidator');

const user_routes = require('./routes/user_routes')

const home_routes = require('./routes/home_routes')

const setting_routes = require('./routes/setting_routes')

router.use('/', middleware.extractHeaderLanguage);

router.use('/', middleware.validateHeaderApiKey);

router.use('/', middleware.validateHeaderToken);

router.use('/auth/', user_routes);

router.use('/home/', home_routes);

router.use('/setting/', setting_routes);

module.exports = router;