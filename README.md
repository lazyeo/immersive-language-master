# Immersive Language Master (ILM)

A powerful Chrome extension for immersive language learning through real-time text analysis and intelligent vocabulary management.

## 🚀 Quick Start

1. **Install**: Load the extension in Chrome (Developer Mode)
2. **Configure**: Complete the 25-question vocabulary assessment
3. **Learn**: Browse any website and watch highlighted words for learning

## 📚 Documentation

All project documentation is located in the `docs/` directory:

- **[Documentation Index](docs/INDEX.md)** - Complete documentation overview
- **[Project Management](docs/CLAUDE.md)** - Main project hub
- **[Installation Guide](docs/INSTALLATION.md)** - Detailed setup instructions
- **[Feature Guide](docs/IMPROVED_FEATURES.md)** - Complete feature documentation
- **[Quick Start](docs/QUICK_START.md)** - Immediate setup guide

## ✨ Key Features

- **Universal Text Processing** - Works on any website with English text
- **Smart Word Classification** - COCA-based vocabulary analysis (5,000 words)
- **Multi-Platform Support** - Optimized for YouTube, Netflix, and all websites
- **Progressive Learning** - Personalized vocabulary tracking and spaced repetition
- **6-Provider Translation** - Google, DeepL, Claude, ChatGPT, xAI, Gemini
- **25-Question Assessment** - Scientific vocabulary level evaluation

## 🛠️ Technical Stack

- Chrome Extension Manifest V3
- Modern JavaScript (ES6+)
- Chrome Storage API for data persistence
- COCA corpus (5,000 words) for vocabulary analysis
- Multi-provider translation service integration

## 📊 Current Version

**v2.1.0** - Enhanced Interaction & Stability Update (2024-01)
- ✅ Fixed Chrome API compatibility issues
- ✅ Unified tooltip system (removed duplicate overlays)
- ✅ Improved interaction stability (no tooltip regeneration)
- ✅ Links excluded from processing
- ✅ Better click-through behavior for highlights
- ✅ Enhanced error handling and fallback modes

**v2.0.0** - Universal Language Processing
- ✅ Universal website support
- ✅ Advanced dictionary system
- ✅ Smart word splitting
- ✅ Performance optimized (<50ms word processing)
- ✅ Modern UI with responsive design

## 🏗️ Project Structure

```
immersive-language-master/
├── README.md                    # This file
├── manifest.json               # Extension configuration (v2.0.0)
├── background.js               # Service worker
├── core/                       # Core processing engines
├── components/                 # UI components
├── content-scripts/           # Platform-specific processors
├── services/                  # Translation and learning services
├── styles/                    # CSS styling
├── data/                      # Vocabulary databases
├── popup/                     # Extension popup interface
├── sidebar/                   # Chrome sidebar interface
├── newtab/                    # New tab learning dashboard
└── docs/                      # All documentation
    ├── INDEX.md              # Documentation index
    ├── CLAUDE.md             # Project management hub
    ├── PROJECT_OVERVIEW.md   # Technical architecture
    └── [Other docs...]       # User guides and features
```

## 🤝 Contributing

See [Development Plan](docs/DEVELOPMENT_PLAN.md) for contribution guidelines and roadmap.

## 📄 License

This project is open source and available under the MIT License.

---

For detailed documentation, please refer to the [Documentation Index](docs/INDEX.md) in the `docs/` directory.