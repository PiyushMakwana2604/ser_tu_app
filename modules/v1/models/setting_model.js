const dbConn = require("../../../config/database");
const common = require("../../../config/common");
const lang = require("../../../config/language");
const emailTemplate = require("../../../config/template")
const logger = require("../../../logger");
const Codes = require("../../../config/status_codes");
const moment = require("moment");
var asyncLoop = require('node-async-loop');
const { log } = require("winston");

let setting_model = {

    //function for faqs List
    async faqs_list(req, res) {
        try {
            const [result, fields] = await dbConn.query(`SELECT * FROM tbl_faqs Where is_active = 1;`, req.user_id);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_get_faq_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for terms and about us List
    async terms_and_about_us_list(req, res) {
        try {
            const [result, fields] = await dbConn.query(`SELECT * FROM tbl_terms_and_about_us Where content_type="${req.content_type}" AND  is_active = 1;`, req.user_id);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_get_succ_list'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for terms and about us List
    async contact_us(req, res) {
        try {
            let params = {
                first_name: req.first_name,
                last_name: req.last_name,
                email: req.email,
                subject: (req.subject != undefined) ? req.subject : "",
                description: (req.description != undefined) ? req.description : ""
            };
            const [rows, fields] = await dbConn.query(`INSERT INTO tbl_contact_us SET ?`, params);
            if (rows.affectedRows == 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_contact_list'], null)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for delete account
    async delete_account(req, res) {
        try {
            const [update, field] = await dbConn.query(`UPDATE tbl_user SET is_deleted = 1 WHERE id = ${req.user_id} `);
            if (update.affectedRows == 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_delete_acc_succ'], null)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

}

module.exports = setting_model;
