import { Telegraf } from 'telegraf'
import type { RequestHandler } from './$types'
import { TELEGRAM_KEY, TELEGRAM_WEBBOOK_TOKEN } from '$env/static/private'

const bot = new Telegraf(TELEGRAM_KEY)

export const GET: RequestHandler = async () => {
	bot.telegram.deleteWebhook({
    drop_pending_updates: true
  })

	return new Response('webhook deleted...')
}
