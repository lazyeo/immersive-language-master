# Development Guide

## 🚀 Getting Started

### Prerequisites
- Chrome browser (latest version)
- Basic knowledge of Chrome Extension development
- Git for version control
- Code editor (VS Code recommended)

### Setup Development Environment

1. **Clone the repository**
```bash
git clone [repository-url]
cd immersive-language-master
```

2. **Load extension in Chrome**
- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode" (top right)
- Click "Load unpacked"
- Select the project directory

3. **Make changes and test**
- Edit files in your code editor
- Click "Reload" button in Chrome extensions page
- Test changes on any website

## 🏗️ Architecture Overview

### Core Components

#### 1. Word Processor (`/core/word-processor.js`)
- **Purpose**: Main text processing engine
- **Key Functions**:
  - `processTextContent()`: Processes DOM text nodes
  - `markWordAsKnown()`: Updates word classification
  - `showWordTooltip()`: Displays interactive tooltip
  - `updateAllWordInstances()`: Syncs word states across page

**Important Considerations**:
- Always check Chrome API availability before use
- Use event.stopPropagation() to prevent bubbling
- Ensure tooltip singleton pattern (only one tooltip at a time)

#### 2. Text Analyzer (`/core/text-analyzer.js`)
- **Purpose**: Vocabulary analysis and classification
- **Key Functions**:
  - `analyzeText()`: Returns text statistics
  - `classifyWord()`: Determines word difficulty
  - `loadVocabularyDatabase()`: Loads COCA corpus

**Fallback Mode**: Works without Chrome APIs using built-in frequency map

#### 3. Translation Service (`/services/translation-service.js`)
- **Purpose**: Multi-provider translation management
- **Providers**: Google, DeepL, Claude, ChatGPT, xAI, Gemini
- **Pattern**: Provider classes initialized lazily to avoid errors

#### 4. Learning Manager (`/services/learning-manager.js`)
- **Purpose**: Tracks learning progress and statistics
- **Storage**: Chrome storage API with fallback to memory

### Event Flow

```
User hovers over word
    ↓
MouseEnter Event (300ms delay)
    ↓
showWordTooltip() called
    ↓
Check for existing tooltip
    ↓
Create/Position tooltip
    ↓
User interacts with buttons
    ↓
Update word state
    ↓
updateAllWordInstances()
    ↓
Save to storage
```

## 🛠️ Common Development Tasks

### Adding a New Translation Provider

1. Create provider class in `translation-service.js`:
```javascript
class NewProvider extends TranslationProvider {
    async translate(text, options) {
        // Implementation
    }
}
```

2. Add to provider initialization
3. Update UI options in popup

### Modifying Word Classification

Edit classification logic in `text-analyzer.js`:
```javascript
classifyWord(word) {
    // Modify classification logic
}
```

### Changing Tooltip Behavior

1. Edit tooltip creation in `word-processor.js`
2. Update styles in `/styles/universal-overlay.css`
3. Test interaction thoroughly

## 🐛 Debugging Guide

### Chrome DevTools

1. **Background Script**: 
   - Go to `chrome://extensions/`
   - Click "Service Worker" link
   - Opens dedicated DevTools

2. **Content Scripts**:
   - Right-click webpage → Inspect
   - Console shows content script logs
   - Use `console.log('🔍 ILM:', data)` for consistent logging

### Common Issues and Solutions

#### Issue: Chrome API undefined
**Solution**: Add availability check
```javascript
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    // Use Chrome API
} else {
    // Use fallback
}
```

#### Issue: Duplicate tooltips
**Solution**: Check for existing tooltip
```javascript
if (document.querySelector('.ilm-tooltip')) {
    return; // Don't create another
}
```

#### Issue: Events bubbling incorrectly
**Solution**: Use event control methods
```javascript
event.stopPropagation();
event.preventDefault();
```

## ✅ Testing

### Manual Testing Checklist

- [ ] **Basic Functionality**
  - [ ] Words highlight correctly on page load
  - [ ] Tooltip appears on hover (after 300ms)
  - [ ] Only one tooltip visible at a time
  - [ ] All tooltip buttons work

- [ ] **Edge Cases**
  - [ ] Links are not processed
  - [ ] Very long pages work correctly
  - [ ] Special characters handled properly
  - [ ] Multiple tabs work independently

- [ ] **Performance**
  - [ ] Page load time acceptable
  - [ ] Smooth scrolling maintained
  - [ ] Memory usage reasonable
  - [ ] No console errors

### Test Pages

Use provided test pages for specific scenarios:
- `test-chrome-api-fix.html` - Chrome API compatibility
- `test-unified-tooltip.html` - Tooltip functionality
- `test-interaction-fixes.html` - Interaction behavior

## 📝 Code Style Guidelines

### JavaScript
- Use ES6+ features (arrow functions, template literals, etc.)
- Add JSDoc comments for functions
- Use meaningful variable names
- Handle errors gracefully

### CSS
- Use CSS classes, not inline styles
- Follow BEM naming when possible
- Keep z-index values documented
- Use CSS variables for colors

### Git Commits
- Use clear, descriptive messages
- Reference issue numbers when applicable
- Keep commits focused and atomic

Example:
```
fix: prevent tooltip regeneration on click

- Added stopPropagation to tooltip events
- Fixed event bubbling issue
- Closes #123
```

## 🚨 Important Notes

### Chrome API Compatibility
Always ensure Chrome APIs are available before use. The extension should gracefully degrade when APIs are unavailable.

### Event Handling
Be careful with event propagation. Improper handling can cause:
- Duplicate tooltips
- Click interference
- Performance issues

### Performance Considerations
- Process text in chunks for long pages
- Use requestAnimationFrame for DOM updates
- Cache frequently accessed data
- Clean up event listeners properly

### Security
- Never inject untrusted content into DOM
- Sanitize user input
- Use Chrome's content security policy
- Don't store sensitive data in plain text

## 📚 Resources

### Documentation
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Web APIs Reference](https://developer.mozilla.org/en-US/docs/Web/API)
- [COCA Corpus](https://www.english-corpora.org/coca/)

### Tools
- [Chrome Extension Debugger](https://chrome.google.com/webstore/detail/chrome-extension-debugger/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

Please ensure:
- All tests pass
- No console errors
- Code follows style guidelines
- Documentation is updated