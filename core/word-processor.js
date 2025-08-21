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
        const skipClasses = [
            'ilm-tooltip', 'ilm-preview', 'ilm-word-overlay', 'ilm-definition-popup',
            'ilm-lookup-popup', 'ilm-enhanced-popup', 'ilm-selection-menu',
            'ilm-feedback', 'ilm-processing-indicator', 'ilm-modal', 'ilm-popup',
            'ilm-bilingual-popup', 'ilm-word-card', 'ilm-preview-modal',
            // Chrome extension elements
            'extension-popup', 'chrome-extension', 'browser-extension'
        ];
        
        // Check tag name
        if (skipTags.includes(element.tagName.toLowerCase())) {
            return true;
        }

        // Check classes - more comprehensive check
        if (element.className) {
            const classList = element.className.toString();
            if (skipClasses.some(cls => classList.includes(cls))) {
                return true;
            }
        }

        // Check for extension-related IDs and attributes
        if (element.id && (
            element.id.startsWith('chrome-extension-') ||
            element.id.startsWith('extension-') ||
            element.id.includes('ilm-') ||
            element.id.includes('popup') ||
            element.id.includes('tooltip')
        )) {
            return true;
        }

        // Check for extension container attributes
        if (element.hasAttribute && (
            element.hasAttribute('data-extension') ||
            element.hasAttribute('data-chrome-extension') ||
            element.hasAttribute('data-ilm-popup') ||
            element.hasAttribute('data-popup')
        )) {
            return true;
        }

        // Check if element is inside a shadow DOM or has shadow root
        if (element.shadowRoot || element.getRootNode()?.host) {
            return true;
        }

        // Check for high z-index elements (likely popups/overlays)
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return true;
        }

        const zIndex = parseInt(style.zIndex);
        if (!isNaN(zIndex) && zIndex > 9000) {
            return true;
        }

        // Check if element is positioned fixed/absolute with high z-index (likely popup)
        if ((style.position === 'fixed' || style.position === 'absolute') && zIndex > 1000) {
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
        
        // 🚀 FIXED: Priority-based word classification
        // 1. First check if it's a basic word that should be ignored
        if (this.isBasicWord(word) && !isKnown && !isLearning) {
            // Return plain text for basic words not explicitly in user lists
            return document.createTextNode(wordInfo.originalCase);
        }

        // 2. Check explicit user classifications first
        if (isKnown) {
            // 🚀 FIXED: Known words display as normal text with subtle styling
            // No more hiding with "___" to maintain reading flow
            const element = document.createElement('span');
            element.className = 'ilm-word ilm-word-known';
            element.textContent = wordInfo.originalCase;
            element.dataset.word = word;
            element.dataset.classification = 'known';
            element.dataset.ilmWord = 'true';
            this.addWordInteractions(element, word, 'known');
            return element;
        }

        // 3. Check if it's in learning list
        if (isLearning) {
            const element = document.createElement('span');
            element.className = 'ilm-word ilm-word-learning';
            element.textContent = wordInfo.originalCase;
            element.dataset.word = word;
            element.dataset.classification = 'learning';
            element.dataset.ilmWord = 'true';
            this.addWordInteractions(element, word, 'learning');
            return element;
        }

        // 4. Check if it's truly unknown based on user vocabulary level
        const isUnknown = this.isWordUnknownForUser(word);
        
        if (isUnknown && this.userSettings.highlightUnknownWords) {
            const element = document.createElement('span');
            element.className = 'ilm-word ilm-word-unknown';
            element.textContent = wordInfo.originalCase;
            element.dataset.word = word;
            element.dataset.classification = 'unknown';
            element.dataset.ilmWord = 'true';
            this.addWordInteractions(element, word, 'unknown');
            return element;
        }

        // 5. Default: return plain text for normal words
        return document.createTextNode(wordInfo.originalCase);
    }

    /**
     * Check if word is unknown for the current user based on vocabulary level
     * @param {string} word - Word to check
     * @returns {boolean} True if word should be considered unknown
     */
    isWordUnknownForUser(word) {
        // Use user's vocabulary level setting (default 2000)
        const userVocabLevel = this.userSettings.vocabularyLevel || 2000;
        
        // Get word frequency rank from COCA data if available
        let wordRank = 9999; // Default to very uncommon
        if (window.ilmTextAnalyzer && window.ilmTextAnalyzer.frequencyMap) {
            const frequencyData = window.ilmTextAnalyzer.frequencyMap.get(word);
            if (frequencyData) {
                wordRank = frequencyData.rank || frequencyData;
            }
        }
        
        // Words beyond user's vocabulary level are considered unknown
        if (wordRank > userVocabLevel) {
            return true;
        }
        
        // Additional checks for complex words
        const syllables = this.countSyllables(word);
        const isAcademic = this.isAcademicWord(word);
        
        // Academic words or words with many syllables might be unknown even if frequent
        if (isAcademic && userVocabLevel < 3000) {
            return true;
        }
        
        if (syllables > 3 && userVocabLevel < 2000) {
            return true;
        }
        
        return false;
    }

    /**
     * Check if word is academic/specialized vocabulary
     * @param {string} word - Word to check
     * @returns {boolean} True if word is academic
     */
    isAcademicWord(word) {
        const academicWords = new Set([
            'analyze', 'concept', 'constitute', 'data', 'derive', 'establish',
            'evidence', 'factor', 'function', 'indicate', 'method', 'occur',
            'percent', 'period', 'policy', 'principle', 'research', 'structure',
            'theory', 'variable', 'significant', 'require', 'approach', 'area',
            'assessment', 'assume', 'authority', 'available', 'benefit', 'concept',
            'consistent', 'constitutional', 'context', 'contract', 'create', 'definition',
            'environment', 'estimate', 'export', 'formula', 'function', 'identify',
            'income', 'interpret', 'involve', 'legal', 'legislation', 'major',
            'method', 'normal', 'obtain', 'participate', 'particular', 'percent',
            'primary', 'process', 'require', 'research', 'response', 'role',
            'section', 'significant', 'similar', 'source', 'specific', 'structure'
        ]);
        
        return academicWords.has(word.toLowerCase());
    }

    /**
     * Count syllables in a word (approximate)
     * @param {string} word - Word to count
     * @returns {number} Estimated syllable count
     */
    countSyllables(word) {
        const vowels = 'aeiouy';
        let count = 0;
        let previousWasVowel = false;

        for (let i = 0; i < word.length; i++) {
            const isVowel = vowels.includes(word[i].toLowerCase());
            if (isVowel && !previousWasVowel) {
                count++;
            }
            previousWasVowel = isVowel;
        }

        // Handle silent e
        if (word.endsWith('e') && count > 1) {
            count--;
        }

        return Math.max(1, count);
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
        // Hover handler for translations with improved stability
        if (this.userSettings.showTranslationOnHover) {
            let hoverTimeout = null;
            
            element.addEventListener('mouseenter', (e) => {
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    hoverTimeout = null;
                }
                this.showWordTooltip(e.target, word);
            });

            element.addEventListener('mouseleave', (e) => {
                // Check if mouse is moving to the tooltip
                const relatedTarget = e.relatedTarget;
                const tooltip = document.querySelector('.ilm-tooltip');
                
                if (tooltip && relatedTarget) {
                    // Check if mouse is moving to the tooltip or any child of the tooltip
                    if (tooltip.contains(relatedTarget) || relatedTarget === tooltip) {
                        // Mouse moved to tooltip, don't hide
                        return;
                    }
                }
                
                // Delay hiding tooltip to allow mouse to move to tooltip
                element._hoverTimeout = setTimeout(() => {
                    const currentTooltip = document.querySelector('.ilm-tooltip');
                    // Only hide if tooltip is not being hovered
                    if (!currentTooltip || currentTooltip.dataset.tooltipHovered !== 'true') {
                        this.hideWordTooltip(e.target);
                    }
                }, 200); // 200ms delay for stability
            });
        }

        // 🚀 FIXED: Click handler now only shows tooltip, no direct marking
        // This prevents accidental marking during reading
        element.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showWordTooltip(e.target, word);
        });

        // Keyboard navigation
        element.setAttribute('tabindex', '0');
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.showWordTooltip(e.target, word);
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
                // 🚀 FIXED: Update ALL instances of the word on the page
                this.updateAllWordInstances(word, 'known');
                this.showTemporaryFeedback(element, '✓ Marked as known', 'success');
            } else if (classification === 'known') {
                // Mark as learning (unknown)
                await this.markWordAsLearning(word);
                // 🚀 FIXED: Update ALL instances of the word on the page
                this.updateAllWordInstances(word, 'learning');
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
     * Update all instances of a word across the page
     * @param {string} word - Word to update
     * @param {string} newClassification - New classification for the word
     */
    updateAllWordInstances(word, newClassification) {
        // Find all elements with this word
        const wordElements = document.querySelectorAll(`[data-word="${word}"]`);
        
        wordElements.forEach(element => {
            const oldClassification = element.dataset.classification;
            
            if (newClassification === 'known') {
                // 🚀 FIXED: Known words maintain their text content but get known styling
                // No more hiding with "___" to preserve reading flow
                element.className = 'ilm-word ilm-word-known';
                element.dataset.classification = 'known';
                
                // Remove old event handlers and add new ones
                this.removeWordInteractions(element);
                this.addWordInteractions(element, word, 'known');
            } else {
                // Update the classification and styling
                this.updateWordDisplay(element, newClassification);
            }
        });
        
        console.log(`📝 ILM: Updated ${wordElements.length} instances of "${word}" to ${newClassification}`);
    }

    /**
     * Remove all event listeners from a word element
     * @param {HTMLElement} element - Word element
     */
    removeWordInteractions(element) {
        // Clone the element to remove all event listeners
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        return newElement;
    }

    /**
     * Mark word as known with enhanced learning manager integration
     * @param {string} word - Word to mark as known
     * @param {Object} context - Additional context for learning record
     */
    async markWordAsKnown(word, context = {}) {
        this.knownWords.add(word);
        this.learningWords.delete(word);
        
        await chrome.storage.local.set({
            knownWords: Array.from(this.knownWords),
            learningWords: Array.from(this.learningWords)
        });

        // Update learning manager if available
        if (window.ilmLearningManager) {
            await window.ilmLearningManager.updateLearningRecord(word, 'marked_known', {
                ...context,
                source: 'word_processor',
                url: window.location.href
            });
        }

        // Notify background script
        chrome.runtime.sendMessage({
            type: 'WORD_MARKED_AS_KNOWN',
            word: word
        });
    }

    /**
     * Mark word as learning with enhanced learning manager integration
     * @param {string} word - Word to mark as learning
     * @param {Object} context - Additional context for learning record
     */
    async markWordAsLearning(word, context = {}) {
        this.learningWords.add(word);
        this.knownWords.delete(word);
        
        await chrome.storage.local.set({
            knownWords: Array.from(this.knownWords),
            learningWords: Array.from(this.learningWords)
        });

        // Update learning manager if available
        if (window.ilmLearningManager) {
            await window.ilmLearningManager.updateLearningRecord(word, 'added_to_learning', {
                ...context,
                source: 'word_processor',
                url: window.location.href
            });
        }

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
     * Show enhanced word tooltip with translation and learning aids
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

            // Check if this is truly unknown word that needs enhanced tooltip
            const classification = element.dataset.classification;
            const isUnknownWord = classification === 'unknown' || classification === 'learning';
            
            if (isUnknownWord && this.userSettings.showTranslationOnHover) {
                // Show enhanced tooltip for unknown words
                await this.showEnhancedTooltip(element, word);
            } else {
                // Show simple tooltip for other words
                await this.showSimpleTooltip(element, word);
            }

        } catch (error) {
            console.error('❌ ILM: Tooltip creation failed:', error);
            element.dataset.tooltipActive = 'false';
        }
    }

    /**
     * Show enhanced tooltip with comprehensive word information
     * @param {HTMLElement} element - Word element
     * @param {string} word - The word
     */
    async showEnhancedTooltip(element, word) {
        try {
            // Get enhanced translation with multiple sources
            const translation = await this.getEnhancedWordTranslation(word);
            
            // Double-check no tooltip was created while waiting
            if (this.elementExists('ilm-tooltip')) {
                element.dataset.tooltipActive = 'false';
                return;
            }
            
            // Create enhanced tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'ilm-tooltip ilm-tooltip-enhanced';
            tooltip.innerHTML = `
                <div class="ilm-tooltip-header">
                    <div class="ilm-tooltip-word">${word}</div>
                    <div class="ilm-tooltip-pronunciation">${translation.pronunciation || ''}</div>
                </div>
                <div class="ilm-tooltip-content">
                    <div class="ilm-tooltip-translation">${translation.translation}</div>
                    ${translation.partOfSpeech ? `<div class="ilm-tooltip-pos">${translation.partOfSpeech}</div>` : ''}
                    ${translation.examples && translation.examples.length > 0 ? `
                        <div class="ilm-tooltip-example">"${translation.examples[0]}"</div>
                    ` : ''}
                </div>
                <div class="ilm-tooltip-actions">
                    <button class="ilm-tooltip-btn" onclick="window.ilmWordProcessor.markWordAsKnown('${word}'); this.closest('.ilm-tooltip').remove();">
                        ✓ Known
                    </button>
                    <button class="ilm-tooltip-btn" onclick="window.ilmWordProcessor.markWordAsLearning('${word}'); this.closest('.ilm-tooltip').remove();">
                        📚 Learn
                    </button>
                </div>
            `;

            // Add hover events to tooltip to prevent hiding when mouse moves to it
            tooltip.addEventListener('mouseenter', () => {
                // Clear any pending hide timeout from the word element
                if (element._hoverTimeout) {
                    clearTimeout(element._hoverTimeout);
                    element._hoverTimeout = null;
                }
                
                // Mark tooltip as being actively hovered
                tooltip.dataset.tooltipHovered = 'true';
            });
            
            tooltip.addEventListener('mouseleave', (e) => {
                tooltip.dataset.tooltipHovered = 'false';
                
                // Check if mouse is moving back to the word element
                const relatedTarget = e.relatedTarget;
                if (relatedTarget && relatedTarget === element) {
                    // Mouse moved back to word, don't hide
                    return;
                }
                
                // Delay hiding to allow user to move mouse back
                setTimeout(() => {
                    if (tooltip.dataset.tooltipHovered !== 'true') {
                        this.hideWordTooltip(element);
                    }
                }, 150);
            });

            this.positionAndShowTooltip(tooltip, element);

        } catch (error) {
            console.error('❌ ILM: Enhanced tooltip creation failed:', error);
            // Fallback to simple tooltip
            await this.showSimpleTooltip(element, word);
        }
    }

    /**
     * Show simple tooltip for basic words
     * @param {HTMLElement} element - Word element
     * @param {string} word - The word
     */
    async showSimpleTooltip(element, word) {
        try {
            // Get basic translation
            const translation = await this.getWordTranslation(word);
            
            // Double-check no tooltip was created while waiting
            if (this.elementExists('ilm-tooltip')) {
                element.dataset.tooltipActive = 'false';
                return;
            }
            
            // Create simple tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'ilm-tooltip ilm-tooltip-simple';
            tooltip.innerHTML = `
                <div class="ilm-tooltip-word">${word}</div>
                <div class="ilm-tooltip-translation">${translation}</div>
            `;

            // Add hover stability to simple tooltips too
            tooltip.addEventListener('mouseenter', () => {
                if (element._hoverTimeout) {
                    clearTimeout(element._hoverTimeout);
                    element._hoverTimeout = null;
                }
                tooltip.dataset.tooltipHovered = 'true';
            });
            
            tooltip.addEventListener('mouseleave', (e) => {
                tooltip.dataset.tooltipHovered = 'false';
                const relatedTarget = e.relatedTarget;
                if (relatedTarget && relatedTarget === element) {
                    return;
                }
                
                setTimeout(() => {
                    if (tooltip.dataset.tooltipHovered !== 'true') {
                        this.hideWordTooltip(element);
                    }
                }, 150);
            });

            this.positionAndShowTooltip(tooltip, element);

        } catch (error) {
            console.error('❌ ILM: Simple tooltip creation failed:', error);
            element.dataset.tooltipActive = 'false';
        }
    }

    /**
     * Position and display tooltip with smart positioning
     * @param {HTMLElement} tooltip - Tooltip element
     * @param {HTMLElement} element - Reference element
     */
    positionAndShowTooltip(tooltip, element) {
        const rect = element.getBoundingClientRect();
        const tooltipWidth = 280; // Estimated width
        const tooltipHeight = 120; // Estimated height
        
        // Smart positioning: prefer bottom, but adjust if near edges
        let left = rect.left;
        let top = rect.bottom + 8;
        
        // Adjust horizontal position if too close to right edge
        if (left + tooltipWidth > window.innerWidth - 20) {
            left = window.innerWidth - tooltipWidth - 20;
        }
        
        // Adjust horizontal position if too close to left edge
        if (left < 20) {
            left = 20;
        }
        
        // Adjust vertical position if too close to bottom edge
        if (top + tooltipHeight > window.innerHeight - 20) {
            top = rect.top - tooltipHeight - 8; // Show above instead
        }
        
        // Apply positioning
        tooltip.style.position = 'fixed';
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.style.zIndex = '10000';

        document.body.appendChild(tooltip);

        // Store reference for cleanup
        tooltip._sourceElement = element;
        element._activeTooltip = tooltip;

        // Auto-hide after delay if not being interacted with
        const autoHideTimer = setTimeout(() => {
            // Only hide if tooltip is not being hovered and element is not being hovered
            if (tooltip.parentNode && 
                tooltip.dataset.tooltipHovered !== 'true' && 
                !element.matches(':hover')) {
                tooltip.style.opacity = '0';
                tooltip.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (tooltip.parentNode) {
                        tooltip.remove();
                        if (element._activeTooltip === tooltip) {
                            element._activeTooltip = null;
                        }
                    }
                }, 300);
                element.dataset.tooltipActive = 'false';
            }
        }, 4000);
        
        // Store timer for potential cleanup
        tooltip._autoHideTimer = autoHideTimer;
    }

    /**
     * Get enhanced word translation with multiple data sources
     * @param {string} word - Word to translate
     * @returns {Promise<Object>} Enhanced translation object
     */
    async getEnhancedWordTranslation(word) {
        try {
            // Try to get bilingual translation first (English-to-English)
            if (window.ilmBilingualEngine) {
                const result = await window.ilmBilingualEngine.getBilingualExplanation(word, 'elementary');
                if (result && result.length > 0) {
                    return {
                        translation: result[0].definition,
                        examples: [result[0].simpleExample],
                        partOfSpeech: result[0].partOfSpeech,
                        pronunciation: await this.getWordPronunciation(word)
                    };
                }
            }

            // Fallback to regular translation service
            if (window.ilmMultiLanguageTranslator) {
                const result = await window.ilmMultiLanguageTranslator.translate(word, {
                    to: 'zh', // or user's preferred language
                    includeAlternatives: true
                });
                
                if (result.success) {
                    return {
                        translation: result.translation,
                        examples: result.examples || [],
                        partOfSpeech: result.partOfSpeech,
                        pronunciation: result.pronunciation
                    };
                }
            }

            // Final fallback
            const basicTranslation = await this.getWordTranslation(word);
            return {
                translation: basicTranslation,
                examples: [],
                partOfSpeech: '',
                pronunciation: ''
            };

        } catch (error) {
            console.error('❌ ILM: Enhanced translation failed:', error);
            return {
                translation: `Definition of "${word}"`,
                examples: [],
                partOfSpeech: '',
                pronunciation: ''
            };
        }
    }

    /**
     * Get word pronunciation information
     * @param {string} word - Word to get pronunciation for
     * @returns {Promise<string>} Pronunciation guide
     */
    async getWordPronunciation(word) {
        try {
            // This would integrate with pronunciation APIs or local data
            // For now, return a simple phonetic approximation
            return `/${word}/`; // Placeholder
        } catch (error) {
            return '';
        }
    }

    /**
     * Hide word tooltip with comprehensive cleanup
     * @param {HTMLElement} element - Word element
     */
    hideWordTooltip(element) {
        // Clear any pending hide timeout
        if (element && element._hoverTimeout) {
            clearTimeout(element._hoverTimeout);
            element._hoverTimeout = null;
        }
        
        // Handle specific tooltip for this element
        let tooltip = null;
        if (element && element._activeTooltip) {
            tooltip = element._activeTooltip;
        } else {
            // Fallback to finding any active tooltip
            tooltip = document.querySelector('.ilm-tooltip');
        }
        
        if (tooltip) {
            // Clear auto-hide timer
            if (tooltip._autoHideTimer) {
                clearTimeout(tooltip._autoHideTimer);
                tooltip._autoHideTimer = null;
            }
            
            // Remove tooltip
            tooltip.remove();
            
            // Clean up references
            if (element) {
                element._activeTooltip = null;
                element.dataset.tooltipActive = 'false';
            }
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
     * Reveal hidden word temporarily (for hideKnown mode only)
     * @param {HTMLElement} element - Hidden word element
     */
    revealHiddenWord(element) {
        const originalWord = element.dataset.originalWord;
        const originalText = element.textContent;
        
        element.textContent = originalWord;
        element.classList.add('ilm-word-revealed');

        // Show tooltip while revealed
        this.showWordTooltip(element, element.dataset.word);

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
                        <span class="ilm-cefr-badge cefr-${this.getCEFRFromLevel(wordInfo.level)}" title="Common European Framework Level">${this.getCEFRFromLevel(wordInfo.level)}</span>
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

                ${this.generateDifficultyAnalysisSection(wordInfo)}

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
                    <button class="ilm-btn ilm-btn-bookmark" data-word="${wordInfo.word}" onclick="window.ilmWordProcessor.bookmarkWordFromPopup('${wordInfo.word}', this);">📖 Bookmark</button>
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

        // Difficulty analysis toggle
        const analysisToggle = popup.querySelector('.ilm-analysis-toggle');
        const analysisDetails = popup.querySelector('.ilm-difficulty-details');
        
        if (analysisToggle && analysisDetails) {
            analysisToggle.addEventListener('click', () => {
                const isExpanded = analysisToggle.dataset.expanded === 'true';
                
                if (isExpanded) {
                    // Hide details
                    analysisDetails.style.display = 'none';
                    analysisToggle.textContent = 'Show Details';
                    analysisToggle.dataset.expanded = 'false';
                } else {
                    // Show details
                    analysisDetails.style.display = 'block';
                    analysisToggle.textContent = 'Hide Details';
                    analysisToggle.dataset.expanded = 'true';
                    
                    // Animate the factor bars
                    setTimeout(() => {
                        this.animateFactorBars(popup);
                    }, 50);
                }
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
     * Animate difficulty factor bars for visual appeal
     * @param {HTMLElement} popup - Popup element containing factor bars
     */
    animateFactorBars(popup) {
        const factorBars = popup.querySelectorAll('.ilm-factor-fill');
        
        factorBars.forEach((bar, index) => {
            const targetWidth = bar.style.width;
            bar.style.width = '0%';
            bar.style.transition = 'width 0.8s ease-out';
            
            setTimeout(() => {
                bar.style.width = targetWidth;
            }, index * 100); // Stagger animation
        });

        // Animate the score circle
        const scoreCircle = popup.querySelector('.ilm-score-circle');
        if (scoreCircle) {
            const scoreValue = parseInt(scoreCircle.dataset.score);
            this.animateScoreCircle(scoreCircle, scoreValue);
        }
    }

    /**
     * Animate circular score display
     * @param {HTMLElement} scoreElement - Score circle element
     * @param {number} targetScore - Target score percentage (0-100)
     */
    animateScoreCircle(scoreElement, targetScore) {
        const scoreFill = scoreElement.querySelector('.ilm-score-fill');
        const scoreText = scoreElement.querySelector('.ilm-score-text');
        
        if (!scoreFill || !scoreText) return;

        let currentScore = 0;
        const duration = 1500; // 1.5 seconds
        const increment = targetScore / (duration / 16); // 60fps
        
        const animate = () => {
            currentScore = Math.min(currentScore + increment, targetScore);
            
            // Update circular progress
            const degrees = (currentScore / 100) * 360;
            scoreFill.style.background = `conic-gradient(
                #38b2ac 0deg,
                #38b2ac ${degrees}deg,
                #e2e8f0 ${degrees}deg,
                #e2e8f0 360deg
            )`;
            
            // Update text
            scoreText.textContent = `${Math.round(currentScore)}%`;
            
            if (currentScore < targetScore) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
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
     * Extract CEFR level from level description
     * @param {string} levelDescription - Level description (e.g., "B2 (Medium Frequency)")
     * @returns {string} CEFR level (e.g., "B2")
     */
    getCEFRFromLevel(levelDescription) {
        if (!levelDescription) return 'B1'; // Default fallback
        const match = levelDescription.match(/^([ABC][12])/);
        return match ? match[1] : 'B1';
    }

    /**
     * Generate detailed difficulty analysis section for enhanced popup
     * @param {Object} wordInfo - Enhanced word information
     * @returns {string} HTML for difficulty analysis section
     */
    generateDifficultyAnalysisSection(wordInfo) {
        // Get detailed breakdown if available
        const difficultyBreakdown = window.translationService ? 
            window.translationService.getDifficultyBreakdown(wordInfo.word) : 
            null;

        if (!difficultyBreakdown) {
            return ''; // No detailed analysis available
        }

        const { overall, factors, recommendations, learningTips } = difficultyBreakdown;

        return `
            <div class="ilm-difficulty-analysis">
                <div class="ilm-difficulty-analysis-header">
                    <h4 class="ilm-difficulty-analysis-title">📊 Difficulty Analysis</h4>
                    <button class="ilm-analysis-toggle" data-expanded="false">Show Details</button>
                </div>
                
                <div class="ilm-difficulty-summary">
                    <div class="ilm-difficulty-score">
                        <div class="ilm-score-circle" data-score="${(overall.score * 100).toFixed(0)}">
                            <div class="ilm-score-fill" style="--score: ${overall.score * 100}%"></div>
                            <div class="ilm-score-text">${(overall.score * 100).toFixed(0)}%</div>
                        </div>
                        <div class="ilm-score-label">Difficulty Score</div>
                    </div>
                    
                    <div class="ilm-cefr-info">
                        <div class="ilm-cefr-level-display cefr-${overall.cefrLevel}">${overall.cefrLevel}</div>
                        <div class="ilm-cefr-description">${this.getCEFRDescription(overall.cefrLevel)}</div>
                    </div>
                </div>

                <div class="ilm-difficulty-details" style="display: none;">
                    <div class="ilm-factors-breakdown">
                        <h5>📈 Complexity Factors:</h5>
                        <div class="ilm-factors-grid">
                            <div class="ilm-factor-item">
                                <div class="ilm-factor-name">📊 Frequency</div>
                                <div class="ilm-factor-bar">
                                    <div class="ilm-factor-fill" style="width: ${factors.frequency * 100}%"></div>
                                </div>
                                <div class="ilm-factor-score">${(factors.frequency * 100).toFixed(0)}%</div>
                            </div>
                            
                            <div class="ilm-factor-item">
                                <div class="ilm-factor-name">🔬 Structure</div>
                                <div class="ilm-factor-bar">
                                    <div class="ilm-factor-fill" style="width: ${factors.morphological * 100}%"></div>
                                </div>
                                <div class="ilm-factor-score">${(factors.morphological * 100).toFixed(0)}%</div>
                            </div>
                            
                            <div class="ilm-factor-item">
                                <div class="ilm-factor-name">🔊 Pronunciation</div>
                                <div class="ilm-factor-bar">
                                    <div class="ilm-factor-fill" style="width: ${factors.phonological * 100}%"></div>
                                </div>
                                <div class="ilm-factor-score">${(factors.phonological * 100).toFixed(0)}%</div>
                            </div>
                            
                            <div class="ilm-factor-item">
                                <div class="ilm-factor-name">🧠 Meaning</div>
                                <div class="ilm-factor-bar">
                                    <div class="ilm-factor-fill" style="width: ${factors.semantic * 100}%"></div>
                                </div>
                                <div class="ilm-factor-score">${(factors.semantic * 100).toFixed(0)}%</div>
                            </div>
                            
                            <div class="ilm-factor-item">
                                <div class="ilm-factor-name">✍️ Spelling</div>
                                <div class="ilm-factor-bar">
                                    <div class="ilm-factor-fill" style="width: ${factors.orthographic * 100}%"></div>
                                </div>
                                <div class="ilm-factor-score">${(factors.orthographic * 100).toFixed(0)}%</div>
                            </div>
                        </div>
                    </div>

                    ${recommendations.length > 0 ? `
                        <div class="ilm-learning-recommendations">
                            <h5>💡 Learning Recommendations:</h5>
                            <ul class="ilm-recommendations-list">
                                ${recommendations.map(rec => `<li class="ilm-recommendation-item">${rec}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${Object.keys(learningTips).some(key => learningTips[key].length > 0) ? `
                        <div class="ilm-learning-tips">
                            <h5>🎯 Specific Tips:</h5>
                            <div class="ilm-tips-grid">
                                ${learningTips.pronunciation.length > 0 ? `
                                    <div class="ilm-tip-category">
                                        <div class="ilm-tip-title">🔊 Pronunciation</div>
                                        <ul class="ilm-tip-list">
                                            ${learningTips.pronunciation.map(tip => `<li>${tip}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                                
                                ${learningTips.spelling.length > 0 ? `
                                    <div class="ilm-tip-category">
                                        <div class="ilm-tip-title">✍️ Spelling</div>
                                        <ul class="ilm-tip-list">
                                            ${learningTips.spelling.map(tip => `<li>${tip}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                                
                                ${learningTips.usage.length > 0 ? `
                                    <div class="ilm-tip-category">
                                        <div class="ilm-tip-title">💬 Usage</div>
                                        <ul class="ilm-tip-list">
                                            ${learningTips.usage.map(tip => `<li>${tip}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                                
                                ${learningTips.memory.length > 0 ? `
                                    <div class="ilm-tip-category">
                                        <div class="ilm-tip-title">🧠 Memory</div>
                                        <ul class="ilm-tip-list">
                                            ${learningTips.memory.map(tip => `<li>${tip}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Get CEFR level description
     * @param {string} level - CEFR level (A1, A2, B1, B2, C1, C2)
     * @returns {string} Description of the CEFR level
     */
    getCEFRDescription(level) {
        const descriptions = {
            'A1': 'Beginner - Basic survival vocabulary',
            'A2': 'Elementary - Everyday situations',
            'B1': 'Intermediate - Familiar topics',
            'B2': 'Upper-Intermediate - Complex topics',
            'C1': 'Advanced - Nuanced communication',
            'C2': 'Proficient - Near-native level'
        };
        
        return descriptions[level] || 'Intermediate level';
    }

    /**
     * Bookmark word from enhanced popup with comprehensive context
     * @param {string} word - Word to bookmark
     * @param {HTMLElement} button - Button element that triggered the action
     */
    async bookmarkWordFromPopup(word, button) {
        try {
            if (!window.ilmLearningManager) {
                this.showTemporaryFeedback(button, '❌ Learning Manager not available', 'error');
                return;
            }

            // Disable button and show loading state
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = '⏳ Bookmarking...';

            // Get enhanced context from the popup
            const popup = button.closest('.ilm-enhanced-popup');
            const context = this.extractBookmarkContextFromPopup(popup, word);

            // Create bookmark using learning manager
            const result = await window.ilmLearningManager.bookmarkWord(word, context);

            if (result.success) {
                button.textContent = '📖 Bookmarked ✓';
                button.classList.remove('ilm-btn-bookmark');
                button.classList.add('ilm-btn-success');
                this.showTemporaryFeedback(button, '✓ Word bookmarked successfully!', 'success');
                
                // Update button action to remove bookmark
                button.onclick = () => this.removeBookmarkFromPopup(word, button);
            } else {
                throw new Error(result.message || 'Bookmark creation failed');
            }

        } catch (error) {
            console.error('❌ ILM: Bookmark creation failed:', error);
            button.textContent = originalText;
            button.disabled = false;
            this.showTemporaryFeedback(button, '❌ Bookmark failed', 'error');
        }
    }

    /**
     * Extract comprehensive bookmark context from enhanced popup
     * @param {HTMLElement} popup - Enhanced popup element
     * @param {string} word - Target word
     * @returns {Object} Bookmark context
     */
    extractBookmarkContextFromPopup(popup, word) {
        const context = {
            originalCase: word,
            source: 'enhanced_popup',
            url: window.location.href,
            timestamp: Date.now()
        };

        try {
            // Extract difficulty and CEFR level
            const difficultyBadge = popup.querySelector('.ilm-difficulty-badge');
            if (difficultyBadge) {
                context.difficulty = difficultyBadge.textContent.trim();
            }

            const cefrBadge = popup.querySelector('.ilm-cefr-badge');
            if (cefrBadge) {
                context.cefrLevel = cefrBadge.textContent.trim();
            }

            // Extract primary definition
            const primaryDefinition = popup.querySelector('.ilm-definition-item.active .ilm-definition-text');
            if (primaryDefinition) {
                context.translation = primaryDefinition.textContent.trim();
            }

            // Extract part of speech
            const posTag = popup.querySelector('.ilm-pos-tag');
            if (posTag) {
                context.category = posTag.textContent.trim();
            }

            // Extract pronunciation
            const pronunciation = popup.querySelector('.ilm-pronunciation-ipa');
            if (pronunciation) {
                context.pronunciation = pronunciation.textContent.trim();
            }

            // Extract example sentences
            const examples = popup.querySelectorAll('.ilm-example-sentence');
            if (examples.length > 0) {
                context.examples = Array.from(examples)
                    .slice(0, 3) // Limit to first 3 examples
                    .map(ex => ex.textContent.replace(/\s+/g, ' ').trim());
            }

            // Extract related words
            const synonyms = popup.querySelector('.ilm-relation-words');
            if (synonyms) {
                context.relatedWords = synonyms.textContent.split(',').map(s => s.trim()).slice(0, 5);
            }

            // Extract common phrases
            const collocations = popup.querySelectorAll('.ilm-collocation-item');
            if (collocations.length > 0) {
                context.tags = Array.from(collocations)
                    .slice(0, 3)
                    .map(col => col.textContent.trim());
            }

            // Extract page context (sentence containing the word)
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const selectedText = selection.toString().trim();
                if (selectedText.toLowerCase().includes(word.toLowerCase())) {
                    context.sentence = selectedText;
                }
            }

        } catch (error) {
            console.warn('❌ ILM: Context extraction partially failed:', error);
        }

        return context;
    }

    /**
     * Remove bookmark from popup
     * @param {string} word - Word to remove from bookmarks
     * @param {HTMLElement} button - Button element
     */
    async removeBookmarkFromPopup(word, button) {
        try {
            if (!window.ilmLearningManager) {
                this.showTemporaryFeedback(button, '❌ Learning Manager not available', 'error');
                return;
            }

            // Find and remove bookmark
            const bookmarks = window.ilmLearningManager.bookmarkedWords;
            const bookmarkToRemove = Array.from(bookmarks.entries())
                .find(([id, bookmark]) => bookmark.word === word.toLowerCase());

            if (bookmarkToRemove) {
                const [bookmarkId] = bookmarkToRemove;
                bookmarks.delete(bookmarkId);
                await window.ilmLearningManager.saveData();

                // Update button state
                button.textContent = '📖 Bookmark';
                button.classList.remove('ilm-btn-success');
                button.classList.add('ilm-btn-bookmark');
                button.onclick = () => this.bookmarkWordFromPopup(word, button);
                
                this.showTemporaryFeedback(button, '✓ Bookmark removed', 'info');
            }

        } catch (error) {
            console.error('❌ ILM: Bookmark removal failed:', error);
            this.showTemporaryFeedback(button, '❌ Removal failed', 'error');
        }
    }

    /**
     * Check if word is already bookmarked
     * @param {string} word - Word to check
     * @returns {boolean} True if word is bookmarked
     */
    isWordBookmarked(word) {
        if (!window.ilmLearningManager) return false;
        
        const bookmarks = window.ilmLearningManager.bookmarkedWords;
        return Array.from(bookmarks.values())
            .some(bookmark => bookmark.word === word.toLowerCase());
    }

    /**
     * Get learning statistics for display
     * @returns {Object} Learning statistics
     */
    getLearningStatistics() {
        if (!window.ilmLearningManager) {
            return {
                totalBookmarks: 0,
                totalStudySessions: 0,
                currentStreak: 0,
                wordsForReview: 0
            };
        }

        const stats = window.ilmLearningManager.getLearningStatistics();
        const reviewWords = window.ilmLearningManager.getWordsForReview();
        
        return {
            totalBookmarks: stats.overview.totalBookmarks,
            totalStudySessions: stats.overview.totalStudySessions,
            currentStreak: stats.overview.currentStreak,
            wordsForReview: reviewWords.length,
            todayStudied: stats.recent.todayStudied,
            weekStudied: stats.recent.weekStudied
        };
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