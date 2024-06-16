import "./bootstrap"
import { bot } from "./bot"
import { createOpenAI } from "@ai-sdk/openai"
import { type CoreMessage, generateText } from "ai"
import { type Telegraf } from "telegraf"
import { message } from "telegraf/filters"
import { sleep } from "./utils"

const { PORT, VERCEL_URL, TELEGRAM_WEBHOOK_TOKEN } = process.env

const openai = createOpenAI({
	baseURL: process.env.OPENROUTER_BASE_URL + "/api/v1",
	apiKey: process.env.OPENROUTER_API_KEY,
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

const webhook: Telegraf.LaunchOptions["webhook"] = VERCEL_URL
	? {
			domain: VERCEL_URL,
			port: +PORT!,
			hookPath: "/",
			secretToken: TELEGRAM_WEBHOOK_TOKEN!,
		}
	: undefined

bot
	.launch({ webhook, dropPendingUpdates: true }, () => console.log("Bot is running!"))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
