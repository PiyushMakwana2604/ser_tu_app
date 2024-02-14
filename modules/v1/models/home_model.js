const dbConn = require("../../../config/database");
const common = require("../../../config/common");
const lang = require("../../../config/language");
const emailTemplate = require("../../../config/template")
const logger = require("../../../logger");
const Codes = require("../../../config/status_codes");
const moment = require("moment");
var asyncLoop = require('node-async-loop');
const { log } = require("winston");


let home_model = {

    //function for add comment
    async add_comment(req, res) {
        try {
            let params = {
                user_id: req.user_id,
                post_id: req.post_id,
                parent_id: (req.parent_id != undefined) ? req.parent_id : "0",
                comment: req.comment
            };
            const [rows, fields] = await dbConn.query(`INSERT INTO tbl_post_comment SET ?`, params);
            if (rows.affectedRows == 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_comment_details'], null);
            }
            let comment_id = rows.insertId
            let reqParentId = req.parent_id;

            while (reqParentId !== undefined && reqParentId !== "" && reqParentId !== 0) {
                let commentDetail = await home_model.commentDetails(reqParentId);

                await dbConn.query(`UPDATE tbl_post_comment SET reply_comment_count = reply_comment_count + 1 WHERE id = ${reqParentId}`);

                reqParentId = commentDetail[0].parent_id;
            }
            const [update, field] = await dbConn.query(`UPDATE tbl_post SET comment_count = comment_count + 1 WHERE id = ${req.post_id} `);
            let commentDetails = await home_model.commentDetails(comment_id);
            let postDetails = await home_model.postDetails(req.post_id);
            if (postDetails) {
                commentDetails[0].comment_count = postDetails[0].comment_count
            }
            if (commentDetails) {
                return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_comment_succ'], commentDetails)
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for delete comment
    async delete_comment(req, res) {
        try {
            const [result] = await dbConn.query(`SELECT * FROM tbl_post_comment WHERE id = ${req.comment_id}`);
            console.log(result)
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_comment_details'], null);
            }
            if (result.length > 0 && (result[0].is_deleted == "1" || result[0].is_active == "0")) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_comment_details'], null);
            }
            const [rows, fields] = await dbConn.query(`UPDATE tbl_post_comment SET is_deleted = 1 WHERE id=${req.comment_id}`);
            if (rows.affectedRows == 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
            }

            let reqParentId = result[0].parent_id;

            while (reqParentId !== undefined && reqParentId !== "" && reqParentId !== 0) {
                let commentDetail = await home_model.commentDetails(reqParentId);
                await dbConn.query(`UPDATE tbl_post_comment SET reply_comment_count = reply_comment_count - ${result[0].reply_comment_count + 1} WHERE id = ${reqParentId}`);

                reqParentId = commentDetail[0].parent_id;
            }
            const [response] = await dbConn.query(`SELECT reply_comment_count FROM tbl_post_comment WHERE id = ${req.comment_id}`);
            let remove_count = response[0].reply_comment_count + 1;
            const [update, field] = await dbConn.query(`UPDATE tbl_post SET comment_count = comment_count - ${remove_count} WHERE id = ${result[0].post_id} `, req);
            if (update.affectedRows == 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
            }
            let postDetails = await home_model.postDetails(result[0].post_id);
            if (postDetails) {
                count = [{
                    comment_count: postDetails[0].comment_count
                }]
                return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_delete_comment_succ'], count)
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for like dislike on post
    async like_dislike(req, res) {
        try {
            let postDetail = await home_model.postDetails(req.post_id);
            if (!postDetail) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_entervalid_post_id'], null);
            }
            const [result, fields] = await dbConn.query(`SELECT id,post_id,is_active FROM tbl_post_like WHERE post_id = ${req.post_id} AND user_id = ${req.user_id}`);
            if (result.length > 0) {
                if (result[0].is_active == "1") {
                    const [delete_data, fields] = await dbConn.query(`UPDATE tbl_post_like SET is_active = 0 WHERE id=${result[0].id}`);
                    if (delete_data.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    const [update, field] = await dbConn.query(`UPDATE tbl_post SET like_count = like_count - 1 WHERE id = ${result[0].post_id} `, req);
                    if (update.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    let postDetails = await home_model.postDetails(req.post_id);
                    if (postDetails) {
                        count = [{
                            like_count: postDetails[0].like_count
                        }]
                        return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_delete_like_succ'], count)
                    }
                } else {
                    const [delete_data, fields] = await dbConn.query(`UPDATE tbl_post_like SET is_active = 1 WHERE id=${result[0].id}`);
                    if (delete_data.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    const [update, field] = await dbConn.query(`UPDATE tbl_post SET like_count = like_count + 1 WHERE id = ${result[0].post_id} `, req);
                    if (update.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    let postDetails = await home_model.postDetails(req.post_id);
                    if (postDetails) {
                        count = [{
                            like_count: postDetails[0].like_count
                        }]
                        return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_like_succ'], count)
                    }
                }
            } else {
                let params = {
                    user_id: req.user_id,
                    post_id: req.post_id
                };
                const [rows, fieldss] = await dbConn.query(`INSERT INTO tbl_post_like SET ?`, params);
                if (rows.affectedRows == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_like_details'], null);
                }
                // let like_id = rows.insertId
                const [update, field] = await dbConn.query(`UPDATE tbl_post SET like_count = like_count + 1 WHERE id = ${req.post_id} `);
                if (update.affectedRows == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                }
                let postDetails = await home_model.postDetails(req.post_id);
                if (postDetails) {
                    count = [{
                        like_count: postDetails[0].like_count
                    }]
                    return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_like_succ'], count)
                }
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for save unsave on post
    async save_unsave(req, res) {
        try {
            let postDetail = await home_model.postDetails(req.post_id);
            if (!postDetail) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_entervalid_post_id'], null);
            }
            const [result, fields] = await dbConn.query(`SELECT id,post_id,is_active FROM tbl_post_save WHERE post_id = ${req.post_id} AND user_id = ${req.user_id}`);
            if (result.length > 0) {
                if (result[0].is_active == 1) {
                    const [delete_data, fields] = await dbConn.query(`UPDATE tbl_post_save SET is_active = 0 WHERE id=${result[0].id}`);
                    if (delete_data.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    const [update, field] = await dbConn.query(`UPDATE tbl_post SET save_count = save_count - 1 WHERE id = ${result[0].post_id} `, req);
                    if (update.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    let postDetails = await home_model.postDetails(req.post_id);
                    if (postDetails) {
                        count = [{
                            save_count: postDetails[0].save_count
                        }]
                        return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_unsave_succ'], count)
                    }
                } else {
                    const [delete_data, fields] = await dbConn.query(`UPDATE tbl_post_save SET is_active = 1 WHERE id=${result[0].id}`);
                    if (delete_data.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    const [update, field] = await dbConn.query(`UPDATE tbl_post SET save_count = save_count + 1 WHERE id = ${result[0].post_id} `, req);
                    if (update.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    let postDetails = await home_model.postDetails(req.post_id);
                    if (postDetails) {
                        count = [{
                            save_count: postDetails[0].save_count
                        }]
                        return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_save_succ'], count)
                    }
                }
            } else {
                let params = {
                    user_id: req.user_id,
                    post_id: req.post_id
                };
                const [rows, fieldss] = await dbConn.query(`INSERT INTO tbl_post_save SET ?`, params);
                if (rows.affectedRows == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_save_details'], null);
                }
                // let save_id = rows.insertId
                const [update, field] = await dbConn.query(`UPDATE tbl_post SET save_count = save_count + 1 WHERE id = ${req.post_id} `);
                if (update.affectedRows == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                }
                let postDetails = await home_model.postDetails(req.post_id);
                if (postDetails) {
                    count = [{
                        save_count: postDetails[0].save_count
                    }]
                    return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_save_succ'], count)
                }
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for add share
    async add_share(req, res) {
        try {
            let postDetail = await home_model.postDetails(req.post_id);
            if (!postDetail) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_entervalid_post_id'], null);
            }
            for (const receiverId of req.receiver_id) {
                let params = {
                    sender_id: req.user_id,
                    post_id: req.post_id,
                    receiver_id: receiverId
                };
                const [rows, fields] = await dbConn.query(`INSERT INTO tbl_post_share SET ?`, params);
                if (rows.affectedRows == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_share_details'], null);
                }
                const [update, field] = await dbConn.query(`UPDATE tbl_post SET share_count = share_count + 1 WHERE id = ${req.post_id} `);
                if (update.affectedRows == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                }
            }
            let postDetails = await home_model.postDetails(req.post_id);
            if (postDetails) {
                count = [{
                    share_count: postDetails[0].share_count
                }]
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_add_share_succ'], count);
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for add tag
    async add_tag(req, res) {
        try {
            let postDetail = await home_model.postDetails(req.post_id);
            if (!postDetail) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_entervalid_post_id'], null);
            }
            for (const tagId of req.tag_id) {
                let params = {
                    post_id: req.post_id,
                    tag_id: tagId
                };
                const [rows, fields] = await dbConn.query(`INSERT INTO tbl_post_tag SET ?`, params);
                if (rows.affectedRows == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_tag_details'], null);
                }
                const [update, field] = await dbConn.query(`UPDATE tbl_post SET tag_count = tag_count + 1 WHERE id = ${req.post_id} `);
                if (update.affectedRows == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                }
            }
            let postDetails = await home_model.postDetails(req.post_id);
            if (postDetails) {
                count = [{
                    tag_count: postDetails[0].tag_count
                }]
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_add_tag_succ'], count);
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for like dislike on comment
    async comment_like_dislike(req, res) {
        try {
            let commentDetail = await home_model.commentDetails(req.comment_id);
            if (!commentDetail) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_entervalid_comment_id'], null);
            }
            const [result, fields] = await dbConn.query(`SELECT id,comment_id,is_active FROM tbl_comment_like WHERE comment_id = ${req.comment_id} AND user_id = ${req.user_id}`);
            if (result.length > 0) {
                if (result[0].is_active == "1") {
                    const [delete_data, fields] = await dbConn.query(`UPDATE tbl_comment_like SET is_active = 0 WHERE id=${result[0].id}`);
                    if (delete_data.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    const [update, field] = await dbConn.query(`UPDATE tbl_post_comment SET comment_like_count = comment_like_count - 1 WHERE id = ${result[0].comment_id} `, req);
                    if (update.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    let commentDetails = await home_model.commentDetails(req.comment_id);
                    if (commentDetails) {
                        count = [{
                            comment_like_count: commentDetails[0].comment_like_count
                        }]
                        return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_delete_like_succ'], count)
                    }
                } else {
                    const [delete_data, fields] = await dbConn.query(`UPDATE tbl_comment_like SET is_active = 1 WHERE id=${result[0].id}`);
                    if (delete_data.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    const [update, field] = await dbConn.query(`UPDATE tbl_post_comment SET comment_like_count = comment_like_count + 1 WHERE id = ${result[0].comment_id} `, req);
                    if (update.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    let commentDetails = await home_model.commentDetails(req.comment_id);
                    if (commentDetails) {
                        count = [{
                            comment_like_count: commentDetails[0].comment_like_count
                        }]
                        return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_like_succ'], count)
                    }
                }
            } else {
                let params = {
                    user_id: req.user_id,
                    comment_id: req.comment_id
                };
                const [rows, fieldss] = await dbConn.query(`INSERT INTO tbl_comment_like SET ?`, params);
                if (rows.affectedRows == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_like_details'], null);
                }
                const [update, field] = await dbConn.query(`UPDATE tbl_post_comment SET comment_like_count = comment_like_count + 1 WHERE id = ${req.comment_id} `);
                if (update.affectedRows == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                }
                let commentDetails = await home_model.commentDetails(req.comment_id);
                if (commentDetails) {
                    count = [{
                        comment_like_count: commentDetails[0].comment_like_count
                    }]
                    return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_like_succ'], count)
                }
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for like dislike on comment reply
    // async comment_reply_like_dislike(req, res) {
    //     try {
    //         let commentreplyDetail = await home_model.commentreplyDetails(req.comment_reply_id);
    //         if (!commentreplyDetail) {
    //             return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_entervalid_comment_id'], null);
    //         }
    //         const [result, fields] = await dbConn.query(`SELECT id,comment_reply_id,is_active FROM tbl_comment_reply_like WHERE comment_reply_id = ${req.comment_reply_id} AND user_id = ${req.user_id}`);
    //         if (result.length > 0) {
    //             if (result[0].is_active == "1") {
    //                 const [delete_data, fields] = await dbConn.query(`UPDATE tbl_comment_reply_like SET is_active = 0 WHERE id=${result[0].id}`);
    //                 if (delete_data.affectedRows == 0) {
    //                     return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
    //                 }
    //                 const [update, field] = await dbConn.query(`UPDATE tbl_comment_reply SET reply_comment_like_count = reply_comment_like_count - 1 WHERE id = ${result[0].comment_reply_id} `);
    //                 if (update.affectedRows == 0) {
    //                     return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
    //                 }
    //                 let commentreplyDetails = await home_model.commentreplyDetails(req.comment_reply_id);
    //                 if (commentreplyDetails) {
    //                     count = [{
    //                         reply_comment_like_count: commentreplyDetails[0].reply_comment_like_count
    //                     }]
    //                     return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_delete_like_succ'], count)
    //                 }
    //             } else {
    //                 const [delete_data, fields] = await dbConn.query(`UPDATE tbl_comment_reply_like SET is_active = 1 WHERE id=${result[0].id}`);
    //                 if (delete_data.affectedRows == 0) {
    //                     return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
    //                 }
    //                 const [update, field] = await dbConn.query(`UPDATE tbl_comment_reply SET reply_comment_like_count = reply_comment_like_count + 1 WHERE id = ${result[0].comment_reply_id} `);
    //                 if (update.affectedRows == 0) {
    //                     return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
    //                 }
    //                 let commentreplyDetails = await home_model.commentreplyDetails(req.comment_reply_id);
    //                 if (commentreplyDetails) {
    //                     count = [{
    //                         reply_comment_like_count: commentreplyDetails[0].reply_comment_like_count
    //                     }]
    //                     return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_like_succ'], count)
    //                 }
    //             }
    //         } else {
    //             let params = {
    //                 user_id: req.user_id,
    //                 comment_reply_id: req.comment_reply_id
    //             };
    //             const [rows, fieldss] = await dbConn.query(`INSERT INTO tbl_comment_reply_like SET ?`, params);
    //             if (rows.affectedRows == 0) {
    //                 return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_like_details'], null);
    //             }
    //             const [update, field] = await dbConn.query(`UPDATE tbl_comment_reply SET reply_comment_like_count = reply_comment_like_count + 1 WHERE id = ${req.comment_reply_id} `);
    //             if (update.affectedRows == 0) {
    //                 return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
    //             }
    //             let commentreplyDetails = await home_model.commentreplyDetails(req.comment_reply_id);
    //             if (commentreplyDetails) {
    //                 count = [{
    //                     reply_comment_like_count: commentreplyDetails[0].reply_comment_like_count
    //                 }]
    //                 return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_like_succ'], count)
    //             }
    //         }
    //     }
    //     catch (error) {
    //         logger.error(error)
    //         return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
    //     }
    // },

    //function for follow and unfollow
    async follow_following(req, res) {
        try {
            const [result, fields] = await dbConn.query(`SELECT * FROM tbl_follow_following WHERE follow_id = ${req.follow_id} AND user_id = ${req.user_id}`);
            if (result.length > 0) {
                if (result[0].is_active == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_inactive_details'], null);
                }
                if (result[0].is_deleted == "1") {
                    const [update, field] = await dbConn.query(`UPDATE tbl_follow_following SET is_deleted = 0 WHERE id = ${result[0].id} `);
                    if (update.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    let following_count = await home_model.following_count(req.user_id);
                    let follower_count = await home_model.follower_count(req.user_id);
                    if (follower_count && following_count) {
                        count = {
                            following_count: following_count[0]['following_count'],
                            follower_count: follower_count[0]['follower_count']
                        }
                        return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_follow_succ'], count)
                    }
                } else {
                    const [update, field] = await dbConn.query(`UPDATE tbl_follow_following SET is_deleted = 1 WHERE id = ${result[0].id} `);
                    if (update.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    let following_count = await home_model.following_count(req.user_id);
                    let follower_count = await home_model.follower_count(req.user_id);
                    if (follower_count && following_count) {
                        count = {
                            following_count: following_count[0]['following_count'],
                            follower_count: follower_count[0]['follower_count']
                        }
                        return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_unfollow_succ'], count)
                    }
                }
            } else {
                let params = {
                    user_id: req.user_id,
                    follow_id: req.follow_id,
                    status: "accepted"
                };
                const [rows, fieldss] = await dbConn.query(`INSERT INTO tbl_follow_following SET ?`, params);
                if (rows.affectedRows == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_like_details'], null);
                }
                let following_count = await home_model.following_count(req.user_id);
                let follower_count = await home_model.follower_count(req.user_id);
                if (follower_count && following_count) {
                    count = {
                        following_count: following_count[0]['following_count'],
                        follower_count: follower_count[0]['follower_count']
                    }
                    return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_follow_succ'], count)
                }
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for remove following and follower
    async remove_following_follower(req, res) {
        try {
            const [result, fields] = await dbConn.query(`SELECT * FROM tbl_follow_following WHERE id = ${req.remove_id} AND status = 'accepted' AND is_active = 1 AND is_deleted = 0`);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_details'], null);
            }
            const [update, field] = await dbConn.query(`UPDATE tbl_follow_following SET is_deleted = 1 WHERE id = ${result[0].id} `);
            if (update.affectedRows == 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
            }
            let following_count = await home_model.following_count(req.user_id);
            let follower_count = await home_model.follower_count(req.user_id);
            if (following_count && follower_count) {
                count = {
                    following_count: following_count[0]['following_count'],
                    follower_count: follower_count[0]['follower_count']
                }
                return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_unfollow_succ'], count)
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for following List
    async following_list(req, request, res) {
        try {
            var where = ``;
            if (request.search) {
                where += `AND LOWER(user_name) LIKE ('%${request.search}%') `;
            }
            const [result, fields] = await dbConn.query(`SELECT uf.id,uf.user_id,uf.follow_id,u.first_name as following_firstname,u.last_name as following_lastname,u.user_name,u.profile_image as following_image,
            CASE
                WHEN TIMESTAMPDIFF(second,uf.created_at,now()) < 60 THEN concat(TIMESTAMPDIFF(second,uf.created_at,now()),' seconds ago')
                WHEN TIMESTAMPDIFF(minute,uf.created_at,now()) < 60 THEN concat(TIMESTAMPDIFF(minute,uf.created_at,now()),' minutes ago')
                WHEN TIMESTAMPDIFF(hour,uf.created_at,now()) < 24 THEN concat(TIMESTAMPDIFF(hour,uf.created_at,now()),' hours ago')
                WHEN TIMESTAMPDIFF(day,uf.created_at,now()) < 31 THEN concat( TIMESTAMPDIFF(day,uf.created_at,now()),' days ago')
                WHEN TIMESTAMPDIFF(month,uf.created_at,now()) < 13 THEN concat( TIMESTAMPDIFF(month,uf.created_at,now()),' months ago')
            END as time_diffrence
            FROM tbl_follow_following uf
            JOIN tbl_user u ON uf.follow_id=u.id
            WHERE uf.user_id = ? AND uf.is_active=1 AND uf.is_deleted=0 AND uf.status="accepted" ${where}
            ORDER BY uf.created_at DESC`, req.user_id);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_getfollowing_list_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for follower List
    async follower_list(req, request, res) {
        try {
            var where = ``;
            if (request.search) {
                where += `AND LOWER(user_name) LIKE ('%${request.search}%') `;
            }
            const [result, fields] = await dbConn.query(`SELECT uf.id,uf.user_id,uf.follow_id,u.first_name as follower_firstname,u.last_name as follower_lastname,u.profile_image as following_image,
                CASE
                    WHEN TIMESTAMPDIFF(second,uf.created_at,now()) < 60 THEN concat(TIMESTAMPDIFF(second,uf.created_at,now()),' seconds ago')
                    WHEN TIMESTAMPDIFF(minute,uf.created_at,now()) < 60 THEN concat(TIMESTAMPDIFF(minute,uf.created_at,now()),' minutes ago')
                    WHEN TIMESTAMPDIFF(hour,uf.created_at,now()) < 24 THEN concat(TIMESTAMPDIFF(hour,uf.created_at,now()),' hours ago')
                    WHEN TIMESTAMPDIFF(day,uf.created_at,now()) < 31 THEN concat( TIMESTAMPDIFF(day,uf.created_at,now()),' days ago')
                    WHEN TIMESTAMPDIFF(month,uf.created_at,now()) < 13 THEN concat( TIMESTAMPDIFF(month,uf.created_at,now()),' months ago')
                END as time_diffrence
                FROM tbl_follow_following uf
                JOIN tbl_user u ON uf.user_id=u.id
                WHERE uf.follow_id = ? AND uf.is_active=1 AND uf.is_deleted=0 AND uf.status="accepted" ${where}
                ORDER BY uf.created_at DESC`, req.user_id);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_getfollower_list_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for Post Like List
    async post_like_list(req, res) {
        try {
            var where = ``;
            if (req.search) {
                where += `AND LOWER(user_name) LIKE ('%${req.search}%') `;
            }
            const [result, fields] = await dbConn.query(`SELECT uf.*,u.first_name ,u.last_name,u.user_name,u.profile_image as following_image,
            CASE WHEN EXISTS (SELECT 1 FROM tbl_follow_following f WHERE f.user_id = ${req.user_id} AND f.user_id = u.id AND f.is_active = 1) THEN 'following' ELSE 'follow' END AS is_followed
            FROM tbl_post_like uf
            JOIN tbl_user u ON uf.user_id=u.id
            WHERE uf.post_id = ? AND uf.is_active=1 ${where}
            ORDER BY uf.created_at DESC;`, req.post_id);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_get_postlike_list_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for Post Comment Like List
    async post_comment_list(req, res) {
        try {
            const [result, fields] = await dbConn.query(`SELECT pc.*,u.first_name ,u.last_name ,u.profile_image as following_image,
            CASE WHEN EXISTS (SELECT 1 FROM tbl_comment_like cl WHERE cl.user_id = ${req.user_id} AND cl.comment_id = pc.id AND cl.is_active = 1) THEN '1' ELSE '0' END AS is_like
            FROM tbl_post_comment pc
            JOIN tbl_user u ON pc.user_id=u.id
            WHERE pc.post_id = ? AND pc.is_active=1 AND pc.is_deleted=0 AND parent_id=0
            ORDER BY pc.created_at DESC;`, req.post_id);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            // for (let i = 0; i < result.length; i++) {
            //     const comment = result[i];
            //     const reply_comment_id = comment.id;
            //     const reply_comment_count = comment.reply_comment_count;
            //     if (reply_comment_count > 0) {
            //         const [response, fields] = await dbConn.query(`SELECT pc.*,u.first_name ,u.last_name ,u.profile_image as following_image
            //             FROM tbl_comment_reply pc
            //             JOIN tbl_user u ON pc.user_id=u.id
            //             WHERE pc.comment_id = ? AND pc.is_active=1 AND pc.is_deleted=0
            //             ORDER BY pc.created_at DESC;`, reply_comment_id);
            //         if (response.length > 0) {
            //             result[i].reply_comments = response;
            //         }
            //     }
            // }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_get_postlike_list_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for Post Comment Like List
    async post_reply_comment_list(req, res) {
        try {
            var page = req.page
            var perPage = req.perpage
            var offset = (page - 1) * perPage;
            const [result, fields] = await dbConn.query(`SELECT pc.*,u.first_name ,u.last_name ,u.profile_image as following_image,
            CASE WHEN EXISTS (SELECT 1 FROM tbl_comment_like cl WHERE cl.user_id = ${req.user_id} AND cl.comment_id = pc.id AND cl.is_active = 1) THEN '1' ELSE '0' END AS is_like
                FROM tbl_post_comment pc
                JOIN tbl_user u ON pc.user_id=u.id
                WHERE pc.post_id = ? AND pc.is_active=1 AND pc.is_deleted=0 AND parent_id=${req.parent_id}
                ORDER BY pc.created_at DESC
                LIMIT ${perPage} OFFSET ${offset};`, req.post_id);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_get_postlike_list_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },


    //function for Post Report
    async post_report(req, res) {
        try {
            let params = {
                user_id: req.user_id,
                post_id: req.post_id,
                report_type: req.report_type,
                description: (req.description != undefined && req.description != "") ? req.description : ""
            };
            const [rows, fields] = await dbConn.query(`INSERT INTO tbl_post_report SET ?`, params);
            if (rows.affectedRows == 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_details'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_post_report_succ'], null)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for Post Report
    async user_report(req, res) {
        try {
            let params = {
                user_id: req.user_id,
                report_id: req.report_id,
                report_type: req.report_type,
                description: (req.description != undefined && req.description != "") ? req.description : ""
            };
            const [rows, fields] = await dbConn.query(`INSERT INTO tbl_user_report SET ?`, params);
            if (rows.affectedRows == 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_details'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_user_report_succ'], null)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for block user
    async block_user(req, res) {
        try {
            let userDetail = await home_model.userDetails(req.block_id);
            console.log(req);
            console.log("userDetail", userDetail);
            if (!userDetail) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_entervalid_user'], null);
            }
            const [result, fields] = await dbConn.query(`SELECT * FROM tbl_block_user WHERE blocked_to = ${req.block_id} AND blocked_from = ${req.user_id}`);
            if (result.length > 0) {
                if (result[0].is_active == "1") {
                    const [delete_data, fields] = await dbConn.query(`UPDATE tbl_block_user SET is_active = 0 WHERE id=${result[0].id}`);
                    if (delete_data.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_unblock_user_succ'], null)
                } else {
                    const [delete_data, fields] = await dbConn.query(`UPDATE tbl_block_user SET is_active = 1 WHERE id=${result[0].id}`);
                    if (delete_data.affectedRows == 0) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_something_wrong'], null);
                    }
                    return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_block_user_succ'], null)
                }
            } else {
                let params = {
                    blocked_from: req.user_id,
                    blocked_to: req.block_id
                };
                const [rows, fieldss] = await dbConn.query(`INSERT INTO tbl_block_user SET ?`, params);
                if (rows.affectedRows == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_like_details'], null);
                }
                return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_block_user_succ'], null)
            }
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for block user List
    async block_user_list(req, request, res) {
        try {
            var where = ``;
            if (request.search) {
                where += `AND LOWER(user_name) LIKE ('%${request.search}%') `;
            }
            const [result, fields] = await dbConn.query(`SELECT bu.*,u.first_name ,u.last_name,u.user_name,u.profile_image as user_image
            FROM tbl_block_user bu
            JOIN tbl_user u ON bu.blocked_to=u.id
            WHERE bu.blocked_from = ? AND bu.is_active=1 ${where}
            ORDER BY bu.created_at DESC;`, req.user_id);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_blockuser_data'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_get_blockuser_list_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for homescreen feed
    async homescreen_feed(req, res) {
        try {
            const [result, fields] = await dbConn.query(`SELECT p.id,u.id as user_id,p.post_type,p.thumbnail,p.hashtag,p.description,p.like_count,p.comment_count,p.share_count,p.save_count,p.tag_count,
            (SELECT pl.is_active FROM tbl_post_like pl WHERE p.id=pl.post_id AND pl.user_id= ${req.user_id}) as is_like,
            (SELECT ps.is_active FROM tbl_post_save ps WHERE p.id=ps.post_id AND ps.user_id= ${req.user_id}) as is_save,
            u.user_name,u.profile_image
                FROM tbl_post p
                LEFT JOIN tbl_user u on p.user_id=u.id
                GROUP BY p.id
                ORDER BY p.created_at desc`);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_details'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_get_homescreen_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    // SELECT p.id,u.id as user_id,p.post_type,p.thumbnail,p.hashtag,p.description,p.like_count,p.comment_count,p.share_count,p.save_count,p.tag_count,pl.is_active as is_like,ps.is_active as is_save,u.user_name,u.profile_image
    //             FROM tbl_post p
    //             LEFT JOIN tbl_post_like pl ON p.id=pl.post_id AND pl.user_id = ${req.user_id}
    //             LEFT JOIN tbl_post_save ps ON p.id=ps.post_id AND ps.user_id = ${req.user_id}
    //             LEFT JOIN tbl_user u on p.user_id=u.id
    //             GROUP BY p.id
    //             ORDER BY p.created_at desc

    // SELECT p.id,u.id as user_id,p.post_type,p.thumbnail,p.hashtag,p.description,p.like_count,p.comment_count,p.share_count,p.save_count,p.tag_count,
    // (SELECT pl.is_active FROM tbl_post_like pl WHERE p.id=pl.post_id AND pl.user_id= ${req.user_id}) as is_like,
    // (SELECT ps.is_active FROM tbl_post_save ps WHERE p.id=ps.post_id AND ps.user_id= ${req.user_id}) as is_save,u.user_name,u.profile_image
    //             FROM tbl_post p
    //             LEFT JOIN tbl_user u on p.user_id=u.id
    //             GROUP BY p.id
    //             ORDER BY p.created_at desc

    //function for create post
    async post_details(req, res) {
        try {
            const [result, fields] = await dbConn.query(`SELECT p.id,u.id as user_id,p.post_type,p.thumbnail,p.hashtag,p.description,p.like_count,p.comment_count,p.share_count,p.save_count,p.tag_count,
            (SELECT pl.is_active FROM tbl_post_like pl WHERE p.id=pl.post_id AND pl.user_id= ${req.user_id}) as is_like,
            (SELECT ps.is_active FROM tbl_post_save ps WHERE p.id=ps.post_id AND ps.user_id= ${req.user_id}) as is_save,
            u.user_name,u.profile_image
                FROM tbl_post p
                LEFT JOIN tbl_user u on p.user_id=u.id
                WHERE p.id = ${req.post_id}
                GROUP BY p.id
                ORDER BY p.created_at desc`);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_details'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_get_postdata_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },
    // SELECT p.id,u.id as user_id,p.post_type,p.thumbnail,p.hashtag,p.description,p.like_count,p.comment_count,p.share_count,p.save_count,p.tag_count,pl.is_active as is_like,ps.is_active as is_save,u.user_name,u.profile_image
    //             FROM tbl_post p
    //             LEFT JOIN tbl_post_like pl ON p.id=pl.post_id AND pl.user_id = ${req.user_id}
    //             LEFT JOIN tbl_post_save ps ON p.id=ps.post_id AND ps.user_id = ${req.user_id}
    //             LEFT JOIN tbl_user u on p.user_id=u.id
    //             WHERE p.id = ${req.post_id} 
    //             GROUP BY p.id
    //             ORDER BY p.created_at desc

    //function for create post
    async my_profile(req, res) {
        try {
            const [result, fields] = await dbConn.query(`SELECT id,user_id,post_type,thumbnail FROM tbl_post WHERE user_id = ${req.userid} AND is_active=1 AND is_deleted=0`);
            const [response, field] = await dbConn.query(`SELECT id,first_name,last_name,user_name,profile_image,cover_image,about FROM tbl_user WHERE id = ${req.userid} AND is_active=1 AND is_deleted=0`);
            if (response.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            let following_count = await home_model.following_count(req.user_id);
            let follower_count = await home_model.follower_count(req.user_id);
            let user_post_count = await home_model.user_post_count(req.user_id);

            if (response.length > 0 && follower_count && following_count && user_post_count) {
                response[0].follower_count = follower_count[0]['follower_count'];
                response[0].following_count = following_count[0]['following_count'];
                response[0].post_count = user_post_count[0]['post_count'];
                response[0].post_data = (result.length > 0) ? result : "";
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_get_postdata_succ'], response[0])
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    async create_savepost_folder(req, res) {
        try {
            let params = {
                user_id: req.user_id,
                name: req.name
            }
            const [rows, fields] = await dbConn.query(`INSERT INTO tbl_save_post_folder SET ?`, params);
            if (rows.affectedRows == 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            let folder_id = rows.insertId
            const [result, field] = await dbConn.query(`SELECT * FROM tbl_save_post_folder WHERE id = ${folder_id} AND is_active=1 AND is_deleted = 0`);
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_create_savepost_folder_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    async edit_savepost_folder(req, res) {
        try {
            const [rows, fields] = await dbConn.query(`UPDATE tbl_save_post_folder SET name = "${req.name}" WHERE id = ${req.folder_id}`);
            if (rows.affectedRows == 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            const [result, field] = await dbConn.query(`SELECT * FROM tbl_save_post_folder WHERE id = ${req.folder_id} AND is_active=1 AND is_deleted = 0`);
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_edit_savepost_folder_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    async delete_savepost_folder(req, res) {
        try {
            const [rows, fields] = await dbConn.query(`UPDATE tbl_save_post_folder SET is_deleted = "1" WHERE id = ${req.folder_id}`);
            if (rows.affectedRows == 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_delete_savepost_folder_succ'], null)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    async service_category_list(req, res) {
        try {
            const [result, fields] = await dbConn.query(`SELECT * FROM tbl_service_category WHERE is_active=1 `);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_get_service_category_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    async service_list(req, res) {
        console.log(req);
        try {
            var where = "";
            if (req.category_id == 3) {
                where = `ORDER BY s.date ASC`;
            }

            const [result, fields] = await dbConn.query(`SELECT s.id, s.category_id, s.name, s.location, s.latitude, s.longitude, s.price, DATE_FORMAT(s.date, '%Y-%m-%d') as date, s.start_time, s.end_time, sc.name category_name, GROUP_CONCAT( CASE WHEN sm.id IS NOT NULL THEN JSON_OBJECT( 'id', sm.id, 'service_id', sm.service_id, 'media', sm.media, 'media_type', sm.media_type ) ELSE '' END ) as service_media FROM tbl_service s JOIN tbl_service_category sc ON sc.id = s.category_id LEFT JOIN tbl_service_media sm ON sm.service_id = s.id AND sm.is_active = 1 WHERE s.category_id = ? AND s.is_active = 1 GROUP BY s.id ${where};`, req.category_id);
            console.log(typeof result[0].service_media);
            result.forEach(row => {
                if (row.service_media) {
                    row.service_media = JSON.parse(`[${row.service_media}]`);
                }
            });
            // console.log(result);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_get_services_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    async service_details(req, res) {
        try {
            const [result, fields] = await dbConn.query(`SELECT s.*,sc.name category_name FROM tbl_service s JOIN tbl_service_category sc ON sc.id = s. category_id WHERE s.id = ? AND s.is_active = 1; `, req.service_id);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            const [result_img] = await dbConn.query(`SELECT id,service_id,media,media_type FROM tbl_service_media WHERE service_id =? And is_active = 1; `, req.service_id);
            result[0].service_media = result_img
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_get_service_details_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    async create_poll(req, res) {
        try {
            let params = {
                user_id: req.user_id,
                question: req.question,
                option_1: req.option_1,
                option_2: req.option_2,
                option_3: (req.option_3 != undefined && req.option_3 != "") ? req.option_3 : "",
                poll_length: (req.poll_length != undefined && req.poll_length != "") ? req.poll_length : "1"
            };
            for (let i = 1; i <= 3; i++) {
                for (let j = i + 1; j <= 3; j++) {
                    if (req[`option_${i}`] === req[`option_${j}`]) {
                        return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_poll_option'], null);
                    }
                }
            }
            const [rows, fields] = await dbConn.query(`INSERT INTO tbl_poll SET ?`, params);
            if (rows.affectedRows == 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_comment_details'], null);
            }
            let poll_id = rows.insertId;
            const [result, field] = await dbConn.query(`SELECT * FROM tbl_poll WHERE id = ${poll_id} AND is_active=1 AND is_deleted = 0`);
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_create_poll_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    async add_poll_vote(req, res) {
        try {
            const [result, fields] = await dbConn.query(`SELECT * FROM tbl_poll_vote where user_id = ? AND poll_id = ?; `, [req.user_id, req.poll_id]);
            if (result.length <= 0) {
                let params = {
                    poll_id: req.poll_id,
                    user_id: req.user_id
                }
                params[`option_${req.vote}`] = 1;
                console.log(params);
                const [rows, fields] = await dbConn.query(`INSERT INTO tbl_poll_vote SET ?`, params);
                if (rows.affectedRows == 0) {
                    return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_invalid_comment_details'], null);
                }
                let poll_vote_id = rows.insertId;
                const [result, field] = await dbConn.query(`SELECT * FROM tbl_poll_vote WHERE id = ${poll_vote_id} AND is_active=1`);
                return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_poll_vote_succ'], result)
            }
            let params = {};

            for (let i = 1; i <= 3; i++) {
                params[`option_${i}`] = 0;
            }
            if (result[0][`option_${req.vote}`] == 1) {
                params[`option_${req.vote}`] = 0;
            } else {
                params[`option_${req.vote}`] = 1;
            }
            const [rows, field] = await dbConn.query(`UPDATE tbl_poll_vote SET ? WHERE id = ${result[0].id}`, params);
            if (rows.affectedRows == 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            const [response] = await dbConn.query(`SELECT * FROM tbl_poll_vote WHERE id = ${result[0].id} AND is_active=1`);
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_poll_vote_succ'], response)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    async poll_listing(req, res) {
        try {
            const [result, fields] = await dbConn.query(`SELECT p.*,
                (SELECT COUNT(pv.id) FROM tbl_poll_vote pv WHERE pv.poll_id = p.id AND (pv.option_1 != 0 OR pv.option_2 != 0 OR pv.option_3 != 0)) AS total_votes,
                (SELECT COUNT(pv.option_1) FROM tbl_poll_vote pv WHERE pv.poll_id=p.id AND pv.option_1=1) option_1_count,
                (SELECT COUNT(pv.option_2) FROM tbl_poll_vote pv WHERE pv.poll_id=p.id AND pv.option_2=1) option_2_count,
                (SELECT COUNT(pv.option_3) FROM tbl_poll_vote pv WHERE pv.poll_id=p.id AND pv.option_3=1) option_3_count ,
                (SELECT COUNT(pv.option_1) FROM tbl_poll_vote pv WHERE pv.poll_id = p.id AND pv.option_1 = 1) / 
                    NULLIF((SELECT COUNT(pv.id) FROM tbl_poll_vote pv WHERE pv.poll_id = p.id AND (pv.option_1 != 0 OR pv.option_2 != 0 OR pv.option_3 != 0)), 0) * 100 AS option_1_percentage,
                (SELECT COUNT(pv.option_2) FROM tbl_poll_vote pv WHERE pv.poll_id = p.id AND pv.option_2 = 1) / 
                    NULLIF((SELECT COUNT(pv.id) FROM tbl_poll_vote pv WHERE pv.poll_id = p.id AND (pv.option_1 != 0 OR pv.option_2 != 0 OR pv.option_3 != 0)), 0) * 100 AS option_2_percentage,
                (SELECT COUNT(pv.option_3) FROM tbl_poll_vote pv WHERE pv.poll_id = p.id AND pv.option_3 = 1) / 
                    NULLIF((SELECT COUNT(pv.id) FROM tbl_poll_vote pv WHERE pv.poll_id = p.id AND (pv.option_1 != 0 OR pv.option_2 != 0 OR pv.option_3 != 0)), 0) * 100 AS option_3_percentage
                FROM tbl_poll p WHERE p.user_id = ? AND p.is_active = 1;`, req.user_id);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_add_poll_vote_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    async people_poll_listing(req, res) {
        try {
            var options = "";
            if (req.vote != undefined && req.vote != "") {
                options = `AND option_${req.vote} = 1`
            }
            let sql = `SELECT pv.*,u.first_name,u.last_name,u.user_name,u.profile_image FROM tbl_poll_vote pv 
                JOIN tbl_user u ON u.id = pv.user_id
                WHERE pv.poll_id = ? AND (pv.option_1 != 0 OR pv.option_2 != 0 OR pv.option_3 != 0) AND pv.is_active = 1 ${options};`
            const [result, fields] = await dbConn.query(sql, req.poll_id);
            console.log(sql);
            if (result.length <= 0) {
                return await common.sendResponse(res, Codes.NOT_FOUND, lang[req.language]['text_home_unavailable_data'], null);
            }
            return await common.sendResponse(res, Codes.SUCCESS, lang[req.language]['text_home_people_poll_listing_succ'], result)
        }
        catch (error) {
            logger.error(error)
            return await common.sendResponse(res, Codes.INTERNAL_ERROR, lang[req.language]['text_home_something_wrong'], error);
        }
    },

    //function for get user details
    async userDetails(req) {
        const [rows, fields] = await dbConn.query("SELECT * FROM tbl_user WHERE id = '" + req + "' AND is_active='1' AND is_deleted='0'");
        if (rows.length > 0) {
            return rows;
        }
        else {
            return false;
        }
    },

    //function for get post details
    async postDetails(req) {
        const [rows, fields] = await dbConn.query("SELECT * FROM tbl_post WHERE id = '" + req + "' AND is_active='1' AND is_deleted='0'");
        if (rows.length > 0) {
            return rows;
        }
        else {
            return false;
        }
    },

    //function for get comment details
    async commentDetails(req) {
        const [rows, fields] = await dbConn.query("SELECT * FROM tbl_post_comment WHERE id = '" + req + "' AND is_active='1' AND is_deleted='0'");
        if (rows.length > 0) {
            return rows;
        }
        else {
            return false;
        }
    },

    //function for get following count
    async following_count(req) {
        const [rows, fields] = await dbConn.query("SELECT COUNT(id) as following_count FROM tbl_follow_following WHERE user_id = '" + req + "' AND is_active='1' AND is_deleted='0' AND status = 'accepted'");
        if (rows.length > 0) {
            return rows;
        }
        else {
            return false;
        }
    },

    //function for get follower count
    async follower_count(req) {
        const [rows, fields] = await dbConn.query("SELECT COUNT(id) as follower_count FROM tbl_follow_following WHERE follow_id = '" + req + "' AND is_active='1' AND is_deleted='0' AND status = 'accepted'");
        if (rows.length > 0) {
            return rows;
        }
        else {
            return false;
        }
    },

    //function for get user post count
    async user_post_count(req) {
        const [rows, fields] = await dbConn.query("SELECT COUNT(id) as post_count FROM tbl_post WHERE user_id = '" + req + "' AND is_active='1' AND is_deleted='0'");
        if (rows.length > 0) {
            return rows;
        }
        else {
            return false;
        }
    },

}

module.exports = home_model;
