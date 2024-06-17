import { bot } from "./setup.js"
import type { Telegraf } from "telegraf"

const { PORT, VERCEL_URL, TELEGRAM_WEBHOOK_TOKEN } = process.env

const webhook: Telegraf.LaunchOptions["webhook"] = VERCEL_URL
	? {
			domain: VERCEL_URL,
			port: +PORT!,
			hookPath: "/",
			secretToken: TELEGRAM_WEBHOOK_TOKEN!,
		}
	: undefined

export const launchBot = () =>
	bot
		.launch({ webhook, dropPendingUpdates: true }, () => console.log("Bot is running!"))
		.catch((error: unknown) => {
			console.error(error)
			process.exit(1)
		})
