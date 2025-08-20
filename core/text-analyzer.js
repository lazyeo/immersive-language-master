// Immersive Language Master - Text Analysis Engine
// Advanced text processing and vocabulary analysis for language learning

class TextAnalyzer {
    constructor() {
        this.vocabDatabase = null;
        this.userVocabLevel = 2000; // Default vocabulary level
        this.contentCache = new Map();
        this.analysisCache = new Map();
        
        this.initializeAnalyzer();
    }

    async initializeAnalyzer() {
        try {
            // Load vocabulary database
            await this.loadVocabularyDatabase();
            
            // Get user's vocabulary level from storage
            const result = await chrome.storage.local.get(['vocabularyLevel']);
            if (result.vocabularyLevel) {
                this.userVocabLevel = result.vocabularyLevel;
            }
            
            console.log('🧠 ILM: Text Analyzer initialized successfully');
        } catch (error) {
            console.error('❌ ILM: Text Analyzer initialization failed:', error);
        }
    }

    async loadVocabularyDatabase() {
        try {
            const response = await fetch(chrome.runtime.getURL('data/coca-5000.json'));
            this.vocabDatabase = await response.json();
            
            // Create frequency map for faster lookup
            this.frequencyMap = new Map();
            this.vocabDatabase.forEach((word, index) => {
                this.frequencyMap.set(word.toLowerCase(), index + 1);
            });
            
            console.log('📚 ILM: Vocabulary database loaded -', this.vocabDatabase.length, 'words');
        } catch (error) {
            console.error('❌ ILM: Failed to load vocabulary database:', error);
            // Create fallback frequency map
            this.frequencyMap = new Map();
        }
    }

    /**
     * Extract and analyze text content from webpage
     * @param {Document} document - The document to analyze
     * @returns {Object} Analysis results including content, statistics, and unknown words
     */
    analyzePageContent(document = window.document) {
        const cacheKey = document.location.href;
        
        // Check cache first
        if (this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey);
        }

