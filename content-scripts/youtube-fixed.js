// English Listening Assistant - YouTube Content Script (Fixed Version)
console.log('🎧 ELA: YouTube script starting...');

class YouTubeSubtitleManager {
    constructor() {
        this.isActive = false;
        this.vocabularyLevel = 3000;
        this.settings = {};
        this.currentSubtitles = [];
        this.unknownWords = new Set();
        this.observer = null;
        this.lastSubtitleText = '';
        this.cocaWords = null;
        
        console.log('🎧 ELA: YouTube manager constructed');
        this.initializeManager();
    }

    async initializeManager() {
        console.log('🎧 ELA: Initializing YouTube manager');
        
        try {
            // Load settings from storage
            await this.loadSettings();
            console.log('🎧 ELA: Settings loaded:', this.settings);
            
            // Add visual indicator
            this.addDebugIndicator();
            
            // Start watching for subtitles immediately
            this.startWatching();
            
            // Listen for navigation changes (YouTube is SPA)
            this.setupNavigationListener();
            
            // Listen for messages from popup/background
            chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
            
            console.log('🎧 ELA: YouTube manager initialized successfully');
        } catch (error) {
            console.error('🎧 ELA: Error initializing manager:', error);
        }
    }

    addDebugIndicator() {
        // Add visual indicator that extension is active
        const indicator = document.createElement('div');
        indicator.id = 'ela-status-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        `;
        indicator.textContent = '🎧 ELA Active';
        document.body.appendChild(indicator);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.style.opacity = '0';
                indicator.style.transition = 'opacity 0.5s';
                setTimeout(() => indicator.remove(), 500);
            }
        }, 3000);
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get([
                'vocabularyLevel',
                'showTranslationOnHover',
                'subtitlePosition',
                'fontSize',
                'knownWords'
            ]);

            this.settings = {
                vocabularyLevel: result.vocabularyLevel || 1000, // Start with lower level for testing
                showTranslationOnHover: result.showTranslationOnHover !== false,
                subtitlePosition: result.subtitlePosition || 'bottom',
                fontSize: result.fontSize || 'medium',
                knownWords: new Set(result.knownWords || [])
            };

            this.vocabularyLevel = this.settings.vocabularyLevel;
            console.log('🎧 ELA: Vocabulary level set to:', this.vocabularyLevel);
        } catch (error) {
            console.error('🎧 ELA: Error loading settings:', error);
            this.settings = { vocabularyLevel: 1000, showTranslationOnHover: true, subtitlePosition: 'bottom', fontSize: 'medium', knownWords: new Set() };
        }
    }

    setupNavigationListener() {
        let lastUrl = location.href;
        const observer = new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                console.log('🎧 ELA: URL changed:', url);
                if (url.includes('/watch')) {
                    setTimeout(() => {
                        console.log('🎧 ELA: Video change detected, restarting...');
                        this.onVideoChange();
                    }, 2000);
                }
            }
        });
        observer.observe(document, { subtree: true, childList: true });
    }

    onVideoChange() {
        console.log('🎧 ELA: Handling video change');
        this.stopWatching();
        this.startWatching();
        this.resetSubtitleState();
    }

    resetSubtitleState() {
        this.currentSubtitles = [];
        this.unknownWords.clear();
        this.lastSubtitleText = '';
    }

    startWatching() {
        if (this.isActive) {
            console.log('🎧 ELA: Already watching');
            return;
        }
        
        this.isActive = true;
        console.log('🎧 ELA: Starting to watch for subtitles');
        
        // Wait a bit for YouTube to load
        setTimeout(() => {
            this.setupSubtitleMonitoring();
        }, 1000);
    }

    stopWatching() {
        if (!this.isActive) return;
        
        this.isActive = false;
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        
        console.log('🎧 ELA: Stopped watching');
    }

    setupSubtitleMonitoring() {
        console.log('🎧 ELA: Setting up subtitle monitoring');
        
        // Start aggressive polling to catch subtitles
        this.startPolling();
        
        // Also try to set up observer
        this.monitorSubtitleContainer();
    }

    startPolling() {
        console.log('🎧 ELA: Starting subtitle polling');
        
        this.pollingInterval = setInterval(() => {
            this.checkForSubtitles();
        }, 500); // Check every 500ms
    }

    checkForSubtitles() {
        // Multiple possible selectors for YouTube subtitles
        const possibleSelectors = [
            '.ytp-caption-segment',
            '.captions-text',
            '.ytp-caption-window-container span',
            '.html5-captions-text',
            '[class*="caption"]',
            '[class*="subtitle"]'
        ];

        let subtitleElements = [];
        let foundSelector = '';

        for (const selector of possibleSelectors) {
            subtitleElements = document.querySelectorAll(selector);
            if (subtitleElements.length > 0) {
                foundSelector = selector;
                break;
            }
        }

        if (subtitleElements.length > 0) {
            let currentText = '';
            subtitleElements.forEach(element => {
                const text = element.textContent?.trim();
                if (text) {
                    currentText += text + ' ';
                }
            });
            currentText = currentText.trim();

            if (currentText && currentText !== this.lastSubtitleText) {
                console.log('🎧 ELA: Subtitle detected:', currentText, 'using selector:', foundSelector);
                this.lastSubtitleText = currentText;
                this.processSubtitle(currentText, subtitleElements[0]);
            }
        } else {
            // If no subtitles, hide custom ones
            this.hideCustomSubtitles();
        }
    }

    monitorSubtitleContainer() {
        const containers = [
            '.ytp-caption-window-container',
            '.html5-captions-display',
            '.captions-container'
        ];

        for (const containerSelector of containers) {
            const container = document.querySelector(containerSelector);
            if (container) {
                console.log('🎧 ELA: Found subtitle container:', containerSelector);
                
                this.observer = new MutationObserver(() => {
                    this.checkForSubtitles();
                });

                this.observer.observe(container, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
                break;
            }
        }
    }

    async processSubtitle(text, originalElement) {
        console.log('🎧 ELA: Processing subtitle:', text);
        
        try {
            // Extract words from subtitle text
            const words = this.extractWords(text);
            console.log('🎧 ELA: Extracted words:', words);
            
            // Identify unknown words based on vocabulary level
            const unknownWords = await this.identifyUnknownWords(words);
            console.log('🎧 ELA: Unknown words:', unknownWords);
            
            // Always show custom subtitle for testing
            if (words.length > 0) {
                this.showFilteredSubtitle(text, unknownWords, originalElement);
                
                // Add unknown words to learning list
                unknownWords.forEach(word => this.unknownWords.add(word));
                
                // Update learning list in storage
                if (unknownWords.length > 0) {
                    await this.updateLearningList();
                }
            }
        } catch (error) {
            console.error('🎧 ELA: Error processing subtitle:', error);
        }
    }

    extractWords(text) {
        // Remove punctuation and split into words
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1); // Include shorter words for testing
        
        console.log('🎧 ELA: Words extracted from "' + text + '":', words);
        return words;
    }

    async identifyUnknownWords(words) {
        const unknownWords = [];
        
        for (const word of words) {
            const isKnown = await this.isWordKnown(word);
            if (!isKnown) {
                unknownWords.push(word);
            }
        }
        
        console.log('🎧 ELA: Identified unknown words:', unknownWords);
        return unknownWords;
    }

    async isWordKnown(word) {
        // Check if word is in known words set
        if (this.settings.knownWords.has(word)) {
            return true;
        }
        
        // For testing, make common words "unknown" to see the effect
        const alwaysUnknown = ['example', 'learning', 'education', 'technology', 'important', 'different'];
        if (alwaysUnknown.includes(word)) {
            return false;
        }
        
        // Very common words are always known
        const alwaysKnown = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
        if (alwaysKnown.includes(word)) {
            return true;
        }
        
        // For testing, consider words with more than 6 characters as potentially unknown
        return word.length <= 6;
    }

    showFilteredSubtitle(originalText, unknownWords, originalElement) {
        console.log('🎧 ELA: Showing filtered subtitle');
        
        // Hide original YouTube subtitles
        this.hideOriginalSubtitles();
        
        // Create custom subtitle showing filtered content
        const filteredText = this.createFilteredText(originalText, unknownWords);
        this.showCustomSubtitle(filteredText, unknownWords);
    }

    createFilteredText(originalText, unknownWords) {
        const words = originalText.split(/\s+/);
        return words.map(word => {
            const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
            if (unknownWords.includes(cleanWord)) {
                return word; // Show unknown word
            }
            return '___'; // Hide known word
        }).join(' ');
    }

    showCustomSubtitle(text, unknownWords) {
        // Remove existing custom subtitle
        this.hideCustomSubtitles();
        
        console.log('🎧 ELA: Creating custom subtitle:', text);
        
        // Create custom subtitle element
        const subtitleDiv = document.createElement('div');
        subtitleDiv.id = 'ela-custom-subtitle';
        subtitleDiv.className = 'ela-subtitle';
        
        // Create spans for each word to enable hover functionality
        const words = text.split(/\s+/);
        words.forEach((word, index) => {
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'ela-word';
            
            const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
            if (unknownWords.includes(cleanWord)) {
                span.classList.add('ela-unknown-word');
                span.dataset.word = cleanWord;
                
                if (this.settings.showTranslationOnHover) {
                    this.addHoverTranslation(span, cleanWord);
                }
            }
            
            subtitleDiv.appendChild(span);
            
            // Add space after word (except last word)
            if (index < words.length - 1) {
                subtitleDiv.appendChild(document.createTextNode(' '));
            }
        });
        
        // Position the subtitle
        this.positionCustomSubtitle(subtitleDiv);
        
        // Add to page
        document.body.appendChild(subtitleDiv);
        
        console.log('🎧 ELA: Custom subtitle added to page');
    }

    addHoverTranslation(element, word) {
        element.addEventListener('mouseenter', async () => {
            const translation = await this.getTranslation(word);
            if (translation) {
                this.showTooltip(element, translation);
            }
        });
        
        element.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }

    async getTranslation(word) {
        // Simple placeholder translations for testing
        const translations = {
            'example': '例子',
            'learning': '学习',
            'education': '教育',
            'technology': '技术',
            'important': '重要的',
            'different': '不同的'
        };
        
        return translations[word] || `[${word}的中文释义]`;
    }

    showTooltip(element, text) {
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.id = 'ela-tooltip';
        tooltip.className = 'ela-tooltip';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip above the word
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
    }

    hideTooltip() {
        const tooltip = document.getElementById('ela-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    positionCustomSubtitle(element) {
        const position = this.settings.subtitlePosition;
        const fontSize = this.settings.fontSize;
        
        // Apply font size
        const fontSizes = {
            small: '16px',
            medium: '20px',
            large: '26px'
        };
        element.style.fontSize = fontSizes[fontSize];
        
        // Apply position
        switch (position) {
            case 'top':
                element.style.top = '20%';
                break;
            case 'center':
                element.style.top = '50%';
                element.style.transform = 'translate(-50%, -50%)';
                break;
            case 'bottom':
            default:
                element.style.bottom = '20%';
                break;
        }
    }

    hideOriginalSubtitles() {
        const selectors = [
            '.ytp-caption-window-container',
            '.html5-captions-display',
            '.captions-container'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style.display = 'none';
            });
        });
    }

    showOriginalSubtitles() {
        const selectors = [
            '.ytp-caption-window-container',
            '.html5-captions-display',
            '.captions-container'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style.display = '';
            });
        });
    }

    hideCustomSubtitles() {
        const customSubtitle = document.getElementById('ela-custom-subtitle');
        if (customSubtitle) {
            customSubtitle.remove();
        }
        this.hideTooltip();
    }

    async updateLearningList() {
        try {
            const learningWords = Array.from(this.unknownWords);
            await chrome.storage.local.set({ learningWords });
            console.log('🎧 ELA: Learning list updated:', learningWords);
            
            // Notify background script
            chrome.runtime.sendMessage({
                type: 'ADD_TO_LEARNING_LIST',
                words: learningWords
            });
        } catch (error) {
            console.error('🎧 ELA: Error updating learning list:', error);
        }
    }

    handleMessage(request, sender, sendResponse) {
        console.log('🎧 ELA: Received message:', request);
        
        switch (request.type) {
            case 'SETTINGS_UPDATED':
                this.settings = { ...this.settings, ...request.settings };
                this.vocabularyLevel = this.settings.vocabularyLevel;
                console.log('🎧 ELA: Settings updated:', this.settings);
                break;
                
            case 'TOGGLE_EXTENSION':
                if (this.isActive) {
                    this.stopWatching();
                    this.showOriginalSubtitles();
                } else {
                    this.startWatching();
                }
                break;
        }
        
        return true;
    }
}

// Initialize when script loads
console.log('🎧 ELA: Creating YouTube manager...');
const manager = new YouTubeSubtitleManager();