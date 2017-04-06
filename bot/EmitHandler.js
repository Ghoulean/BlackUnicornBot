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
var _Player = require('./Player.js');
var _PlaylistHandler = require('./PlaylistHandler.js');
var _QueueHandler = require('./QueueHandler.js');

class EmitHandler extends EventEmitter {
	
	constructor() {
		super();
	}
}



module.exports = EmitHandler;