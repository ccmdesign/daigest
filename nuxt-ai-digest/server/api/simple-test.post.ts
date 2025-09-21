export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  return {
    success: true,
    message: 'API endpoint working',
    receivedData: body,
    timestamp: new Date().toISOString()
  }
})