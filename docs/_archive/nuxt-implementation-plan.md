# Nuxt AI Digest Implementation Plan

## Project Overview
Port the existing AI digest scraping system to a Nuxt 3 web application with ShadCN Vue components, deployable on Vercel/Netlify as a single serverless instance.

## 🚨 **CRITICAL REQUIREMENT**
**MUST USE ShadCN Vue** - This is a non-negotiable requirement. All UI components must be implemented using ShadCN Vue, not @nuxt/ui or any other UI library.

## 📊 **Implementation Progress** *(Updated: 2025-09-21)*

### ✅ **COMPLETED**
- **Nuxt 3 Project Setup**: Working application with proper directory structure (`app/` srcDir)
- **Basic Routing**: Pages render correctly, Nuxt welcome screen replaced
- **Pipeline Code Ported**: All scraping logic moved to `server/utils/pipeline/`
- **API Endpoints**: Mock processing endpoint working (`/api/process-simple`)
- **TypeScript Types**: Complete type definitions for ArticleRecord, ProcessingOptions
- **Project Structure**: Proper file organization with app/, server/, types/
- **Environment Setup**: TailwindCSS, heroicons, basic dependencies installed

### 🔧 **IN PROGRESS**
- **ShadCN Vue Integration**: Need to replace @nuxt/ui with proper ShadCN Vue setup
- **Pipeline Import Resolution**: Module import paths for real scraping functionality

### ❌ **PENDING**
- **Real Article Processing**: Fix import issues to enable actual scraping
- **ShadCN Vue Components**: Replace all U* components with proper ShadCN equivalents
- **Real-time Updates**: Server-Sent Events implementation
- **Export Functionality**: JSON, markdown, sharing features
- **Mobile Optimization**: Responsive design refinements
- **Vercel Deployment**: Production deployment configuration

---

## Milestone 1: Foundation Setup (Week 1)

### Tasks
1. **Project Initialization**
   - Create new Nuxt 3 project
   - Install and configure ShadCN Vue
   - Set up TailwindCSS and base styling
   - Configure TypeScript and ESLint

2. **Dependency Migration**
   - Install existing scraping dependencies in Nuxt project
   - Configure environment variables and runtime config
   - Set up proper import paths and auto-imports

3. **Basic Project Structure**
   ```
   nuxt-ai-digest/
   ├── components/
   │   ├── ui/              # ShadCN components
   │   ├── LinkInput.vue
   │   ├── ProcessingStatus.vue
   │   └── ArticleCard.vue
   ├── pages/
   │   └── index.vue        # Main interface
   ├── server/
   │   ├── api/
   │   │   └── process.post.ts
   │   └── utils/
   │       └── pipeline/    # Ported scraping logic
   └── composables/
       └── useDigestProcessor.ts
   ```

**Deliverables:**
- Working Nuxt 3 project with ShadCN Vue
- Basic file structure ready for development
- Environment configuration matching existing project

**Acceptance Criteria:**
- `npm run dev` starts successfully
- ShadCN components render correctly
- All dependencies installed without conflicts

---

## Milestone 2: Backend Pipeline Integration (Week 2)

### Tasks
4. **Port Scraping Pipeline**
   - Copy `src/pipeline/` to `server/utils/pipeline/`
   - Update imports to work with Nuxt server context
   - Modify file I/O operations for serverless environment
   - Test pipeline functionality in server context

5. **Create Processing API Endpoint**
   - Implement `/api/process.post.ts` 
   - Handle URL validation and sanitization
   - Integrate with existing provider chain
   - Return structured JSON response

6. **Serverless Configuration**
   - Configure Playwright for serverless environment
   - Set up memory and timeout limits
   - Implement browser instance management
   - Add error handling for serverless constraints

**Deliverables:**
- Working API endpoint that processes URLs
- Ported pipeline code running in Nuxt server
- Playwright configured for serverless deployment

**Acceptance Criteria:**
- API endpoint processes single URL successfully
- Confidence scoring works correctly
- Metadata extraction matches existing functionality

---

## Milestone 3: Frontend Interface (Week 3)

### Tasks
7. **URL Input Interface**
   - Create textarea component with URL validation
   - Implement real-time URL detection and highlighting
   - Add batch processing indicators
   - Include optional context field

8. **Article Card Components**
   - Design card layout based on confidence levels
   - Implement green/yellow/red visual indicators
   - Add metadata display (title, author, publication, etc.)
   - Include action buttons (copy, export, view original)

