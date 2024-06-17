import { kv } from "@repo/kv"

export async function load({ request }) {
	const pageVisits = (await kv.get<string[]>("pageVisits")) ?? []

	pageVisits.push(request.headers.get("user-agent") || "No user-agent header")
	await kv.set("pageVisits", pageVisits)

	const updatedPageVisits = (await kv.get<string[]>("pageVisits"))!

	return {
		pageVisits: updatedPageVisits,
	}
}