        try {
            // Extract main content
            const content = this.extractMainContent(document);
            
            if (!content || content.trim().length < 50) {
                return null; // Too little content to analyze
            }

            // Analyze content
            const analysis = this.performTextAnalysis(content);
            
            // Cache results
            this.analysisCache.set(cacheKey, analysis);
            
            return analysis;
        } catch (error) {
            console.error('❌ ILM: Page content analysis failed:', error);
            return null;
        }
    }

    /**
     * Extract main text content from webpage, filtering out navigation, ads, etc.
     * @param {Document} document - Document to extract content from
     * @returns {string} Extracted text content
     */
    extractMainContent(document) {
        // Priority selectors for main content
        const contentSelectors = [
            'article',
            '[role="main"]',
            'main',
            '.content',
            '.post-content',
            '.entry-content',
            '.article-body',
            '.post-body',
            '#content',
            '#main-content'
        ];

        let mainContent = '';

        // Try each selector in priority order
        for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                mainContent = this.cleanTextContent(element.textContent);
                if (mainContent.length > 200) {
                    break; // Found substantial content
                }
            }
        }

        // Fallback: extract from body but filter out common noise
        if (mainContent.length < 200) {
            const body = document.body;
            if (body) {
                // Clone body to avoid modifying original
                const bodyClone = body.cloneNode(true);
                
                // Remove noise elements
                const noiseSelectors = [
                    'nav', 'header', 'footer', 'aside',
                    '.navigation', '.nav', '.menu',
                    '.sidebar', '.advertisement', '.ads',
                    '.comments', '.social-share',
                    'script', 'style', 'noscript'
                ];
                
                noiseSelectors.forEach(selector => {
                    const elements = bodyClone.querySelectorAll(selector);
                    elements.forEach(el => el.remove());
                });
                
                mainContent = this.cleanTextContent(bodyClone.textContent);
            }
        }

        return mainContent;
    }

    /**
     * Clean and normalize text content
     * @param {string} text - Raw text to clean
     * @returns {string} Cleaned text
     */
    cleanTextContent(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, ' ')              // Normalize whitespace
            .replace(/\n\s*\n/g, '\n')         // Remove extra line breaks
            .replace(/[^\w\s\.\!\?\,\;\:\'\"]/g, ' ') // Keep basic punctuation
            .trim();
    }

    /**
     * Perform comprehensive text analysis
     * @param {string} text - Text to analyze
     * @returns {Object} Analysis results
     */
    performTextAnalysis(text) {
        const words = this.extractWords(text);
        const sentences = this.extractSentences(text);
        
        // Analyze vocabulary
        const vocabularyAnalysis = this.analyzeVocabulary(words);
        
        // Calculate reading difficulty
        const difficulty = this.calculateReadingDifficulty(words, sentences);
        
        return {
            content: text,
            wordCount: words.length,
            sentenceCount: sentences.length,
            uniqueWords: vocabularyAnalysis.uniqueWords,
            unknownWords: vocabularyAnalysis.unknownWords,
            knownWords: vocabularyAnalysis.knownWords,
            difficulty: difficulty,
            readingTime: Math.ceil(words.length / 200), // Average reading speed
            timestamp: Date.now()
        };
    }

    /**
     * Extract words from text with smart splitting
     * @param {string} text - Text to extract words from
     * @returns {Array} Array of words
     */
    extractWords(text) {
        // Split by word boundaries and filter
        const words = text
            .toLowerCase()
            .replace(/[^\w\s']/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1)
            .map(word => word.replace(/'/g, "'")) // Normalize apostrophes
            .filter(word => /^[a-zA-Z']+$/.test(word)); // Only alphabetic words

        return words;
    }

    /**
     * Extract sentences from text
     * @param {string} text - Text to extract sentences from
     * @returns {Array} Array of sentences
     */
    extractSentences(text) {
        return text
            .split(/[.!?]+/)
            .map(sentence => sentence.trim())
            .filter(sentence => sentence.length > 10);
    }

    /**
     * Analyze vocabulary level of words
     * @param {Array} words - Array of words to analyze
     * @returns {Object} Vocabulary analysis results
     */
    analyzeVocabulary(words) {
        const wordFrequency = new Map();
        const unknownWords = new Set();
        const knownWords = new Set();

        // Count word frequency and classify
        words.forEach(word => {
            wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
            
            const frequency = this.frequencyMap.get(word);
            
            if (!frequency || frequency > this.userVocabLevel) {
                unknownWords.add(word);
            } else {
                knownWords.add(word);
            }
        });

        // Sort unknown words by frequency in text (most common first)
        const sortedUnknownWords = Array.from(unknownWords)
            .map(word => ({
                word,
                frequency: wordFrequency.get(word),
                vocabRank: this.frequencyMap.get(word) || 9999
            }))
            .sort((a, b) => b.frequency - a.frequency);

        return {
            uniqueWords: wordFrequency.size,
            unknownWords: sortedUnknownWords,
            knownWords: Array.from(knownWords),
            wordFrequency: Object.fromEntries(wordFrequency)
        };
    }

    /**
     * Calculate reading difficulty based on various metrics
     * @param {Array} words - Array of words
     * @param {Array} sentences - Array of sentences
     * @returns {Object} Difficulty metrics
     */
    calculateReadingDifficulty(words, sentences) {
        const avgWordsPerSentence = words.length / sentences.length;
        const avgSyllablesPerWord = words.reduce((sum, word) => sum + this.countSyllables(word), 0) / words.length;
        
        // Flesch Reading Ease Score
        const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
        
        // Vocabulary complexity score (percentage of unknown words)
        const unknownWordRatio = this.analyzeVocabulary(words).unknownWords.length / words.length;
        
        let difficultyLevel = 'Unknown';
        if (fleschScore >= 90) difficultyLevel = 'Very Easy';
        else if (fleschScore >= 80) difficultyLevel = 'Easy';
        else if (fleschScore >= 70) difficultyLevel = 'Fairly Easy';
        else if (fleschScore >= 60) difficultyLevel = 'Standard';
        else if (fleschScore >= 50) difficultyLevel = 'Fairly Difficult';
        else if (fleschScore >= 30) difficultyLevel = 'Difficult';
        else difficultyLevel = 'Very Difficult';

        return {
            fleschScore: Math.round(fleschScore),
            level: difficultyLevel,
            avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
            avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
            unknownWordRatio: Math.round(unknownWordRatio * 100) / 100,
            vocabularyComplexity: unknownWordRatio > 0.3 ? 'High' : unknownWordRatio > 0.15 ? 'Medium' : 'Low'
        };
    }

    /**
     * Count syllables in a word (approximate)
     * @param {string} word - Word to count syllables for
     * @returns {number} Number of syllables
     */
    countSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        
        // Count vowel groups
        const vowelGroups = word.match(/[aeiouy]+/g);
        let syllables = vowelGroups ? vowelGroups.length : 1;
        
        // Adjust for silent e
        if (word.endsWith('e')) syllables--;
        
        // Minimum one syllable
        return Math.max(syllables, 1);
    }

    /**
     * Check if a word is unknown based on user's vocabulary level
     * @param {string} word - Word to check
     * @returns {boolean} True if word is unknown
     */
    isWordUnknown(word) {
        const lowerWord = word.toLowerCase();
        
        // 🚀 PERFORMANCE: Skip basic words entirely
        if (this.isBasicWord(lowerWord)) {
            return false;
        }

        const frequency = this.frequencyMap.get(lowerWord);
        
        // 🚀 SMART FILTERING: More intelligent unknown word detection
        // Only consider words unknown if they're beyond user's level AND not too basic
        if (!frequency) {
            // Word not in COCA database - only consider unknown if it's complex enough
            return lowerWord.length > 4; // Skip short unknown words
        }
        
        return frequency > this.userVocabLevel;
    }

    /**
     * Check if word is a basic/common word that should never be highlighted
     * @param {string} word - Word to check
     * @returns {boolean} True if word is basic
     */
    isBasicWord(word) {
        // 🚀 PERFORMANCE: Use the same extensive blacklist as WordProcessor for consistency
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
     * Get word difficulty information
     * @param {string} word - Word to analyze
     * @returns {Object} Word difficulty info
     */
    getWordInfo(word) {
        const frequency = this.frequencyMap.get(word.toLowerCase());
        
        return {
            word: word,
            frequency: frequency || null,
            isKnown: frequency && frequency <= this.userVocabLevel,
            difficulty: frequency ? (
                frequency <= 1000 ? 'common' :
                frequency <= 3000 ? 'intermediate' :
                frequency <= 5000 ? 'advanced' : 'rare'
            ) : 'unknown'
        };
    }

    /**
     * Clear analysis cache
     */
    clearCache() {
        this.analysisCache.clear();
        this.contentCache.clear();
    }

    /**
     * Update user vocabulary level
     * @param {number} level - New vocabulary level
     */
    updateVocabularyLevel(level) {
        this.userVocabLevel = level;
        this.clearCache(); // Clear cache as analysis results will change
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.TextAnalyzer = TextAnalyzer;
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmTextAnalyzer) {
    window.ilmTextAnalyzer = new TextAnalyzer();
}