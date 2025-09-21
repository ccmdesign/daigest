export function parseHtmlArticle(html: string, url: string): Record<string, any> {
  if (!html) return {}
  
  try {
    // Simple HTML parsing fallback
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=[\"']description[\"'][^>]*content=[\"']([^\"']+)[\"']/i)
    const description = descMatch ? descMatch[1].trim() : ''
    
    // Extract meta author
    const authorMatch = html.match(/<meta[^>]*name=[\"']author[\"'][^>]*content=[\"']([^\"']+)[\"']/i)
    const author = authorMatch ? authorMatch[1].trim() : ''
    
    // Extract basic text content (very simple)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    let body = ''
    if (bodyMatch) {
      // Remove scripts and styles
      body = bodyMatch[1]
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ') // Remove all HTML tags
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim()
    }
    
    const result: Record<string, any> = {}
    
    if (title) result.title = title
    if (description) result.description = description
    if (author) result.author = author
    if (body && body.length > 50) {
      result.body = body
      result.word_count = body.split(/\s+/).filter(word => word.length > 0).length
    }
    
    // Try to extract hostname as publisher
    try {
      const urlObj = new URL(url)
      result.publisher = urlObj.hostname.replace(/^www\./, '')
    } catch {
      // Ignore URL parsing errors
    }
    
    return result
    
  } catch (error) {
    console.warn('HTML parsing fallback failed:', error)
    return {}
  }
}