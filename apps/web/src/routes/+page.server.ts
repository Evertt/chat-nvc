import { kv } from "@repo/kv"

export async function load({ request }) {
	const headers = Object.fromEntries(request.headers.entries())
	type Headers = typeof headers

	const pageVisits = (await kv.get<Headers[]>("pageVisits")) ?? []

	pageVisits.push(headers)
	await kv.set("pageVisits", pageVisits)

	const updatedPageVisits = (await kv.get<Headers[]>("pageVisits"))!

	return {
		pageVisits: updatedPageVisits,
	}
}
