/**
 * Created by vinay.sahu on 10/10/17.
 */
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var Mustache = require('mustache');

var transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    auth: {
        user: 'vinaysahuca@gmail.com',
        pass: 'vinay!@#'
    }
}));

var mailOptions = {
    from: 'support.vuora@gmail.com',
    to: 'myfriend@yahoo.com',
    subject: 'Vuora:Password Reset',
    text: 'please click to following link to reset your password : http://localhost:3000/users/passwordreset/'
};

exports.sendMailWithText = function (data, callback) {
    mailOptions.to = data.mailid;
    mailOptions.text = data.text;
    transporter.sendMail(mailOptions, callback);
};

exports.sendMailWithHtml = function (mustache, data, callback) {
    var output = Mustache.render(mustache, data);
    mailOptions.to = data.mailid;
    mailOptions.html = output;
    transporter.sendMail(mailOptions, callback);
};