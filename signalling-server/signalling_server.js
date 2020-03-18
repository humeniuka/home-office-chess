#!/usr/bin/env node
'use strict';
const fs = require("fs");
const path = require("path");
const https = require("https");
const WebSocket = require("ws");
const uuid = require("uuid");

const args = process.argv.slice(2);
if (args.length < 2) {
    var prog = path.basename(process.argv[1]);
    console.log("\
missing required arguments!\n\
\n\
Usage:  %s  keyDir  port\n\
\n\
 Starts a secure signalling server listening on the given `port` (int). The private\n\
 key and certificate are taken from the directory `keyDir` (path).\n\
\n\
Example:\n\
   %s  /etc/letsencrypt/live/site.com  9000\n\
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

var credentials =  { key: privateKey, cert: certificate };
var httpsServer = https.createServer(credentials);

// initialize the WebSocket server instance
const wss = new WebSocket.Server(
    {
	server: httpsServer
    }
);

class Room {
    constructor(name) {
	// name of the chat room
	this.name = name;
	// map user IDs to names of users
	this.users = {};
	// map users' IDs to websockets associated with each user
	this.connections = {};
	// list of messages in the chat, each message is an object
	//  { user: '<The user name>', data: '<some text>', date: '<time when the message was sent>' }
	this.transcript = [];
    }
}

//
let rooms = {};

const sendTo = (connection, message) => {
    var msg = JSON.stringify(message);
    connection.send(msg);
}

// broadcast a message to all connected users in the same room
const sendToAll = (message) => {
    var room = rooms[message.room];
    var msg = JSON.stringify(message);
    for (var userID in room.connections) {
	room.connections[userID].send(msg);
    }
};

wss.on("connection", ws => {
    ws.on("message", str => {
	let data;
	// accepting only JSON messages
	try {
	    var msg = JSON.parse(str);
	} catch(e)  {
	    console.log(str);
	    console.log(`Invalid JSON: $str`);
	    return;
	}
	switch(msg.type) {
	case 'join':
	    // User requests to join the conversion in a room by sending a JSON string:
	    //   {"type": "join", "user": "<real name of user>", "room": "<name of room to join>"}
	    // A unique ID is generated which the user has to send to identify himself
	    // in future calls.
	    console.log("join");
	    if ((msg.user !== undefined) && (msg.room !== undefined)) {
		var roomName = msg.room;
		if (rooms[roomName] === undefined) {
		    // add new room
		    rooms[roomName] = new Room(roomName);
		}
		var room = rooms[roomName];

		// save connection
		const id = uuid.v4();
		room.users[id] = msg.user;
		room.connections[id] = ws;
		sendToAll(
		    {
			type: "notification",
			room: msg.room,
			data: `${msg.user} joined the conversation.`
		    });
		// send new user the transcript of the conversation
		// and tell him his ID and the names of the other connected users
		let userNames = [];
		for (var userID in room.users) {
		    userNames.push(room.users[userID]);
		}
		sendTo(ws, 
		       {
			   id    : id,
			   type  : "transcript",
			   data  : room.transcript,
			   users : userNames
		       });
	    }
	    break;
	case 'leave':
	    // User sent a JSON string to signal that she wants to leave the chat:
	    //   {"type": "leave", "room": "<name of room to leave>", "user": "<real name of user>", "id": "<The user ID obtained during login>"}
	    console.log("leave room " + msg.room);
	    var room = rooms[msg.room];
	    console.log("room (object) = " + room);
	    console.log("msg.id = " + msg.id);
	    console.log("room.connections[msg.id] = " + room.connections[msg.id]);
	    if ((room !== undefined) && (room.connections[msg.id] !== undefined)) {
		console.log("  send signal that user " + msg.user + " leaves to everyone");
		sendToAll(
		    {
			type: "notification",
			room: msg.room,
			data: `${msg.user} left the conversation.`
		    });
		delete room.connections[msg.id];
		delete room.users[msg.id];
	    }
	    break;
	case 'message':
	    // User sent a JSON string with a message to all other users:
	    //   {"type": "message", "user": "<real name of user>", "id": "<The user ID obtained during login>", "data": "<The message sent to the group>"}
	    console.log("message " + msg);
	    console.log("Room room = " + msg.room);
	    console.log(rooms[msg.room]);
	    var room = rooms[msg.room];
	    if ((room === undefined) || (room.connections[msg.id] === undefined)) {
		sendTo(ws,
		       {
			   type: "error",
			   data: "You have to send a login request \"{type: \"join\", room: \"name of room\", user: \"Your name\"}\" first."
		       });
		return;
	    }
	    if (msg.data !== undefined) {
		room.transcript.push(
		    {user: msg.user,
		     data: msg.data,
		     date: Date()
		    });
		// only keep the last 100 messages
		if (room.transcript.length > 100) {
		    // remove the first item
		    room.transcript.shift();
		}
		// broadcast message to all connected users
		sendToAll(
		    {
			type: "message",
			room: msg.room,
			user: msg.user,
			data: msg.data,
			date: Date()
		    });
	    }
	    break;
	default:
	    console.log(`Unknown message type ${msg.type}`);
	}
    });
});


// start our server
try {
    httpsServer.listen(port, () => {
	console.log(`Signalling server running on port: ${port}`);
    });
} catch (err) {
    console.log("ERROR: " + err);
}
