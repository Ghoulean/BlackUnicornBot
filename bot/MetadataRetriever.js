'use strict';

//Dependencies
const fs = require('fs');
const ytdl = require('ytdl-core');
const rp = require('request-promise');
const jsonfile = require('jsonfile');
const mmd = require('musicmetadata');

//Files
var config = require(`${__dirname}/../config.json`);
var utils = require(`${__dirname}/../utils.js`);


var MetadataRetriever = {
	youtubeSearch: (query) => {
		return new Promise((resolve, reject) => {
			let baseURL = 'https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=';
			rp(`${baseURL}${encodeURIComponent(query)}&key=${config.admin.youtube_api_key}`)
				.then((response, body) => {
					let json = JSON.parse(response);
					if ('error' in json) {
						reject('An error has occurred: ' + json.error.errors[0].message + ' - ' + json.error.errors[0].reason);
					} else if (json.items.length === 0) {
						reject('No videos match the search criteria');
					} else {
						resolve(MetadataRetriever.youtubeVideo(json.items[0].id.videoId));
					}
				})
				.catch((e) => {
					console.log('error in MetadataRetriever (4):', e);
				});
		});
	},
	youtubeVideo: (videoId) => {
		return new Promise((resolve, reject) => {	
			ytdl.getInfo("https://www.youtube.com/watch?v=" + videoId, (err, info) => {
				if (err) {
					console.log('error in MetadataRetriever (3):', err);
				} else {
					if (info.length_seconds > config.song.max_length) {
						reject('Requested song is too long! ' + info.length_seconds + ' > ' + config.song.max_length);
					}
					let json = {'song': videoId, 'type': 'youtube', 'length': info.length_seconds, 'displayName': info.title};		
					resolve(json);
				}
			});
		});
	},
	mp3: (filename) => {
		return new Promise((resolve, reject) => {
			if (fs.existsSync('songs/' + filename + '.mp3')) {
				mmd(fs.createReadStream('songs/' + filename + '.mp3'), { duration: true }, function (err, metadata) {
					let json = {'song': filename, 'type': 'mp3file', 'length': metadata.duration, 'displayName': metadata.title};
					resolve(json);
				});
			} else {
				reject('Metadata for ' + filename + ' not found');
			}
		});
	},
	getCache: () => {
		return new Promise((resolve, reject) => {
			fs.readdir(`${__dirname}/../song_metadata/`, (err, files) => {
				if (err) {
					reject(`Error reading songs directory: ${err}`);
				} else if (!files) {
					reject('No songs in cache');
				} else {
					let allSongNames = [];
					for (let name of files) {
						if (name.endsWith('.json')) {
							name = name.replace(/\.json$/, '');
							try {
								let json = jsonfile.readFileSync('song_metadata/' + name + '.json');
								allSongNames.push(json);
							} catch (e) {
								console.log(`getCache() error: ${e}`);
							}
						}
					}
					resolve(allSongNames);
				}
			});
		});
	}
}

module.exports = MetadataRetriever;