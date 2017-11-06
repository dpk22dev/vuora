/**
 * Created by vinay.sahu on 11/4/17.
 */
var util = require('./util');
var i = 0;
var getTag = function () {
    i++;
    var url = 'https://stackoverflow.com/filter/tags?q=backen&newstyle=true&_=' + new Date().getTime();
    util.get(url, function (err, result) {
        if (err) {
            console.log(i + "" + err);
        } else {
            console.log(i + "" + result);
        }
    })
};

var dt = function () {
    var d1 = new Date();
    var d2 = new Date("November 23, 2018 01:23:00");

    var h = d2.getHours();
    var m = d2.getMinutes();
    var s = d2.getSeconds();
    var ms = d2.getMilliseconds();
    console.log(d1);
    d1.setHours(h);
    d1.setMinutes(m);
    d1.setSeconds(s);
    console.log(d1);
};
dt();