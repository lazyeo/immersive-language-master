// English Listening Assistant - Netflix Content Script
// Handles subtitle extraction and intelligent filtering for Netflix

class NetflixSubtitleManager {
    constructor() {
        this.isActive = false;
        this.vocabularyLevel = 3000;
        this.settings = {};
        this.currentSubtitles = [];
        this.unknownWords = new Set();
        this.observer = null;
        this.lastSubtitleText = '';
        this.netflixPlayer = null;
        
        this.initializeManager();
    }

    async initializeManager() {
        console.log('English Listening Assistant: Initializing Netflix manager');
        
        // Load settings from storage
        await this.loadSettings();
        
        // Wait for Netflix player to be ready
        this.waitForNetflixPlayer();
        
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

    waitForNetflixPlayer() {
        const checkForPlayer = () => {
            // Netflix uses different selectors for the video player
            const playerContainer = document.querySelector('.watch-video--player-view') ||
                                  document.querySelector('.PlayerContainer') ||
                                  document.querySelector('[data-uia="player"]');
            
            if (playerContainer) {
                this.netflixPlayer = playerContainer;
                this.startWatching();
                console.log('Netflix player found, starting subtitle monitoring');
            } else {
                // Retry after 1 second if player not found
                setTimeout(checkForPlayer, 1000);
            }
        };

        // Initial check
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkForPlayer);
        } else {
            checkForPlayer();
        }

        // Also listen for navigation changes (Netflix is SPA)
        this.setupNavigationListener();
    }

    setupNavigationListener() {
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                if (url.includes('/watch/')) {
                    // New video loaded
                    setTimeout(() => this.onVideoChange(), 2000);
                }
            }
        }).observe(document, { subtree: true, childList: true });
    }

    onVideoChange() {
        console.log('Netflix video changed, restarting subtitle monitoring');
        this.stopWatching();
        this.waitForNetflixPlayer();
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
        console.log('Netflix subtitle monitoring started');
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
        
        console.log('Netflix subtitle monitoring stopped');
    }

    setupSubtitleMonitoring() {
        // Netflix has multiple possible subtitle selectors
        this.monitorNetflixSubtitles();
        
        // Polling fallback
        this.startPolling();
    }

    monitorNetflixSubtitles() {
        const setupObserver = () => {
            // Netflix subtitle selectors (they change frequently)
            const possibleSelectors = [
                '.player-timedtext',
                '.player-timedtext-text-container',
                '.timedtext-text-container',
                '[data-uia="player-timedtext"]',
                '.ltr-1evcx25', // Netflix's dynamic class name pattern
                '.ltr-mmqjzm',
                '.player-timedtext-text'
            ];

            let subtitleContainer = null;
            
            for (const selector of possibleSelectors) {
                subtitleContainer = document.querySelector(selector);
                if (subtitleContainer) {
                    console.log(`Found Netflix subtitle container with selector: ${selector}`);
                    break;
                }
            }

            if (subtitleContainer) {
                // Set up MutationObserver
                this.observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList' || 
                            mutation.type === 'characterData' || 
                            mutation.type === 'attributes') {
                            this.handleNetflixSubtitleChange();
                        }
                    });
                });

                this.observer.observe(subtitleContainer, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });

                console.log('Netflix subtitle observer established');
                return true;
            }
            
            return false;
        };

        // Try to set up observer immediately
        if (!setupObserver()) {
            // If not found, keep trying every 2 seconds
            const retryInterval = setInterval(() => {
                if (setupObserver()) {
                    clearInterval(retryInterval);
                }
            }, 2000);
            
            // Stop trying after 30 seconds
            setTimeout(() => clearInterval(retryInterval), 30000);
        }
    }

    startPolling() {
        // More frequent polling for Netflix due to dynamic content
        this.pollingInterval = setInterval(() => {
            this.handleNetflixSubtitleChange();
        }, 300);
    }

    handleNetflixSubtitleChange() {
        // Netflix subtitle selectors
        const possibleSelectors = [
            '.player-timedtext span',
            '.player-timedtext-text-container span',
            '.timedtext-text-container span',
            '[data-uia="player-timedtext"] span',
            '.ltr-1evcx25 span',
            '.ltr-mmqjzm span',
            '.player-timedtext-text span'
        ];

        let subtitleElements = [];
        
        for (const selector of possibleSelectors) {
            subtitleElements = document.querySelectorAll(selector);
            if (subtitleElements.length > 0) {
                break;
            }
        }

        if (subtitleElements.length === 0) {
            // Try alternative approach - look for any text in subtitle containers
            const containers = document.querySelectorAll([
                '.player-timedtext',
                '.player-timedtext-text-container',
                '.timedtext-text-container',
                '[data-uia="player-timedtext"]'
            ].join(','));
            
            let foundText = '';
            containers.forEach(container => {
                const text = container.textContent?.trim();
                if (text && text.length > 0) {
                    foundText = text;
                }
            });
            
            if (foundText && foundText !== this.lastSubtitleText) {
                this.lastSubtitleText = foundText;
                console.log('Netflix subtitle detected (alternative):', foundText);
                this.processSubtitle(foundText, containers[0]);
            } else {
                this.hideCustomSubtitles();
            }
            return;
        }

        // Extract current subtitle text
        let currentText = '';
        subtitleElements.forEach(element => {
            const text = element.textContent?.trim();
            if (text) {
                currentText += text + ' ';
            }
        });
        currentText = currentText.trim();

        // Skip if text hasn't changed
        if (currentText === this.lastSubtitleText || !currentText) {
            return;
        }

        this.lastSubtitleText = currentText;
        console.log('Netflix subtitle detected:', currentText);

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
            .filter(word => word.length > 2);
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
        // Hide original Netflix subtitles
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
        // Placeholder translation
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
        // Netflix subtitle containers to hide
        const selectors = [
            '.player-timedtext',
            '.player-timedtext-text-container',
            '.timedtext-text-container',
            '[data-uia="player-timedtext"]',
            '.ltr-1evcx25',
            '.ltr-mmqjzm'
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
            '.player-timedtext',
            '.player-timedtext-text-container',
            '.timedtext-text-container',
            '[data-uia="player-timedtext"]',
            '.ltr-1evcx25',
            '.ltr-mmqjzm'
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
const netflixManager = new NetflixSubtitleManager();