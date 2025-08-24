# System Architecture

## 🏗️ Overview

Immersive Language Master is a Chrome Extension built with Manifest V3, featuring a modular architecture that separates concerns across different components.

```
┌─────────────────────────────────────────────────────────┐
│                     Chrome Browser                       │
├─────────────────────────────────────────────────────────┤
│                    Extension Context                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Background Service Worker           │   │
│  │  - Message routing                              │   │
│  │  - Storage management                           │   │
│  │  - API communications                           │   │
│  └─────────────────────────────────────────────────┘   │
│                           ↕                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │               Content Scripts                    │   │
│  │  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │Word Processor│  │Text Analyzer │            │   │
│  │  └──────────────┘  └──────────────┘            │   │
│  │  ┌──────────────┐  ┌──────────────┐            │   │
│  │  │ Translation  │  │   Learning   │            │   │
│  │  │   Service    │  │   Manager    │            │   │
│  │  └──────────────┘  └──────────────┘            │   │
│  └─────────────────────────────────────────────────┘   │
│                           ↕                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │                  User Interface                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │  Popup   │  │ Tooltips │  │  Cards   │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 📦 Component Architecture

### Core Layer

#### Word Processor (`/core/word-processor.js`)
**Responsibilities**:
- DOM text node processing
- Word classification and highlighting
- User interaction handling
- Tooltip management

**Key Design Patterns**:
- **Singleton Pattern**: Only one tooltip instance
- **Observer Pattern**: Word state changes propagate to all instances
- **Delegation Pattern**: Event delegation for performance

**Dependencies**:
- Text Analyzer (classification)
- Translation Service (translations)
- Learning Manager (progress tracking)

#### Text Analyzer (`/core/text-analyzer.js`)
**Responsibilities**:
- Vocabulary database management
- Word frequency analysis
- Difficulty classification
- Text statistics

**Data Flow**:
```
Word Input → Frequency Lookup → Classification → Output
           ↓
    COCA Database (5000 words)
```

**Fallback Strategy**:
- Primary: Chrome storage for vocabulary data
- Fallback: In-memory frequency map
- Emergency: Basic classification

### Service Layer

#### Translation Service (`/services/translation-service.js`)
**Architecture**: Provider-based plugin system

```javascript
TranslationService
    ├── GoogleTranslateProvider
    ├── DeepLProvider
    ├── ClaudeProvider
    ├── ChatGPTProvider
    ├── XAIProvider
    └── GeminiProvider
```

**Pattern**: Strategy Pattern for provider selection
**Caching**: LRU cache with 1000 entry limit

#### Learning Manager (`/services/learning-manager.js`)
**Responsibilities**:
- Learning progress tracking
- Spaced repetition scheduling
- Statistics generation
- Data persistence

**Storage Structure**:
```javascript
{
  learningRecords: Map<word, record>,
  bookmarkedWords: Map<word, metadata>,
  studySessions: Array<session>,
  reviewQueue: Array<word>,
  streakData: Object,
  learningGoals: Object
}
```

### UI Layer

#### Component System
**Tooltip Component**:
- Self-contained with event handling
- Position calculation
- Animation management
- Cleanup on removal

**Word Card Component**:
- Detailed word information
- Translation display
- Learning actions
- Progress indicators

## 🔄 Data Flow

### Word Processing Pipeline

```
1. Page Load
    ↓
2. DOM Content Loaded
    ↓
3. Universal Processor Initialization
    ↓
4. Text Node Discovery
    ↓
5. Word Extraction & Classification
    ↓
6. DOM Modification (Highlighting)
    ↓
7. Event Listener Attachment
    ↓
8. Ready for Interaction
```

### User Interaction Flow

```
User Hovers Over Word
    ↓
MouseEnter Event (300ms delay)
    ↓
Tooltip Creation Check
    ↓
Translation Fetch (cached/API)
    ↓
Tooltip Display
    ↓
User Action (Known/Learn/Translate/Details)
    ↓
State Update
    ↓
DOM Update (All Instances)
    ↓
Storage Persistence
    ↓
