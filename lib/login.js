/**
 * Created by vinay.sahu on 10/10/17.
 */
var md5 = require('md5');
var async = require('async');
var mongo = require('./mongo');
var path = require('path');
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
    var id = user.emailId;
    var pwd = user.password;
    var name = user.name;
    var image = user.image;
    pwd = md5(pwd);
    userUtil.getUser(id, function (err, res) {
        if (!res) {
            async.parallel({
                one: function (callback) {
                    userUtil.createUser(id, name, image, [], [], callback)
                },
                two: function (callback) {
                    userUtil.saveCred(id, pwd, callback)
                }
            }, function (err, result) {
                if (result) {
                    callback(null, {status: 'successfully signed up'});
                } else {
                    callback(err, null);
                }
            });
        } else if (res) {
            callback({err: 'user already exists in DB'}, null);
        } else {
            callback({err: 'something broken please try again later'}, null);
        }

    });
};

loginUtil.signIn = function (user, callback) {
    var id = user.emailId;
    var pwd = user.password;
    userUtil.getCred(id, function (err, res) {
        if (res && res != null) {
            var md5pwd = res.pwd;
            var createdMd5 = md5(pwd);
            if (md5pwd === createdMd5) {
                userUtil.getUser(id, callback);
            } else {
                callback({err: 'either username or password is incorrect'}, null);
            }
        } else {
            callback({err: 'provided emailid doesnot found in DB.'}, null);
        }
    });
};

loginUtil.forgotPassword = function (id, callback) {
    userUtil.getUser(id, function (err, res) {
        if (res) {
            var name = res.name || id.substring(0, id.indexOf('@'));
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
                    callback(null, {status: 'link has been sent to mail'})
                });
            });
        } else {
            if (!res) {
                callback({err: 'User is not registered with us'}, null);
            } else {
                callback({err: 'something broke please try again later'}, null);
            }
        }
    })

};

loginUtil.resetPassword = function (token, password, callback) {
    var md5Pwd = md5(password);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(FORGOT_LINK);
    collection.findOne({link: token}, function (err, res) {
        if (res) {
            var id = res._id;
            userUtil.saveCred(id, md5Pwd, function (err, res) {
                collection.deleteOne({link: token}, callback);
            })
        } else {
            callback({err: 'Link is expired try again later'}, null);
        }
    })
};
module.exports = loginUtil;