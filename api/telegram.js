import { Telegraf } from 'telegraf'

const { TELEGRAM_KEY, TELEGRAM_WEBBOOK_TOKEN } = process.env
const bot = new Telegraf(TELEGRAM_KEY)
const host = 'https://chat-nvc.vercel.app'

bot.command('start', ctx => {
	console.log('start', ctx.from)
	ctx.reply('hello there! Welcome to my new telegram bot.')
})

//method that displays the inline keyboard buttons

bot.command('animals', ctx => {
	console.log('animals', ctx.from)
	const animalMessage = `great, here are pictures of animals you would love`
	ctx.reply(animalMessage, {
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

bot.action('dog', ctx => {
	console.log('dog', ctx.from)
	ctx.replyWithPhoto(`${host}/res/dog.jpg`)
})

//method that returns image of a cat

bot.action('cat', ctx => {
	console.log('cat', ctx.from)
	ctx.replyWithPhoto(`${host}/res/cat.jpg`)
})

const botWebhook = bot.webhookCallback('/api/telegram', {
	secretToken: TELEGRAM_WEBBOOK_TOKEN
})

export const config = { runtime: 'edge' }
export default (req, res) => botWebhook(req, res)
