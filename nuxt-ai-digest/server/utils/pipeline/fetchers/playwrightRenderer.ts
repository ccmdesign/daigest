interface RenderResult {
  status: string
  html?: string
  error?: string
}

export async function createPlaywrightRenderer() {
  let browser: any = null
  let page: any = null
  
  const isServerless = process.env.PLAYWRIGHT_SERVERLESS === '1'

  async function loadPlaywright(): Promise<any | null> {
    try {
      const pkg = await import('playwright')
      return pkg
    } catch (error: any) {
      if (error.code !== 'ERR_MODULE_NOT_FOUND') {
        console.warn('Unexpected Playwright import error:', error)
      }
    }

    try {
      const pkg = await import('playwright-core')
      return pkg
    } catch (fallbackError: any) {
      if (fallbackError.code !== 'ERR_MODULE_NOT_FOUND') {
        console.warn('Unexpected Playwright-core import error:', fallbackError)
      }
    }

    return null
  }
  
  async function initBrowser() {
    if (browser) return browser
    
    try {
      if (isServerless) {
        // Use Chromium for serverless
        const chromium = await import('@sparticuz/chromium-min')
        const playwright = await import('playwright-core')
        
        browser = await playwright.chromium.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        })
      } else {
        // Use regular Playwright for local development
        const playwright = await loadPlaywright()

        if (!playwright) {
          throw new Error('Playwright dependency not found. Install "playwright" or "playwright-core".')
        }

        const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
        const launchOptions: Record<string, any> = {
          headless: true,
        }

        if (executablePath) {
          launchOptions.executablePath = executablePath
        }

        browser = await playwright.chromium.launch(launchOptions)
      }
      
      page = await browser.newPage()
      
      // Set realistic headers
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      })
      
      return browser
    } catch (error: any) {
      console.error('Failed to initialize Playwright browser:', error)
      throw error
    }
  }
  
  async function render(url: string): Promise<RenderResult> {
    try {
      await initBrowser()
      
      if (!page) {
        return { status: 'error', error: 'Browser page not initialized' }
      }
      
      // Navigate with timeout
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Wait a bit for dynamic content
      await page.waitForTimeout(2000)
      
      // Get the HTML content
      const html = await page.content()
      
      return { status: 'ok', html }
      
    } catch (error: any) {
      console.warn('Playwright render failed:', error.message)
      return { status: 'error', error: error.message }
    }
  }
  
  async function close() {
    try {
      if (page) {
        await page.close()
        page = null
      }
      if (browser) {
        await browser.close()
        browser = null
      }
    } catch (error) {
      console.warn('Error closing Playwright browser:', error)
    }
  }
  
  return { render, close }
}
