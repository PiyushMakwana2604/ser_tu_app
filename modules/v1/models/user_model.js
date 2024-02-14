const dbConn = require("../../../config/database");
const common = require("../../../config/common");
const lang = require("../../../config/language");
const emailTemplate = require("../../../config/template")
const logger = require("../../../logger");
const Codes = require("../../../config/status_codes");
const moment = require("moment");

let user_model = {

    //function for Register user
    async register(req, res) {
        try {
            const checkUniqueEmail = await common.checkUniqueEmail(req)
            const checkUniqueMobile = await common.checkUniqueMobile(req)
            if (!checkUniqueEmail) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_user_duplicate_email'], null)
            }
            if (!checkUniqueMobile) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_user_duplicate_mobile'], null)
            }
            let user = {
                first_name: req.first_name,
                last_name: req.last_name,
                dob: req.dob,
                mobile: req.mobile,
                email: req.email,
                password: common.encryptPlain(parseInt(req.password)),
                front_id_proof: req.front_id_proof,
                back_id_proof: req.back_id_proof,
                country_code: req.country_code,
                id_prooof_type: (req.id_prooof_type != undefined) ? req.id_prooof_type : "adhar card",
                otp_code: (req.otp_code != undefined) ? req.otp_code : "",
                mobile_verify: (req.mobile_verify != undefined) ? req.mobile_verify : "pending"
            };
            let OTP = Math.floor(1000 + Math.random() * 9000);
            user.otp_code = OTP;
            const [rows, fields] = await dbConn.query(`INSERT INTO tbl_user SET ?`, user);
            if (rows.affectedRows != 0) {
                req.user_id = rows.insertId
                let checkDeviceInfo = await common.checkDeviceInfo(req);
                let userprofile = await user_model.userDetails(req.user_id);
                checkDeviceInfo.token = userprofile.token;
                return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_user_register_succ'], userprofile)
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_user_something_wrong'], error);
        }
    },

    //function for Login user
    async login(req, res) {
        try {
            const [rows, fields] = await dbConn.query("SELECT * FROM tbl_user WHERE mobile = '" + req.mobile + "' AND is_deleted = 0 ");
            if (rows.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_user_invalid_login_details'], null);
            }
            if (rows[0].is_active != 1) {
                return await common.sendResponse(res, Codes.INACTIVE, lang[req.language]['text_user_account_inactive'], null)
            }
            let password = await common.decryptPlain(rows[0].password)
            if (password === req.password && rows[0].mobile_verify == "verified") {
                let upd_params = {
                    is_active: "1"
                }
                req.user_id = rows[0].id;
                let checkDeviceInfo = await common.checkDeviceInfo(req);
                let userprofile = await user_model.updateUserDetails(upd_params, req.user_id);
                checkDeviceInfo.token = userprofile.token;
                return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_user_login_succ'], userprofile[0]);
            } else if (password === req.password && rows[0].mobile_verify == "pending") {
                let OTP = Math.floor(1000 + Math.random() * 9000);
                const [updaterows, fields] = await dbConn.query(`UPDATE tbl_user SET otp_code = ${OTP} WHERE id = ${rows[0].id}`);
                if (updaterows.affectedRows != 0) {
                    let userprofile = await user_model.userDetails(rows[0].id)
                    return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_user_login_succ'], userprofile);
                }
            }
            else {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_user_incorrect_password'], null);
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_user_something_wrong'], null);
        }
    },

    //function for Logout user
    async logout(req, res) {
        try {
            let upd_params = {
                is_active: 1
            }
            let userprofile = await user_model.updateUserDetails(upd_params, req.user_id);
            if (userprofile != null) {
                var update = {
                    token: '',
                    device_token: ''
                }
                const [rows, fields] = await dbConn.query(`UPDATE tbl_user_device SET ? WHERE user_id = ${req.user_id}`, update);
                if (rows.affectedRows != 0) {
                    return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_user_logout_succ'], null);
                }
            }
        } catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_user_something_wrong'], null);

        }
    },

    //function for edit profile
    async editProfile(req, res) {
        let edit_check_unique_email = await common.edit_checkUniqueEmail(req, req.user_id)
        if (!edit_check_unique_email) {
            return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_user_duplicate_email'], null)
        }
        let edit_check_unique_mobile = await common.edit_checkUniqueMobile(req, req.user_id)
        if (!edit_check_unique_mobile) {
            return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_user_duplicate_mobile'], null)
        }
        let updparams = {
            first_name: req.first_name,
            last_name: req.last_name,
            dob: req.dob,
            mobile: req.mobile,
            front_id_proof: req.front_id_proof,
            back_id_proof: req.back_id_proof,
            email: req.email,
            cover_image: req.cover_image
        };
        let updateuserprofile = await user_model.updateUserDetails(updparams, req.user_id)
        if (updateuserprofile.length > 0)
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_user_edit_profile_succ'], updateuserprofile[0]);

    },

    //function for forget Password
    async forgotPassword(req, res) {
        try {
            const [rows, fields] = await dbConn.query("SELECT * FROM tbl_user WHERE mobile = '" + req.mobile + "' AND is_deleted = 0");
            if (rows.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_user_invalid_forget_details'], null);
            }
            if (rows[0].is_active != 1) {
                return await common.sendResponse(res, Codes.INACTIVE, lang[req.language]['text_user_account_inactive'], null)
            }
            let OTP = Math.floor(1000 + Math.random() * 9000);
            let updparams = {
                otp_code: OTP,
            };
            let updateuserprofile = await user_model.updateUserDetails(updparams, rows[0].id)
            if (updateuserprofile.length > 0) {
                return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_user_forget_pass_otp'], updateuserprofile[0]);
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_user_something_wrong'], null);
        }
    },

    //function for get user details
    async userDetails(req) {
        try {
            const [rows, fields] = await dbConn.query("SELECT u.*,ut.device_token as device_token,ut.device_type as device_type,ut.token as token FROM tbl_user u LEFT JOIN tbl_user_device as ut ON u.id = ut.user_id WHERE u.id = '" + req + "' AND u.is_active='1' AND u.is_deleted='0' GROUP BY u.id order by u.id desc");
            if (rows.length > 0) {
                return rows;
            }
            else {
                return false;
            }
        } catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_user_something_wrong'], error);
        }
    },

    //function for update user details
    async updateUserDetails(req, user_id) {
        try {
            const [rows, fields] = await dbConn.query(`UPDATE tbl_user SET ? WHERE id = ${user_id} `, req);
            if (rows.affectedRows != 0) {
                return await user_model.userDetails(user_id)
            }
        } catch (error) {
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_user_something_wrong'], error);
        }

    },

    async verify_user_otp(req, res) {
        try {
            const [rows, fields] = await dbConn.query("SELECT * FROM tbl_user WHERE mobile = '" + req.mobile + "' AND otp_code = '" + req.otp + "' AND is_deleted=0 ");
            if (rows.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_user_otp_invalid_otp'], null);
            }
            if (rows[0].is_active != 1) {
                return await common.sendResponse(res, Codes.INACTIVE, lang[req.language]['text_user_account_inactive'], null)
            }
            if (rows.length > 0) {
                if (req.otp == rows[0].otp_code) {
                    let upd_params = {
                        otp_code: "",
                        mobile_verify: "verified"
                    }
                    const [rows, fields] = await dbConn.query(`UPDATE tbl_user SET ? where mobile = '${req.mobile}'`, upd_params);
                    if (rows.affectedRows != 0) {
                        const [userdata, fields] = await dbConn.query("SELECT * FROM tbl_user WHERE mobile = '" + req.mobile + "' AND otp_code = '" + req.otp + "' ");
                        return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_user_otp_verify_succ'], userdata);
                    }
                }
            }
        } catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_user_something_wrong'], null);
        }
    },

    async resend_user_otp(req, res) {
        try {
            const [rows, fields] = await dbConn.query("SELECT * FROM tbl_user WHERE mobile = '" + req.mobile + "' ");
            if (rows.length > 0 && rows[0].mobile_verify == "pending") {
                let OTP = Math.floor(1000 + Math.random() * 9000);
                const [updaterows, fields] = await dbConn.query(`UPDATE tbl_user SET otp_code = ${OTP} WHERE id = ${rows[0].id}`);
                if (updaterows.affectedRows != 0) {
                    let userprofile = await user_model.userDetails(rows[0].id)
                    return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_user_resend_otp_succ'], userprofile);
                }
            } else {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_user_something_wrong'], null);
            }
        } catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_user_something_wrong'], null);

        }
    },

    //function for forget Password
    async changePassword(req, res) {
        try {
            let userprofile = await user_model.userDetails(req.user_id)
            if (userprofile[0] == null) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_user_not_found'], null);
            }

            if (userprofile[0] != null) {
                let currentpassword = await common.decryptPlain(userprofile[0].password);
                if (currentpassword != req.oldpassword) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_user_old_password_incorrect'], null);
                }
                else if (currentpassword == req.newpassword) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_user_newold_password_similar'], null);
                }
                else {
                    let password = common.encryptPlain(parseInt(req.newpassword));
                    let updparams = {
                        password: password
                    };
                    let updateuserdetails = await user_model.updateUserDetails(updparams, req.user_id)
                    if (updateuserdetails != null) {
                        return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_user_change_password_success'], updateuserdetails[0]);
                    }
                }
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_user_something_wrong'], null);
        }
    },

    //function for forget Update Password
    async updatePassword(req, res) {
        try {
            let password = common.encryptPlain(parseInt(req.newpassword));
            let updparams = {
                password: password
            };
            req.user_id = req.userid;
            let updateuserdetails = await user_model.updateUserDetails(updparams, req.user_id)
            if (updateuserdetails != null) {
                return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_user_change_password_success'], updateuserdetails[0]);
            } else {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_user_not_found'], null);
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_user_something_wrong'], null);
        }
    },

    //function for get profile
    async getuserProfile(req, res) {
        try {
            let userprofile = await user_model.userDetails(req.user_id)
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_user_get_user_profile'], userprofile[0]);

        } catch (error) {
            logger.error(error)
        }
    }
}

module.exports = user_model;