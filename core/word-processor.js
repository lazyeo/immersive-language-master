// Immersive Language Master - Word Processor
// Advanced word processing, highlighting, and interaction system

class WordProcessor {
    constructor() {
        this.userSettings = {};
        this.knownWords = new Set();
        this.learningWords = new Set();
        this.highlightedElements = new Set();
        this.selectionHandler = null;
        
        this.initializeProcessor();
    }

    async initializeProcessor() {
        try {
            // Load user settings and vocabulary data
            await this.loadUserData();
            
            // Setup text selection handling
            this.setupSelectionHandling();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            console.log('⚙️ ILM: Word Processor initialized successfully');
        } catch (error) {
            console.error('❌ ILM: Word Processor initialization failed:', error);
        }
    }

    async loadUserData() {
        try {
            const result = await chrome.storage.local.get([
                'knownWords', 
                'learningWords', 
                'vocabularyLevel',
                'displayMode',
                'bionicReadingEnabled',
                'highlightUnknownWords',
                'showTranslationOnHover'
            ]);

            this.knownWords = new Set(result.knownWords || []);
            this.learningWords = new Set(result.learningWords || []);
            this.userSettings = {
                vocabularyLevel: result.vocabularyLevel || 2000,
                displayMode: result.displayMode || 'hideKnown',
                bionicReadingEnabled: result.bionicReadingEnabled || false,
                highlightUnknownWords: result.highlightUnknownWords !== false,
                showTranslationOnHover: result.showTranslationOnHover !== false
            };

            console.log('📚 ILM: User data loaded -', this.knownWords.size, 'known words,', this.learningWords.size, 'learning words');
        } catch (error) {
            console.error('❌ ILM: Failed to load user data:', error);
        }
    }

    /**
     * Process text content and apply word highlighting/modifications
     * @param {HTMLElement} element - Element containing text to process
     * @param {Object} options - Processing options
     */
    processTextContent(element, options = {}) {
        if (!element) {
            return; // Invalid element
        }

        // 🚀 PERFORMANCE: Check if already processed and prevent duplicate processing
        if (element.dataset.ilmProcessed === 'true') {
            return; // Already processed
        }

        // 🚀 PERFORMANCE: Additional duplicate prevention
        if (element.querySelector && element.querySelector('.ilm-word')) {
            element.dataset.ilmProcessed = 'true';
            return; // Contains processed words, skip
        }

        try {
            // Skip if element contains form inputs or other interactive elements
            if (this.shouldSkipElement(element)) {
                element.dataset.ilmProcessed = 'skip'; // Mark as skipped
                return;
            }

            // 🚀 PERFORMANCE: Check content size before processing
            const textContent = element.textContent || '';
            if (textContent.trim().length < 10) {
                element.dataset.ilmProcessed = 'skip'; // Skip very short content
                return;
            }

            // Process text nodes recursively
            this.processTextNodes(element, options);
            
            // Mark as processed
            element.dataset.ilmProcessed = 'true';
            this.highlightedElements.add(element);

            // Apply Bionic Reading if enabled
            if (this.userSettings.bionicReadingEnabled) {
                this.applyBionicReading(element);
            }

        } catch (error) {
            console.error('❌ ILM: Text processing failed:', error);
            element.dataset.ilmProcessed = 'error'; // Mark as error to prevent retry
        }
    }

    /**
     * Check if element should be skipped during processing
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} True if element should be skipped
     */
    shouldSkipElement(element) {
        const skipTags = ['script', 'style', 'input', 'textarea', 'select', 'button', 'code', 'pre'];
        const skipClasses = ['ilm-tooltip', 'ilm-preview', 'ilm-word-overlay'];
        
        // Check tag name
        if (skipTags.includes(element.tagName.toLowerCase())) {
            return true;
        }

        // Check classes
        if (element.className && skipClasses.some(cls => element.className.includes(cls))) {
            return true;
        }

        // Check if element is hidden
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return true;
        }

