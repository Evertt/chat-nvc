import { Readable, Writable } from 'stream'
import { Telegraf, session, type Context } from 'telegraf'
import { createClient } from '@supabase/supabase-js'
import type { Update } from "telegraf/types"
import { oneLine, oneLineCommaListsAnd } from 'common-tags'
import { message } from 'telegraf/filters'
import { getSystemPrompt } from './.dep/handleAnswers'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type {
	CreateModerationResponse,
	CreateChatCompletionRequest,
	CreateChatCompletionResponse,
	ChatCompletionRequestMessage,
} from 'openai'

import ffmpeg from 'fluent-ffmpeg'
import pathToFfmpeg from 'ffmpeg-static'
import { path as pathToFFprobe } from 'ffprobe-static'

if (!pathToFfmpeg) {
	throw new Error('ffmpeg-static not found')
}

declare const process: {
	env: {
		SUPABASE_KEY: string
		SUPABASE_PASSWORD: string
		OPENAI_KEY: string
		TELEGRAM_KEY: string
		TELEGRAM_WEBBOOK_TOKEN: string
	}
}

interface Message {
	name: string
	message: string
	timestamp: number
	type: 'text' | 'voice'
}

interface Session {
	messages: Message[]
}

interface ContextWithSession <U extends Update = Update> extends Context<U> {
	session: Session,
}

const BOT_NAME = 'ChatNVC'
// const chats = new Map<number, Message[]>()

const {
	OPENAI_KEY,
	TELEGRAM_KEY,
	SUPABASE_KEY,
	SUPABASE_PASSWORD,
	TELEGRAM_WEBBOOK_TOKEN
} = process.env

const Supabase = <Session>() => {
	const supabase = createClient(
		`https://db.oayqreivowdwqabufjyj.supabase.co:6543/postgres?pgbouncer=true`,
		SUPABASE_KEY
	)

	return {
		async get(key: string) {
			const { data } = await supabase
				.from('telegraf-sessions')
				.select('session')
				.eq('key', key)
				.single()

				console.log("Retrieved a session from supabase:", key, data?.session)
			
				return data ? data.session as Session : undefined
		},

		async set(key: string, session: Session) {
			const { error } = await supabase
				.from('telegraf-sessions')
				.upsert({ key, session })
				.single()

				console.log("Stored a session in supabase:", { key, session, error })

				return error ? { error } : true
		},

		async delete(key: string) {
			const { error } = await supabase
				.from('telegraf-sessions')
				.delete()
				.eq('key', key)

			console.log("Deleted a session from supabase:", { key, error })

			return error ? { error } : true
		}
	}
}

const bot = new Telegraf<ContextWithSession>(TELEGRAM_KEY, {
	telegram: { webhookReply: false }
})

bot.use(session({
	store: Supabase<Session>(),
	defaultSession: () => ({
		messages: [] as Message[]
	})
}))

// const host = 'https://chat-nvc.vercel.app'

const convertOggOpusToWebm = async (opusAudioData: Buffer | ArrayBuffer) => {
  const buffer = opusAudioData instanceof Buffer
    ? opusAudioData : Buffer.from(opusAudioData)

  // eslint-disable-next-line @typescript-eslint/no-empty-function
	const readable = new Readable({ read() {} })
	readable.push(buffer)
	readable.push(null)

  const chunks: BlobPart[] = []

	const writable = new Writable({
    write(chunk, _, callback) {
      chunks.push(chunk)
      callback()
    }
  })

  return new Promise<Blob>((resolve, reject) => {
    ffmpeg(readable)
      .setFfmpegPath(pathToFfmpeg!)
      .setFfprobePath(pathToFFprobe)
			.format('webm')
			.noVideo()
      .withAudioCodec('copy')
      .on('end', function (err) {
        if (!err) {
          console.log('conversion Done')
          resolve(new Blob(chunks, { type: 'audio/webm' }))
        }
      })
      .on('error', function (err) {
        console.log('error:', err)
        reject(err)
      })
			.output(writable)
			.run()
  })
}

bot.start(async ctx => {
	if (ctx.chat.type !== 'private')
		return ctx.reply('Please write to me in a private chat 🙏')

	const greeting = `Hi ${ctx.from.first_name}, what would you like empathy for today?`

	ctx.session.messages = [
		{
			type: 'text',
			name: BOT_NAME,
			message: greeting,
			timestamp: Date.now()
		}
	]

	await ctx.reply(greeting)
})

bot.help(ctx => ctx.reply(oneLine`
	I'm ChatNVC, a bot that tries to listen to you empathically.
	I remember our past messages for maximum 1 hour.
	You can also force me to start over by typing /start.
`))

