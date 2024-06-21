import { kv } from "@repo/kv"

export async function load({ request }) {
	const headers = request.headers
	const host = headers.get("host") ?? "no-host"
	const userAgent = headers.get("user-agent") ?? "no-user-agent"

	const pageVisits = (await kv.get<string[]>("pageVisits")) ?? []
	await kv.set("pageVisits", [...pageVisits, `host: ${host}, user-agent: ${userAgent}`])

	const updatedPageVisits = (await kv.get<string[]>("pageVisits"))!

	return {
		pageVisits: updatedPageVisits,
	}
}
