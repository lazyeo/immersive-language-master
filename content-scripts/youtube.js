// English Listening Assistant - YouTube Content Script
// Handles subtitle extraction and intelligent filtering for YouTube videos

class YouTubeSubtitleManager {
    constructor() {
        this.isActive = false;
        this.vocabularyLevel = 3000;
        this.settings = {};
        this.currentSubtitles = [];
        this.unknownWords = new Set();
        this.observer = null;
        this.lastSubtitleText = '';
        
        this.initializeManager();
    }

    async initializeManager() {
        console.log('English Listening Assistant: Initializing YouTube manager');
        
        // Load settings from storage
        await this.loadSettings();
        
        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startWatching());
        } else {
            this.startWatching();
        }

        // Listen for navigation changes (YouTube is SPA)
        this.setupNavigationListener();
        
        // Listen for messages from popup/background
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
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
                vocabularyLevel: result.vocabularyLevel || 3000,
                showTranslationOnHover: result.showTranslationOnHover !== false,
                subtitlePosition: result.subtitlePosition || 'bottom',
                fontSize: result.fontSize || 'medium',
                knownWords: new Set(result.knownWords || [])
            };

            this.vocabularyLevel = this.settings.vocabularyLevel;
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    setupNavigationListener() {
        // Listen for YouTube navigation changes
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                if (url.includes('/watch')) {
                    // New video loaded
                    setTimeout(() => this.onVideoChange(), 1000);
                }
            }
        }).observe(document, { subtree: true, childList: true });
    }

    onVideoChange() {
        console.log('YouTube video changed, restarting subtitle monitoring');
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
        if (this.isActive) return;
        
        this.isActive = true;
        this.setupSubtitleMonitoring();
        console.log('YouTube subtitle monitoring started');
    }

    stopWatching() {
        if (!this.isActive) return;
        
        this.isActive = false;
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        console.log('YouTube subtitle monitoring stopped');
    }

    setupSubtitleMonitoring() {
        // Method 1: Monitor subtitle container changes
        this.monitorSubtitleContainer();
        
        // Method 2: Polling fallback (in case MutationObserver misses changes)
        this.startPolling();
    }

    monitorSubtitleContainer() {
        const checkForSubtitles = () => {
            const subtitleContainer = document.querySelector('.ytp-caption-window-container');
            
            if (subtitleContainer) {
                // Set up MutationObserver on subtitle container
                this.observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList' || mutation.type === 'characterData') {
                            this.handleSubtitleChange();
                        }
                    });
                });

                this.observer.observe(subtitleContainer, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                    attributes: false
                });

                console.log('Subtitle container observer established');
            } else {
                // Retry after 1 second if container not found
                setTimeout(checkForSubtitles, 1000);
            }
        };

        checkForSubtitles();
    }

    startPolling() {
        // Fallback polling every 500ms to catch any missed subtitle changes
        this.pollingInterval = setInterval(() => {
            this.handleSubtitleChange();
        }, 500);
    }

    handleSubtitleChange() {
        const subtitleElements = document.querySelectorAll('.ytp-caption-segment');
        
        if (subtitleElements.length === 0) {
            // No subtitles currently visible
            this.hideCustomSubtitles();
            return;
        }

        // Extract current subtitle text
        let currentText = '';
        subtitleElements.forEach(element => {
            currentText += element.textContent + ' ';
        });
        currentText = currentText.trim();

        // Skip if text hasn't changed
        if (currentText === this.lastSubtitleText || !currentText) {
            return;
        }

        this.lastSubtitleText = currentText;
        console.log('Subtitle detected:', currentText);

        // Process the subtitle text
        this.processSubtitle(currentText, subtitleElements[0]);
    }

    async processSubtitle(text, originalElement) {
        // Extract words from subtitle text
        const words = this.extractWords(text);
        
        // Identify unknown words based on vocabulary level
        const unknownWords = await this.identifyUnknownWords(words);
        
        // Show filtered subtitle if there are unknown words
        if (unknownWords.length > 0) {
            this.showFilteredSubtitle(text, unknownWords, originalElement);
            
            // Add unknown words to learning list
            unknownWords.forEach(word => this.unknownWords.add(word));
            
            // Update learning list in storage
            await this.updateLearningList();
        } else {
            // Hide original subtitles if all words are known
            this.hideOriginalSubtitles();
        }
    }

    extractWords(text) {
        // Remove punctuation and split into words
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2); // Filter out very short words
    }

    async identifyUnknownWords(words) {
        const unknownWords = [];
        
        for (const word of words) {
            const isKnown = await this.isWordKnown(word);
            if (!isKnown) {
                unknownWords.push(word);
            }
        }
        
        return unknownWords;
    }

    async isWordKnown(word) {
        // Check if word is in known words set
        if (this.settings.knownWords.has(word)) {
            return true;
        }
        
        // Load COCA frequency data if not already loaded
        if (!this.cocaWords) {
            await this.loadCocaData();
        }
        
        // Check if word is within user's vocabulary level based on COCA frequency
        const wordData = this.cocaWords.find(w => w.word === word);
        if (wordData) {
            // If word rank is within user's vocabulary level, it's considered known
            return wordData.rank <= this.vocabularyLevel;
        }
        
        // If word not in COCA data, consider it unknown (likely advanced/specialized)
        return false;
    }

    async loadCocaData() {
        try {
            if (!this.cocaWords) {
                const response = await fetch(chrome.runtime.getURL('data/coca-5000.json'));
                this.cocaWords = await response.json();
                console.log('COCA word data loaded:', this.cocaWords.length, 'words');
            }
        } catch (error) {
            console.error('Error loading COCA data:', error);
            // Fallback to simple frequency check
            this.cocaWords = [];
        }
    }

    showFilteredSubtitle(originalText, unknownWords, originalElement) {
        // Hide original YouTube subtitles
        this.hideOriginalSubtitles();
        
        // Create custom subtitle showing only unknown words
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
        // Placeholder translation (in real implementation, use translation API)
        const translations = {
            'example': '例子',
            'important': '重要的',
            'necessary': '必要的',
            'available': '可获得的',
            'different': '不同的'
        };
        
        return translations[word] || `[${word}的中文释义]`;
    }

    showTooltip(element, text) {
        this.hideTooltip(); // Remove any existing tooltip
        
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
            small: '14px',
            medium: '18px',
            large: '24px'
        };
        element.style.fontSize = fontSizes[fontSize];
        
        // Apply position
        switch (position) {
            case 'top':
                element.style.top = '10%';
                break;
            case 'center':
                element.style.top = '50%';
                element.style.transform = 'translate(-50%, -50%)';
                break;
            case 'bottom':
            default:
                element.style.bottom = '15%';
                break;
        }
    }

    hideOriginalSubtitles() {
        const subtitleElements = document.querySelectorAll('.ytp-caption-window-container');
        subtitleElements.forEach(element => {
            element.style.display = 'none';
        });
    }

    showOriginalSubtitles() {
        const subtitleElements = document.querySelectorAll('.ytp-caption-window-container');
        subtitleElements.forEach(element => {
            element.style.display = '';
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
        const learningWords = Array.from(this.unknownWords);
        await chrome.storage.local.set({ learningWords });
        
        // Notify background script
        chrome.runtime.sendMessage({
            type: 'ADD_TO_LEARNING_LIST',
            words: learningWords
        });
    }

    handleMessage(request, sender, sendResponse) {
        switch (request.type) {
            case 'SETTINGS_UPDATED':
                this.settings = { ...this.settings, ...request.settings };
                this.vocabularyLevel = this.settings.vocabularyLevel;
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
const manager = new YouTubeSubtitleManager();