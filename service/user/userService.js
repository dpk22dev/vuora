/**
 * Created by vinay.sahu on 10/7/17.
 */
var mongo = require('./../../lib/mongo');
var Long = require('mongodb').Long;
var elastic = require('./../../lib/elasticSearchWrapper');
var utils = require('./../../lib/util');
var ES_INDEX = 'vuora';
var ES_USER_TYPE = 'users';
var ES_ACTIVITY_TYPE = 'activity';
var USER_COLLECTION = "user";
var USER_TAG_COLLECTION = "usertag";
var USER_CRED = "usercred";

function User(id, fid, name, title, desc, image, organisations, colleges) {
    this.userId = id;
    this.fId = fid;
    this.name = name;
    this.title = title;
    this.desc = desc;
    this.image = image;
    this.organisations = organisations;
    this.colleges = colleges;
}

function Organisation(title, company, location, from, to, current) {
    this.title = title;
    this.company = company;
    this.location = location;
    this.from = Long.fromNumber(from);
    this.to = Long.fromNumber(to);
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
    this.from = Long.fromNumber(from);
    this.to = Long.fromNumber(to);
}

function UserTag(id, tag, rating) {
    this.userId = id;
    this.tag = tag;
    this.rating = rating;
}

function updateToElastic(index, type, id, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_TAG_COLLECTION);
    var tags = [];
    collection.find({userId: id}).toArray(function (err, results) {
        results.forEach(function (result) {
            var tag = result.tag;
            if (tags.indexOf(tag) < 0) {
                tags.push(tag);
            }
        });
        userUtil.getUser(id, function (result) {
            if (result.data) {
                result.data.tags = tags;
                elastic.update(index, type, id, result.data, function (err, res) {
                    callback(utils.convertToResponse(err, res, 'Unable to update doc in ES'));
                });
            } else {
                callback(result);
            }
        })
    });
}
var userUtil = {};

userUtil.createUser = function (id, fid, name, image, organisations, colleges, callback) {
    var user = new User(id, fid, name, null, null, image, organisations, colleges);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_COLLECTION);
    collection.insertOne(user, function (err, res) {
        if (err) {
            callback(utils.convertToResponse(err, result, "Error occured while updating to Mongo"))
        } else {
            updateToElastic(ES_INDEX, ES_USER_TYPE, id, function (err, result) {
                if (result) {
                    result = user;
                }
                callback(utils.convertToResponse(err, result, "Error occured while updating to ES"))
            });
        }
    });
};

userUtil.setTags = function (id, tag, rating, callback) {
    rating = rating || 0;
    var userTag = new UserTag(id, tag, rating);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_TAG_COLLECTION);
    collection.insertOne(userTag, function (err, res) {
        if (err) {
            callback(utils.convertToResponse(err, res, "Error occured while saving to mongo"));
        } else {
            updateToElastic(ES_INDEX, ES_USER_TYPE, id, function (res) {
                if (res.data) {
                    res = {data: 'Successfully inserted'};
                }
                callback(res);
            });
        }
    });
};

userUtil.setCollege = function (id, colleges, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_COLLECTION);
    collection.updateOne({userId: id}
        , {$set: {colleges: colleges}}, {upsert: true, safe: false}, function (err, result) {
            if (result) {
                updateToElastic(ES_INDEX, ES_USER_TYPE, id, function (err, result) {
                    callback(utils.convertToResponse(err, result, "error occured while saving to ES"));
                });
            } else {
                callback(utils.convertToResponse(err, result, "error occured while saving to mongo"))
            }
        });
};

userUtil.getTags = function (id, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_TAG_COLLECTION);
    collection.find({userId: id}).toArray(function (err, results) {
        callback(utils.convertToResponse(err, results, "Error occured while getting tags from mongo"));
    });
};

userUtil.setOrganisation = function (id, organisations, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_COLLECTION);
    collection.updateOne({userId: id}
        , {$set: {companies: organisations}}, {upsert: true, safe: false}, function (err, result) {
            if (result) {
                updateToElastic(ES_INDEX, ES_USER_TYPE, id, function (err, result) {
                    callback(utils.convertToResponse(err, result, "error occured while saving to ES"));
                });
            } else {
                callback(utils.convertToResponse(err, result, "error occured while saving to mongo"))
            }
        });
};

userUtil.updateUser = function (id, user, callback) {
    var update = {};
    if (user.organisations) {
        update.organisations = user.organisations;
    }
    if (user.colleges) {
        update.colleges = user.colleges;
    }
    if (user.name) {
        update.name = user.name;
    }
    if (user.image) {
        update.image = user.image;
    }
    if (user.title) {
        update.title = user.title;
    }
    if (user.desc) {
        update.desc = user.desc;
    }
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_COLLECTION);
    collection.updateOne({userId: id}
        , {
            $set: update
        }, function (err, result) {
            if (err) {
                callback(utils.convertToResponse(err, result, "Error occured while updating result to mongo"))
            } else {
                updateToElastic(ES_INDEX, ES_USER_TYPE, id, function (result) {
                    if (result.data) {
                        result.data = user;
                    }
                    callback(result)
                });
            }
        });
};

userUtil.updateUserTitleDesc = function (user, callback) {
    collection.updateOne({userId: user.id}
        , {
            $set: {
                title: user.title,
                desc: user.desc,
                name: user.name,
                image: user.image
            }
        }, function (err, result) {
            if (err) {
                callback(utils.convertToResponse(err, result, "Error occured while updating result to mongo"))
            } else {
                updateToElastic(ES_INDEX, ES_USER_TYPE, user._id, function (err, result) {
                    if (result) {
                        result = user;
                    }
                    callback(utils.convertToResponse(err, result, "Error occured while updating result to mongo"))
                });
            }
        });
};

userUtil.getUser = function (id, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_COLLECTION);
    collection.findOne({userId: id}, function (err, res) {
        callback(utils.convertToResponse(err, res, "Error occured while getting user data from mongo"));
    })
};

userUtil.saveCred = function (id, pwd, callback) {
    var userCred = new UserCredentials(id, pwd);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CRED);
    collection.insertOne(userCred, function (err, res) {
        callback(utils.convertToResponse(err, res, 'Unable to save cred'));
    });
};

userUtil.getCred = function (id, callback) {
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CRED);
    collection.findOne({_id: id}, function (err, res) {
        callback(utils.convertToResponse(err, res, 'Unable to get cred'));
    })
};

userUtil.saveUserActivity = function (data, callback) {
    elastic.index(ES_INDEX, ES_ACTIVITY_TYPE, data, callback);
};

/*userUtil.getTagSuggestion = function (tag, callback) {
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
 elastic.search(ES_INDEX, ES_USER_TYPE, query, function (err, res) {
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
 };*/

userUtil.getTagSuggestion = function (tag, callback) {
    var url = 'https://stackoverflow.com/filter/tags?q=' + tag + '&newstyle=true&_=' + new Date().getTime();
    utils.get(url, function (err, data) {
        callback(utils.convertToResponse(err, data, "Error occured while getting tag"));
    })
};
module.exports = userUtil;


