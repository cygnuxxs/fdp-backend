import 'dotenv/config'

export const port = Number(process.env["PORT"] ?? 3000)
export const databaseUrl = process.env["DATABASE_URL"]
export const betterAuthUrl = process.env["BETTER_AUTH_URL"]
export const betterAuthSecret = process.env["BETTER_AUTH_SECRET"]