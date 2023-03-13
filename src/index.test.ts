import TelegramServer from 'telegram-test-api'
import { TELEGRAM_KEY } from '$env/static/private'
import { describe, it, expect, beforeAll, afterAll } from "vitest"

describe('telegram', async () => {
	let server: TelegramServer

	beforeAll(async () => {
		server = new TelegramServer()
		await server.start()
	})

	afterAll(async () => {
		await server.stop()
	})

	it('should start', async () => {
		server.setWebhook({ url: 'http://0.0.0.0:8000/webhook' }, TELEGRAM_KEY)
		const client = server.getClient(TELEGRAM_KEY, {
			timeout: 10000,
		})
		const message = client.makeMessage('/start')
		await client.sendMessage(message)
		const updateResp = await client.getUpdates()
		console.log(`Ok: ${updateResp.ok}, result:\n`, updateResp.result)
		expect(updateResp.ok).to.be.true
		updateResp.result.forEach(update => {
			expect(update.message.text).to.equal("Hello, I'm a bot that's using Sanic and python-telegram-bot!")
		})
	})
})

