// import { Telegraf } from 'telegraf'
// import { createClient } from '@vercel/kv'
import { env } from "$env/dynamic/private"
import { json } from "@sveltejs/kit"

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	return json({ url: env.VERCEL_URL ?? "no vercel url" })
}
