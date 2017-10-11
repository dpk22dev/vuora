/**
 * Created by vinay.sahu on 10/7/17.
 */
var mongo = require('./../config/mongo');
var elastic = require('./elasticSearchUtil');
var USER_COLLECTION = "user";
var USER_TAG_COLLECTION = "usertag";
var USER_CRED = "usercred";

function User(id, name, image, organisations, colleges) {
    this._id = id;
    this.name = name;
    this.image = image;
    this.organisations = organisations;
    this.colleges = colleges;
}

function Organisation(title, company, location, from, to, current) {
    this.title = title;
    this.company = company;
    this.location = location;
    this.from = from;
    this.to = to;
    this.current = new Boolean(current);
}

function UserCredentials(id, pwd) {
    this._id = id;
    this.pwd = pwd;
}

function College(title, degree, tags, grade, from, to) {
    this.title = title;
    this.degree = degree;
    this.tags = tags;
    this.grade = grade;
    this.from = from;
    this.to = to;
}

function UserTag(id, tag, rating) {
    this.id = id;
    this.tag = tag;
    this.rating = rating;
}
var userUtil = {};

userUtil.createUser = function (id, name, image, organisations, colleges, callback) {
    var user = new User(id, name, image, organisations, colleges);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_COLLECTION);
    collection.insertOne(user, function (err, res) {
        callback(err, res);
    });
};

userUtil.setTags = function (id, tag, rating, callback) {
    rating = rating || 0;
    var userTag = new UserTag(id, tag, rating);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_TAG_COLLECTION);
    collection.insertOne(userTag, function(err, res){
        callback(err, res);
    });
};

userUtil.addCollege = function (id, title, degree, tags, grade, from, to, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_COLLECTION);
    var college = new College(title, degree, tags, grade, from, to);
    userUtil.getUser(id, function (err, response) {
        if (response) {
            var colleges = response.colleges;
            colleges.push(college);
            collection.updateOne({_id: id}
                , {$set: {colleges: colleges}}, function (err, result) {
                    callback(err, result);
                });
        }
    });
};

userUtil.addOrganisation = function (id, title, company, location, from, to, current, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_COLLECTION);
    var org = new Organisation(title, company, location, from, to, current);
    userUtil.getUser(id, function (err, response) {
        if (response) {
            var orgs = response.organisations;
            orgs.push(org);
            collection.updateOne({_id: id}
                , {$set: {organisations: orgs}}, function (err, result) {
                    callback(err, result);
                });
        }
    });
};

userUtil.updateUser = function (user, callback) {
    collection.updateOne({_id: user._id}
        , {
            $set: {
                organisations: user.organisations,
                colleges: user.colleges,
                name: user.name,
                image: user.image
            }
        }, function (err, result) {
            callback(err, result);
        });
};

userUtil.getUser = function (id, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_COLLECTION);
    collection.findOne({_id: id}, function (err, res) {
        callback(err, res);
    })
};

userUtil.saveCred = function (id, pwd, callback) {
    var userCred = new UserCredentials(id, pwd);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CRED);
    collection.insertOne(userCred, function(err, res){
        callback(err, res);
    });
};

userUtil.getCred = function (id, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CRED);
    collection.findOne({_id: id}, function (err, res) {
        callback(err, res);
    })
};
userUtil.getTagSuggestion = function (tag, callback) {
    var query =
        {
            "query": {
                "regexp": {
                    "name": {
                        "value": tag,
                        "flags": "INTERSECTION|COMPLEMENT|EMPTY"
                    }
                }
            }
        };
    elastic.search("vuora", "tags", query, function (err, res) {
        var suggestions = [];
        if (res) {
            if (res) {
                res.forEach(function (obj) {
                    var suggestion = {};
                    suggestion.val = obj._source.name;
                    suggestions.push(suggestion);
                })
            }
        }
        callback(err, suggestions);
    })
};
module.exports = userUtil;


