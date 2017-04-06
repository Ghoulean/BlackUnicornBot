'use strict';

//Dependencies
const fs = require('fs');
const ytdl = require('ytdl-core');
const EventEmitter = require('events');

//Files
var config = require(`${__dirname}/../config.json`);
var utils = require(`${__dirname}/../utils.js`);

class Queue extends EventEmitter {
	constructor() {
		super();
		this.queue = [];
	}
	
	isEmpty() {
		return (this.queue.length === 0);
	}
	
	getFirst() {
		if (this.isEmpty()) {
			return null;
		}
		return this.queue.shift();
	}
	
	getQueue() {
		return this.queue;
	}
	
	clearQueue() {
		this.queue = [];
	}
	
	addQueue(item, sourceId) {
		item.source = sourceId;
		this.queue.push(item);
	}
	
	getAt(i) {
		return this.queue[i];
	}
	
	removeAt(i) {
		this.queue.splice(i, 1);
	}
	
}

var QueueHandler = new Queue();

module.exports = QueueHandler;