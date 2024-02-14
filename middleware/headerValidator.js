const dbConn = require('../config/database')
const common = require('../config/common');
const lang = require("../config/language");
const logger = require('../logger');
const Codes = require('../config/status_codes');

//methods that do not check token
const bypassMethod = new Array("register", "signup", "login", "forgotPassword", "verifyOtp", "verify_user_otp", "resend_user_otp", "updatePassword", "email");

//method that not require api key
const bypassHeaderKey = new Array("sendnotification", "email");

let headerValidator = {

    //function for extract accept language from request header and set in req globaly
    extractHeaderLanguage: async (req, res, next) => {
        try {
            let language = (req.headers['accept-language'] != undefined && req.headers['accept-language'] != '') ? req.headers['accept-language'] : "en";
            req.language = language;
            next()
        } catch (error) {
            logger.error(error)
        }

    },

    //Function to validate API key of header (Note : Header keys are encrypted)
    // validateHeaderApiKey: async (req, res, next) => {
    //     try {
    //         let api_key = await common.decryptPlain(req.headers['api-key'])
    //         // console.log("api_key", api_key);
    //         const path_data = req.path.split("/");
    //         if (bypassHeaderKey.indexOf(path_data[2]) === -1) {
    //             if (api_key == process.env.API_KEY) {
    //                 next()
    //             } else {
    //                 return await common.sendResponse(res, Codes.UNAUTHORIZED, lang[req.language]['rest_keywords_invalid_api_key'], null);
    //             }
    //         }
    //     } catch (error) {
    //         logger.error(error)
    //     }
    // },

    // bypass api key
    validateHeaderApiKey: async (req, res, next) => {
        try {
            const path_data = req.path.split("/");
            if (bypassHeaderKey.indexOf(path_data[2]) === -1) {
                if (req.headers['api-key'] && req.headers['api-key'] != '') {
                    let api_key = await common.decryptPlain(req.headers['api-key'])
                    console.log(api_key);
                    if (api_key == process.env.API_KEY) {
                        next()
                    } else {
                        return await common.sendResponse(res, Codes.UNAUTHORIZED, lang[req.language]['rest_keywords_invalid_api_key'], null);
                    }
                } else {
                    return await common.sendResponse(res, Codes.UNAUTHORIZED, lang[req.language]['rest_keywords_invalid_api_key'], null);
                }
            } else {
                next()
            }
        } catch (error) {
            logger.error(error)
        }
    },
    //Function to validate the token of any user before every request
    validateHeaderToken: async (req, res, next) => {
        try {
            let path_data = req.path.split("/");
            if (bypassMethod.indexOf(path_data[2]) === -1) {
                if (req.headers['token'] && req.headers['token'] != '') {
                    let headtoken = await common.decryptPlain(req.headers['token'])
                    if (headtoken !== '') {
                        const [rows, fields] = await dbConn.query(`SELECT * FROM tbl_user_device WHERE device_token	 = ? `, [headtoken]);
                        if (rows.length > 0) {
                            req.user_id = rows[0].user_id;
                            next()
                        }
                        else {
                            return await common.sendResponse(res, Codes.UNAUTHORIZED, lang[req.language]['rest_keywords_tokeninvalid'], null);
                        }
                    }
                    else {
                        return await common.sendResponse(res, Codes.UNAUTHORIZED, lang[req.language]['rest_keywords_tokeninvalid'], null);
                    }
                } else {
                    return await common.sendResponse(res, Codes.UNAUTHORIZED, lang[req.language]['rest_keywords_tokeninvalid'], null);
                }
            }
            else {
                next()
            }
        } catch (error) {
            logger.error(error)
        }

    },

}
module.exports = headerValidator