Analytics Tracking
```

## 💾 Storage Architecture

### Chrome Storage Structure

```javascript
chrome.storage.local = {
  // User Settings
  vocabularyLevel: Number,        // 500-5000
  displayMode: String,            // 'hideKnown', 'showAll', etc.
  translationProvider: String,    // 'google', 'deepl', etc.
  translationLanguage: String,    // 'zh-CN', 'es', etc.
  
  // Learning Data
  knownWords: Array<String>,      // Words marked as known
  learningWords: Array<String>,   // Words being learned
  learningRecords: Array,         // Detailed learning history
  bookmarkedWords: Array,         // Saved for review
  
  // Statistics
  studySessions: Array,           // Session history
  streakData: Object,            // Daily streak information
  learningGoals: Object,          // User-defined goals
  
  // Cache
  translationCache: Object,       // Recent translations
  analysisCache: Object          // Text analysis results
}
```

### Fallback Storage
When Chrome APIs unavailable:
- Use in-memory storage
- SessionStorage for temporary persistence
- LocalStorage as last resort

## 🎯 Event System

### Event Types

#### DOM Events
- `mouseenter` - Tooltip trigger (with delay)
- `mouseleave` - Tooltip hide
- `click` - Word actions
- `keydown` - Keyboard shortcuts

#### Custom Events
- `word-state-changed` - Word classification update
- `tooltip-created` - Tooltip instantiation
- `learning-progress` - Progress update

#### Message Passing
```javascript
// Content Script → Background
chrome.runtime.sendMessage({
  type: 'WORD_MARKED_AS_KNOWN',
  word: 'example'
});

// Background → Content Script
chrome.tabs.sendMessage(tabId, {
  type: 'UPDATE_SETTINGS',
  settings: {...}
});
```

## 🔐 Security Considerations

### Content Security Policy
- No inline scripts
- No eval() usage
- Trusted sources only

### Data Sanitization
- HTML escaping for user content
- XSS prevention in tooltips
- Input validation for settings

### API Key Management
- Stored in Chrome storage (encrypted)
- Never exposed in code
- User-provided keys only

## ⚡ Performance Optimization

### Strategies

#### 1. Lazy Loading
- Components loaded on demand
- Vocabulary database chunked
- Translations cached aggressively

#### 2. Debouncing & Throttling
- Tooltip display (300ms delay)
- Scroll events throttled
- Storage writes batched

#### 3. DOM Optimization
- Minimal reflows
- RAF for animations
- Virtual scrolling for long lists

#### 4. Memory Management
- Event listener cleanup
- DOM reference release
- Cache size limits

### Performance Targets
- Initial load: <100ms
- Word processing: <50ms per word
- Tooltip display: <200ms
- Memory usage: <50MB base

## 🔄 State Management

### Global State
Managed through singleton pattern:
```javascript
window.ilmWordProcessor     // Word processing
window.ilmTextAnalyzer      // Text analysis
window.ilmTranslationService // Translations
window.ilmLearningManager   // Learning data
```

### Local State
Component-specific state:
- Tooltip visibility
- Hover timers
- Animation states
- Form inputs

### State Synchronization
- Chrome storage for persistence
- Message passing for updates
- Event system for propagation

## 🚀 Deployment Architecture

### Build Process
1. Code validation
2. Resource optimization
3. Manifest generation
4. Extension packaging

### Update Mechanism
- Automatic updates via Chrome Web Store
- Version checking
- Migration scripts for data

### Monitoring
- Error reporting to console
- Performance metrics
- Usage analytics (privacy-compliant)

## 📊 Scalability Considerations

### Current Limits
- 5,000 word vocabulary
- 6 translation providers
- Single language pair

### Future Expansion
- Multiple language support
- Larger vocabulary databases
- Plugin system for providers
- Cloud synchronization
- Mobile app companion

## 🔧 Maintenance

### Code Organization
```
/core           - Core processing logic
/services       - Business services
/components     - UI components
/styles         - CSS styles
/content-scripts - Page-specific scripts
/background     - Service worker
/popup          - Extension popup
/data           - Static data files
/docs           - Documentation
```

### Testing Strategy
- Unit tests for services
- Integration tests for components
- E2E tests for user flows
- Performance benchmarks

### Debugging Tools
- Chrome DevTools
- Extension-specific DevTools
- Custom logging system
- Test pages for scenarios