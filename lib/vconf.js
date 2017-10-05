var HashMap = require('hashmap');

var vconfs = {};
var questionmap = new HashMap();
var questionvaluemap = new HashMap();
var usernames = [];
var confs = [];

exports.getQuestionMap = function (vconf) {
    var response = [];
    var questions = vconfs[vconf];
    if (questions) {
        questions.forEach(function (questionId) {
            var question = {};
            question.id = questionId;
            question.question = questionmap.get(questionId);
            question.value = questionvaluemap.get(questionId);
            response.push(question);
        });
    }
    return response;
};

exports.addUser = function (userName) {
    usernames[userName] = userName;
};

exports.addQuestionToVConf = function (vconf, id, data) {
    questionmap.set(id, data);
    questionvaluemap.set(id, 0);
    var questions;
    if (vconfs[vconf]) {
        questions = vconfs[vconf];
        questions.push(id);
    } else {
        questions = [];
        questions.push(id);
    }
    vconfs[vconf] = questions;
};

exports.vote = function (data) {
    if (data) {
        var id = data.id;
        var value = questionvaluemap.get(id) || 0;
        if ('upvote' === data.action.trim().toString()) {
            value++;
        } else {
            value--;
        }
    }
    questionvaluemap.set(id, value);
};

exports.disconnectUser = function (userName) {
    delete usernames[userName];
};