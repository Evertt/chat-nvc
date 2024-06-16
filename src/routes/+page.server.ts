import { kv } from "$lib/server/kv"

/** @type {import('./$types').PageLoad} */
export async function load({ request }) {
	let pageVisits = (await kv.get<number | string[]>("pageVisits")) ?? []

	if (typeof pageVisits === "number") {
		pageVisits = new Array(pageVisits).fill("This user-agent header wasn't recorded at the time.")

		await kv.set<string[]>("pageVisits", pageVisits)
	}

	pageVisits.push(request.headers.get("user-agent") || "No user-agent header")
	await kv.set("pageVisits", pageVisits)

	const updatedPageVisits = await kv.get<string[]>("pageVisits")

	return {
		pageVisits: updatedPageVisits!,
	}
}
