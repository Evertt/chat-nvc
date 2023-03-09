import { Telegraf } from 'telegraf'

const { TELEGRAM_KEY, TELEGRAM_WEBBOOK_TOKEN } = process.env
const bot = new Telegraf(TELEGRAM_KEY)

bot.command('start', (ctx) => {
	console.log(ctx.from)
	bot.telegram.sendMessage(ctx.chat.id, 'hello there! Welcome to my new telegram bot.', {})
})

//method that displays the inline keyboard buttons

bot.hears('animals', (ctx) => {
	console.log(ctx.from)
	const animalMessage = `great, here are pictures of animals you would love`
	ctx.deleteMessage()
	bot.telegram.sendMessage(ctx.chat.id, animalMessage, {
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: 'dog',
						callback_data: 'dog'
					},
					{
						text: 'cat',
						callback_data: 'cat'
					}
				]
			]
		}
	})
})

//method that returns image of a dog

bot.action('dog', (ctx) => {
	bot.telegram.sendPhoto(ctx.chat.id, {
		source: 'res/dog.jpg'
	})
})

//method that returns image of a cat

bot.action('cat', (ctx) => {
	bot.telegram.sendPhoto(ctx.chat.id, {
		source: 'res/cat.jpg'
	})
})

const botWebhook = bot.webhookCallback('/api/telegram', {
	secretToken: TELEGRAM_WEBBOOK_TOKEN
})

export default (req, res) => botWebhook(req, res)
