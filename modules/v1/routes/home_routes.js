const express = require('express')
const router = express.Router()
const homeController = require('../controller/home_controllers');

router.post('/add_comment', homeController.add_comment);

router.post('/delete_comment', homeController.delete_comment);

// post like unlike
router.post('/like_dislike', homeController.like_dislike);

router.post('/save_unsave', homeController.save_unsave);

router.post('/add_share', homeController.add_share);

router.post('/add_tag', homeController.add_tag);

router.post('/comment_like_dislike', homeController.comment_like_dislike);

router.post('/follow_following', homeController.follow_following);

router.post('/remove_following_follower', homeController.remove_following_follower);

router.post('/following_list', homeController.following_list);

router.post('/follower_list', homeController.follower_list);

router.post('/post_like_list', homeController.post_like_list);

router.post('/post_comment_list', homeController.post_comment_list);

router.post('/post_reply_comment_list', homeController.post_reply_comment_list);

router.post('/post_report', homeController.post_report);

router.post('/user_report', homeController.user_report);

router.post('/block_user', homeController.block_user);

router.post('/block_user_list', homeController.block_user_list);

router.post('/homescreen_feed', homeController.homescreen_feed);

router.post('/post_details', homeController.post_details);

router.post('/my_profile', homeController.my_profile);

router.post('/create_savepost_folder', homeController.create_savepost_folder);

router.post('/edit_savepost_folder', homeController.edit_savepost_folder);

router.post('/delete_savepost_folder', homeController.delete_savepost_folder);

router.get('/service_category_list', homeController.service_category_list);

router.get('/service_list', homeController.service_list);

router.get('/service_details', homeController.service_details);

router.post('/create_poll', homeController.create_poll);

router.post('/add_poll_vote', homeController.add_poll_vote);

router.get('/poll_listing', homeController.poll_listing);

router.get('/people_poll_listing', homeController.people_poll_listing);


module.exports = router;