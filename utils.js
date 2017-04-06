'use strict';

//Dependencies or something
//none lul

//Essential files
var config = require(`${__dirname}/config.json`)

/**
* Levenshtein distance between two strings. Algorithm by Milot-Mirdita
* @arg {String} 		a 					String.
* @arg {String} 		b 					String.
* @returns {Integer} 		 				Levenshtein distance between a and b.
*/
exports.levenshtein = function(a, b) {
	if (a.length == 0) { return b.length; } 
	if (b.length == 0) { return a.length; }
	
	// swap to save some memory O(min(a,b)) instead of O(a)
	if(a.length > b.length) {
		let tmp = a;
		a = b;
		b = tmp;
	}
	
	let row = [];
	for(let i = 0; i <= a.length; i++) {
		row[i] = i;
	}
	
	for (let i = 1; i <= b.length; i++) {
		let prev = i;
		for (let j = 1; j <= a.length; j++) {
			let val;
			if (b.charAt(i-1) == a.charAt(j-1)) {
				val = row[j-1]; // match
			} else {
				val = Math.min(row[j-1] + 1, // substitution
						prev + 1,     // insertion
						row[j] + 1);  // deletion
			}
			row[j - 1] = prev;
			prev = val;
		}
		row[a.length] = prev;
	}
	return row[a.length];
}	

/**
* Function that ensures that a string is filename-friendly
* @arg {String} 		str 				String to be formatted.
* @returns {String} 		 				Formatted string.
*/
exports.fmtFile = (str) => {
	return str.trim().toLowerCase().replace(/[<>:"\/\\\|\?\*]/gi, '');
}

/**
* Function that removes the file extension of a filename
* @arg {String} 		str 				String to be formatted.
* @returns {String} 		 				Formatted string.
*/
exports.cleanFilename = (str) => {
	if (str.indexOf(".") >= 0) {
		return str.substring(0, str.lastIndexOf("."));
	}
	return str;
}

/**
* Function that formats seconds into mm:ss
* @arg {int} 		sec 					Seconds
* @returns {String} 		 				Formatted time
*/
exports.formatSeconds = (sec) => {
	let minutes = Math.floor(sec/60);
	let seconds = sec % 60
	
	let minutes_units = minutes % 10;
	let minutes_digits = Math.floor(minutes/10);
	
	let seconds_units = seconds % 10;
	let seconds_digits = Math.floor(seconds/10);
	
	return `${minutes_digits}${minutes_units}:${seconds_digits}${seconds_units}`;
}

/**
* Helper command to split long messages into one or several DM/PMs
* @arg {Client} 		bot 				The client.
* @arg {Message} 		msg 				The message that triggered the command.
* @arg {String} 		outputStr 			The message to send to the user.
* @arg {boolean} 		forcePM 			If true, sends the message through PM/DM regardless of message length.
* @arg {String} 		splitChar 			The preferred character to split the output string by. So your message doesn't cut a word or sentence in half. Default ','
*/
exports.sendLongMessage = (bot, msg, outputStr, forcePM, splitChar) => { //note to self: clean this up later
	if (outputStr.length >= config.message.force_pm || forcePM) {
		if (msg.guild) {
			msg.channel.sendMessage(`${msg.author}, sent response via PM.`);
		}
		
		/*
		* Input an array containing the messages sent, e.g. ["but", "first,", "a", "warm", "up", "shot!"]
		* "ind" starts at 0
		* Do not pad messages with ```; padding is automatic
		*/
		var timeoutWrapper = (strarr, ind) => {
			if (ind < strarr.length) {
				setTimeout(() => {
					msg.author.sendMessage("```" + strarr[ind] + "```")
					timeoutWrapper(strarr, ind+1);
				}, 1000);
			}
		};
		
		let splitter = splitChar || ',';
		let splitArray = outputStr.split(splitter);
		let sendMsg = [""];
		
		//Append subsubstrings (split with splitter) to substring until substring is as large as possible
		//Then create new substring
		for (let i = 0; i < splitArray.length; i++){
			if (sendMsg[sendMsg.length - 1].length + splitArray[i].length <= config.message.max_message_length) {
				sendMsg[sendMsg.length - 1] += splitArray[i] + splitter;
			} else {
				sendMsg.push(splitArray[i] + splitter);
			}
		}
		
		//Remove leading and trailing whitespace on all substrings
		for (let i = 0; i < sendMsg.length; i++){
			sendMsg[i] = sendMsg[i].trim();
		}
		
		//Remove last splitter on the last substring, if it exists
		if (splitter.trim() != "") {
			sendMsg[sendMsg.length - 1] = sendMsg[sendMsg.length - 1].substr(0, sendMsg[sendMsg.length - 1].length - 1);
		}
		
		timeoutWrapper(sendMsg, 0);
	} else {
		msg.channel.sendMessage("```" + outputStr + "```");
	}
}