9. **Processing State Management**
   - Create loading states and progress indicators
   - Implement error handling and retry mechanisms
   - Add cancel processing functionality
   - Show real-time status updates

**Deliverables:**
- Complete URL input interface
- Article card components with all confidence levels
- Processing state management

**Acceptance Criteria:**
- URLs are validated and highlighted as user types
- Cards display correctly for all confidence levels
- Loading states provide clear feedback

---

## Milestone 4: Real-time Updates & Advanced Features (Week 4)

### Tasks
10. **Server-Sent Events Implementation**
    - Create streaming API endpoint (`/api/process-stream.post.ts`)
    - Implement progress updates for each URL
    - Handle connection management and cleanup
    - Add error handling for connection drops

11. **Export Functionality**
    - Implement JSON export for entire digest
    - Add markdown export for individual articles
    - Create shareable digest URLs
    - Add copy-to-clipboard functionality

12. **Enhanced UX Features**
    - Add filtering by confidence level
    - Implement search across processed articles
    - Create batch selection for multiple cards
    - Add keyboard shortcuts for power users

**Deliverables:**
- Real-time processing updates
- Complete export functionality
- Enhanced user experience features

**Acceptance Criteria:**
- Users see real-time progress for each URL
- Export functions work reliably
- Filtering and search perform smoothly

---

## Milestone 5: Optimization & Deployment (Week 5)

### Tasks
13. **Performance Optimization**
    - Implement caching for processed URLs
    - Optimize bundle size and lazy loading
    - Add browser instance pooling
    - Implement request deduplication

14. **Mobile Responsiveness**
    - Optimize card layout for mobile screens
    - Implement touch-friendly interactions
    - Add mobile-specific gestures
    - Test across different device sizes

15. **Production Deployment**
    - Configure Vercel deployment settings
    - Set up environment variables
    - Implement proper error monitoring
    - Add analytics and performance tracking

**Deliverables:**
- Optimized, production-ready application
- Mobile-responsive design
- Deployed application on Vercel

**Acceptance Criteria:**
- Application loads quickly on all devices
- Mobile experience is smooth and intuitive
- Deployment is stable and scalable

---

## Technical Requirements

### Dependencies to Install
```json
{
  "dependencies": {
    "shadcn-vue": "^0.10.x",
    "radix-vue": "^1.9.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.1.x",
    "tailwind-merge": "^3.3.x",
    "lucide-vue-next": "^0.544.x",
    "@vueuse/core": "^10.x",
    "@vueuse/nuxt": "^10.x",
    "zod": "^3.x",
    "@mozilla/readability": "^0.5.0",
    "@sparticuz/chromium-min": "^121.0.0",
    "jsdom": "^24.1.0",
    "metascraper": "^5.33.4",
    "metascraper-author": "^5.33.4",
    "metascraper-date": "^5.33.4",
    "metascraper-description": "^5.33.4",
    "metascraper-publisher": "^5.33.4",
    "metascraper-title": "^5.33.4",
    "metascraper-url": "^5.33.4",
    "pdf-parse": "^1.1.1",
    "playwright-core": "^1.55.0"
  }
}
```

### Environment Variables
```bash
# Existing variables from current project
PLAYWRIGHT_SERVERLESS=1
DIFFBOT_TOKEN=your_token
BRIGHTDATA_TOKEN=your_token

# New Nuxt-specific variables
NUXT_SECRET_KEY=your_secret
NUXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

### Vercel Configuration
```json
{
  "functions": {
    "app/**": {
      "memory": 1536,
      "maxDuration": 60
    }
  },
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

## Success Metrics
- **Performance**: Process 5-10 URLs in under 30 seconds
- **Reliability**: 95% success rate for article extraction
- **User Experience**: Intuitive interface requiring no training
- **Mobile**: Fully responsive design working on all screen sizes
- **Deployment**: Zero-downtime deployments on Vercel

## Risk Mitigation
- **Cold Starts**: Implement browser instance warming
- **Memory Limits**: Add processing queue for large batches
- **Timeout Issues**: Implement proper error boundaries
- **Rate Limiting**: Add request throttling and retry logic

## Future Enhancements (Post-Launch)
- Team collaboration features
- Saved digest history
- Advanced search and filtering
- Integration with external tools (Notion, Linear)
- Mobile app development
- AI-powered article summarization

---

*This plan provides a structured approach to implementing the Nuxt AI Digest application while maintaining the robustness of the existing scraping infrastructure.*