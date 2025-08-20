# Immersive Language Master (ILM) v1.2.0

An advanced Chrome extension for immersive language learning that transforms any webpage into a personalized vocabulary learning environment through intelligent word highlighting, comprehensive dictionary popups, and adaptive learning features.

## 🎯 Key Features

### 🌐 Universal Language Learning
- **All-Website Support**: Works on every website for comprehensive language immersion
- **Intelligent Word Highlighting**: Smart detection of unknown words with instant visual feedback
- **Advanced Dictionary Popups**: Multi-definition support with phonetics, examples, and etymology
- **Interactive Learning**: Click-to-learn system with instant word classification

### 📚 Comprehensive Word Analysis
- **Multiple Definitions**: Context-aware definitions for different word meanings
- **IPA Pronunciation System**: American & British phonetic transcriptions with audio
- **Rich Example Sentences**: Contextual examples with difficulty levels and sources
- **Etymology & Root Analysis**: Deep word formation insights with historical evolution

### 🎭 Platform-Specific Features
- **YouTube & Netflix Integration**: Enhanced subtitle processing and filtering
- **Dynamic Content Support**: Real-time processing for modern web applications
- **Performance Optimized**: Smart caching and efficient processing algorithms

### 🎨 Modern User Experience
- **480px Enhanced Popup**: Comprehensive information display with tabbed interface
- **Green/Teal Theme**: Accessibility-focused design with dark mode support
- **Responsive Design**: Mobile and desktop optimized layouts
- **Keyboard Shortcuts**: Quick access to core features

## 🚀 What's New in v1.2.0 (Latest)

### 🎯 Enhanced Dictionary System (Phase 3A)
- ✅ **Multi-Definition Support**: Context-aware word meanings with part-of-speech tagging
- ✅ **Advanced Phonetics**: IPA pronunciation with American/British variants and audio playback
- ✅ **Rich Example Sentences**: Contextual examples with difficulty levels and interactive features
- ✅ **Etymology Analysis**: Comprehensive word origins, root analysis, and historical evolution

### 🌐 Universal Website Support
- ✅ **All-Website Processing**: Works on every website, not just video platforms
- ✅ **Performance Optimizations**: Smart word filtering and intelligent processing
- ✅ **Enhanced Architecture**: Universal content processor with text analysis engine

### 🔧 Previous Updates (v1.1.0)
- ✅ **Interactive Learning System**: Click-to-learn word classification
- ✅ **Subtitle Stability**: Fixed flashing and duplicate displays
- ✅ **Modern UI Design**: 480px popup with accessibility-focused green theme

## How It Works

1. **Assessment**: Take a vocabulary test to determine your current level (1000-5000+ words)
2. **Word Analysis**: The extension analyzes video subtitles and identifies words beyond your level
3. **Filtered Display**: Shows only unknown words in subtitles, hiding familiar ones with "___"
4. **Interactive Learning**: Hover over words to see translations and add them to your learning list
5. **Progress Tracking**: Build your vocabulary over time with spaced repetition

## 🔧 Installation

### Quick Setup
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your browser toolbar

### Version Selection
- **Current Stable**: v1.1.0 (Improved) - Use `manifest.json` (already configured)
- **Legacy Version**: v1.0.x available in backup files if needed

**📖 For detailed setup instructions, see [INSTALLATION.md](INSTALLATION.md)**

## Usage

### First Time Setup
1. Click the extension icon to open the popup
2. Take the vocabulary assessment (25 questions)
3. Configure your preferences (translation hover, subtitle position, font size)

### Watching Videos
1. Go to YouTube or Netflix
2. Start playing an English video with subtitles enabled
3. The extension will automatically filter subtitles based on your vocabulary level
4. Hover over highlighted words to see translations
5. Words are automatically added to your learning list

### Pre-Study Mode
1. Click the extension icon
2. Click "Review Learning Words" to study new words before watching
3. Use the built-in pronunciation feature
4. Progress through your word list systematically

## Technical Details

### Data Sources
- **COCA Corpus**: Uses Corpus of Contemporary American English frequency data
- **Vocabulary Levels**: Based on academic word frequency research
- **Assessment Words**: Carefully selected words across difficulty levels

### Supported Platforms
- YouTube (all video types)
- Netflix (web player)
- Future: Other video platforms

### Privacy & Storage
- All data stored locally in your browser
- No data sent to external servers
- COCA word lists included in extension package

## 🏗️ Project Structure

