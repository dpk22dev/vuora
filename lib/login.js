/**
 * Created by vinay.sahu on 10/10/17.
 */
var md5 = require('md5');
var async = require('async');
var mongo = require('./mongo');
var path = require('path');
var util = require('./../lib/util');
var userUtil = require('./../service/user/userService');
var randomstring = require("randomstring");
var fs = require('fs');
var emailService = require('./email');
var FORGOT_LINK = "forgotlink";

function Forgotdoc(id, link) {
    this._id = id;
    this.link = link;
    this.createdAt = new Date();
};

var loginUtil = {};
loginUtil.signUp = function (user, callback) {
    var id = user.id;
    var pwd = user.password;
    var name = user.name;
    var image = user.image;
    pwd = md5(pwd);
    userUtil.getUser(id, function (result) {
        if (!result.data) {
            async.parallel({
                one: function (callback) {
                    userUtil.createUser(id, name, image, [], [], callback)
                },
                two: function (callback) {
                    userUtil.saveCred(id, pwd, callback)
                }
            }, function (err, result) {
                if (result) {
                    callback(util.convertToResponse(null, {status: 'successfully signed up'}, ''));
                } else {
                    callback(util.convertToResponse(err, null, 'Error occured while signing up'));
                }
            });
        } else if (result.data) {
            callback(util.convertToResponse({err: 'user already exists in DB'}, null, 'user already exists in DB'));
        } else {
            callback(util.convertToResponse({err: 'something broken please try again later'}, null, 'something broken please try again later'));
        }

    });
};

loginUtil.signIn = function (user, callback) {
    var id = user.id;
    var pwd = user.password;
    userUtil.getCred(id, function (result) {
        if (result.data && result.data != null) {
            var md5pwd = res.pwd;
            var createdMd5 = md5(pwd);
            if (md5pwd === createdMd5) {
                userUtil.getUser(id, callback);
            } else {
                callback(util.convertToResponse({err: 'either username or password is incorrect'}, null, 'either username or password is incorrect'));
            }
        } else {
            callback(util.convertToResponse({err: 'provided emailid doesnot found in DB.'}, null, 'provided emailid doesnot found in DB.'));
        }
    });
};

loginUtil.forgotPassword = function (id, callback) {
    userUtil.getUser(id, function (res) {
        if (res.data) {
            var name = res.data.name || id.substring(0, id.indexOf('@'));
            var linktoken = randomstring.generate(7);
            var forgotDoc = new Forgotdoc(id, linktoken);
            var mongoDB = mongo.getInstance();
            var collection = mongoDB.collection(FORGOT_LINK);
            collection.insertOne(forgotDoc, function (err, res) {
                var data = {};
                data.action_url = 'http://localhost:3000/users/passwordreset/' + linktoken;
                data.name = name;
                data.support_url = 'VUORA';
                data.mailid = id;

                var filePath = path.join(__dirname, '../public/mustache/forgot_password.mustache');
                var contents = fs.readFileSync(filePath).toString();
                emailService.sendMailWithHtml(contents, data, function (err, res) {
                    callback(utils.convertToResponse(err, {status: 'link has been sent to mail'}, "Not able to send mail"))
                });
            });
        } else {
            if (!res) {
                callback(util.convertToResponse({err: 'User is not registered with us'}, null, 'User is not registered with us'));
            } else {
                callback(util.convertToResponse({err: 'something broke please try again later'}, null, 'something broke please try again later'));
            }
        }
    })

};

loginUtil.resetPassword = function (token, password, callback) {
    var md5Pwd = md5(password);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(FORGOT_LINK);
    collection.findOne({link: token}, function (res) {
        if (res.data) {
            var id = res._id;
            userUtil.saveCred(id, md5Pwd, function (result) {
                collection.deleteOne({link: token}, function (err, result) {
                    callback(util.convertToResponse(err, result, 'Error occured while exoiring link'));
                });
            })
        } else {
            callback(res);
        }
    })
};
module.exports = loginUtil;