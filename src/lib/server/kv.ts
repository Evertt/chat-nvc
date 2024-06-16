import { dirname } from "node:path"
import { createClient, VercelKV } from "@vercel/kv"
import { loadEnv } from "vite"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const buildDirRegex = /\/(node_modules|\.(vercel|svelte-kit))\/.+$/
const computedDirname = buildDirRegex.test(__dirname)
  ? __dirname.replace(buildDirRegex, "/")
  : `${__dirname}/../../../`

const possibleRootPaths = [computedDirname, process.cwd()]

const mode = import.meta.env.MODE || process.env.NODE_ENV || "development"

const env = {
  ...loadEnv(mode, possibleRootPaths[0], "KV_"),
  ...loadEnv(mode, possibleRootPaths[1], "KV_"),
  ...import.meta.env,
  ...process.env,
}

const { KV_REST_API_TOKEN, KV_REST_API_URL, KV_KEY_PREFIX = "" } = env

const kv = KV_REST_API_URL
  ? createClient({
      url: KV_REST_API_URL,
      token: KV_REST_API_TOKEN,
    })
  : new VercelKV({ request: async (...args) => (console.trace({ args }), {}) })

const keyPrefix = KV_KEY_PREFIX.replace(/(\w)$/, "$1:")

const oldGet = kv.get.bind(kv)
kv.get = (key: string) => oldGet(`${keyPrefix}${key}`)

const oldSet = kv.set.bind(kv)
kv.set = (key, ...args) => oldSet(`${keyPrefix}${key}`, ...args)

export { kv }
