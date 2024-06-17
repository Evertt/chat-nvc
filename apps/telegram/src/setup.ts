import { bot } from "./bot.js"
import { createOpenAI } from "@ai-sdk/openai"
import { type CoreMessage, generateText } from "ai"
import { message } from "telegraf/filters"
import { sleep } from "./utils.js"

const { OPENROUTER_API_KEY, OPENROUTER_BASE_URL } = process.env

const openai = createOpenAI({
	baseURL: OPENROUTER_BASE_URL + "/api/v1",
	apiKey: OPENROUTER_API_KEY,
})

type GenerateTextReturnType = Awaited<ReturnType<typeof generateText>>

function generateTextWithFallbacks(options: Omit<Parameters<typeof generateText>[0], "model">) {
	const models = [
		"meta-llama/llama-3-8b-instruct:free",
		"nousresearch/hermes-2-pro-llama-3-8b",
		"nousresearch/nous-hermes-2-mixtral-8x7b-dpo",
		"meta-llama/llama-3-70b-instruct",
		"mistralai/mixtral-8x22b-instruct",
	] as const

	return models.reduce(
		(p, model, i) =>
			p.catch(() =>
				sleep(i && 500 * 2 ** i).then(() => generateText({ ...options, model: openai(model) }))
			),
		Promise.reject<GenerateTextReturnType>(new Error("No model found"))
	)
}

const messages: CoreMessage[] = []

bot.start((ctx) => {
	const response = "Hello, I'm Chat-NVC!"
	messages.push({ role: "assistant", content: response })
	ctx.reply(response)
})

bot.on(message("text"), async (ctx) => {
	const userInput = ctx.message.text

	messages.push({ role: "user", content: userInput })

	return await ctx.persistentChatAction("typing", () =>
		generateTextWithFallbacks({
			system: `You are a warm empathetic friend who always listens according to the principles of Nonviolent Communication.`,
			messages,
		})
			.then(async (result) => {
				if (result.finishReason === "error") throw result

				const { text } = result
				await ctx.reply(text)
				messages.push({ role: "assistant", content: text })
			})
			.catch(async () => void (await ctx.reply("Sorry, something went wrong.")))
	)
})

export { bot }
