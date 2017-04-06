'use strict';

//Dependencies
const fs = require('fs');
const rp = require('request-promise');
const jsonfile = require('jsonfile');

//Files
var config = require(`${__dirname}/../config.json`);
var utils = require(`${__dirname}/../utils.js`);

var PlaylistHandler = {
	getPlaylist: (name) => {
		return new Promise((resolve, reject) => {
			if (fs.existsSync('playlists/' + name + '.json')) {
				let json = jsonfile.readFileSync('playlists/' + name + '.json');
				resolve(json.songEntries);
			} else {
				reject(`Playlist ${name} not found`);
			}
		});
	},
	savePlaylist: (queue, name) => {
		return new Promise((resolve, reject) => {
			let json = {songEntries: []};
			for (let i = 0; i < queue.length; i++) {
				json.songEntries.push(queue[i]);
			}
			//Write to file
			jsonfile.writeFile('playlists/' + name + '.json', json, function (e) {
				if (e) {
					console.log('error in PlaylistHandler (1):', e);
				}
				resolve('Successfully saved ' + name);
			});
		});
	},
	getAllPlaylists: () => {
		return new Promise((resolve, reject) => {
			fs.readdir(`${__dirname}/../playlists/`, (err, files) => {
				if (err) {
					reject(`Error reading playlists directory: ${err}`);
				} else if (!files) {
					reject('No playlists saved');
				} else {
					let playlistNames = [];
					for (let name of files) {
						if (name.endsWith('.json')) {
							name = name.replace(/\.json$/, '');
							playlistNames.push(name);
						}
					}
					resolve(playlistNames);
				}
			});
		});
	},
	deletePlaylist: (name) => {
		fs.unlink(file, function (err) {
			if (err) {
				console.error(err.toString());
			} else {
				console.warn(file + ' deleted');
			}
		});	
	}
}

module.exports = PlaylistHandler;