import dotenv from "dotenv"

const cwd = process.cwd()

const { NODE_ENV = "local", MODE = NODE_ENV } = process.env

const paths = [`${cwd}/.env`, ...(MODE ? [`${cwd}/.env.${MODE}`] : [])]

dotenv.config({ path: paths })

process.env["MODE"] = MODE
