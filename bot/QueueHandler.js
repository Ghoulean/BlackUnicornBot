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
	
	shuffle() {
		//Fisher-Yates (Knuth) shuffle
		for (let i = this.queue.length-1; i > 0; i--) {
			let j = Math.floor(Math.random() * i);
			
			let tempEntry = this.queue[i];
			this.queue[i] = this.queue[j];
			this.queue[j] = tempEntry;
		}
	}
	
}

var QueueHandler = new Queue();

module.exports = QueueHandler;