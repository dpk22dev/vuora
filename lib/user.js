/**
 * Created by vinay.sahu on 10/7/17.
 */
var mongo = require('./../config/mongo');
var USER_COLLECTION = "user";
var USER_TAG_COLLECTION = "usertag";

function User(id, name, image, organisations, colleges) {
    this.id = id;
    this.name = name;
    this.image = image;
    this.organisations = organisations;
    this.colleges = colleges;
}

function Organisation(title, company, location, from, to, current, tags) {
    this.title = title;
    this.company = company;
    this.location = location;
    this.from = from;
    this.to = to;
    this.current = new Boolean(current);
    this.tags = tags;
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

userUtil.createUser = function (id, name, image, organisations, colleges) {
    var user = new User(id, name, image, organisations, colleges);
    var mongoDB = mongo.getInstance();
    var collection = mongoDB.collection(USER_COLLECTION);
    collection.insertOne(user);
    return user;
};

userUtil.setTags = function (id, tag, rating) {
    rating = rating || 0;
    var userTag = new UserTag(id, tag, rating);
    var collection = mongoDB.collection(USER_TAG_COLLECTION);
    collection.insertOne(userTag);
    return userTag;
};

userUtil.addEducation = function (id, education) {
    var collection = mongoDB.collection(USER_COLLECTION);
    var findObj = {};
    findObj._id = id;
    collection.fin
};

module.exports = userUtil;


