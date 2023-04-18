import { dev } from "$app/environment"
import { type RequestEvent, fail } from "@sveltejs/kit"
import { JWT } from "node-jsonwebtoken"
import { PASSWORD } from "$env/static/private"

const jwt = new JWT<"valid">(PASSWORD)

export const authenticateUser = async (event: RequestEvent) => {
	// get the cookies from the request
	const { cookies } = event

	// get the user token from the cookie
	const userToken = cookies.get("auth")

  console.log("userToken:", userToken)
  if (!userToken) return false

	// if the user token is not valid, return null
	// this is where you would check the user token against your database
	// to see if it is valid and return the user object

  const isAuthenticated = await jwt.verify(userToken) === "valid"

	return isAuthenticated
}

export const loginUser = async (event: RequestEvent) => {
  const data = await event.request.formData()
  const password = data.get("password") as string

  if (password === PASSWORD) {
    const token = await jwt.sign("valid")

    event.cookies.set("auth", token, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      secure: dev ? false : true,
      sameSite: "strict"
    })

    event.locals.isAuthenticated = true
  } else {
    return fail(401, { password, message: "Incorrect password"})
  }
}
