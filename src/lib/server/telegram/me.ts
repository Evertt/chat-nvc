import { Telegram } from "telegraf"

const { TELEGRAM_KEY } = process.env
const telegram = new Telegram(TELEGRAM_KEY!)
export const me = await telegram.getMe()
