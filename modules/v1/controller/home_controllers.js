const common = require("../../../config/common");
const home_model = require("../models/home_model");
const logger = require("../../../logger");
const Codes = require("../../../config/status_codes");
const { log } = require("winston");

exports.add_comment = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        post_id: "required",
        comment: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.add_comment(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.delete_comment = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        comment_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.delete_comment(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.like_dislike = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        post_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.like_dislike(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.save_unsave = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        post_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.save_unsave(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.add_share = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        post_id: "required",
        receiver_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.add_share(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.add_tag = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        post_id: "required",
        tag_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.add_tag(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.comment_like_dislike = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        comment_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.comment_like_dislike(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.follow_following = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        follow_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.follow_following(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.remove_following_follower = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        remove_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.remove_following_follower(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.following_list = async (req, res) => {
    let request = await common.decryption(req);
    return home_model.following_list(req, request, res)
};

exports.follower_list = async (req, res) => {
    let request = await common.decryption(req);
    return home_model.follower_list(req, request, res)
};

exports.post_like_list = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        post_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.post_like_list(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.post_comment_list = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        post_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.post_comment_list(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};


exports.post_reply_comment_list = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        post_id: "required",
        parent_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.post_reply_comment_list(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.post_report = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        post_id: "required",
        report_type: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.post_report(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};


exports.user_report = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        report_id: "required",
        report_type: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.user_report(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.block_user = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        block_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.block_user(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.block_user_list = async (req, res) => {
    let request = await common.decryption(req);
    return home_model.block_user_list(req, request, res)
};

exports.homescreen_feed = async (req, res) => {
    return home_model.homescreen_feed(req, res)
};

exports.post_details = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        post_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.post_details(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.my_profile = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        userid: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.my_profile(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.create_savepost_folder = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        name: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.create_savepost_folder(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.edit_savepost_folder = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        folder_id: "required",
        name: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.edit_savepost_folder(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.delete_savepost_folder = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        folder_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.delete_savepost_folder(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.service_category_list = async (req, res) => {
    return home_model.service_category_list(req, res)
};

exports.service_list = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        category_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.service_list(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.service_details = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        service_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.service_details(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.create_poll = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        question: "required|Without:email",
        option_1: "required",
        option_2: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.create_poll(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.add_poll_vote = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        poll_id: "required",
        vote: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.add_poll_vote(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};

exports.poll_listing = async (req, res) => {
    return home_model.poll_listing(req, res)
};

exports.people_poll_listing = async (req, res) => {
    let request = await common.decryption(req);
    let rules = {
        poll_id: "required"
    }
    let valid = await common.checkValidationRules(request, rules)
    if (valid.status) {
        return home_model.people_poll_listing(request, res)
    }
    else {
        logger.error(valid.error)
        return common.sendResponse(res, Codes.VALIDATION_ERROR, valid.error, null);
    }
};