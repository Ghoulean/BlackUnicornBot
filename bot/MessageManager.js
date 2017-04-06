'use strict';

//Dependencies
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

//Continue next song after current song finishes playing
var autoContinue = true;

Player.on('finishSong', () => {
	if (!QueueHandler.isEmpty() && autoContinue){
		let entry = QueueHandler.getFirst();
		if (entry) {
			Player.play(entry);
		}
	}
});

var commands = {
	help: {
		desc: 'List all commands',
		execute: (bot, msg, suffix) => {
			let sendMsg = [];
			sendMsg.push('Starred commands are only executable by whitelisted users only.');
			for (let key in commands) {
				let star = (commands[key].whitelist_only ? '*' : '');
				sendMsg.push(`${config.message.command_prefix}${key}${star}: ${commands[key].desc}`);
			}
			msg.channel.sendMessage('```' + sendMsg.join('\n') + '```');
		}
	},
	add: {
		desc: 'Add a song to the queue',
		execute: (bot, msg, suffix) => {
			msg.channel.startTyping();
			let processingFunc = null;
			
			if (youtubeVideoId(suffix)) { //Youtube URL
				suffix = youtubeVideoId(suffix);
				processingFunc = 'youtubeVideo';
			} else if (mp3File(suffix)) { //Locally hosted MP3 file
				suffix = mp3File(suffix);
				processingFunc = 'mp3';
			} else { //Search on YouTube
				//suffix = suffix;
				processingFunc = 'youtubeSearch';
			}
			
			MetadataRetriever[processingFunc](suffix)
				.then((entry) => {
					QueueHandler.addQueue(entry, msg.author.username);
					msg.channel.sendMessage('```' + `${msg.author.username} added ${entry.displayName} [${utils.formatSeconds(entry.length)}] to the queue.` + '```');
					msg.channel.stopTyping();
				})
				.catch((reason) => {
					msg.channel.sendMessage('```' + reason + '```');
					msg.channel.stopTyping(true);
				});
		}
	},
	play: {
		desc: 'Play songs in queue',
		execute: (bot, msg, suffix) => {
			
			if (Player.getPlaying()) {
				Player.resume();
				//msg.channel.sendMessage('```Already playing```');
			}
			
			autoContinue = true;
			Player.setBot(bot);
			
			//Go to voice channel
			let msgMember = msg.member;
			if (!msgMember) {
				msg.channel.sendMessage('```Error: Member not found.```');
				return;
			}
			let voiceChannel = msgMember.voiceChannel;
			if (!voiceChannel) {
				msg.channel.sendMessage('```Error: Must call command in voice channel.```');
				return;
			}
			
			//Play song
			voiceChannel.join()
				.then((connection) => { 
					
					Player.setConnection(connection);
					if (!Player.getPlaying()) {
						if (!QueueHandler.isEmpty()){
							//QueueHandler.emit('playSong', QueueHandler.getFirst());
							let entry = QueueHandler.getFirst();
							console.log(entry);
							Player.play(entry);
							//msg.channel.sendMessage('```Playing...```');
							commands.current.execute(bot, msg, suffix);
						} else {
							msg.channel.sendMessage('```Queue is empty.```');
						}
					}
					
				})
				.catch((e) => {
					console.log(e);
					msg.channel.sendMessage('```Cannot join voice channel (probably permissions?)```');
				});
		}
	},
	current: {
		desc: 'Get information on the currently playing song',
		execute: (bot, msg, suffix) => {
			if (!Player.getPlaying()) {
				msg.channel.sendMessage('```Not currently playing```');
				return;
			}
			msg.channel.sendMessage('```' + `Currently playing ${Player.getPlaying().displayName} [${utils.formatSeconds(Player.getCurrentTime())}/${utils.formatSeconds(Player.getPlaying().length)}]` + "```");
		}
	},
	pause: {
		desc: 'Pause the currently playing song',
		execute: (bot, msg, suffix) => {
			Player.pause();
			msg.channel.sendMessage('```Paused```');
		}
	},
	skip: {
		desc: 'Skip the currently playing song',
		execute: (bot, msg, suffix) => {
			let skipThis = Player.getPlaying();
			Player.pause();
			Player.finishSong('skip');
			msg.channel.sendMessage('```' + `Skipped ${skipThis.displayName}` + '```');
			commands.current.execute(bot, msg, suffix);
		}
	},
	stop: {
		desc: 'Stop playing',
		execute: (bot, msg, suffix) => {
			QueueHandler.clearQueue();
			autoContinue = false;
			Player.finishSong('manual');
			Player.setConnection(null);
			let voiceChannel = bot.voiceConnections.get(msg.guild.id).channel;
			if (voiceChannel) {
				voiceChannel.leave();
			}
		}
	},
	playlist: {
		desc: 'Queue a playlist',
		whitelist_only: true,
		execute: (bot, msg, suffix) => {
			suffix = utils.fmtFile(suffix);
			PlaylistHandler.getPlaylist(suffix)
				.then((list) => {
					for (let i = 0; i < list.length; i++) {
						QueueHandler.addQueue(list[i], 'playlist/'+suffix);
					}
					msg.channel.sendMessage('```Added the playlist ' + suffix + ' to the queue.```')
				})
				.catch((e) => {
					msg.channel.sendMessage('```' + e + '```');
				});
		}
	},
	createplaylist: {
		desc: 'Create a playlist',
		whitelist_only: true,
		execute: (bot, msg, suffix) => {
			suffix = utils.fmtFile(suffix);
			if (suffix.length < 1) {
				msg.channel.sendMessage('```Must specify a playlist name```');
				return;
			}
			PlaylistHandler.savePlaylist(QueueHandler.getQueue(), suffix)
				.then((resolve) => {
					msg.channel.sendMessage('```' + resolve + '```');
				});
		}
	},
	listplaylists: {
		desc: 'List all playlists',
		whitelist_only: true,
		execute: (bot, msg, suffix) => {
			PlaylistHandler.getAllPlaylists()
				.then((list) => {
					let sendMsg = [];
					for (let i = 0; i < list.length; i++){
						sendMsg.push(`${i+1}. ${list[i]}`);
					}
					msg.channel.sendMessage('```' + sendMsg.join('\n') + '```');
				})
				.catch((e) => {
					msg.channel.sendMessage('```' + e + '```');
				});
		}
	},
	queue: {
		desc: 'Look at the queue',
		execute: (bot, msg, suffix) => {
			if (QueueHandler.isEmpty()) {
				msg.channel.sendMessage('```Queue is empty```');
				commands.current.execute(bot, msg, suffix);
				return;
			}
			
			let queue = QueueHandler.getQueue();
			
			let sendMsg = [];
			let totalTime = Player.getCurrentTime();
			if (totalTime >= 0) {
				sendMsg.push(`Currently playing ${Player.getPlaying().displayName} [${utils.formatSeconds(Player.getCurrentTime())}/${utils.formatSeconds(Player.getPlaying().length)}]`);
				totalTime = parseInt(Player.getPlaying().length - totalTime);
			} else {
				totalTime = 0;
			}
			for (let i = 0; i < queue.length; i++){
				sendMsg.push(`${i+1}. ${queue[i].displayName} [${utils.formatSeconds(queue[i].length)}] @[${utils.formatSeconds(totalTime)}] --${queue[i].source}`);
				totalTime += parseInt(queue[i].length);
				if (i >= config.message.list_limit - 1) {
					sendMsg.push(`...and ${queue.length - i - 1} more`);
					break;
				}
			}
			msg.channel.sendMessage('```' + sendMsg.join('\n') + '```');
		}
	},
	remove: {
		desc: 'Remove a song from the queue',
		execute: (bot, msg, suffix) => {
			if (!suffix) {
				msg.channel.sendMessage('```Not a valid removal```');
				return;
			}
			let num = parseInt(suffix);
			if (num <= 0 || num > QueueHandler.getQueue().length) {
				msg.channel.sendMessage('```Not a valid removal```');
				return;
			}
			let removed = QueueHandler.getAt(num-1);
			if (!removed) {
				msg.channel.sendMessage('```' + `Error: not recognized` + '```');
				return;
			}
			QueueHandler.removeAt(num-1);
			msg.channel.sendMessage('```' + `Removed ${removed.displayName}` + '```');
		}
	},
	clear: {
		desc: 'Clear the queue',
		whitelist_only: true,
		execute: (bot, msg, suffix) => {
			QueueHandler.clearQueue();
			msg.channel.sendMessage('```Cleared queue```');
		}
	},
	listsongs: {
		desc: 'List all downloaded songs. Guarenteed high quality.',
		whitelist_only: true,
		execute: (bot, msg, suffix) => {
			MetadataRetriever.getCache()
				.then((list) => {
					let sendMsg = [];
					for (let i = 0; i < list.length; i++){
						sendMsg.push(`${i+1}. ${list[i].displayName}`);
					}
					utils.sendLongMessage(bot, msg, sendMsg.join('\n'));
				})
				.catch((e) => {
					msg.channel.sendMessage('```' + `Error: ${e}` + '```');
				});
		}
	},
	info: {
		desc: 'Get metadata of a song',
		whitelist_only: true,
		execute: (bot, msg, suffix) => {
			if (!suffix) {
				msg.channel.sendMessage('```Need song name```');
				return;
			}
			MetadataRetriever.getCache()
				.then((list) => {
					let minDistance = Number.MAX_SAFE_INTEGER;
					let obj = null;
					for (let i = 0; i < list.length; i++){
						let dist = utils.levenshtein(list[i].displayName, suffix);
						if (dist < minDistance) {
							minDistance = dist;
							obj = list[i];
						}
					}
					msg.channel.sendMessage('```' + `Name: ${obj.displayName}\nLength: ${utils.formatSeconds(obj.length)}\nID: ${obj.song}` + '```');
				})
				.catch((e) => {
					msg.channel.sendMessage('```' + `Error: ${e}` + '```');
				});
		}
	}
	
};

function youtubeVideoId(string) {
	var regex = /(?:\?v=|&v=|youtu\.be\/)(.*?)(?:\?|&|$)/;
	var matches = string.match(regex);
	if (matches) {
		return matches[1];
	}
	return null;
}

function mp3File(string) {
	if (string.endsWith('.mp3')) {
		return string.substr(0, string.length-4);
	}
	return null;
}


module.exports = commands;

