const express = require('express')
const router = express.Router()
const userController = require('../controller/user_controllers');

router.post('/register', userController.register);

router.post('/login', userController.login);

router.post('/verify_user_otp', userController.verify_user_otp);

router.post('/resend_user_otp', userController.resend_user_otp);

router.get('/getUserProfile', userController.getuserProfile);

router.post('/forgotPassword', userController.forgotPassword);

router.post('/editProfile', userController.editProfile);

router.post('/updatePassword', userController.updatePassword);

router.post('/changePassword', userController.changePassword);

router.post('/logout', userController.logout);


module.exports = router;