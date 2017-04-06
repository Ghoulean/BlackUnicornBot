'use strict';

//Dependencies
var Discord = require('discord.js');
var fs = require('fs');

//Files
var config = require('./config.json');

//Important objects
var bot = new Discord.Client();

//Commands
var events = {};
var MessageManager = require('./bot/MessageManager.js');

function loadBotEvents() {
	return new Promise((resolve, reject) => {
		fs.readdir(`${__dirname}/botEvents/`, (err, files) => {
			if (err) {
				reject(`Error reading events directory: ${err}`);
			} else if (!files) {
				reject('No files in directory events/');
			} else {
				for (let name of files) {
					if (name.endsWith('.js')) {
						name = name.replace(/\.js$/, '');
						try {
							events[name] = require(`${__dirname}/botEvents/${name}.js`)
							initBotEvent(name);
						} catch (e) {
							console.log(`loadBotEvents() error: ${e}`);
						}
					}
				}
				resolve();
			}
		});
	});
}

function initBotEvent(name) {
	if (name === 'message') {
		bot.on('message', (msg) => {
			events.message(bot, msg, config, MessageManager);
		});
	} else if (name === 'ready') {
		bot.on('ready', () => {
			events.ready(bot, config);
		});
	} else if (name === 'disconnect') {
		bot.on('disconnect', (err) => {
			events.disconnect(bot, config, err);
		});
	} else {
		bot.on(name, () => {
			events[name](bot, config, ...arguments);
		});
	}
}

function login() {
	bot.login(config.admin.token);	
	console.log('Launching BlackUnicornBot...');
}

function launch() {
	//initiate
	loadBotEvents()
		.then(login)
		.catch(error => {
			console.log(`Fatal error in init: ${error}`);
		});
}
	
module.exports = launch;