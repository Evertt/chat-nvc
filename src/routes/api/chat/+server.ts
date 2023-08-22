import { Readable } from "node:stream"
import { OPENAI_KEY } from '$env/static/private'
import { getSystemPrompt } from '$lib/handleAnswers'
import OpenAI from 'openai'
import type { RequestHandler } from './$types'
import { countTokens as getTokens } from '$lib/tokenizer'
import { json } from '@sveltejs/kit'
import type { Config } from '@sveltejs/adapter-vercel'
import { commaListsAnd } from "common-tags"
import type { ChatCompletionChunk, CompletionCreateParamsStreaming, CreateChatCompletionRequestMessage } from "openai/resources/chat"

type ChatMessage = CreateChatCompletionRequestMessage

export const config: Config = {
	runtime: 'edge'
}

const openai = new OpenAI({ apiKey: OPENAI_KEY })

export const POST: RequestHandler = async ({ request }) => {
	try {
		if (!OPENAI_KEY) {
			throw new Error('OPENAI_KEY env variable not set')
		}

		const requestData = await request.json()

		if (!requestData) {
			throw new Error('No request data')
		}

		const model = "gpt-4"
		const introData: IntroData = requestData.introData
		const messages: ChatMessage[] = requestData.messages

		const systemPrompt: ChatMessage = {
			role: 'system',
			content: getSystemPrompt(introData),
		}

		messages.unshift(systemPrompt)

		const tokenCount = getTokens(messages, model)

		if (tokenCount >= 8000) {
			throw new Error('Query too large')
		}

		if (messages.length > 1) {
			const { results: [results] } = await openai.moderations.create({
				input: messages.at(-1)!.content!
			})

			if (results.flagged) {
				type Categories = (keyof typeof results.categories)[]

				const categories = (Object.keys(results.categories) as Categories)
					.filter(category => results.categories[category])

				throw new Error(`Message flagged for ${commaListsAnd`${categories}`}}`)
			}
		}

		/// I wanted to use this, but I wasn't able to convert the stream
		/// to a stream that worked with new Response()
		// const iterable = await openai.chat.completions.create(
		// 	{ messages, model, temperature: 0.9, stream: true }
		// )
		//
		// const stream = asyncIterableToStream(iterable)

		const chatRequestOpts: CompletionCreateParamsStreaming = {
			model: 'gpt-4',
			temperature: 0.9,
			stream: true,
			messages,
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

		return new Response(chatResponse.body, {
			headers: {
				'Content-Type': 'text/event-stream'
			}
		})
	} catch (err) {
		console.error(err)
		return json({ error: 'There was an error processing your request' }, { status: 500 })
	}
}
