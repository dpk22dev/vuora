/**
 * Created by vinay.sahu on 10/8/17.
 */
var winston = require('winston');
var path = require('path');
var appDir = process.env.PWD + '/../';
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.File({filename: appDir + '/error.log', level: 'error'}),
        new winston.transports.File({filename: appDir + '/combined.log'})
    ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger;