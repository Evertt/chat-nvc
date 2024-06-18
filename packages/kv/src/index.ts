import dotenv from "dotenv"
import { createClient, VercelKV } from "@vercel/kv"

const cwd = process.cwd()

const { NODE_ENV = "development", MODE = NODE_ENV } = process.env

dotenv.config({ path: [`${cwd}/.env`, ...(MODE ? [`${cwd}/.env.${MODE}`] : [])] })

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

type GetFn = typeof kv.get
type SetFn = typeof kv.set

const kvProxy = new Proxy(kv, {
	get(target, key) {
		if (key === "get") {
			return ((key, ...args) => target.get(`${keyPrefix}${key}`, ...args)) as GetFn
		}

		if (key === "set") {
			return ((key, ...args) => target.set(`${keyPrefix}${key}`, ...args)) as SetFn
		}

		return Reflect.get(target, key)
	},
})

export { kvProxy as kv }
