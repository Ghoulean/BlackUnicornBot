'use strict';

const ytdl = require('ytdl-core');
const fs = require('fs');
const request = require('request');
const EventEmitter = require('events');

var utils = require('./../utils.js');
var config = require('./../config.json');

class _Player extends EventEmitter {
	constructor(){
		super();
		this.bot = null;
		this.connection = null;
		this.dispatcher = null;
		this.isPlaying = null;
	}
	
	play(entry) {	
		if (!this.bot || !this.connection) {
			console.log('error, bot or connection not set');
			return;
		}
	
		this.setPlaying(entry);
		let stream;
		
		if (entry.type == 'youtube') {
			stream = ytdl('https://www.youtube.com/watch?v=' + entry.song, {filter: 'audioonly'});
			this.dispatcher = this.connection.playStream(stream, {volume: 0.15});
			stream.on('error', (e) => {
				console.log(this.getCurrentTime());
				console.log(`YT stream error: ${e}`);
				this.dispatcher.end();
			});

			stream.on('end', (e) => {
				console.log('Video ended', e);
				//this.dispatcher.end();
			});
		} else if (entry.type == 'mp3file') {
			if (!fs.existsSync('songs/' + entry.song + '.mp3')) {
				console.log('error: try to play song that no longer exists');
				this.finishSong('song does not exist');
				return;
			}
			this.dispatcher = this.connection.playFile('songs/' + entry.song + '.mp3', {volume: 0.15});
		}
			
		this.dispatcher.on('end', (e) => {
			console.log(this.getCurrentTime());
			console.log('dispatcher end', e);
			this.finishSong(e);
        });

        this.dispatcher.on('error', (e) => {
			console.log(this.getCurrentTime());
            console.log('Discord voice chat error', e);
			this.dispatcher.end();
        });

		this.dispatcher.on('error', (e) => {
			console.log('error in Player.js:', e);
		});
	}
	
	pause() {
		if (this.dispatcher) {
			this.dispatcher.pause();
		}
	}
	
	resume() {
		if (this.dispatcher) {
			this.dispatcher.resume();
		}
	}
	
	finishSong(e) {
		this.dispatcher = null;
		this.setPlaying(null);
		this.emit('finishSong');
	}
	
	getCurrentTime() {
		if (!this.dispatcher) {
			return -1;
		} else {
			return Math.ceil(this.dispatcher.time/1000);
		}
	}
	
	getPlaying() {
		return this.isPlaying;
	}
	
	setPlaying(b) {
		this.isPlaying = b;
		if (b) {
			this.bot.user.setGame(`${config.misc.playing_intro}${b.displayName}`);
		} else {
			this.bot.user.setGame(null);
		}
	}
	
	setBot(bot) {
		this.bot = bot;
	}
	
	setConnection(connection) {
		this.connection = connection;
	}
}

var Player = new _Player();

module.exports = Player;