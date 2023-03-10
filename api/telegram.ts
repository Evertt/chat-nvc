import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { getSystemPrompt } from './.dep/handleAnswers'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type {
	CreateModerationResponse,
	CreateChatCompletionRequest,
	CreateChatCompletionResponse,
	ChatCompletionRequestMessage,
} from 'openai'

declare const process: {
	env: {
		OPENAI_KEY: string
		TELEGRAM_KEY: string
		TELEGRAM_WEBBOOK_TOKEN: string
	}
}

interface Message {
	name: string
	message: string
	timestamp: number
}

const chats = new Map<number, Message[]>()

const {
	OPENAI_KEY,
	TELEGRAM_KEY,
	TELEGRAM_WEBBOOK_TOKEN
} = process.env

const bot = new Telegraf(TELEGRAM_KEY)
// const host = 'https://chat-nvc.vercel.app'

bot.start(async ctx => {
	if (ctx.chat.type !== 'private')
		return ctx.reply('Please write to me in a private chat 🙏')

	const greeting = `Hi ${ctx.from.first_name}, what would you like empathy for today?`

	chats.set(ctx.chat.id, [
		{ name: 'ChatNVC', message: greeting, timestamp: Date.now() }
	])

	await ctx.reply(greeting)
})

bot.help(ctx => ctx.reply(`
	I'm ChatNVC, a bot that tries to listen to you empathically.
	I remember our past messages for maximum 1 hour.
	You can also force me to start over by typing /start.
`.replace(/\s+/g, ' ')))

bot.on(message('text'), async ctx => {
	if (ctx.chat.type !== 'private') return
	if (!chats.has(ctx.chat.id)) chats.set(ctx.chat.id, [])

	await ctx.sendChatAction('typing')
	const interval = setInterval(() => ctx.sendChatAction('typing'), 5100)

	const execute = async () => {
		const moderationRes = await fetch('https://api.openai.com/v1/moderations', {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${OPENAI_KEY}`
			},
			method: 'POST',
			body: JSON.stringify({
				input: ctx.message.text
			})
		})

		const moderationData: CreateModerationResponse = await moderationRes.json()
		const [results] = moderationData.results

		if (results.flagged) {
			console.log('Message flagged by OpenAI:', ctx.message.text)

			const categories = Object.entries(results.categories)
				.filter(([_, value]) => value)
				.map(([category]) => category)
				.join(', ')

			return ctx.reply(`
				Your message was flagged by OpenAI for ${categories}.
				Please try to rephrase your message. 🙏
			`.replace(/^\n +|(\n) +/g, '$1'))
		}

		console.log('Message not flagged by OpenAI:', ctx.message.text)

		const messages = chats.get(ctx.chat.id)!
		messages.push({
			name: ctx.from.first_name,
			message: ctx.message.text,
			timestamp: Date.now()
		})
		
		const chatMessages: ChatCompletionRequestMessage[] = messages.map(msg => (
			{ role: msg.name === 'ChatNVC' ? 'assistant' : 'user', content: msg.message }
		))

		const systemPrompt = getSystemPrompt({
			request: 'empathy',
			names: [ctx.from.first_name],
		})

		chatMessages.unshift({ role: 'system', content: systemPrompt })

		const chatRequestOpts: CreateChatCompletionRequest = {
			model: 'gpt-3.5-turbo',
			temperature: 0.9,
			messages: chatMessages,
		}
	
		const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
			headers: {
				Authorization: `Bearer ${OPENAI_KEY}`,
				'Content-Type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(chatRequestOpts)
		})

		if (!chatResponse.ok) {
			const err = await chatResponse.json()
			throw new Error(err)
		}

		console.log('Chat response ok')

		const completionResponse: CreateChatCompletionResponse = await chatResponse.json()
		
		const assistantResponse = completionResponse.choices[0]?.message?.content ?? ''

		console.log('Assistant response:', assistantResponse)

		ctx.reply(assistantResponse)

		messages.push({
			name: 'ChatNVC',
			message: assistantResponse,
			timestamp: Date.now()
		})
	}

	execute()
		.catch(error => {
			console.error(error)
	
			ctx.reply(`
				Something went wrong. It's possible that OpenAI's servers are overloaded.
				Please try again in a few seconds or minutes. 🙏
			`.replace(/\s+/g, ' '))
		})
		.finally(() => {
			clearInterval(interval)
			cleanUpChats()
		})
})

const botWebhook = bot.webhookCallback('/api/telegram', {
	secretToken: TELEGRAM_WEBBOOK_TOKEN
})

function cleanUpChats() {
	const now = Date.now()

	for (const [chatId, messages] of chats.entries()) {
		const i = messages.findIndex(msg =>
			now - msg.timestamp < 1000 * 60 * 60 // 1 hour
		)

		if (i === 0) continue
		else if (i === -1) chats.delete(chatId)
		else chats.set(chatId, messages.slice(i))
	}
}

export default async (req: VercelRequest, res: VercelResponse) => {
	await botWebhook(req, res)
}
