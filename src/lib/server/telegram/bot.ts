import { Telegraf } from "telegraf"
import { me } from "./me"

export const bot = new Telegraf(process.env.TELEGRAM_KEY!, {
	telegram: { webhookReply: false },
	handlerTimeout: 1000 * 60 * 5, // 5 minutes
})

bot.botInfo = me

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
