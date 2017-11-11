/**
 * Created by vinay.sahu on 10/7/17.
 */

var format = require('string-format');
var userUtil = require('./../service/user/userService');
var http = require('./util');
var config = require('config');
var logger = require('./../config/logger');

var saveData = function (data, callback) {
    logger.log('parsing data to USER format');
    data = JSON.parse(data);
    var user = {
        id: data.emailAddress,
        name: data.firstName + " " + data.lastName,
        image: data.pictureUrl
    };

    var orgs = data.positions.values || [];
    var orgnisations = [];
    orgs.forEach(function (org) {
        var object = {};
        object.title = org.title;
        object.company = org.company.name;
        object.location = org.company.location;
        object.from = org.startDate.month + "/" + org.startDate.year;
        object.current = org.isCurrent;
        if (!object.current) {
            object.to = org.endDate.month + "/" + org.endDate.year;
        }
        orgnisations.push(object);
    });
    userUtil.createUser(user.id, null, user.name, user.image, orgnisations, []);
    callback(user);
};

exports.getProfile = function (code, callback) {
    logger.log('info', 'Getting linkedin profile');
    var authTokenUrl = format(config.get(linkedin.oauth1uri), config.get(linkedin.redirectionuri), config.get(linkedin.clientid), config.get(linkedin.clientsecret), code, config.get(linkedin.state));
    http.get(authTokenUrl, function (err, res) {
        if (res) {
            var resData = JSON.parse(res) || {};
            var token = resData.access_token;
            lOAuthTokenUrl = format(config.get(linkedin.oauth2uri), token);
            http.get(lOAuthTokenUrl, function (err, res) {
                if (res) {
                    logger.log('info', "linkedIn profile retrieved storing to DB");
                    saveData(res, callback);
                } else {
                    logger.log('info', "Error occuered while getting linkedin profile" + err);
                }
            })
        } else {
            logger.log('info', "Error occuered while getting linkedin profile" + err);
        }
    });
};

