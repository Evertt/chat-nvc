import dotenv from "dotenv"
import { createClient, VercelKV } from "@vercel/kv"

dotenv.config()

const { KV_REST_API_TOKEN = "", KV_REST_API_URL = "", KV_KEY_PREFIX = "" } = process.env

const kv =
	KV_REST_API_URL && KV_REST_API_TOKEN
		? createClient({
				url: KV_REST_API_URL,
				token: KV_REST_API_TOKEN,
			})
		: new VercelKV({
				request: async (...args) => (console.trace("Running fake VercelKV client", { args }), {}),
			})

const keyPrefix = KV_KEY_PREFIX.replace(/(\w)$/, "$1:")

const oldGet = kv.get.bind(kv) as typeof kv.get
kv.get = (key: string) => oldGet(`${keyPrefix}${key}`)

const oldSet = kv.set.bind(kv) as typeof kv.set
kv.set = (key, ...args) => oldSet(`${keyPrefix}${key}`, ...args)

export { kv }
