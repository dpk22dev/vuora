/**
 * Created by vinay.sahu on 10/7/17.
 */
var format = require('string-format');
var userUtil = require('./user');
var http = require('./util');

var lOauth1 = {
    uri: "https://www.linkedin.com/uas/oauth2/accessToken?grant_type=authorization_code&redirect_uri={}&client_id={}&client_secret={}&code={}&state={}",
    rediectUri: "http://localhost:3000/chat/lclbk",
    clientId: "81q35viopx4tzm",
    clientSecret: "D1OhB9hOolFQrSed",
    state: "DCEeFWf45A53sdfKef424"
};

var lOAuthTokenUrl = "https://api.linkedin.com/v1/people/~:(id,first-name,email-address,last-name,headline,picture-url,industry,summary,specialties,positions:(id,title,summary,start-date,end-date,is-current,company:(id,name,type,size,industry,ticker)),educations:(id,school-name,field-of-study,start-date,end-date,degree,activities,notes),associations,interests,num-recommenders,date-of-birth,publications:(id,title,publisher:(name),authors:(id,name),date,url,summary),patents:(id,title,summary,number,status:(id,name),office:(name),inventors:(id,name),date,url),languages:(id,language:(name),proficiency:(level,name)),skills:(id,skill:(name)),certifications:(id,name,authority:(name),number,start-date,end-date),courses:(id,name,number),recommendations-received:(id,recommendation-type,recommendation-text,recommender),honors-awards,three-current-positions,three-past-positions,volunteer)?format=json&oauth2_access_token={}";

var saveData = function (data) {
    data = JSON.parse(data);
    var user = {
        id: data.emailAddress,
        name: data.firstName + " " + data.lastName,
        image: data.pictureUrl
    };

    var orgs = data.positions.values;
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
    userUtil.createUser(user.id, user.name, user.image, orgnisations, []);
};

exports.getProfile = function (code) {
    var authTokenUrl = format(lOauth1.uri, lOauth1.rediectUri, lOauth1.clientId, lOauth1.clientSecret, code, lOauth1.state);
    http.get(authTokenUrl, function (err, res) {
        var resData = JSON.parse(res);
        var token = resData.access_token;
        lOAuthTokenUrl = format(lOAuthTokenUrl, token);
        http.get(lOAuthTokenUrl, function (err, res) {
            saveData(res);
        })
    });
};

