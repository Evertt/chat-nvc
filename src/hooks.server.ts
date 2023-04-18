import { authenticateUser } from "$lib/server/auth"

export const handle = async ({ event, resolve }) => {
	event.locals.isAuthenticated = await authenticateUser(event)

	return resolve(event)
}
