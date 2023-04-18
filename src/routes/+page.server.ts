import { loginUser } from "$lib/server/auth"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = event => {
	const { isAuthenticated } = event.locals
	console.log("isAuthenticated:", isAuthenticated)

	if (event.locals.isAuthenticated) {
		console.log("redirecting to dashboard")
		throw redirect(302, "/dashboard")
	}
}

export const actions: Actions = {
	default: loginUser
}
