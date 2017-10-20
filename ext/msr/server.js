// http://127.0.0.1:9001
// http://localhost:9001

var isUseHTTPs = false;

var server = require(isUseHTTPs ? 'https' : 'http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');

var isWin = !!process.platform.match(/^win/);

function serverHandler(request, response) {
    var uri = url.parse(request.url).pathname;

    if (isWin) {
        filename = path.join(process.cwd() + '\\demos\\', uri);

        if (filename.indexOf('MediaStreamRecorder.js') !== -1) {
            filename = filename.replace('\\demos\\', '\\');
        }
    }
    else {
        filename = path.join(process.cwd() + '/demos/', uri);

        if (filename.indexOf('MediaStreamRecorder.js') !== -1) {
            filename = filename.replace('/demos/', '/');
        }
    }

    fs.exists(filename, function (exists) {
        if (!exists) {
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            response.write('404 Not Found: ' + filename + '\n');
            response.end();
            return;
        }

        if (filename.indexOf('favicon.ico') !== -1) {
            return;
        }

        if (fs.statSync(filename).isDirectory() && !isWin) {
            filename += '/index.html';
        } else if (fs.statSync(filename).isDirectory() && !!isWin) {
            filename += '\\index.html';
        }

        fs.readFile(filename, 'binary', function (err, file) {
            if (err) {
                response.writeHead(500, {
                    'Content-Type': 'text/plain'
                });
                response.write(err + '\n');
                response.end();
                return;
            }

            var contentType;

            if (filename.indexOf('.html') !== -1) {
                contentType = 'text/html';
            }

            if (filename.indexOf('.js') !== -1) {
                contentType = 'application/javascript';
            }

            if (contentType) {
                response.writeHead(200, {
                    'Content-Type': contentType
                });
            } else response.writeHead(200);

            response.write(file, 'binary');
            response.end();
        });
    });
}

var app;

if (isUseHTTPs) {
    var options = {
        key: fs.readFileSync(path.join(__dirname, 'fake-keys/privatekey.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'fake-keys/certificate.pem'))
    };
    app = server.createServer(options, serverHandler);
} else app = server.createServer(serverHandler);

app = app.listen(process.env.PORT || 9001, process.env.IP || "0.0.0.0", function () {
    var addr = app.address();
    console.log("Server listening at", addr.address + ":" + addr.port);
});
