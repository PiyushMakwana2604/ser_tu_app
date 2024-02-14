const Validator = require('Validator');
const logger = require('../logger')
const dbConn = require("../config/database");
const CryptoJS = require("crypto-js");
const moment = require("moment");

const Codes = require('./status_codes');

let cryptoLib = require("cryptlib");
let shakey = cryptoLib.getHashSha256(process.env.KEY, 32);
const SECRET = CryptoJS.enc.Utf8.parse(process.env.KEY);
const IV = CryptoJS.enc.Utf8.parse(process.env.IV);

const common = {

    //function for send Response
    sendResponse: async (res, resCode, msgKey, resData) => {
        try {
            let responsejson =
            {
                "code": resCode,
                "message": msgKey

            }
            if (resData != null) {
                responsejson["data"] = resData;
            }
            const result = await common.encryption(responsejson);
            return res.status(resCode).send(result)

        } catch (error) {
            logger.error(error);
        }

    },

    //decrypt user request
    decryption: async (req) => {
        if (req.body != undefined && Object.keys(req.body).length !== 0) {
            let request = JSON.parse(cryptoLib.decrypt(req.body, shakey, process.env.IV))

            request.language = req.language;
            request.user_id = req.user_id
            return request;
        }
        else {
            return {}
        }
    },

    //encrypt user request
    encryption: async (data) => {
        try {
            let response = cryptoLib.encrypt(JSON.stringify(data), shakey, process.env.IV);

            return response;
        } catch (error) {
            return ''
        }
    },

    //encrypt plain data
    encryptPlain: function (data) {
        try {
            let response = cryptoLib.encrypt(JSON.stringify(data), shakey, process.env.IV);
            return response;
        } catch (e) {
            return '';
        }
    },

    //decrypt plain data
    decryptPlain: function (data) {
        // console.log(data);
        // let response = JSON.parse(cryptoLib.decrypt(data, shakey, process.env.IV))
        try {
            let response = cryptoLib.decrypt(JSON.stringify(data), shakey, process.env.IV);
            return response
        } catch (error) {
            // return cryptoLib.decrypt(JSON.stringify(data), shakey, process.env.IV);
            return CryptoJS.AES.decrypt(data, SECRET, { iv: IV }).toString(CryptoJS.enc.Utf8);
        }
    },


    //check Validation Rules
    checkValidationRules: async (request, rules) => {
        try {
            let v = Validator.make(request, rules);
            let _validator = {
                status: true,
            }
            if (v.fails()) {
                let Validator_errors = v.getErrors();
                _validator.status = false
                for (let key in Validator_errors) {
                    _validator.error = Validator_errors[key][0];
                    break;
                }
            }
            return _validator;
        } catch (error) {
            logger.error(error)
        }

    },

    //check,update,insert user device details
    checkDeviceInfo: async (req) => {
        // try {
        let randtoken = require('rand-token').generator();
        let token = randtoken.generate(64, "0123456789abcdefghijklnmopqrstuvwxyz");
        let upd_device = {
            token: "123456",
            user_id: (req.user_id != undefined) ? req.user_id : "",
            device_type: (req.device_type != undefined) ? req.os_version : "A",
            device_token: token
        };
        const [rows, fields] = await dbConn.query(`SELECT * FROM tbl_user_device WHERE user_id = ${req.user_id}`);
        if (rows.length > 0) {
            const [rows, fields] = await dbConn.query(`UPDATE tbl_user_device SET ? WHERE user_id = ${req.user_id}`, upd_device);
            if (rows.affectedRows != 0) {
                return upd_device;
            }
        }
        else {
            upd_device.user_id = req.user_id;
            const [rows, fields] = await dbConn.query(`INSERT INTO tbl_user_device SET ?`, upd_device);
            if (rows.affectedRows != 0) {
                return upd_device;
            }
        }
        // } catch (error) {
        //     logger.error(error)
        // }

    },

    //function for check unique email
    checkUniqueEmail: async (req) => {
        const [rows, fields] = await dbConn.query(`SELECT * FROM tbl_user WHERE email = '${req.email}'  AND is_deleted = 0 AND is_active = 1 `);
        if (rows.length > 0) {
            return false;
        }
        else {
            return true;
        }
    },

    //function for check unique email
    edit_checkUniqueEmail: async (req) => {
        console.log(req);
        const [rows, fields] = await dbConn.query(`SELECT * FROM tbl_user WHERE email = '${req.email}'  AND id != ${req.user_id} AND is_deleted = 0 AND is_active = 1 `);
        if (rows.length > 0) {
            return false;
        }
        else {
            return true;
        }
    },

    checkUniqueMobile: async (req) => {
        const [rows, fields] = await dbConn.query(`SELECT * FROM tbl_user WHERE mobile = '${req.mobile}'  AND is_deleted = 0 `);
        // console.log(rows);
        if (rows.length > 0) {
            return false;
        }
        else {
            return true;
        }
    },

    edit_checkUniqueMobile: async (req) => {
        const [rows, fields] = await dbConn.query(`SELECT * FROM tbl_user WHERE mobile = '${req.mobile}' AND id != ${req.user_id}  AND is_deleted = 0 `);
        // console.log(rows);
        if (rows.length > 0) {
            return false;
        }
        else {
            return true;
        }
    },

    //function for send email
    send_email: async (subject, to_email, message) => {
        try {
            let nodemailer = require('nodemailer');
            let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_ID,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
            let mailOptions = {
                from: process.env.EMAIL_ID,
                to: to_email,
                subject: subject,
                html: message
            };
            return await transporter.sendMail(mailOptions)
        }
        catch (error) {
            logger.error(error)
        }
    },
}




module.exports = common;