const moderate = async (input: string) => {
	const moderationRes = await fetch('https://api.openai.com/v1/moderations', {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${OPENAI_KEY}`
		},
		method: 'POST',
		body: JSON.stringify({ input })
	})

	const moderationData: CreateModerationResponse = await moderationRes.json()
	const [results] = moderationData.results

	if (results.flagged) {
		const categories = Object.entries(results.categories)
			.filter(([_, value]) => value)
			.map(([category]) => category)
			// .join(', ')

		return categories
	}

	return false
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const repeat = (fn: () => Promise<any>, ms: number) => {
	let stop = false

	const innerFn = async () => {
		while (!stop) {
			await fn()
			await sleep(ms)
		}
	}

	innerFn()

	return () => stop = true
}

const getReply = async (messages: Message[], name: string, text: string, type: 'text' | 'voice') => {
	let moderationResult = await moderate(text)
	if (moderationResult) return oneLineCommaListsAnd`
		Your message was flagged by OpenAI for ${moderationResult}.
		Please try to rephrase your message. 🙏
	`

	messages.push({
		type,
		name: name,
		message: text,
		timestamp: Date.now()
	})
	
	const chatMessages: ChatCompletionRequestMessage[] = messages.map(msg => (
		{ role: msg.name === BOT_NAME ? 'assistant' : 'user', content: msg.message }
	))

	const systemPrompt = getSystemPrompt({
		request: 'empathy',
		names: [name],
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

	const completionResponse: CreateChatCompletionResponse = await chatResponse.json()
	
	const assistantResponse = completionResponse.choices[0]?.message?.content ?? ''

	if (assistantResponse === '') {
		throw new Error('OpenAI returned an empty response')
	}

	moderationResult = await moderate(assistantResponse)
	if (moderationResult) return oneLine`
		Sorry, I was about to say something potentially inappropriate.
		I don't know what happened.
		Could you maybe try to rephrase your last message differently?
		That might help me to formulate a more appropriate response.
		Thank you. 🙏
	`

	messages.push({
		type: 'text',
		name: BOT_NAME,
		message: assistantResponse,
		timestamp: Date.now()
	})

	return assistantResponse
}

bot.on(message('text'), async ctx => {
	if (ctx.chat.type !== 'private') return

	const stopTyping = repeat(
		() => ctx.sendChatAction('typing'),
		5100
	)

	await getReply(ctx.session.messages, ctx.from.first_name, ctx.message.text, 'text')
		.then(reply => ctx.replyWithHTML(reply))
		.catch(error => {
			console.log("Error:", error)
	
			return ctx.reply(oneLine`
				Something went wrong. It's possible that OpenAI's servers are overloaded.
				Please try again in a few seconds or minutes. 🙏
			`)
		})
		.finally(() => {
			stopTyping()
			// cleanUpChats()
		})
})

bot.on(message('voice'), async ctx => {
	if (ctx.chat.type !== 'private') return

	const stopTyping = repeat(
		() => ctx.sendChatAction('typing'),
		5100
	)

	const voiceLink = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
  const randomFilename = Math.random().toString(36).substring(2)
	const filePath = `${randomFilename}.webm`

	const voiceRespFile = await fetch(voiceLink)
	const voiceOggBuffer = await voiceRespFile.arrayBuffer()
	const voiceWebmBlob = await convertOggOpusToWebm(voiceOggBuffer)

	const formData = new FormData()
	formData.append('model', 'whisper-1')
	formData.append('response_format', 'text')
  formData.append('file', voiceWebmBlob, filePath)

	const transcriptionResponse = await fetch(
		'https://api.openai.com/v1/audio/transcriptions',
		{
			headers: {
				Authorization: `Bearer ${OPENAI_KEY}`,
			},
			method: 'POST',
			body: formData
		}
	)

	const transcription = await transcriptionResponse.text()

	await getReply(ctx.session.messages, ctx.from.first_name, transcription, 'voice')
		.then(reply => ctx.replyWithHTML(reply))
		.catch(error => {
			console.log("Error:", error)
	
			return ctx.reply(oneLine`
				Something went wrong. It's possible that OpenAI's servers are overloaded.
				Please try again in a few seconds or minutes. 🙏
			`)
		})
		.finally(() => {
			stopTyping()
			// cleanUpChats()
		})
})

const botWebhook = bot.webhookCallback('/api/telegram', {
	secretToken: TELEGRAM_WEBBOOK_TOKEN
})

// function cleanUpChats() {
// 	const now = Date.now()

// 	for (const [chatId, messages] of chats.entries()) {
// 		const i = messages.findIndex(msg =>
// 			now - msg.timestamp < 1000 * 60 * 60 // 1 hour
// 		)

// 		if (i === 0) continue
// 		else if (i === -1) {
// 			chats.delete(chatId)
// 			bot.telegram.sendMessage(
// 				chatId,
// 				oneLine`Just FYI, I just deleted our chat history from my memory.
// 				So now if you would send me a new message, we would be starting over.
// 				I won't even remember that I sent you this message.`
// 			)
// 		}
// 		else chats.set(chatId, messages.slice(i))
// 	}
// }

export default async (req: VercelRequest, res: VercelResponse) => {
	await botWebhook(req, res)
}
