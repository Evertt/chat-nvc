import { SSE } from 'sse.js'
import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { getSystemPrompt } from './.dep/handleAnswers'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type {
	CreateModerationResponse,
	CreateChatCompletionRequest,
	ChatCompletionRequestMessage
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

async function readAllChunks(readableStream: ReadableStream<Uint8Array> | null) {
	if (!readableStream) return ''

  const reader = readableStream.getReader()
	const decoder = new TextDecoder('utf-8')
  let string = ''
  
  let done = false, value: Uint8Array | undefined

  while (!done) {
    ({ value, done } = await reader.read())
    if (done) break
		const data = decoder.decode(value!)
			.trim().replace(/\s*data: \[DONE\]\s*$/, '')
		const json = JSON.parse(data.substring(6))
		string += json?.choices?.[0]?.delta?.content ?? ''
		if (json?.choices?.[0]?.finish_reason) break
  }

	return string
}

bot.start(ctx => {
	if (ctx.chat.type !== 'private')
		return ctx.reply('Please write to me in a private chat 🙏')

	const greeting = `Hi ${ctx.from.first_name}, what would you like empathy for today?`

	chats.set(ctx.chat.id, [
		{ name: 'ChatNVC', message: greeting, timestamp: Date.now() }
	])

	ctx.reply(greeting)
})

bot.on(message('text'), async ctx => {
	if (ctx.chat.type !== 'private') return
	if (!chats.has(ctx.chat.id)) chats.set(ctx.chat.id, [])

	// await ctx.sendChatAction('typing')

	const handleError = (error: any) => {
		console.error(error)
		ctx.reply(`
			Something went wrong. It's possible that OpenAI's servers are overloaded.
			Please try again in a few seconds or minutes. 🙏
		`.replace(/\s+/g, ' '))
	}

	try {
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
			stream: true,
			messages: chatMessages,
		}
	
		let answer = ''

		const eventSource = new SSE('https://api.openai.com/v1/chat/completions', {
			headers: {
				Authorization: `Bearer ${OPENAI_KEY}`,
				'Content-Type': 'application/json'
			},
			payload: JSON.stringify(chatRequestOpts)
		})

		eventSource.addEventListener('error', handleError)

		eventSource.addEventListener('message', (e) => {
			try {
				if (e.data === '[DONE]') return

				const completionResponse = JSON.parse(e.data)
				const [{ delta }] = completionResponse.choices

				if (delta.content) {
					answer += delta.content
				} else {
					ctx.reply(answer)
					messages.push({
						name: 'ChatNVC',
						message: answer,
						timestamp: Date.now(),
					})
				}
			} catch (err) {
				handleError(err)
			}
		})

		eventSource.stream()
	} catch (error) {
		handleError(error)
	}

	cleanUpChats()
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
