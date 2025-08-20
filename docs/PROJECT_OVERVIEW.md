# English Listening Assistant - Project Overview

**Last Updated**: 2024-12-19  
**Version**: 1.3.0 (Smart Word Splitting & New Tab Dashboard)  
**Status**: Active Development

## 🎯 Project Mission

Comprehensive Chrome extension ecosystem that enhances English listening skills through smart subtitle processing, intelligent word splitting, and personalized learning experiences across YouTube and Netflix platforms.

## 📊 Current State

### ✅ Completed Features
- **Vocabulary Assessment System**: 25-question COCA-based evaluation
- **Smart Word Splitting**: Intelligent separation of concatenated subtitle words
- **Multi-Interface System**: Chrome Side Panel + New Tab Dashboard
- **Translation Integration**: 6-provider translation service (Google, DeepL, Claude, etc.)
- **Interactive Learning**: Click-to-mark, hover translations, and review sessions
- **YouTube Independent Subtitles**: API-based subtitle access (works without UI captions)
- **Netflix Advanced Processing**: DOM-based with smart word splitting
- **Configurable Features**: Optional new tab with preview and reset
- **Real-time Subtitle Timeline**: Live subtitle tracking in side panel
- **Data Persistence**: Comprehensive learning progress and settings storage

### 🔄 Current Version Files
- **Active Manifest**: `manifest.json` (v1.3.0 Smart Features)
- **Main Scripts**: `youtube-improved.js`, `netflix-improved.js` (with smart splitting)
- **Interface System**: `sidebar/` (Chrome Side Panel), `newtab/` (Learning Dashboard)
- **Services**: `translation-service.js` (Multi-provider translation)
- **Styles**: `overlay-improved.css`, `sidebar.css`, `newtab.css`
- **Data**: `coca-5000.json`, `assessment-words.json`

## 🏗️ Architecture Overview

### Core Components

```
English Listening Assistant/
├── manifest.json                    # Extension configuration (v1.3.0)
├── background.js                    # Service Worker - message passing
├── sidebar/                        # Chrome Side Panel Interface
│   ├── sidebar.html                # Advanced settings & timeline
│   ├── sidebar.js                  # SidebarManager - comprehensive controls
│   └── sidebar.css                 # Modern sidebar styling
├── newtab/                         # New Tab Learning Dashboard
│   ├── newtab.html                 # Personalized learning interface
│   ├── newtab.js                   # LearningDashboard - vocabulary review
│   └── newtab.css                  # Responsive dashboard styling
├── content-scripts/                # Platform-specific processors
│   ├── youtube-improved.js         # YouTube + smart word splitting
│   ├── netflix-improved.js         # Netflix + smart word splitting
│   └── subtitle-overlay.js         # Common overlay utilities
├── services/                       # Shared services
│   └── translation-service.js      # Multi-provider translation API
├── data/                          # Vocabulary databases
│   ├── coca-5000.json             # COCA frequency word list
│   └── assessment-words.json       # 55-word assessment pool
├── styles/                        # Visual styling
│   └── overlay-improved.css       # Subtitle overlay styles
└── docs/                          # Project documentation
    ├── PROJECT_OVERVIEW.md        # This file
    ├── DEVELOPMENT_PLAN.md        # Development roadmap
    └── ...
```

## 🔧 Core Functions & APIs

### Background Service Worker (`background.js`)
**Purpose**: Message coordination and data management

**Key Classes**:
- `ExtensionManager`: Main coordinator class

**Key Methods**:
```javascript
- initializeManager(): Setup extension lifecycle
- handleMessage(request, sender, sendResponse): Route messages
- loadSettings(): Load user preferences
- markWordAsKnown(word): Update known vocabulary
- updateLearningList(): Sync learning progress
- handleTranslationRequest(): Coordinate translation services
```

**Message Types**:
- `GET_VOCABULARY_LEVEL`: Retrieve user's vocab level
- `UPDATE_VOCABULARY_LEVEL`: Update vocab assessment result
- `MARK_WORD_AS_KNOWN`: Add word to known list
- `ADD_TO_LEARNING_LIST`: Add words to learning queue
- `TRANSLATE_TEXT`: Request translation from providers
- `SETTINGS_UPDATED`: Sync settings across components
- `SUBTITLE_TIMELINE_UPDATE`: Real-time subtitle data
- `JUMP_TO_TIME`: Video player time navigation

### YouTube Content Script (`youtube-improved.js`)
**Purpose**: Independent subtitle fetching and real-time processing

