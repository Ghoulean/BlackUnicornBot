
module.exports = (bot, config, err) => {
	console.log(`FATAL ERROR: DISCONNECT: ${err.code}: ${err.reason}\nRESTARTING...`);

	process.exit(1);
}
