const common = require("../../../config/common");
const user_model = require("../models/user_model");
const logger = require("../../../logger");
const Codes = require("../../../config/status_codes");
const { log } = require("winston");

exports.register = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        first_name: "required",
        last_name: "required",
        dob: "required",
        mobile: "required|digits_between:10,14",
        email: "required|email",
        password: "required",
        country_code: "required",
        front_id_proof: "required",
        back_id_proof: "required",
        id_prooof_type: "required|in:adhar card,passport,licence"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return user_model.register(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.login = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        mobile: "required",
        password: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return user_model.login(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.logout = async (req, res) => {
    return user_model.logout(req, res)
};

exports.editProfile = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        first_name: "required",
        last_name: "required",
        dob: "required",
        mobile: "required",
        front_id_proof: "required",
        back_id_proof: "required",
        email: "required|email",
        cover_image: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return user_model.editProfile(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.forgotPassword = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        mobile: "required",
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return user_model.forgotPassword(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.verify_user_otp = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        mobile: "required|digits_between:10,14",
        otp: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return user_model.verify_user_otp(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.resend_user_otp = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        mobile: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return user_model.resend_user_otp(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.changePassword = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        oldpassword: "required",
        newpassword: "required"

    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return user_model.changePassword(request, res)
    }
    else {
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.updatePassword = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        userid: "required",
        newpassword: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return user_model.updatePassword(request, res)
    }
    else {
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.getuserProfile = async (req, res) => {
    return user_model.getuserProfile(req, res)
};

