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
    text: 'your new password is '
};

exports.sendMail = function (mailid, pwd) {
    mailOptions.to = mailid;
    mailOptions.text = mailOptions.text + pwd;
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};