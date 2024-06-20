import { kv } from "@repo/kv"

export async function load({ request }) {
	const headers = request.headers
	const host = headers.get("host") ?? "no-host"
	const forwardedHost = headers.get("x-forwarded-host") ?? "no-forwarded-host"

	const pageVisits = (await kv.get<string[]>("pageVisits")) ?? []
	await kv.set("pageVisits", [...pageVisits, `host: ${host}, forwardedHost: ${forwardedHost}`])

	const updatedPageVisits = (await kv.get<string[]>("pageVisits"))!

	return {
		pageVisits: updatedPageVisits,
	}
}
