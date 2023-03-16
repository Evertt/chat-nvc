import { Telegraf } from 'telegraf'
import type { RequestHandler } from './$types'
import { TELEGRAM_KEY, TELEGRAM_WEBBOOK_TOKEN } from '$env/static/private'

const bot = new Telegraf(TELEGRAM_KEY)

export const GET: RequestHandler = async () => {
	bot.telegram

  await bot.telegram.setWebhook(
		'https://chat-nvc.vercel.app/api/telegram',
		{
			secret_token: TELEGRAM_WEBBOOK_TOKEN,
			drop_pending_updates: true,
		}
	)

	return new Response('ok')
}
