export default defineEventHandler(async (event) => {
  return {
    message: 'AI Digest API is running',
    timestamp: new Date().toISOString(),
    env: {
      playwrightServerless: process.env.PLAYWRIGHT_SERVERLESS,
      nodeEnv: process.env.NODE_ENV,
    }
  }
})