```
immersive-language-master/
├── manifest.json                    # Extension configuration (v3.0)
├── background.js                    # Service worker and message handling
├── CLAUDE.md                        # Project management and documentation hub
│
├── core/                           # Core System Architecture
│   ├── universal-processor.js      # Universal content processing engine
│   ├── word-processor.js           # Advanced word processing and interactions
│   └── text-analyzer.js            # Intelligent text analysis and vocab detection
│
├── services/                       # Service Layer
│   └── translation-service.js      # Multi-provider translation and word info
│
├── content-scripts/                # Platform-Specific Processors
│   ├── youtube-improved.js         # Enhanced YouTube subtitle processing
│   ├── netflix-improved.js         # Advanced Netflix subtitle handling
│   └── subtitle-overlay.js         # Common subtitle overlay functionality
│
├── popup/                          # User Interface
│   ├── popup.html                  # Main interface (480px enhanced)
│   ├── popup.js                    # Vocabulary assessment and settings
│   └── popup-improved.css          # Modern green theme styling
│
├── styles/                         # Comprehensive Styling
│   ├── universal-overlay.css       # Universal word highlighting and popups
│   ├── bionic-reading.css          # Bionic reading enhancement
│   └── preview-system.css          # Preview and practice mode styling
│
├── data/                           # Vocabulary Data
│   ├── coca-5000.json             # COCA frequency corpus (5000 words)
│   └── assessment-words.json       # Vocabulary assessment database
│
├── newtab/                         # New Tab Learning Center
│   ├── newtab.html                 # Learning dashboard
│   ├── newtab.js                   # Dashboard functionality
│   └── newtab.css                  # Dashboard styling
│
├── sidebar/                        # Sidebar Learning Interface
│   ├── sidebar.html                # Vocabulary review sidebar
│   ├── sidebar.js                  # Sidebar functionality
│   └── sidebar.css                 # Sidebar styling
│
├── docs/                           # Documentation
│   ├── PROJECT_OVERVIEW.md         # Complete technical documentation
│   └── DEVELOPMENT_PLAN.md         # Sprint planning and roadmap
│
└── icons/                          # Extension Icons
    └── [Various sizes: 16px, 32px, 48px, 128px]
```

## Keyboard Shortcuts

- `Ctrl/Cmd + Shift + E`: Toggle extension on/off
- `Ctrl/Cmd + Shift + S`: Open study mode
- `Ctrl/Cmd + Shift + H`: Toggle translation hover

## Development

### Requirements
- Chrome Browser (version 88+)
- Basic understanding of JavaScript and Chrome Extensions

### Testing
1. Load the extension in developer mode
2. Open YouTube or Netflix
3. Play an English video with subtitles
4. Verify subtitle filtering works correctly

### Customization
- Modify `data/assessment-words.json` to change vocabulary test words
- Update `data/coca-5000.json` to use different word frequency data
- Adjust styling in `styles/overlay.css`

## 📚 Documentation

### Essential Guides
- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - Complete architecture and technical details
- **[Development Plan](docs/DEVELOPMENT_PLAN.md)** - Roadmap and sprint planning
- **[Feature Guide](IMPROVED_FEATURES.md)** - Latest features and interaction guide
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

### Quick References
- **[CLAUDE.md](CLAUDE.md)** - Project management hub and quick navigation
- **[Quick Start](QUICK_START.md)** - Immediate setup and testing guide

## 🔮 Development Roadmap

### ✅ Completed (v1.2.0 - Current)
- **Phase 1**: Universal Language Master architecture
- **Phase 2**: All-website support and performance optimization
- **Phase 3A-1 to 3A-4**: Enhanced dictionary system with multi-definitions, phonetics, examples, and etymology

### 🚧 In Progress
- **Phase 3A-5**: Vocabulary level and difficulty indicators
- **Phase 3A-6**: Smart bookmarking and learning records
- **Phase 3A-7**: Quick actions and translation features
- **Phase 3A-8**: Advanced UI and interaction optimization

### 📅 Upcoming Releases

#### v1.3.0 - Learning Intelligence
- **Translation API Integration**: Multi-provider support (Google, DeepL, Claude)
- **Spaced Repetition System**: Intelligent review scheduling
- **Learning Analytics**: Progress tracking and insights
- **Keyboard Input Practice**: Typing and spelling exercises

#### v1.4.0 - Platform Expansion
- **Additional Video Platforms**: Prime Video, Hulu, Disney+
- **Reading Mode**: Article and blog processing
- **Advanced Caching**: Offline learning capabilities
- **Export/Import**: Learning data portability

#### v2.0.0 - AI-Powered Learning
- **Personalized Learning Paths**: AI-driven curriculum
- **Smart Content Recommendations**: Adaptive difficulty
- **Multi-Language Support**: Chinese, Spanish, French, German
- **Advanced Analytics Dashboard**: Learning insights and gamification

## 🤝 Contributing

### Development Workflow
1. **Planning**: Update `docs/DEVELOPMENT_PLAN.md` before starting
2. **Implementation**: Follow the sprint methodology
3. **Documentation**: Update all relevant docs after completion
4. **Testing**: Use provided testing protocols

**See [DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) for detailed contribution guidelines**

## License

This project is open source and available under the MIT License.

## Credits

- COCA word frequency data from wordfrequency.info
- Built with Chrome Extensions Manifest V3
- Inspired by language learning research and SRS methodology