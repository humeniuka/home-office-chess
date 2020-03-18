#!/usr/bin/env node
'use strict';
const fs = require("fs");
const path = require("path");
const url = require("url");
const mime = require("mime");
const https = require("https");
const WebSocket = require("ws");

// documents are served from this folder and below
const root = path.join(__dirname, "public/");

const args = process.argv.slice(2);
if (args.length < 2) {
    var prog = path.basename(process.argv[1]);
    console.log("\
missing required arguments!\n\
\n\
Usage:  %s  keyDir  port\n\
\n\
 Starts a secure webserver server listening on the given `port` (int). The private\n\
 key and certificate are taken from the directory `keyDir` (path).\n\
\n\
Example:\n\
   %s  /etc/letsencrypt/live/site.com  8085\n\
\n\
", prog, prog);
    process.exit(1);
    
}
const keyDir = args[0];
const port = args[1];

// load SSL certificate
try {
    var privateKey = fs.readFileSync(path.join(keyDir, "privkey.pem"), "utf8");
    var certificate = fs.readFileSync(path.join(keyDir, "fullchain.pem"), "utf8");
} catch (err) {
    console.log("Could not load private key and certificate from dictory " + keyDir + "!");
    console.log(err);
}

var options =  { key: privateKey, cert: certificate };
var httpsServer = https.createServer(options, (request, response) => {
    // sanitize URL
    var filePath = url.parse(request.url).pathname;
    sendFileSafe(filePath, response);
});

function sendFileSafe(filePath, res) {
    // check for strange character
    if (filePath.indexOf('\0') !== -1) {
	res.statusCode = 400;
	res.end("Bad Request");
	return;
    }
    var absPath = path.normalize(path.join(root, filePath));
    if (absPath.indexOf(root) !== 0) {
	// The requested file does not lie within the root directory
	res.statusCode = 404;
	res.end("File not found");
	return;
    }
    sendFile(absPath, res);
}

function sendFile(filePath, res) {
    fs.readFile(filePath, function(err, data) {
	if (err) {
	    res.statusCode = 404;
	    res.end("File not found");
	    return;
	}
	var mimeType = mime.lookup(filePath);
	res.setHeader('Content-Type', mimeType + ";charset=utf-8");
	res.end(data);
    });
}    
				     
// start our server
try {
    httpsServer.listen(port, () => {
	console.log(`Secure static web server running on port: ${port}`);
    });
} catch (err) {
    console.log("ERROR: " + err);
}
