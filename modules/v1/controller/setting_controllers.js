const common = require("../../../config/common");
const setting_model = require("../models/setting_model");
const logger = require("../../../logger");
const Codes = require("../../../config/status_codes");
const { log } = require("winston");

exports.faqs_list = async (req, res) => {
    return setting_model.faqs_list(req, res)
};

exports.terms_and_about_us_list = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        content_type: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return setting_model.terms_and_about_us_list(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.contact_us = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        first_name: "required",
        last_name: "required",
        email: "required|email"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return setting_model.contact_us(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.delete_account = async (req, res) => {
    return setting_model.delete_account(req, res)
};
