module.exports = (bot, msg, config, MessageManager) => {
	let whitelist = false;
	
	//Ignore PM/DMs
	let serverSent = msg.guild;
	if (!serverSent) {
		return;
	}
	//Ignore messages sent by self
	if (msg.author.id == bot.user.id){
		return;
	}
	//Ignore non-commands
	if (!msg.content.startsWith(config.message.command_prefix)) {
		return;
	}
	
	if (msg.content.indexOf(' ') == 1 && msg.content.length > 2) {
		msg.content = msg.content.replace(' ', '');
	}

	
	if (config.admin.whitelisted_users.indexOf(msg.author.id) >= 0) {
		whitelist = true;
	}
		
	//parsing the following message
	//{prefix}{name} {suffix}
	let name = msg.content.split(" ")[0].replace(/\n/g, " ").substring(config.message.command_prefix.length).toLowerCase();
	let suffix = msg.content.replace(/\n/g, " ").substring(name.length + config.message.command_prefix.length + 1).trim();

	//command object
	let command;
	
	//search if name is a valid command
	for (let key in MessageManager) {
		if (key === name) {
			command = MessageManager[key];
			break;
		}
	}
	if (!command) {
		return;
	}

	//If command is whitelist-only, ensure that unauthorized users cannot execute it
	if (!command.whitelist_only || whitelist) {
		command.execute(bot, msg, suffix);
	} else {
		msg.channel.sendMessage('```You do not have permissions to perform that command!```');
	}
	
}