**Key Classes**:
- `YouTubeSubtitleManager`: Main processing engine with independent subtitle support

**Core Methods**:
```javascript
- initializeManager(): Setup monitoring and research independent access
- researchSubtitleAccess(): Analyze ytInitialPlayerResponse for subtitle tracks
- analyzePlayerResponse(): Extract subtitle track URLs from YouTube data
- initializeIndependentSubtitles(): Fetch and parse subtitle data
- parseSubtitleData(): Format detection and parsing (SRV3, WebVTT, XML)
- startIndependentSubtitleSync(): Time-based subtitle synchronization
- smartSplitWords(text): Intelligent word separation using dictionary matching
- checkForSubtitles(): DOM fallback for subtitle detection
- processSubtitle(text, element): Analyze, split, and filter content
- processSubtitleText(text): Apply smart splitting and vocabulary checking
- isWordKnown(word): COCA-based vocabulary checking
- updateSubtitleTimeline(): Send subtitle data to sidebar
```

**Independent Subtitle System**:
- **Data Source**: `ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks`
- **Format Support**: SRV3 XML, WebVTT, Generic XML
- **Synchronization**: 200ms polling with video time matching
- **Fallback**: DOM-based detection when independent system fails

**DOM Selectors (Fallback)**:
- `.ytp-caption-segment`: Primary subtitle elements
- `.ytp-caption-window-container`: Subtitle container
- Video captions button state: `aria-pressed="true"`

### Netflix Content Script (`netflix-improved.js`)
**Purpose**: Netflix-specific subtitle processing

**Key Classes**:
- `NetflixSubtitleManager`: Netflix subtitle engine

**Key Methods**:
```javascript
- waitForNetflixPlayer(): Detect Netflix video player
- checkForSubtitles(): Multi-selector subtitle detection
- setupSubtitleMonitoring(): Observer-based monitoring
- smartSplitWords(text): Intelligent word separation using dictionary matching
- processSubtitle(text, element): Apply smart splitting and vocabulary filtering
- processSubtitleText(text): Enhanced text processing with word splitting
- updateSubtitleTimeline(): Send subtitle data to sidebar
```

**Netflix Selectors**:
- `.player-timedtext span`: Primary Netflix subtitles
- `[data-uia="player-timedtext"]`: Alternative selector
- `[class*="timedtext"]`: Fallback pattern matching

### Multi-Interface System

#### Chrome Side Panel (`sidebar.js`)
**Purpose**: Advanced settings and real-time subtitle management

**Key Classes**:
- `SidebarManager`: Comprehensive interface controller

**Key Methods**:
```javascript
- generateAssessmentWords(): Create vocabulary test
- startAssessment(): Begin 25-question evaluation
- updateSetting(key, value): Save user preferences
- showStudyMode(): Review learning words
- updateNewTabSetting(enabled): Configure new tab dashboard
- openNewTabPreview(): Preview dashboard functionality
- resetNewTabSettings(): Reset to defaults
- updateSubtitleDisplay(): Real-time subtitle timeline
- jumpToSubtitle(time): Navigate video to specific timestamp
- saveTranslationSettings(): Manage translation provider configuration
```

#### New Tab Dashboard (`newtab.js`)
**Purpose**: Personalized vocabulary learning and progress tracking

**Key Classes**:
- `LearningDashboard`: Vocabulary review and progress management

**Key Methods**:
```javascript
- loadData(): Load vocabulary and progress data
- startQuickReview(): Begin vocabulary review session
- loadWordCards(): Display vocabulary for review
- markWordAsKnown(): Move word from learning to known
- addRecentActivity(type, word): Track learning activity
- getTranslation(word): Fetch word translations
- disableNewTab(): Toggle back to default new tab
```

#### Translation Service (`translation-service.js`)
**Purpose**: Multi-provider translation API integration

**Key Classes**:
- `TranslationService`: Translation provider coordinator

**Key Methods**:
```javascript
- translate(text, options): Main translation interface
- translateWithGoogle(text): Google Translate API
- translateWithDeepL(text): DeepL API integration
- translateWithClaude(text): Claude AI translation
- translateWithChatGPT(text): OpenAI ChatGPT translation
- translateWithXAI(text): xAI translation service
- translateWithGemini(text): Google Gemini translation
```

## 📊 Data Flow Architecture

### Vocabulary Assessment Flow
```
User Opens Popup → 25-Question Test → Calculate Level → 
Save to Storage → Update Content Scripts → Filter Subtitles
```

