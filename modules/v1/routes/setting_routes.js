const express = require('express')
const router = express.Router()
const settingController = require('../controller/setting_controllers');

router.get('/faqs_list', settingController.faqs_list);

router.get('/terms_and_about_us_list', settingController.terms_and_about_us_list);

router.post('/contact_us', settingController.contact_us);

router.post('/delete_account', settingController.delete_account);


module.exports = router;
