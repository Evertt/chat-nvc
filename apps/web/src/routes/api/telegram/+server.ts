import { env } from "$env/dynamic/private"
import { json } from "@sveltejs/kit"

export async function GET() {
	return json({ url: env.VERCEL_URL ?? "no vercel url" })
}
