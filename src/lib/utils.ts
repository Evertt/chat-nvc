import type { RequestEvent } from "@sveltejs/kit"

export function handleLoginRedirect(
	event: RequestEvent,
	message = "You must be logged in to access this page"
) {
	const redirectTo = event.url.pathname + event.url.search
	return `/?redirectTo=${redirectTo}&message=${message}`
}
