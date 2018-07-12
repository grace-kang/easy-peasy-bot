
module.exports = function(controller) {
	controller.hears(
			['hello', 'hi', 'greetings', 'hey'],
			'direct_message,mention,direct_mention',
			function (bot, message) {
				bot.reply(message, 'Hello!');
			}
			);


	/**
	 * AN example of what could be:
	 * Any un-handled direct mention gets a reaction and a pat response!
	 */
	controller.on('direct_message,mention,direct_mention', function (bot, message) {
		bot.api.reactions.add({
			timestamp: message.ts,
			channel: message.channel,
			name: 'robot_face',
		}, function (err) {
			if (err) {
				console.log(err)
			}
			bot.reply(message, 'Yes?');
		});
	});
}

