# Changelog

All notable changes to the Immersive Language Master extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2025-01-24

### 🎯 Overview
Major learning enhancement update with SuperMemo 2 algorithm, comprehensive testing system, and practice modes.

### ✨ Added
- **SuperMemo 2 Algorithm**: Advanced spaced repetition learning system
  - Adaptive interval calculation based on recall quality
  - Ease factor adjustment for personalized learning
  - Automatic review scheduling with priority system
  - Learning statistics and mastery tracking
- **Vocabulary Test System**: Comprehensive testing with multiple question types
  - Recognition tests (multiple choice)
  - Production tests (fill in the blank)
  - Context-based questions
  - Spelling tests
  - Synonym/Antonym challenges
  - Adaptive difficulty adjustment
- **Practice Modes**: Multiple practice options
  - Random practice with shuffled words
  - Favorites practice for marked words
  - Due words practice based on spaced repetition
  - Customizable practice sessions
- **Import/Export Functionality**: Data portability
  - Export learning data to JSON
  - Import bookmarks and progress
  - Backup and restore capabilities
- **Advanced Settings Page**: Comprehensive configuration
  - Learning preferences (daily goals, spaced repetition)
  - Display settings (tooltips, highlights)
  - Customizable keyboard shortcuts
  - Theme preferences

### 🔧 Fixed
- Keyboard shortcut TODO implementations completed
- Enhanced learning manager with spaced repetition integration
- Improved data persistence and synchronization

### 🚀 Improved
- **Learning Manager**: 
  - Integrated SuperMemo 2 algorithm
  - Enhanced bookmark tracking with repetition data
  - Better progress calculation
- **User Interface**:
  - New test overlay with modern design
  - Settings page with intuitive controls
  - Progress tracking visualizations
- **Performance**:
  - Optimized data structures for faster access
  - Improved memory management
- **Code Quality**:
  - Modular service architecture
  - Better separation of concerns
  - Enhanced error handling

---

## [2.1.0] - 2024-01-24

### 🎯 Overview
Major stability and interaction improvements focusing on Chrome API compatibility, tooltip system unification, and better user interaction patterns.

### ✨ Added
- **Unified Tooltip System**: Single, enhanced tooltip with all functionality
  - ✓ Known button - marks word as known across entire page
  - 译 Translate button - shows full translation
  - 📚 Learn button - adds to learning list
  - ℹ Details button - shows detailed information
  - × Close button - dismisses tooltip
- **Chrome API Fallback Mode**: Extension works even when Chrome APIs unavailable
- **Interaction Delay**: 300ms hover delay prevents accidental tooltip triggers
- **Test Pages**: Comprehensive test suite for validation
  - test-chrome-api-fix.html
  - test-unified-tooltip.html
  - test-interaction-fixes.html

### 🔧 Fixed
- **Chrome API Errors**: 
  - Fixed "chrome.storage.local undefined" errors
  - Fixed "Symbol.iterator" errors with Map constructors
  - Fixed "word.toLowerCase is not a function" errors
  - Added proper API availability checks with fallback modes
- **Duplicate Tooltips**: 
  - Removed conflicting quick-actions overlay
  - Consolidated all functionality into single tooltip
  - Fixed tooltip regeneration on button clicks
- **Class Declaration Errors**:
  - Added duplicate class definition prevention
  - Fixed module loading order issues
- **Interaction Issues**:
  - Links no longer processed/highlighted
  - Click events properly handled with stopPropagation
  - Pointer-events optimized for better click-through

### 🚀 Improved
- **Performance**:
  - Reduced event listener overhead
  - Optimized tooltip creation/destruction
  - Better memory management with proper cleanup
- **User Experience**:
  - More stable tooltip interactions
  - Consistent highlight behavior
  - Better visual feedback
- **Code Quality**:
  - Enhanced error handling throughout
  - Cleaner event delegation patterns
  - Better separation of concerns

### 📝 Changed
- Disabled quick-actions mouse hover triggers (keyboard shortcuts still work)
- Modified word processor event handling for better stability
- Updated CSS for improved pointer-events behavior
- Enhanced tooltip styling with better button layout

### 🗑️ Removed
- Redundant quick-actions overlay on hover
- Duplicate event listeners causing conflicts
- Unnecessary tooltip regeneration logic

### 🐛 Known Issues
- Translation providers may require API keys for full functionality
- Some websites with complex CSS may need style adjustments
- Performance on very long pages (>10,000 words) may vary

---

## [2.0.0] - 2024-01-20

### ✨ Added
- Universal website support beyond YouTube
- Advanced dictionary system with 5,000 COCA words
- Smart word splitting and classification
- Multi-provider translation support (6 providers)
- 25-question vocabulary assessment
- Modern responsive UI design

### 🚀 Improved
- Performance optimization (<50ms word processing)
- Better text extraction algorithms
- Enhanced learning tracking system
- Improved bionic reading mode

---

## [1.0.0] - 2024-01-15

### 🎉 Initial Release
- Basic YouTube subtitle processing
- Simple word highlighting
- Google Translate integration
- Chrome storage for preferences
- Basic popup interface

---

## Development Notes

### For Developers
When working on this project, please note:

1. **Chrome API Checks**: Always check if Chrome APIs are available before use
2. **Event Handling**: Use stopPropagation() carefully to prevent conflicts
3. **Tooltip Management**: Ensure only one tooltip exists at a time
4. **Link Processing**: Links should never be processed or highlighted
5. **Testing**: Use provided test pages to validate changes

### Testing Checklist
- [ ] Chrome API fallback works correctly
- [ ] Only one tooltip appears on hover
- [ ] Links remain clickable and unhighlighted
- [ ] No console errors during normal usage
- [ ] Performance remains under 50ms for word processing

### File Structure
Key files modified in v2.1.0:
- `/core/word-processor.js` - Main word processing logic
- `/core/text-analyzer.js` - Text analysis engine
- `/components/quick-actions.js` - Quick actions overlay (disabled hover)
- `/services/translation-service.js` - Translation provider management
- `/services/learning-manager.js` - Learning data management
- `/styles/universal-overlay.css` - Tooltip and highlight styles