        return false;
    }

    /**
     * Process text nodes within an element
     * @param {HTMLElement} element - Parent element
     * @param {Object} options - Processing options
     */
    processTextNodes(element, options) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip empty or whitespace-only text nodes
                    if (!node.textContent.trim()) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Skip if parent element should be skipped
                    if (this.shouldSkipElement(node.parentElement)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        // Process each text node
        textNodes.forEach(textNode => {
            this.processTextNode(textNode, options);
        });
    }

    /**
     * Process individual text node
     * @param {Text} textNode - Text node to process
     * @param {Object} options - Processing options
     */
    processTextNode(textNode, options) {
        const text = textNode.textContent;
        const words = this.extractWordsWithPositions(text);
        
        if (words.length === 0) return;

        // Create document fragment to hold processed content
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        words.forEach(wordInfo => {
            // Add text before word
            if (wordInfo.start > lastIndex) {
                const beforeText = text.slice(lastIndex, wordInfo.start);
                fragment.appendChild(document.createTextNode(beforeText));
            }

            // Process the word
            const wordElement = this.createWordElement(wordInfo);
            fragment.appendChild(wordElement);

            lastIndex = wordInfo.end;
        });

        // Add remaining text
        if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            fragment.appendChild(document.createTextNode(remainingText));
        }

        // Replace original text node with processed fragment
        textNode.parentNode.replaceChild(fragment, textNode);
    }

    /**
     * Extract words with their positions in the text
     * @param {string} text - Text to extract words from
     * @returns {Array} Array of word objects with position info
     */
    extractWordsWithPositions(text) {
        const words = [];
        const wordRegex = /\b[a-zA-Z']+\b/g;
        let match;

        while ((match = wordRegex.exec(text)) !== null) {
            words.push({
                word: match[0],
                start: match.index,
                end: match.index + match[0].length,
                originalCase: match[0]
            });
        }

        return words;
    }

    /**
     * Create DOM element for a word with appropriate styling and interactions
     * @param {Object} wordInfo - Word information object
     * @returns {HTMLElement} Word element
     */
    createWordElement(wordInfo) {
        const word = wordInfo.word.toLowerCase();
        const isKnown = this.knownWords.has(word);
        const isLearning = this.learningWords.has(word);
        const isUnknown = window.ilmTextAnalyzer ? window.ilmTextAnalyzer.isWordUnknown(word) : false;

        // 🚀 PERFORMANCE OPTIMIZATION: Only process words that need highlighting
        // Skip processing for basic common words unless they're explicitly in learning lists
        if (!isKnown && !isLearning && !isUnknown && this.isBasicWord(word)) {
            // Return plain text node for basic words
            return document.createTextNode(wordInfo.originalCase);
        }

        // Determine word classification
        let classification = 'normal';
        if (isKnown) {
            classification = 'known';
        } else if (isLearning) {
            classification = 'learning';
        } else if (isUnknown) {
            classification = 'unknown';
        }

        // 🚀 PERFORMANCE: Only create special elements for words that need processing
        if (classification === 'normal' && !this.userSettings.highlightUnknownWords) {
            return document.createTextNode(wordInfo.originalCase);
        }

        // Create word element based on display mode and classification
        let element;
        
        if (this.userSettings.displayMode === 'hideKnown' && isKnown) {
            // Hide known words
            element = document.createElement('span');
            element.className = 'ilm-word-hidden';
            element.textContent = '___';
            element.dataset.originalWord = wordInfo.originalCase;
        } else {
            // Show word with appropriate styling
            element = document.createElement('span');
            element.className = `ilm-word ilm-word-${classification}`;
            element.textContent = wordInfo.originalCase;
        }

        // Add data attributes
        element.dataset.word = word;
        element.dataset.classification = classification;
        element.dataset.ilmWord = 'true';

        // Add interaction handlers only for words that need them
        if (classification !== 'normal') {
            this.addWordInteractions(element, word, classification);
        }

        return element;
    }

    /**
     * Check if word is a basic/common word that doesn't need processing
     * @param {string} word - Word to check
     * @returns {boolean} True if word is basic
     */
    isBasicWord(word) {
        // 🚀 PERFORMANCE: Extensive blacklist of basic English words
        const basicWords = new Set([
            // Articles, conjunctions, prepositions
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'as', 'if', 'so', 'up', 'out', 'off', 'down', 'over', 'under', 'into', 'from', 'through',
            'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around', 'before',
            'behind', 'below', 'beneath', 'beside', 'between', 'beyond', 'during', 'except',
            'inside', 'near', 'outside', 'since', 'toward', 'until', 'upon', 'within', 'without',
            
            // Pronouns
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
            'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
            'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
            'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what',
            
            // Demonstratives and interrogatives
            'here', 'there', 'where', 'when', 'why', 'how', 'while', 'whether',
            
            // Auxiliary verbs and modals
            'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
            'do', 'does', 'did', 'doing', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must',
            'ought', 'shall', 'need', 'dare', 'used',
            
            // Common adverbs
            'not', 'no', 'yes', 'ok', 'okay', 'very', 'too', 'so', 'just', 'only', 'even', 'also',
            'still', 'already', 'yet', 'again', 'once', 'twice', 'always', 'never', 'often',
            'sometimes', 'usually', 'really', 'quite', 'rather', 'pretty', 'much', 'more', 'most',
            'less', 'least', 'almost', 'nearly', 'hardly', 'scarcely', 'barely', 'enough',
            
            // Numbers and ordinals
            'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
            'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
            'first', 'second', 'third', 'fourth', 'fifth', 'last', 'next', 'another', 'other',
            'before', 'after', 'now', 'then', 'today', 'yesterday', 'tomorrow',
            
            // Common adjectives
            'good', 'bad', 'big', 'small', 'large', 'little', 'new', 'old', 'young', 'long', 'short',
            'high', 'low', 'right', 'left', 'up', 'down', 'hot', 'cold', 'warm', 'cool', 'hard', 'soft',
            'fast', 'slow', 'quick', 'easy', 'difficult', 'simple', 'important', 'special', 'sure',
            'clear', 'possible', 'real', 'true', 'false', 'wrong', 'right', 'same', 'different',
            'free', 'full', 'empty', 'open', 'close', 'closed', 'ready', 'early', 'late',
            
            // Common verbs
            'get', 'go', 'come', 'see', 'know', 'think', 'say', 'tell', 'ask', 'give', 'take', 'make',
            'like', 'want', 'need', 'try', 'use', 'work', 'help', 'find', 'put', 'show', 'look', 'feel',
            'seem', 'become', 'leave', 'move', 'turn', 'start', 'stop', 'keep', 'let', 'run', 'walk',
            'talk', 'speak', 'listen', 'hear', 'watch', 'read', 'write', 'play', 'live', 'die',
            'buy', 'sell', 'pay', 'cost', 'spend', 'save', 'win', 'lose', 'call', 'meet',
            
            // Common nouns
            'time', 'day', 'week', 'month', 'year', 'hour', 'minute', 'second', 'moment',
            'way', 'place', 'home', 'house', 'room', 'door', 'window', 'table', 'chair',
            'man', 'woman', 'person', 'people', 'child', 'family', 'friend', 'name', 'hand', 'eye',
            'head', 'face', 'body', 'life', 'world', 'country', 'city', 'town', 'street', 'car',
            'food', 'water', 'money', 'book', 'word', 'thing', 'part', 'end', 'side', 'top',
            'back', 'front', 'kind', 'type', 'sort', 'case', 'point', 'line', 'number', 'idea',
            
            // Other common words
            'each', 'every', 'all', 'some', 'any', 'many', 'few', 'both', 'either', 'neither',
            'such', 'own', 'same', 'well', 'away', 'far', 'near', 'around', 'between', 'among'
        ]);

        // 🚀 PERFORMANCE: Also reject very short words and numbers
        if (word.length <= 2 || /^\d+$/.test(word)) {
            return true;
        }

        return basicWords.has(word.toLowerCase());
    }

    /**
     * Add interaction handlers to word elements
     * @param {HTMLElement} element - Word element
     * @param {string} word - The word
     * @param {string} classification - Word classification
     */
    addWordInteractions(element, word, classification) {
        // Hover handler for translations
        if (this.userSettings.showTranslationOnHover) {
            element.addEventListener('mouseenter', (e) => {
                this.showWordTooltip(e.target, word);
            });

            element.addEventListener('mouseleave', (e) => {
                this.hideWordTooltip(e.target);
            });
        }

        // Click handler for word actions
        element.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleWordClick(word, classification, e.target);
        });

        // Keyboard navigation
        element.setAttribute('tabindex', '0');
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleWordClick(word, classification, e.target);
            }
        });
    }

    /**
     * Handle word click events
     * @param {string} word - The word that was clicked
     * @param {string} classification - Word classification
     * @param {HTMLElement} element - The clicked element
     */
    async handleWordClick(word, classification, element) {
        try {
            if (classification === 'unknown' || classification === 'learning') {
                // Mark as known
                await this.markWordAsKnown(word);
                this.updateWordDisplay(element, 'known');
                this.showTemporaryFeedback(element, '✓ Marked as known', 'success');
            } else if (classification === 'known') {
                // Mark as learning (unknown)
                await this.markWordAsLearning(word);
                this.updateWordDisplay(element, 'learning');
                this.showTemporaryFeedback(element, '+ Added to learning list', 'info');
            } else if (element.classList.contains('ilm-word-hidden')) {
                // Reveal hidden word temporarily
                this.revealHiddenWord(element);
            }
        } catch (error) {
            console.error('❌ ILM: Word click handling failed:', error);
        }
    }

    /**
     * Mark word as known
     * @param {string} word - Word to mark as known
     */
    async markWordAsKnown(word) {
        this.knownWords.add(word);
        this.learningWords.delete(word);
        
        await chrome.storage.local.set({
            knownWords: Array.from(this.knownWords),
            learningWords: Array.from(this.learningWords)
        });

        // Notify background script
        chrome.runtime.sendMessage({
            type: 'WORD_MARKED_AS_KNOWN',
            word: word
        });
    }

    /**
     * Mark word as learning
     * @param {string} word - Word to mark as learning
     */
    async markWordAsLearning(word) {
        this.learningWords.add(word);
        this.knownWords.delete(word);
        
        await chrome.storage.local.set({
            knownWords: Array.from(this.knownWords),
            learningWords: Array.from(this.learningWords)
        });

        // Notify background script
        chrome.runtime.sendMessage({
            type: 'WORD_ADDED_TO_LEARNING',
            word: word
        });
    }

    /**
     * Update word display after classification change
     * @param {HTMLElement} element - Word element
     * @param {string} newClassification - New classification
     */
    updateWordDisplay(element, newClassification) {
        // Remove old classification classes
        element.className = element.className.replace(/ilm-word-\w+/g, '');
        
        // Add new classification
        element.classList.add(`ilm-word-${newClassification}`);
        element.dataset.classification = newClassification;

        // Apply display mode rules
        if (this.userSettings.displayMode === 'hideKnown' && newClassification === 'known') {
            element.textContent = '___';
            element.classList.add('ilm-word-hidden');
            element.dataset.originalWord = element.textContent;
        }
    }

    /**
     * Show word tooltip with translation
     * @param {HTMLElement} element - Word element
     * @param {string} word - The word
     */
    async showWordTooltip(element, word) {
        // 🚀 PERFORMANCE: Multiple duplicate prevention checks
        if (this.elementExists('ilm-tooltip')) return;
        if (element.dataset.tooltipActive === 'true') return;

        try {
            // Mark element as having active tooltip
            element.dataset.tooltipActive = 'true';

            // Get translation
            const translation = await this.getWordTranslation(word);
            
            // Double-check no tooltip was created while waiting
            if (this.elementExists('ilm-tooltip')) {
                element.dataset.tooltipActive = 'false';
                return;
            }
            
            // Create tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'ilm-tooltip';
            tooltip.innerHTML = `
                <div class="ilm-tooltip-word">${word}</div>
                <div class="ilm-tooltip-translation">${translation}</div>
            `;

            // Position tooltip
            const rect = element.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.bottom + 5) + 'px';
            tooltip.style.zIndex = '10000';

            document.body.appendChild(tooltip);

            // Auto-hide after delay
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.remove();
                }
                element.dataset.tooltipActive = 'false';
            }, 5000);

        } catch (error) {
            console.error('❌ ILM: Tooltip creation failed:', error);
            element.dataset.tooltipActive = 'false';
        }
    }

    /**
     * Hide word tooltip
     * @param {HTMLElement} element - Word element
     */
    hideWordTooltip(element) {
        const tooltip = document.querySelector('.ilm-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    /**
     * Get word translation
     * @param {string} word - Word to translate
     * @returns {Promise<string>} Translation
     */
    async getWordTranslation(word) {
        try {
            if (window.translationService) {
                const result = await window.translationService.translate(word);
                return result.text || `Definition of "${word}"`;
            }
            return `Definition of "${word}"`;
        } catch (error) {
            console.error('❌ ILM: Translation failed:', error);
            return `Definition of "${word}"`;
        }
    }

    /**
     * Show temporary feedback message
     * @param {HTMLElement} element - Element to show feedback near
     * @param {string} message - Feedback message
     * @param {string} type - Feedback type (success, info, error)
     */
    showTemporaryFeedback(element, message, type = 'info') {
        const feedback = document.createElement('div');
        feedback.className = `ilm-feedback ilm-feedback-${type}`;
        feedback.textContent = message;

        const rect = element.getBoundingClientRect();
        feedback.style.position = 'fixed';
        feedback.style.left = rect.left + 'px';
        feedback.style.top = (rect.top - 30) + 'px';
        feedback.style.zIndex = '10001';

        document.body.appendChild(feedback);

        // Animate and remove
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transform = 'translateY(-10px)';
            setTimeout(() => feedback.remove(), 300);
        }, 2000);
    }

    /**
     * Reveal hidden word temporarily
     * @param {HTMLElement} element - Hidden word element
     */
    revealHiddenWord(element) {
        const originalWord = element.dataset.originalWord;
        const originalText = element.textContent;
        
        element.textContent = originalWord;
        element.classList.add('ilm-word-revealed');

        // Hide again after delay
        setTimeout(() => {
            element.textContent = originalText;
            element.classList.remove('ilm-word-revealed');
        }, 3000);
    }

    /**
     * Apply Bionic Reading effect to text
     * @param {HTMLElement} element - Element to apply effect to
     */
    applyBionicReading(element) {
        const words = element.querySelectorAll('.ilm-word');
        
        words.forEach(wordElement => {
            const word = wordElement.textContent;
            if (word.length > 3) {
                const boldLength = Math.ceil(word.length / 2);
                const boldPart = word.slice(0, boldLength);
                const normalPart = word.slice(boldLength);
                
                wordElement.innerHTML = `<b>${boldPart}</b>${normalPart}`;
                wordElement.classList.add('ilm-bionic-word');
            }
        });
    }

    /**
     * Setup text selection handling for custom context menu
     */
    setupSelectionHandling() {
        document.addEventListener('mouseup', (e) => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            if (selectedText && selectedText.length > 0) {
                this.handleTextSelection(selectedText, e);
            }
        });
    }

    /**
     * Handle text selection events
     * @param {string} selectedText - Selected text
     * @param {Event} event - Mouse event
     */
    handleTextSelection(selectedText, event) {
        // Create selection context menu
        const menu = document.createElement('div');
        menu.className = 'ilm-selection-menu';
        menu.innerHTML = `
            <button class="ilm-selection-btn" data-action="define">📖 Definition</button>
            <button class="ilm-selection-btn" data-action="translate">🌐 Translate</button>
            <button class="ilm-selection-btn" data-action="add-to-learning">📚 Add to Learning</button>
            <button class="ilm-selection-btn" data-action="practice">✏️ Practice</button>
            <button class="ilm-selection-btn" data-action="lookup">🔍 More Info</button>
        `;

        // Position menu
        menu.style.position = 'fixed';
        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';
        menu.style.zIndex = '10002';

        document.body.appendChild(menu);

        // Add event handlers
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleSelectionAction(action, selectedText);
            }
            menu.remove();
        });

        // Remove menu on outside click
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }

    /**
     * Handle selection menu actions
     * @param {string} action - Action to perform
     * @param {string} text - Selected text
     */
    handleSelectionAction(action, text) {
        switch (action) {
            case 'translate':
                this.translateSelectedText(text);
                break;
            case 'add-to-learning':
                this.addSelectedTextToLearning(text);
                break;
            case 'lookup':
                this.lookupSelectedText(text);
                break;
            case 'define':
                this.defineSelectedText(text);
                break;
            case 'practice':
                this.practiceSelectedText(text);
                break;
        }
    }

    /**
     * Translate selected text
     * @param {string} text - Text to translate
     */
    async translateSelectedText(text) {
        try {
            const translation = await this.getWordTranslation(text);
            
            // Show translation popup
            this.showTranslationPopup(text, translation);
        } catch (error) {
            console.error('❌ ILM: Selection translation failed:', error);
        }
    }

    /**
     * Add selected text to learning list
     * @param {string} text - Text to add
     */
    async addSelectedTextToLearning(text) {
        const words = text.toLowerCase().split(/\s+/).filter(word => /^[a-zA-Z]+$/.test(word));
        
        for (const word of words) {
            await this.markWordAsLearning(word);
        }

        this.showTemporaryFeedback(
            document.elementFromPoint(event.clientX, event.clientY),
            `Added ${words.length} word(s) to learning list`,
            'success'
        );
    }

    /**
     * Get English definition for selected text
     * @param {string} text - Text to define
     */
    async defineSelectedText(text) {
        try {
            const word = text.trim().toLowerCase();
            
            // Use enhanced word info if available
            if (window.translationService && window.translationService.getEnhancedWordInfo) {
                const enhancedInfo = await window.translationService.getEnhancedWordInfo(word);
                this.showEnhancedDefinitionPopup(enhancedInfo);
            } else {
                const definition = await this.getWordDefinition(word);
                this.showDefinitionPopup(word, definition);
            }
        } catch (error) {
            console.error('❌ ILM: Definition lookup failed:', error);
        }
    }

    /**
     * Get word definition (English-English)
     * @param {string} word - Word to define
     * @returns {Promise<string>} Definition
     */
    async getWordDefinition(word) {
        try {
            if (window.translationService) {
                const result = await window.translationService.translate(word, { type: 'definition' });
                return result.definition || `Definition of "${word}"`;
            }
            return `Definition of "${word}"`;
        } catch (error) {
            console.error('❌ ILM: Definition failed:', error);
            return `Definition of "${word}"`;
        }
    }

    /**
     * Show definition popup
     * @param {string} word - Word
     * @param {string} definition - Definition text
     */
    showDefinitionPopup(word, definition) {
        // 🚀 PERFORMANCE: Prevent duplicate popups
        if (this.elementExists('ilm-definition-popup')) {
            return; // Already exists
        }

        const popup = document.createElement('div');
        popup.className = 'ilm-definition-popup';
        popup.innerHTML = `
            <div class="ilm-definition-header">
                <h4 class="ilm-definition-word">${word}</h4>
                <button class="ilm-definition-close">&times;</button>
            </div>
            <div class="ilm-definition-content">
                <p class="ilm-definition-text">${definition}</p>
                <div class="ilm-definition-actions">
                    <button class="ilm-btn ilm-btn-sm ilm-btn-secondary" onclick="this.closest('.ilm-definition-popup').remove()">Close</button>
                    <button class="ilm-btn ilm-btn-sm ilm-btn-primary" data-word="${word}" onclick="window.ilmWordProcessor.markWordAsLearning('${word}'); this.textContent='Added ✓';">Add to Learning</button>
                </div>
            </div>
        `;

        // Position popup in center of viewport
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.zIndex = '10003';

        document.body.appendChild(popup);

        // Setup close handler
        popup.querySelector('.ilm-definition-close').addEventListener('click', () => {
            popup.remove();
        });

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 10000);
    }

    /**
     * Show enhanced definition popup with comprehensive word information
     * @param {Object} wordInfo - Enhanced word information
     */
    showEnhancedDefinitionPopup(wordInfo) {
        // 🚀 PERFORMANCE: Prevent duplicate popups
        if (this.elementExists('ilm-enhanced-popup')) {
            return; // Already exists
        }

        const popup = document.createElement('div');
        popup.className = 'ilm-enhanced-popup';
        popup.innerHTML = this.generateEnhancedPopupHTML(wordInfo);

        // Position popup in center of viewport
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.zIndex = '10003';

        document.body.appendChild(popup);

        // Setup event handlers
        this.setupEnhancedPopupEvents(popup, wordInfo);

        // Auto-hide after 30 seconds for enhanced popup
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 30000);
    }

    /**
     * Highlight target word in example sentence
     * @param {string} sentence - Example sentence
     * @param {string} targetWord - Word to highlight
     * @returns {string} Sentence with highlighted word
     */
    highlightWordInExample(sentence, targetWord) {
        const regex = new RegExp(`\\b(${targetWord}|${targetWord}s|${targetWord}ed|${targetWord}ing)\\b`, 'gi');
        return sentence.replace(regex, '<mark class="ilm-target-word">$1</mark>');
    }

    /**
     * Generate HTML for enhanced popup
     * @param {Object} wordInfo - Enhanced word information
     * @returns {string} HTML content
     */
    generateEnhancedPopupHTML(wordInfo) {
        const pronunciationSection = wordInfo.pronunciation.ipa ? `
            <div class="ilm-pronunciation">
                <div class="ilm-pronunciation-main">
                    <span class="ilm-pronunciation-ipa">${wordInfo.pronunciation.ipa}</span>
                    ${wordInfo.pronunciation.audio ? `<button class="ilm-audio-btn" data-audio="${wordInfo.pronunciation.audio.primary}" title="Play pronunciation">🔊</button>` : ''}
                </div>
                ${wordInfo.pronunciation.americanIpa && wordInfo.pronunciation.britishIpa ? `
                    <div class="ilm-pronunciation-variants">
                        <div class="ilm-pronunciation-variant">
                            <span class="ilm-pronunciation-label">US:</span>
                            <span class="ilm-pronunciation-ipa-variant">${wordInfo.pronunciation.americanIpa}</span>
                        </div>
                        <div class="ilm-pronunciation-variant">
                            <span class="ilm-pronunciation-label">UK:</span>
                            <span class="ilm-pronunciation-ipa-variant">${wordInfo.pronunciation.britishIpa}</span>
                        </div>
                    </div>
                ` : ''}
                ${wordInfo.pronunciation.syllables && wordInfo.pronunciation.syllables.length > 1 ? `
                    <div class="ilm-syllables">
                        <span class="ilm-syllables-label">Syllables:</span>
                        <span class="ilm-syllables-breakdown">${wordInfo.pronunciation.syllables.join('·')}</span>
                        ${wordInfo.pronunciation.stress ? `
                            <span class="ilm-stress-pattern" title="Stress pattern: ${wordInfo.pronunciation.stress.join('-')}">[${wordInfo.pronunciation.stress.map(s => s === 'primary' ? 'ˈ' : s === 'secondary' ? 'ˌ' : '').join('')}]</span>
                        ` : ''}
                    </div>
                ` : ''}
                ${wordInfo.pronunciation.rhyme && wordInfo.pronunciation.rhyme.commonRhymes.length > 0 ? `
                    <div class="ilm-rhymes">
                        <span class="ilm-rhymes-label">Rhymes:</span>
                        <span class="ilm-rhymes-words">${wordInfo.pronunciation.rhyme.commonRhymes.slice(0, 3).join(', ')}</span>
                    </div>
                ` : ''}
            </div>
        ` : '';

        const partOfSpeechSection = wordInfo.partOfSpeech.map(pos => 
            `<span class="ilm-pos-tag">${pos.pos}</span>`
        ).join(' ');

        const definitionsSection = wordInfo.definitions.map((def, index) => `
            <div class="ilm-definition-item ${index === 0 ? 'active' : ''}" data-context="${def.context}">
                <div class="ilm-definition-context">${def.context}</div>
                <div class="ilm-definition-text">${def.definition}</div>
                ${def.examples.length > 0 ? `
                    <div class="ilm-definition-examples">
                        ${def.examples.slice(0, 2).map(ex => `<div class="ilm-example">• ${ex}</div>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');

        // Enhanced example sentences section with rich metadata
        const examplesSection = wordInfo.examples && wordInfo.examples.length > 0 ? `
            <div class="ilm-examples-section">
                <div class="ilm-examples-header">
                    <h4 class="ilm-examples-title">📚 Example Sentences</h4>
                    <div class="ilm-examples-count">${wordInfo.examples.length} examples</div>
                </div>
                <div class="ilm-examples-container">
                    ${wordInfo.examples.slice(0, 4).map((example, index) => `
                        <div class="ilm-example-card" data-context="${example.context || 'general'}" data-level="${example.level || 'basic'}">
                            <div class="ilm-example-content">
                                <div class="ilm-example-sentence">${this.highlightWordInExample(example.sentence, wordInfo.word)}</div>
                                <div class="ilm-example-meta">
                                    <span class="ilm-context-badge context-${example.context || 'general'}">${example.context || 'general'}</span>
                                    <span class="ilm-level-badge level-${example.level || 'basic'}">${example.level || 'basic'}</span>
                                    ${example.source ? `<span class="ilm-source-badge">${example.source}</span>` : ''}
                                </div>
                            </div>
                            <div class="ilm-example-actions">
                                <button class="ilm-example-audio-btn" data-sentence="${example.sentence}" title="Play sentence">🔊</button>
                                <button class="ilm-example-copy-btn" data-sentence="${example.sentence}" title="Copy sentence">📋</button>
                                <button class="ilm-example-translate-btn" data-sentence="${example.sentence}" title="Translate sentence">🌐</button>
                            </div>
                        </div>
                    `).join('')}
                    ${wordInfo.examples.length > 4 ? `
                        <div class="ilm-examples-more">
                            <button class="ilm-show-more-examples">Show ${wordInfo.examples.length - 4} more examples</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        ` : '';

        const synonymsSection = wordInfo.synonyms.length > 0 ? `
            <div class="ilm-word-relations">
                <div class="ilm-relation-group">
                    <span class="ilm-relation-label">Synonyms:</span>
                    <span class="ilm-relation-words">${wordInfo.synonyms.join(', ')}</span>
                </div>
            </div>
        ` : '';

        const collocationsSection = wordInfo.collocations.length > 0 ? `
            <div class="ilm-collocations">
                <div class="ilm-collocation-label">Common phrases:</div>
                <div class="ilm-collocation-list">
                    ${wordInfo.collocations.slice(0, 4).map(col => `<span class="ilm-collocation-item">${col}</span>`).join('')}
                </div>
            </div>
        ` : '';

        return `
            <div class="ilm-enhanced-header">
                <div class="ilm-header-left">
                    <h3 class="ilm-word-title">${wordInfo.originalCase}</h3>
                    ${pronunciationSection}
                </div>
                <div class="ilm-header-right">
                    <div class="ilm-word-stats">
                        <span class="ilm-difficulty-badge difficulty-${wordInfo.difficulty.toLowerCase()}">${wordInfo.difficulty}</span>
                        <span class="ilm-level-badge">${wordInfo.level}</span>
                    </div>
                    <button class="ilm-enhanced-close">&times;</button>
                </div>
            </div>

            <div class="ilm-enhanced-body">
                <div class="ilm-pos-section">
                    ${partOfSpeechSection}
                </div>

                <div class="ilm-definitions-section">
                    <div class="ilm-definition-tabs">
                        ${wordInfo.definitions.map((def, index) => `
                            <button class="ilm-def-tab ${index === 0 ? 'active' : ''}" data-context="${def.context}">
                                ${def.context}
                            </button>
                        `).join('')}
                    </div>
                    <div class="ilm-definitions-content">
                        ${definitionsSection}
                    </div>
                </div>

                ${synonymsSection}
                ${collocationsSection}
                ${examplesSection}

                ${wordInfo.etymology.origin !== 'Unknown' ? `
                    <div class="ilm-etymology">
                        <div class="ilm-etymology-label">📜 Etymology & Word Formation:</div>
                        <div class="ilm-etymology-content">
                            <div class="ilm-etymology-origin">
                                <strong>Origin:</strong> ${wordInfo.etymology.origin}${wordInfo.etymology.firstUse !== 'Unknown' ? ` (${wordInfo.etymology.firstUse})` : ''}
                            </div>
                            <div class="ilm-etymology-meaning">${wordInfo.etymology.meaning}</div>
                            
                            ${wordInfo.etymology.rootWords && wordInfo.etymology.rootWords.length > 0 ? `
                                <div class="ilm-root-analysis">
                                    <h5>🌱 Root Word Analysis:</h5>
                                    <div class="ilm-roots-container">
                                        ${wordInfo.etymology.rootWords.map(root => `
                                            <div class="ilm-root-item">
                                                <span class="ilm-root-form">${root.root}</span>
                                                <span class="ilm-root-meaning">${root.meaning} (${root.language})</span>
                                                <div class="ilm-root-examples">
                                                    Related: ${root.examples.slice(0, 3).join(', ')}
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${wordInfo.etymology.evolution && wordInfo.etymology.evolution.length > 0 ? `
                                <div class="ilm-evolution-timeline">
                                    <h5>⏰ Historical Evolution:</h5>
                                    <div class="ilm-timeline-container">
                                        ${wordInfo.etymology.evolution.map(period => `
                                            <div class="ilm-timeline-item">
                                                <span class="ilm-timeline-period">${period.period}</span>
                                                <span class="ilm-timeline-meaning">${period.meaning}</span>
                                                ${period.context ? `<span class="ilm-timeline-context">(${period.context})</span>` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${wordInfo.etymology.cognates && wordInfo.etymology.cognates.length > 0 ? `
                                <div class="ilm-cognates">
                                    <h5>🔗 Related Words:</h5>
                                    <div class="ilm-cognate-list">
                                        ${wordInfo.etymology.cognates.slice(0, 6).map(cognate => 
                                            `<span class="ilm-cognate-item">${cognate}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${wordInfo.etymology.modernUsage ? `
                                <div class="ilm-modern-usage">
                                    <strong>Modern Usage:</strong> ${wordInfo.etymology.modernUsage}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                <div class="ilm-enhanced-actions">
                    <button class="ilm-btn ilm-btn-secondary" onclick="this.closest('.ilm-enhanced-popup').remove()">Close</button>
                    <button class="ilm-btn ilm-btn-primary" data-word="${wordInfo.word}" onclick="window.ilmWordProcessor.markWordAsLearning('${wordInfo.word}'); this.textContent='Added ✓';">Add to Learning</button>
                    <button class="ilm-btn ilm-btn-success" data-word="${wordInfo.word}" onclick="window.ilmWordProcessor.markWordAsKnown('${wordInfo.word}'); this.textContent='Marked Known ✓';">Mark as Known</button>
                </div>
            </div>
        `;
    }

    /**
     * Setup event handlers for enhanced popup
     * @param {HTMLElement} popup - Popup element
     * @param {Object} wordInfo - Word information
     */
    setupEnhancedPopupEvents(popup, wordInfo) {
        // Close button
        const closeBtn = popup.querySelector('.ilm-enhanced-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                popup.remove();
            });
        }

        // Audio pronunciation
        const audioBtn = popup.querySelector('.ilm-audio-btn');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                this.playWordPronunciation(wordInfo.word, audioBtn.dataset.audio);
            });
        }

        // Definition tabs
        const tabs = popup.querySelectorAll('.ilm-def-tab');
        const definitionItems = popup.querySelectorAll('.ilm-definition-item');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and definitions
                tabs.forEach(t => t.classList.remove('active'));
                definitionItems.forEach(d => d.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding definition
                tab.classList.add('active');
                const context = tab.dataset.context;
                const targetDefinition = popup.querySelector(`[data-context="${context}"]`);
                if (targetDefinition) {
                    targetDefinition.classList.add('active');
                }
            });
        });

        // Collocation clicks
        const collocationItems = popup.querySelectorAll('.ilm-collocation-item');
        collocationItems.forEach(item => {
            item.addEventListener('click', () => {
                // Copy to clipboard or show usage examples
                navigator.clipboard?.writeText(item.textContent);
                this.showTemporaryFeedback(item, 'Copied to clipboard!', 'success');
            });
        });

        // Example sentence actions
        const exampleAudioBtns = popup.querySelectorAll('.ilm-example-audio-btn');
        exampleAudioBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sentence = btn.dataset.sentence;
                this.playExampleSentence(sentence);
            });
        });

        const exampleCopyBtns = popup.querySelectorAll('.ilm-example-copy-btn');
        exampleCopyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sentence = btn.dataset.sentence;
                navigator.clipboard?.writeText(sentence);
                this.showTemporaryFeedback(btn, 'Sentence copied!', 'success');
            });
        });

        const exampleTranslateBtns = popup.querySelectorAll('.ilm-example-translate-btn');
        exampleTranslateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sentence = btn.dataset.sentence;
                this.translateExampleSentence(sentence, btn);
            });
        });

        // Show more examples button
        const showMoreBtn = popup.querySelector('.ilm-show-more-examples');
        if (showMoreBtn) {
            showMoreBtn.addEventListener('click', () => {
                this.showAllExamples(popup, wordInfo);
            });
        }
    }

    /**
     * Play word pronunciation with multiple source fallback
     * @param {string} word - Word to pronounce
     * @param {string|Object} audioData - Audio URL or audio sources object
     */
    async playWordPronunciation(word, audioData) {
        try {
            // Handle both old string format and new object format
            const audioSources = typeof audioData === 'string' ? 
                { primary: audioData } : 
                (audioData || {});
            
            // Try audio sources in order of preference
            const sourceOrder = ['primary', 'cambridge', 'merriam'];
            
            for (const source of sourceOrder) {
                if (audioSources[source] && audioSources[source] !== '') {
                    try {
                        const audio = new Audio(audioSources[source]);
                        
                        // Add loading timeout
                        const playPromise = new Promise((resolve, reject) => {
                            audio.addEventListener('canplay', resolve, { once: true });
                            audio.addEventListener('error', reject, { once: true });
                            setTimeout(() => reject(new Error('Audio loading timeout')), 3000);
                        });
                        
                        await playPromise;
                        await audio.play();
                        
                        // Success - show feedback
                        this.showAudioFeedback(`🔊 ${source} pronunciation`);
                        return; // Successfully played
                        
                    } catch (audioError) {
                        console.warn(`❌ ILM: ${source} audio failed:`, audioError);
                        continue; // Try next source
                    }
                }
            }
            
            // All audio sources failed, use speech synthesis
            this.playWordWithSpeechSynthesis(word, 'en-US');
            
        } catch (error) {
            console.error('❌ ILM: Audio playback failed:', error);
            this.playWordWithSpeechSynthesis(word, 'en-US');
        }
    }

    /**
     * Play word pronunciation using speech synthesis with enhanced options
     * @param {string} word - Word to pronounce
     * @param {string} lang - Language code (default: 'en-US')
     * @param {Object} options - Speech synthesis options
     */
    playWordWithSpeechSynthesis(word, lang = 'en-US', options = {}) {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = lang;
            utterance.rate = options.rate || 0.8;
            utterance.pitch = options.pitch || 1;
            utterance.volume = options.volume || 1;
            
            // Try to use a native English voice if available
            const voices = speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice => 
                voice.lang.startsWith(lang.split('-')[0]) && 
                (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.default)
            ) || voices.find(voice => voice.lang.startsWith('en'));
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            // Add event handlers
            utterance.onstart = () => {
                this.showAudioFeedback('🗣️ Text-to-speech pronunciation');
            };
            
            utterance.onerror = (event) => {
                console.warn('❌ ILM: Speech synthesis error:', event);
            };
            
            speechSynthesis.speak(utterance);
        } else {
            console.warn('❌ ILM: Speech synthesis not supported');
            this.showAudioFeedback('❌ Audio not available', 'error');
        }
    }

    /**
     * Play example sentence using speech synthesis
     * @param {string} sentence - Sentence to play
     */
    playExampleSentence(sentence) {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel(); // Stop any ongoing speech
            
            const utterance = new SpeechSynthesisUtterance(sentence);
            utterance.lang = 'en-US';
            utterance.rate = 0.7; // Slower for learning
            utterance.pitch = 1;
            utterance.volume = 1;
            
            // Try to use a clear English voice
            const voices = speechSynthesis.getVoices();
            const englishVoice = voices.find(voice => 
                voice.lang.startsWith('en') && 
                (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.default)
            );
            
            if (englishVoice) {
                utterance.voice = englishVoice;
            }
            
            utterance.onstart = () => {
                this.showAudioFeedback('🗣️ Playing example sentence');
            };
            
            speechSynthesis.speak(utterance);
        } else {
            this.showAudioFeedback('❌ Speech synthesis not available', 'error');
        }
    }

    /**
     * Translate example sentence
     * @param {string} sentence - Sentence to translate
     * @param {HTMLElement} button - Button that triggered the translation
     */
    async translateExampleSentence(sentence, button) {
        try {
            button.disabled = true;
            button.textContent = '⏳';
            
            const translation = await window.ilmWordProcessor.getWordTranslation(sentence);
            
            // Create or update translation display
            let translationEl = button.parentNode.parentNode.querySelector('.ilm-example-translation');
            if (!translationEl) {
                translationEl = document.createElement('div');
                translationEl.className = 'ilm-example-translation';
                button.parentNode.parentNode.appendChild(translationEl);
            }
            
            translationEl.innerHTML = `<span class="ilm-translation-text">💬 ${translation}</span>`;
            translationEl.style.display = translationEl.style.display === 'block' ? 'none' : 'block';
            
            button.textContent = '🌐';
            button.disabled = false;
        } catch (error) {
            console.error('❌ ILM: Example translation failed:', error);
            button.textContent = '🌐';
            button.disabled = false;
            this.showAudioFeedback('❌ Translation failed', 'error');
        }
    }

    /**
     * Show all examples for a word
     * @param {HTMLElement} popup - Popup element
     * @param {Object} wordInfo - Word information
     */
    showAllExamples(popup, wordInfo) {
        const container = popup.querySelector('.ilm-examples-container');
        const moreButton = popup.querySelector('.ilm-examples-more');
        
        if (container && moreButton) {
            // Add remaining examples
            const remainingExamples = wordInfo.examples.slice(4);
            const newExamplesHTML = remainingExamples.map((example, index) => `
                <div class="ilm-example-card" data-context="${example.context || 'general'}" data-level="${example.level || 'basic'}">
                    <div class="ilm-example-content">
                        <div class="ilm-example-sentence">${this.highlightWordInExample(example.sentence, wordInfo.word)}</div>
                        <div class="ilm-example-meta">
                            <span class="ilm-context-badge context-${example.context || 'general'}">${example.context || 'general'}</span>
                            <span class="ilm-level-badge level-${example.level || 'basic'}">${example.level || 'basic'}</span>
                            ${example.source ? `<span class="ilm-source-badge">${example.source}</span>` : ''}
                        </div>
                    </div>
                    <div class="ilm-example-actions">
                        <button class="ilm-example-audio-btn" data-sentence="${example.sentence}" title="Play sentence">🔊</button>
                        <button class="ilm-example-copy-btn" data-sentence="${example.sentence}" title="Copy sentence">📋</button>
                        <button class="ilm-example-translate-btn" data-sentence="${example.sentence}" title="Translate sentence">🌐</button>
                    </div>
                </div>
            `).join('');
            
            // Insert before the more button
            moreButton.insertAdjacentHTML('beforebegin', newExamplesHTML);
            
            // Remove the more button
            moreButton.remove();
            
            // Re-setup event handlers for new examples
            this.setupNewExampleEvents(popup);
        }
    }

    /**
     * Setup event handlers for newly added examples
     * @param {HTMLElement} popup - Popup element
     */
    setupNewExampleEvents(popup) {
        const newAudioBtns = popup.querySelectorAll('.ilm-example-audio-btn:not([data-event-setup])');
        const newCopyBtns = popup.querySelectorAll('.ilm-example-copy-btn:not([data-event-setup])');
        const newTranslateBtns = popup.querySelectorAll('.ilm-example-translate-btn:not([data-event-setup])');
        
        newAudioBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sentence = btn.dataset.sentence;
                this.playExampleSentence(sentence);
            });
            btn.setAttribute('data-event-setup', 'true');
        });

        newCopyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sentence = btn.dataset.sentence;
                navigator.clipboard?.writeText(sentence);
                this.showTemporaryFeedback(btn, 'Sentence copied!', 'success');
            });
            btn.setAttribute('data-event-setup', 'true');
        });

        newTranslateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sentence = btn.dataset.sentence;
                this.translateExampleSentence(sentence, btn);
            });
            btn.setAttribute('data-event-setup', 'true');
        });
    }

    /**
     * Show audio feedback message
     * @param {string} message - Feedback message
     * @param {string} type - Feedback type ('success', 'error', 'info')
     */
    showAudioFeedback(message, type = 'info') {
        const feedback = document.createElement('div');
        feedback.className = `ilm-audio-feedback ilm-feedback-${type}`;
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10004;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: ilm-feedback-show 0.3s ease;
        `;
        
        document.body.appendChild(feedback);
        
        // Auto remove after 2 seconds
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.style.opacity = '0';
                feedback.style.transform = 'translateY(-10px)';
                setTimeout(() => feedback.remove(), 300);
            }
        }, 2000);
    }

    /**
     * Start practice mode for selected text
     * @param {string} text - Text to practice
     */
    async practiceSelectedText(text) {
        const words = text.toLowerCase().split(/\s+/).filter(word => /^[a-zA-Z]+$/.test(word));
        
        if (words.length === 0) {
            this.showTemporaryFeedback(
                document.elementFromPoint(event.clientX, event.clientY),
                'No valid words found for practice',
                'error'
            );
            return;
        }

        // Create word objects for practice
        const practiceWords = words.map(word => ({
            word: word,
            frequency: 1,
            vocabRank: window.ilmTextAnalyzer ? window.ilmTextAnalyzer.frequencyMap.get(word) || 9999 : 9999
        }));

        // Use the preview system's practice mode
        if (window.ilmUniversalProcessor && window.ilmUniversalProcessor.previewSystem) {
            window.ilmUniversalProcessor.previewSystem.currentWords = practiceWords;
            window.ilmUniversalProcessor.previewSystem.startPractice();
        }
    }

    /**
     * Enhanced lookup with multiple sources
     * @param {string} text - Text to lookup
     */
    async lookupSelectedText(text) {
        try {
            const word = text.trim().toLowerCase();
            
            // Create comprehensive lookup popup
            this.showLookupPopup(word);
        } catch (error) {
            console.error('❌ ILM: Lookup failed:', error);
        }
    }

    /**
     * Show comprehensive lookup popup
     * @param {string} word - Word to lookup
     */
    showLookupPopup(word) {
        // 🚀 PERFORMANCE: Prevent duplicate popups
        if (this.elementExists('ilm-lookup-popup')) {
            return; // Already exists
        }

        const popup = document.createElement('div');
        popup.className = 'ilm-lookup-popup';
        popup.innerHTML = `
            <div class="ilm-lookup-header">
                <h4 class="ilm-lookup-word">${word}</h4>
                <button class="ilm-lookup-close">&times;</button>
            </div>
            <div class="ilm-lookup-content">
                <div class="ilm-lookup-tabs">
                    <button class="ilm-lookup-tab active" data-tab="definition">Definition</button>
                    <button class="ilm-lookup-tab" data-tab="examples">Examples</button>
                    <button class="ilm-lookup-tab" data-tab="etymology">Etymology</button>
                </div>
                <div class="ilm-lookup-tab-content">
                    <div class="ilm-tab-pane active" id="definition">
                        <p class="ilm-loading">Loading definition...</p>
                    </div>
                    <div class="ilm-tab-pane" id="examples">
                        <p>Example sentences will appear here.</p>
                    </div>
                    <div class="ilm-tab-pane" id="etymology">
                        <p>Word origin and etymology information.</p>
                    </div>
                </div>
                <div class="ilm-lookup-actions">
                    <button class="ilm-btn ilm-btn-sm ilm-btn-secondary" onclick="this.closest('.ilm-lookup-popup').remove()">Close</button>
                    <button class="ilm-btn ilm-btn-sm ilm-btn-primary" data-word="${word}" onclick="window.ilmWordProcessor.markWordAsLearning('${word}'); this.textContent='Added ✓';">Add to Learning</button>
                    <a href="https://www.merriam-webster.com/dictionary/${word}" target="_blank" class="ilm-btn ilm-btn-sm ilm-btn-text">More Info</a>
                </div>
            </div>
        `;

        // Position popup
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.zIndex = '10003';

        document.body.appendChild(popup);

        // Setup tab switching
        popup.querySelectorAll('.ilm-lookup-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and panes
                popup.querySelectorAll('.ilm-lookup-tab').forEach(t => t.classList.remove('active'));
                popup.querySelectorAll('.ilm-tab-pane').forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding pane
                tab.classList.add('active');
                popup.querySelector(`#${tab.dataset.tab}`).classList.add('active');
            });
        });

        // Setup close handler
        popup.querySelector('.ilm-lookup-close').addEventListener('click', () => {
            popup.remove();
        });

        // Load definition
        this.loadDefinitionForLookup(word, popup);
    }

    /**
     * Load definition for lookup popup
     * @param {string} word - Word to define
     * @param {HTMLElement} popup - Popup element
     */
    async loadDefinitionForLookup(word, popup) {
        try {
            const definition = await this.getWordDefinition(word);
            const definitionPane = popup.querySelector('#definition');
            definitionPane.innerHTML = `<p>${definition}</p>`;
        } catch (error) {
            const definitionPane = popup.querySelector('#definition');
            definitionPane.innerHTML = `<p>Definition not available</p>`;
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + B: Toggle Bionic Reading
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
                e.preventDefault();
                this.toggleBionicReading();
            }
            
            // Ctrl/Cmd + Shift + H: Toggle highlighting
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
                e.preventDefault();
                this.toggleHighlighting();
            }
        });
    }

    /**
     * Toggle Bionic Reading mode
     */
    async toggleBionicReading() {
        this.userSettings.bionicReadingEnabled = !this.userSettings.bionicReadingEnabled;
        
        await chrome.storage.local.set({
            bionicReadingEnabled: this.userSettings.bionicReadingEnabled
        });

        // Reprocess all content
        this.reprocessAllContent();
    }

    /**
     * Toggle word highlighting
     */
    async toggleHighlighting() {
        this.userSettings.highlightUnknownWords = !this.userSettings.highlightUnknownWords;
        
        await chrome.storage.local.set({
            highlightUnknownWords: this.userSettings.highlightUnknownWords
        });

        // Update display
        this.reprocessAllContent();
    }

    /**
     * Reprocess all highlighted content
     */
    reprocessAllContent() {
        // Remove existing processing
        this.highlightedElements.forEach(element => {
            if (element.parentNode) {
                delete element.dataset.ilmProcessed;
                // Reset content (this would need more sophisticated implementation)
            }
        });

        this.highlightedElements.clear();

        // Reprocess page content
        setTimeout(() => {
            if (window.ilmUniversalProcessor) {
                window.ilmUniversalProcessor.processPageContent();
            }
        }, 100);
    }

    /**
     * Clean up processor (remove all modifications)
     */
    cleanup() {
        // 🚀 PERFORMANCE: More comprehensive cleanup to prevent element accumulation
        const cleanupSelectors = [
            '.ilm-tooltip', 
            '.ilm-selection-menu', 
            '.ilm-feedback',
            '.ilm-definition-popup',
            '.ilm-lookup-popup',
            '.ilm-practice-modal',
            '.ilm-preview-modal'
        ];
        
        cleanupSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                try {
                    el.remove();
                } catch (error) {
                    console.warn('Failed to remove element:', selector, error);
                }
            });
        });
        
        // Clear highlighted elements
        this.highlightedElements.clear();

        // 🚀 PERFORMANCE: Clean up processed markers for potential reprocessing
        document.querySelectorAll('[data-ilm-processed="error"]').forEach(el => {
            el.removeAttribute('data-ilm-processed');
        });
    }

    /**
     * Prevent duplicate tooltip/popup creation
     * @param {string} className - Class name to check
     * @returns {boolean} True if element already exists
     */
    elementExists(className) {
        return document.querySelector(`.${className}`) !== null;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.WordProcessor = WordProcessor;
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmWordProcessor) {
    window.ilmWordProcessor = new WordProcessor();
}