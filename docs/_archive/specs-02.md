# Specs-02: Nuxt App for Link Digest System

## Overview
Alternative implementation approach using Nuxt.js to create a fully integrated web application for the AI digest system. This replaces the Slack-based workflow with a direct web interface where users can paste links in a textarea and receive processed digest information as card-based UI components.

## Core Concept
Transform the existing backend scraping pipeline into a modern web app that provides immediate visual feedback and a superior user experience compared to the Slack bot approach.

## Tech Stack
- **Frontend Framework**: Nuxt 3 with Vue 3 composition API
- **UI Components**: ShadCN Vue (port of ShadCN for Vue/Nuxt)
- **Styling**: TailwindCSS (included with ShadCN)
- **Backend**: Nuxt server API routes (leverage existing pipeline)
- **Deployment**: Vercel/Netlify with edge functions

## User Interface Flow

### 1. Input Interface
- **Landing Page**: Clean, minimal design with large textarea for link input
- **Input Features**:
  - Multi-line textarea accepting URLs (one per line or comma-separated)
  - Auto-detection and validation of URLs as user types
  - Visual indicators for valid/invalid URLs
  - Batch processing indication (e.g., "5 links detected")
  - Optional context field for additional notes

### 2. Processing State
- **Loading Interface**:
  - Progress indicators per URL being processed
  - Real-time status updates ("Fetching...", "Parsing...", "Extracting metadata...")
  - Estimated time remaining
  - Cancel button to abort processing

### 3. Results Display
- **Card-Based Layout**:
  - Each processed link rendered as an individual card
  - Responsive grid layout (1-3 columns depending on screen size)
  - Cards grouped by confidence score (green/yellow/red sections)

## Card Design Specification

### High Confidence Cards (Green)
```vue
<Card class="border-l-4 border-l-green-500">
  <CardHeader>
    <div class="flex justify-between items-start">
      <CardTitle class="text-lg font-semibold line-clamp-2">
        {{ article.title }}
      </CardTitle>
      <Badge variant="success">{{ article.confidence }}%</Badge>
    </div>
    <CardDescription class="text-sm text-muted-foreground">
      {{ article.publication }} • {{ formatDate(article.published_on) }}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p class="text-sm line-clamp-3 mb-4">{{ article.description }}</p>
    <div class="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{{ article.word_count }} words</span>
      <span>•</span>
      <span>by {{ article.author }}</span>
    </div>
  </CardContent>
  <CardFooter class="pt-4">
    <div class="flex justify-between items-center w-full">
      <a :href="article.url" target="_blank" class="text-primary hover:underline text-sm">
        Read Original
      </a>
      <Button variant="outline" size="sm" @click="copyToClipboard(article)">
        Copy Details
      </Button>
    </div>
  </CardFooter>
</Card>
```

### Medium Confidence Cards (Yellow)
- Similar structure with amber border and warning badge
- Additional "Review Needed" indicator
- Show which fields are missing or uncertain

### Low Confidence Cards (Red)
- Minimal information display
- Clear error messaging
- Suggested actions (paywall, retry, manual review)

## Feature Set

### Core Features
1. **Bulk URL Processing**: Handle multiple URLs simultaneously
2. **Real-time Feedback**: Live processing status and progress
3. **Confidence Visualization**: Color-coded results with clear scoring
4. **Export Options**: 
   - Copy individual cards as markdown
   - Export entire digest as JSON
   - Generate shareable digest URL
5. **Responsive Design**: Mobile-first approach with touch-friendly interactions

### Advanced Features
1. **Batch Operations**: Select multiple cards for batch export
2. **Filtering**: Filter cards by confidence, publication, date range
3. **Search**: Full-text search across processed articles
4. **History**: Recent digests with permalink generation
5. **Collaboration**: Share digest URLs with team members

## Technical Architecture

### Frontend Structure
```
app/
├── components/
│   ├── ui/           # ShadCN components
│   ├── LinkInput.vue # URL input textarea component
│   ├── ProcessingStatus.vue
│   ├── ArticleCard.vue
│   └── DigestExport.vue
├── pages/
│   ├── index.vue     # Main digest interface
│   ├── digest/
│   │   └── [id].vue  # Shared digest view
├── server/
│   └── api/
│       ├── process.post.ts  # Main processing endpoint
│       ├── digest/
│       │   └── [id].get.ts  # Retrieve saved digest
└── composables/
    ├── useDigestProcessor.ts
    ├── useArticleCards.ts
    └── useExport.ts
```

### Backend Integration
- **Reuse Existing Pipeline**: Leverage current scraping providers and confidence scoring
- **API Routes**: Convert CLI pipeline to Nuxt server API endpoints
- **Streaming**: Use Server-Sent Events for real-time processing updates
- **Caching**: Cache processed articles to avoid re-scraping identical URLs

### Data Flow
1. User pastes URLs → Frontend validation → API submission
2. Server processes URLs through existing pipeline
3. Real-time updates streamed to frontend via SSE
4. Results rendered as cards with confidence-based styling
5. Optional persistence for sharing/history

## Implementation Phases

### Phase 1: MVP (Core Functionality)
- Basic URL input interface
- Integration with existing scraping pipeline
- Simple card layout for results
- Basic confidence scoring visualization

### Phase 2: Enhanced UX
- Real-time processing updates
- Advanced card designs with all metadata
- Export functionality
- Responsive design optimization

### Phase 3: Collaboration Features
- Digest sharing via URLs
- History/saved digests
- Team collaboration features
- Advanced filtering and search

## Migration from Current System

### Advantages over Slack Bot
1. **Immediate Feedback**: No waiting for Slack messages
2. **Rich UI**: Visual cards vs plain text
3. **Batch Processing**: Handle multiple URLs efficiently
4. **Export Control**: Multiple export formats and sharing options
5. **No Platform Lock-in**: Works independently of Slack

### Backward Compatibility
- Keep existing API endpoints for potential Slack integration
- Maintain JSON output format for Google Docs export
- Allow CLI usage alongside web interface

## Development Setup

### Dependencies
```bash
# Core Nuxt setup
npx nuxi@latest init ai-digest-app
cd ai-digest-app

# Add ShadCN Vue
npx shadcn-vue@latest init

# Install additional dependencies
npm install @vueuse/core @nuxt/icon zod
```

### Environment Configuration
- Reuse existing `.env` structure
- Add web-specific configs (base URL, session secrets)
- Maintain same provider configurations

## Deployment Strategy
- **Primary**: Vercel with Nuxt SSR/SSG hybrid
- **Backend**: Leverage Vercel edge functions for processing
- **Alternative**: Netlify with similar serverless approach
- **Self-hosted**: Docker container for full control

## Success Metrics
1. **Processing Speed**: Sub-30 second response for 5-10 URLs
2. **User Experience**: Intuitive interface requiring no training
3. **Confidence Accuracy**: >80% of results in green/yellow categories
4. **Export Usage**: Regular use of sharing and export features
5. **Adoption**: Preference over existing Slack workflow

## Future Enhancements
- **AI Summarization**: Add GPT-powered summaries to cards
- **Collaborative Notes**: Allow team annotations on articles
- **Scheduled Digests**: Automated daily/weekly digest generation
- **Integration APIs**: Connect with team tools (Notion, Linear, etc.)
- **Mobile App**: React Native app using same backend

---

*This specification outlines a modern, user-friendly alternative to the Slack-based workflow while leveraging the existing robust scraping infrastructure.*