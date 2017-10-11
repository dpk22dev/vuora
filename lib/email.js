/**
 * Created by vinay.sahu on 10/10/17.
 */
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

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

exports.sendMail = function (mailid, pwd, callback) {
    mailOptions.to = mailid;
    mailOptions.text = mailOptions.text + pwd;
    transporter.sendMail(mailOptions, callback);
};