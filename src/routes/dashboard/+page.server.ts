import { handleLoginRedirect } from "$lib/utils"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { createClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ADMIN_KEY } from "$env/static/private"

// Create a single supabase client for interacting with your database
const supabase = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY)

export const load: PageServerLoad = async event => {
	if (!event.locals.isAuthenticated) {
		throw redirect(302, handleLoginRedirect(event))
	}

	const { data, error } = await supabase
		.from("purchases")
		.select()
}
