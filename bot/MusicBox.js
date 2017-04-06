'use strict';

//Dependencies
const ytdl = require('ytdl-core');
const request = require('request');
const fs = require('fs');
const EventEmitter = require('events');

//Files
var config = require(`${__dirname}/../config.json`);
var utils = require(`${__dirname}/../utils.js`);

//Components
var Player = require('./Player.js');
var PlaylistHandler = require('./PlaylistHandler.js');
var QueueHandler = require('./QueueHandler.js');
var MetadataRetriever = require('./MetadataRetriever.js');

Player.on('playSong', (entry) => {
	this.play(entry.song, entry.type, entry.length, entry.displayName);
});

QueueHandler.on('retrieveMetadata', (songId, type, length, displayName) => {
	console.log('got metadata');
	let entry = {
		'song': songId,
		'type': type,
		'length': length,
		'displayName': displayName
	}
	console.log(entry);
	QueueHandler.addQueue(entry);
});

QueueHandler.on('finishSong', () => {
	if (!QueueHandler.isEmpty()){
		QueueHandler.emit('playSong', QueueHandler.getFirst());
	}
});

/*
class MusicBox extends EventEmitter {
	
	constructor() {
		super();
		this.Player = new _Player();
		this.PlaylistHandler = _PlaylistHandler;
		this.QueueHandler = _QueueHandler;
		this.playing = false;
		this.pause = false;
		this.connection = null;
		this.bot = null;
		
		this.Player.on('finishSong', (e) => {
			console.log('DEBUG: HEARD FINISH');
			if (!this.QueueHandler.isEmpty()) {
				console.log('TRYIN 2 PLAY');
				this.playSong();
			} else {
				console.log('empty');
			}
		});
		
	
	
	setBot(bot) {
		this.bot = bot;
	}
	
	setConnection(connection) {
		this.connection = connection;
	}
	
	playSong() {
		let firstQueue = this.QueueHandler.getFirst();
		this.Player.play(this.bot, this.connection, firstQueue.song, firstQueue.type);
	}
}

*/

module.exports = MusicBox;