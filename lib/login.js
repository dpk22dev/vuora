/**
 * Created by vinay.sahu on 10/10/17.
 */
var md5 = require('md5');
var mongo = require('./../config/mongo');
var userUtil = require('./userUtil');
var randomstring = require("randomstring");
var emailService = require('./email');

var loginUtil = {};

loginUtil.signUp = function (user) {
    var id = user.emailid;
    var pwd = user.password;
    var name = user.name;
    var image = user.image;
    pwd = md5(pwd);
    userUtil.createUser(id, name, image, [], []);
    userUtil.saveCred(id, pwd);
};

loginUtil.signIn = function (user, callback) {
    var id = user.emailid;
    var pwd = user.password;
    userUtil.getCred(id, function (err, res) {
        if (res && res != null) {
            var md5pwd = res.password;
            var createdMd5 = md5(pwd);
            if (md5pwd === createdMd5) {
                userUtil.getUser(id, callback);
            } else {
                callback({error: 'either username or password is incorrect'}, null);
            }
        } else {
            callback({error: 'provided emailid doesnot found in DB.'}, null);
        }
    });
};

loginUtil.forgotPassword = function (id) {
    var newPwd = randomstring.generate(7);
    var md5Pwd = md5(newPwd);
    userUtil.saveCred(id, md5Pwd);
    emailService.sendMail(id, newPwd);
};