### YouTube Independent Subtitle Flow
```
Video Loads → Analyze ytInitialPlayerResponse → Extract Subtitle Track URL → 
Fetch Subtitle Data → Parse Format (SRV3/WebVTT/XML) → 
Time-Based Sync (200ms) → Smart Word Splitting → Process Words → 
Filter Display → Update Sidebar Timeline → User Interaction
```

### Netflix DOM-Based Subtitle Flow
```
Video Plays → Monitor DOM Changes → Extract Subtitle Text → 
Smart Word Splitting → Process Words → Filter Display → 
Update Sidebar Timeline → User Interaction → Update Learning Lists
```

### Learning Interaction Flow
```
Unknown Word (Green) → Hover (Show Translation) → Click (Mark Known)
Hidden Word (___) → Hover (Show Word + Translation) → Click (Add to Learning)
New Tab Dashboard → Quick Review → Mark Known/Unknown → Update Progress
Sidebar Timeline → Click Subtitle → Jump to Video Time → Context Learning
```

## 🎨 Visual Design System

### Color Palette (Green Theme)
- **Primary**: `#28a745` to `#20c997` (Green gradient)
- **Secondary**: `#6c757d` (Gray)
- **Success**: `#28a745` (Green)
- **Warning**: `#ffc107` to `#fd7e14` (Orange gradient)
- **Danger**: `#dc3545` (Red)
- **Info**: `#17a2b8` (Teal)

### Typography
- **Font Family**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Subtitle Sizes**: Small(16px), Medium(20px), Large(26px)
- **UI Font Sizes**: 11px-28px responsive scale

### Interactive States
- **Unknown Words**: Green background, white text, hover effects
- **Hidden Words**: Dashed border, gray text, yellow hover
- **Tooltips**: Contextual colors based on action type

## 🔌 Integration Points

### Chrome Extension APIs
- **Storage API**: User preferences and vocabulary lists
- **Scripting API**: Content script injection
- **Runtime API**: Message passing between components
- **Active Tab**: Current page interaction

### External Data Sources
- **COCA Corpus**: 5000 most frequent English words
- **Assessment Database**: 55 curated test words across difficulty levels
- **Future**: Translation APIs, pronunciation services

### Platform Integration
- **YouTube**: Subtitle element monitoring, caption state detection
- **Netflix**: Dynamic content handling, multiple selector fallbacks

## 📈 Performance Metrics

### Current Benchmarks
- **Subtitle Detection Latency**: <200ms
- **Memory Usage**: <50MB typical
- **Token Processing**: ~100-500 words/minute
- **UI Response Time**: <100ms for interactions

### Optimization Strategies
- **Polling Interval**: 200ms for responsiveness
- **COCA Data Caching**: Load once, reuse across sessions
- **Debounced Processing**: Prevent duplicate subtitle processing
- **Efficient Selectors**: Prioritized fallback chain

## 🔐 Security & Privacy

### Data Handling
- **Local Storage Only**: No external data transmission
- **User Vocabulary**: Stored in Chrome's local storage
- **No Tracking**: No analytics or user behavior tracking
- **Secure Contexts**: HTTPS-only platform access

### Permissions
- **Minimal Scope**: Only required permissions
- **Host Permissions**: Limited to YouTube and Netflix
- **No Background**: Service worker only when needed

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] Vocabulary assessment completion
- [ ] YouTube subtitle filtering accuracy
- [ ] Netflix subtitle detection
- [ ] Smart word splitting functionality
- [ ] Word interaction (click/hover)
- [ ] Translation service integration
- [ ] New tab dashboard functionality
- [ ] Side panel subtitle timeline
- [ ] New tab configuration (enable/disable/preview/reset)
- [ ] Settings persistence
- [ ] Multi-tab session management
- [ ] Cross-browser compatibility

### Automated Testing (Future)
- Unit tests for word processing logic
- Integration tests for subtitle detection
- Performance benchmarks
- UI interaction tests

## 🚀 Deployment Status

### Current Versions
- **Production**: v1.3.0 (Smart Features)
- **Development**: Active improvements (Sprint 7 planned)
- **Legacy**: v1.0.x-v1.2.x archived

### Distribution
- **Development**: Manual loading via Chrome extensions page
- **Future**: Chrome Web Store publication

---

**Maintainers**: Development Team  
**Next Review**: Scheduled for next development cycle  
**Contact**: See DEVELOPMENT_PLAN.md for contribution guidelines