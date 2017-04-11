'use strict';

//Dependencies
const fs = require('fs');
const rp = require('request-promise');
const jsonfile = require('jsonfile');

//Files
var MetadataRetriever = require('./MetadataRetriever.js');

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
			name = utils.fmtFile(name);
			//Write to file
			jsonfile.writeFile('playlists/' + name + '.json', json, function (e) {
				if (e) {
					console.log('error in PlaylistHandler (1):', e);
				}
				resolve('Successfully saved ' + name);
			});
		});
	},
	getYTPlaylist: (id) => {
		return new Promise((resolve, reject) => {
			let baseURL = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=';
			rp(`${baseURL}${encodeURIComponent(id)}&key=${config.admin.youtube_api_key}`)
				.then((response, body) => {
					let json = JSON.parse(response);
					if ('error' in json) {
						reject('An unhandled error has occurred in PlaylistHandler: ' + json.error.errors[0].message + ' - ' + json.error.errors[0].reason);
					} else if (json.items.length === 0) {
						reject('No videos found');
					} else {
						let YTQueue = [];
						let retrieveDataRecursion = (i) => {
							if (json.items.length <= i) {
								resolve(YTQueue);
								return;
							}
							MetadataRetriever.youtubeVideo(json.items[i].snippet.resourceId.videoId)
								.then((entry) => {
									YTQueue.push(entry);
									retrieveDataRecursion(i+1);
								})
								.catch((e) => {
									console.log('error in PlaylistHandler (3):', e);
								});
						}
						/*for (let i = 0; i < json.items.length; i++){
							MetadataRetriever.youtubeVideo(json.items[i].snippet.resourceId.videoId)
								.then((entry) => {
									YTQueue.push(entry);
								})
								.catch((e) => {
									console.log('error in PlaylistHandler (3):', e);
								});
						}*/
						retrieveDataRecursion(0);
					}
				})
				.catch((e) => {
					console.log('error in PlaylistHandler (2):', e);
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