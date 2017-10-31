//var customLogger = require('./../config/logger');
process.env.NODE_CONFIG_DIR = '../config';
const customConfig = require('config');

const fse = require('fs-extra')
const klawSync = require('klaw-sync')
const path = require("path");

var processor = {};
processor.processAsync = function ( ) {
    /*
    keeps on creating in/out dir; some bug
     */
    const uploadDir = customConfig.get('f2f.uploadsPath')

    fse.ensureDir( uploadDir ).then( function ( ok ) {
        return fse.ensureDir( uploadDir+'/in' );
    }).then( function ( ok ) {
        return fse.ensureDir( uploadDir+'/out' );
    }).then( function ( ok ) {
        const files = klawSync( uploadDir , {nodir: true})
        files.forEach( function(fileObj ){
            var fileName = path.basename( fileObj.path );
            var dirName = path.dirname( fileObj.path  );
            // filename: videoId;userId;datetime;.webm
            var info = fileName.split(';');
            var inVideoDir = dirName + '/in/' + info[0];
            var destFile = inVideoDir+'/'+fileName;
            fse.ensureDir( inVideoDir ).then( function ( ok ) {
                fse.copy( fileObj.path, destFile, { overwrite: true } ).then( function ( ok ) {}, function (err) { console.log( "error while transferring file!" + err ) });
            });
        } );

    }, function ( err ) {
        console.log( "error:" + err );
    })

    //only after every promise is done

};

processor.processSync = function () {
    const uploadDir = customConfig.get('f2f.uploadsPath');
    fse.ensureDirSync( uploadDir+'/in' );
    fse.ensureDirSync( uploadDir+'/out' );

    const files = klawSync( uploadDir , {nodir: true});
    files.forEach( function(fileObj ) {
        var fileName = path.basename(fileObj.path);
        var dirName = path.dirname(fileObj.path);
        // filename: videoId;userId;datetime;.webm
        var info = fileName.split(';');
        var inVideoDir = dirName + '/in/' + info[0];
        var destFile = inVideoDir + '/' + fileName;

        fse.ensureDirSync(inVideoDir);

        fse.copySync(fileObj.path, destFile, {overwrite: true});
    });

    //check if its ok to merge files for this videoId
    //for each dir in /in
    // //ffmpeg merge files into  .merged file
    //create dir with same videoID name in /out
    //put merged file there
    //move in dir to out/videoId



}

module.exports = processor;

processor.processSync();