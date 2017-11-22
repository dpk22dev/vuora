/**
 * Created by vinay.sahu on 10/7/17.
 */
var mongo = require('./../../lib/mongo');
var Long = require('mongodb').Long;
var userIdUtil = require('./../../lib/userIdUtil');
var elastic = require('./../../lib/elasticSearchWrapper');
var utils = require('./../../lib/util');
var ES_INDEX = 'vuora';
var ES_USER_TYPE = 'users';
var ES_ACTIVITY_TYPE = 'activity';
var USER_COLLECTION = "user";
var USER_TAG_COLLECTION = "usertag";
var USER_CRED = "usercred";
var FOLLOWS = "follows";

function User(id, fid, name, title, desc, image, organisations, colleges) {
    this.userId = Long.fromNumber(id);
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
    this._id = Long.fromNumber(id);
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
    this.userId = Long.fromNumber(id);
    this.tag = tag;
    this.rating = rating;
}

function Follows(primary, secondry) {
    this.primary = primary;
    this.secondry = secondry;
}

function updateToElastic(index, type, id, callback) {
    id = Long.fromNumber(id);
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

function getUserByTags(data, sort, callback) {
    var page = data.page || 1;
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_TAG_COLLECTION);
    collection.find({tags: data.tag}).sort({rating: sort}).skip(page).limit(10).toArray(function (err, results) {
        if (results) {
            var uids = [];
            results.forEach(function (result) {
                uids.push(result.userId);
            });
            async.map(uids, userUtil.getUser, callback);
        } else {
            callback(utils.convertToResponse(err, results, 'Error occured while getting response from DB'));
        }
    });
}

function getRelUserByTags(data, callback) {
    var dev = data.page || 1;
    var rate = data.rate || 5;
    var min = (rate - dev) >= 0 ? (rate - dev) : 0;
    var max = (rate + dev) <= 10 ? (rate + dev) : 10;
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_TAG_COLLECTION);
    collection.find({$and: [{"$gte": min}, {"$lte": max}]}).toArray(function (err, results) {
        if (results) {
            var uids = [];
            results.forEach(function (result) {
                uids.push(result.userId);
            });
            async.map(uids, userUtil.getUser, callback);
        } else {
            callback(utils.convertToResponse(err, results, 'Error occured while getting response from DB'));
        }
    })
}

var userUtil = {};

userUtil.createUser = function (id, fid, name, image, organisations, colleges, callback) {
    id = Long.fromNumber(id);
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
    id = Long.fromNumber(id);
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
    id = Long.fromNumber(id);
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
    id = Long.fromNumber(id);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_TAG_COLLECTION);
    collection.find({userId: id}).toArray(function (err, results) {
        callback(utils.convertToResponse(err, results, "Error occured while getting tags from mongo"));
    });
};

userUtil.setOrganisation = function (id, organisations, callback) {
    id = Long.fromNumber(id);
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
    id = Long.fromNumber(id);
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
    user.id = Long.fromNumber(user.id);
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
                updateToElastic(ES_INDEX, ES_USER_TYPE, user.id, function (err, result) {
                    if (result) {
                        result = user;
                    }
                    callback(utils.convertToResponse(err, result, "Error occured while updating result to mongo"))
                });
            }
        });
};

userUtil.getUser = function (id, callback) {
    id = Long.fromNumber(id);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_COLLECTION);
    collection.findOne({userId: id}, function (err, res) {
        callback(utils.convertToResponse(err, res, "Error occured while getting user data from mongo"));
    })
};

userUtil.saveCred = function (id, pwd, callback) {
    id = Long.fromNumber(id);
    var userCred = new UserCredentials(id, pwd);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CRED);
    collection.insertOne(userCred, function (err, res) {
        callback(utils.convertToResponse(err, res, 'Unable to save cred'));
    });
};

userUtil.getCred = function (id, callback) {
    id = Long.fromNumber(id);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_CRED);
    collection.findOne({_id: Long.fromNumber(id)}, function (err, res) {
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

userUtil.follows = function (data, callback) {
    var primary = data.primary;
    var secondry = data.secondry;
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(FOLLOWS);
    if (primary && secondry) {
        userIdUtil.getUIDArray([primary, secondry], function (err, result) {
            var follow = new Follows(result[primary], result[secondry]);
            collection.insertOne(follow, function (err, result) {
                callback(utils.convertToResponse(err, follow, 'Error occured while saving it to mongoDB'));
            })
        })
    } else {
        callback(utils.convertToResponse({err: "provided ids aren't correct"}, null, "provided ids aren't correct"));
    }
};

userUtil.search = function (data, callback) {
    var tags = data.tags;
    var page = data.page;
    var type = data.type;

    switch (type) {
        case "asc": {
            getUserByTags(data, 1, callback);
            break;
        }
        case "desc": {
            getUserByTags(data, -1, callback);
            break;
        }
        case "rel": {
            getRelUserByTags(data, callback);
            break;
        }
    }
};
module.exports = userUtil;


