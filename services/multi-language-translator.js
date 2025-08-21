// Immersive Language Master - Multi-Language Translation Engine
// Advanced translation system with multiple language support, caching, and context-aware translation

class MultiLanguageTranslator {
    constructor() {
        this.supportedLanguages = new Map([
            // Major languages
            ['zh', { name: 'Chinese', native: '中文', flag: '🇨🇳', rtl: false }],
            ['en', { name: 'English', native: 'English', flag: '🇺🇸', rtl: false }],
            ['es', { name: 'Spanish', native: 'Español', flag: '🇪🇸', rtl: false }],
            ['fr', { name: 'French', native: 'Français', flag: '🇫🇷', rtl: false }],
            ['de', { name: 'German', native: 'Deutsch', flag: '🇩🇪', rtl: false }],
            ['ja', { name: 'Japanese', native: '日本語', flag: '🇯🇵', rtl: false }],
            ['ko', { name: 'Korean', native: '한국어', flag: '🇰🇷', rtl: false }],
            ['pt', { name: 'Portuguese', native: 'Português', flag: '🇵🇹', rtl: false }],
            ['ru', { name: 'Russian', native: 'Русский', flag: '🇷🇺', rtl: false }],
            ['it', { name: 'Italian', native: 'Italiano', flag: '🇮🇹', rtl: false }],
            ['nl', { name: 'Dutch', native: 'Nederlands', flag: '🇳🇱', rtl: false }],
            ['ar', { name: 'Arabic', native: 'العربية', flag: '🇸🇦', rtl: true }],
            ['hi', { name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', rtl: false }],
            ['th', { name: 'Thai', native: 'ไทย', flag: '🇹🇭', rtl: false }],
            ['vi', { name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳', rtl: false }],
        ]);

        this.translationCache = new Map();
        this.userPreferences = null;
        this.fallbackLanguages = ['en', 'zh'];
        this.translationProviders = ['google', 'deepl', 'microsoft'];
        this.currentProvider = 'google';
        
        this.initializeTranslator();
    }

    async initializeTranslator() {
        try {
            // Load user preferences
            await this.loadUserPreferences();
            
            // Initialize translation cache from storage
            await this.loadTranslationCache();
            
            // Setup periodic cache cleanup
            this.setupCacheCleanup();
            
            console.log('🌐 ILM: Multi-Language Translator initialized successfully');
        } catch (error) {
            console.error('❌ ILM: Multi-Language Translator initialization failed:', error);
        }
    }

    /**
     * Load user translation preferences
     */
    async loadUserPreferences() {
        try {
            const result = await chrome.storage.local.get(['translationPreferences']);
            this.userPreferences = result.translationPreferences || {
                targetLanguage: 'zh',
                sourceLanguage: 'en',
                provider: 'google',
                enableContextualTranslation: true,
                enableBidirectionalTranslation: true,
                cacheTranslations: true,
                showAlternativeTranslations: true,
                translationSpeed: 'balanced' // fast, balanced, accurate
            };
        } catch (error) {
            console.error('❌ ILM: Failed to load translation preferences:', error);
            this.userPreferences = this.getDefaultPreferences();
        }
    }

    /**
     * Get default translation preferences
     */
    getDefaultPreferences() {
        return {
            targetLanguage: 'zh',
            sourceLanguage: 'en',
            provider: 'google',
            enableContextualTranslation: true,
            enableBidirectionalTranslation: true,
            cacheTranslations: true,
            showAlternativeTranslations: true,
            translationSpeed: 'balanced'
        };
    }

    /**
     * Load translation cache from storage
     */
    async loadTranslationCache() {
        try {
            const result = await chrome.storage.local.get(['translationCache']);
            if (result.translationCache) {
                this.translationCache = new Map(result.translationCache);
                console.log(`📊 ILM: Loaded ${this.translationCache.size} cached translations`);
            }
        } catch (error) {
            console.error('❌ ILM: Failed to load translation cache:', error);
        }
    }

    /**
     * Save translation cache to storage
     */
    async saveTranslationCache() {
        try {
            await chrome.storage.local.set({
                translationCache: Array.from(this.translationCache.entries())
            });
        } catch (error) {
            console.error('❌ ILM: Failed to save translation cache:', error);
        }
    }

    /**
     * Main translation method with multiple provider support
     * @param {string} text - Text to translate
     * @param {Object} options - Translation options
     * @returns {Promise<Object>} Translation result
     */
    async translate(text, options = {}) {
        const translationOptions = {
            from: options.from || this.userPreferences.sourceLanguage,
            to: options.to || this.userPreferences.targetLanguage,
            context: options.context || '',
            provider: options.provider || this.userPreferences.provider,
            includeAlternatives: options.includeAlternatives !== false,
            useCache: options.useCache !== false
        };

        try {
            // Generate cache key
            const cacheKey = this.generateCacheKey(text, translationOptions);
            
            // Check cache first
            if (translationOptions.useCache && this.translationCache.has(cacheKey)) {
                const cached = this.translationCache.get(cacheKey);
                if (this.isCacheValid(cached)) {
                    console.log('💾 ILM: Using cached translation');
                    return cached.result;
                }
            }

            // Perform translation
            const result = await this.performTranslation(text, translationOptions);
            
            // Cache the result
            if (translationOptions.useCache && result.success) {
                this.cacheTranslation(cacheKey, result);
            }

            return result;

        } catch (error) {
            console.error('❌ ILM: Translation failed:', error);
            return {
                success: false,
                error: error.message,
                originalText: text,
                translation: text, // Fallback to original text
                alternatives: [],
                confidence: 0
            };
        }
    }

    /**
     * Perform actual translation using selected provider
     * @param {string} text - Text to translate
     * @param {Object} options - Translation options
     * @returns {Promise<Object>} Translation result
     */
    async performTranslation(text, options) {
        const providers = {
            google: () => this.translateWithGoogle(text, options),
            deepl: () => this.translateWithDeepL(text, options),
            microsoft: () => this.translateWithMicrosoft(text, options)
        };

        const primaryProvider = providers[options.provider];
        if (primaryProvider) {
            try {
                return await primaryProvider();
            } catch (error) {
                console.warn(`⚠️ ILM: Primary provider ${options.provider} failed, trying fallback`);
            }
        }

        // Try fallback providers
        for (const providerName of this.translationProviders) {
            if (providerName !== options.provider && providers[providerName]) {
                try {
                    console.log(`🔄 ILM: Trying fallback provider: ${providerName}`);
                    return await providers[providerName]();
                } catch (error) {
                    console.warn(`⚠️ ILM: Fallback provider ${providerName} failed`);
                }
            }
        }

        throw new Error('All translation providers failed');
    }

    /**
     * Google Translate integration
     * @param {string} text - Text to translate
     * @param {Object} options - Translation options
     * @returns {Promise<Object>} Translation result
     */
    async translateWithGoogle(text, options) {
        const url = 'https://translate.googleapis.com/translate_a/single';
        const params = new URLSearchParams({
            client: 'gtx',
            sl: options.from,
            tl: options.to,
            dt: 't',
            dt: 'bd',
            dt: 'at',
            dt: 'ex',
            dt: 'ld',
            dt: 'md',
            dt: 'qca',
            dt: 'rw',
            dt: 'rm',
            dt: 'ss',
            q: text
        });

        try {
            const response = await fetch(`${url}?${params}`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return this.parseGoogleTranslateResponse(data, text, options);

        } catch (error) {
            console.error('❌ ILM: Google Translate API error:', error);
            throw error;
        }
    }

    /**
     * Parse Google Translate API response
     * @param {Array} data - API response data
     * @param {string} originalText - Original text
     * @param {Object} options - Translation options
     * @returns {Object} Parsed translation result
     */
    parseGoogleTranslateResponse(data, originalText, options) {
        const result = {
            success: true,
            originalText: originalText,
            translation: '',
            alternatives: [],
            confidence: 0,
            provider: 'google',
            sourceLanguage: options.from,
            targetLanguage: options.to,
            timestamp: Date.now()
        };

        try {
            // Extract main translation
            if (data[0] && Array.isArray(data[0])) {
                result.translation = data[0].map(segment => segment[0]).join('');
            }

            // Extract confidence score
            if (data[6] && typeof data[6] === 'number') {
                result.confidence = Math.round(data[6] * 100);
            }

            // Extract alternative translations
            if (data[1] && Array.isArray(data[1])) {
                result.alternatives = data[1].map(alternative => ({
                    text: alternative[0],
                    backTranslation: alternative[1] || [],
                    frequency: alternative[2] || 0
                })).slice(0, 5); // Limit to 5 alternatives
            }

            // Extract detected source language
            if (data[2]) {
                result.detectedLanguage = data[2];
            }

            // Extract synonyms
            if (data[11] && Array.isArray(data[11])) {
                result.synonyms = data[11].map(group => ({
                    partOfSpeech: group[0],
                    words: group[1] || []
                }));
            }

            // Extract definitions
            if (data[12] && Array.isArray(data[12])) {
                result.definitions = data[12].map(def => ({
                    partOfSpeech: def[0],
                    definitions: def[1] || []
                }));
            }

            // Extract examples
            if (data[13] && Array.isArray(data[13])) {
                result.examples = data[13].map(example => example[0]).slice(0, 3);
            }

        } catch (parseError) {
            console.error('❌ ILM: Failed to parse Google Translate response:', parseError);
            result.translation = originalText;
            result.confidence = 0;
        }

        return result;
    }

    /**
     * DeepL translation (placeholder for future implementation)
     * @param {string} text - Text to translate
     * @param {Object} options - Translation options
     * @returns {Promise<Object>} Translation result
     */
    async translateWithDeepL(text, options) {
        // DeepL API implementation would go here
        // For now, fallback to Google Translate
        console.log('🔄 ILM: DeepL not implemented, falling back to Google Translate');
        return await this.translateWithGoogle(text, options);
    }

    /**
     * Microsoft Translator (placeholder for future implementation)
     * @param {string} text - Text to translate
     * @param {Object} options - Translation options
     * @returns {Promise<Object>} Translation result
     */
    async translateWithMicrosoft(text, options) {
        // Microsoft Translator API implementation would go here
        // For now, fallback to Google Translate
        console.log('🔄 ILM: Microsoft Translator not implemented, falling back to Google Translate');
        return await this.translateWithGoogle(text, options);
    }

    /**
     * Quick translate method for instant translation
     * @param {string} text - Text to translate
     * @param {string} targetLang - Target language code
     * @returns {Promise<string>} Quick translation result
     */
    async quickTranslate(text, targetLang = null) {
        const options = {
            to: targetLang || this.userPreferences.targetLanguage,
            includeAlternatives: false,
            useCache: true
        };

        try {
            const result = await this.translate(text, options);
            return result.success ? result.translation : text;
        } catch (error) {
            console.error('❌ ILM: Quick translate failed:', error);
            return text;
        }
    }

    /**
     * Batch translate multiple texts
     * @param {Array<string>} texts - Array of texts to translate
     * @param {Object} options - Translation options
     * @returns {Promise<Array>} Array of translation results
     */
    async batchTranslate(texts, options = {}) {
        const results = [];
        const batchSize = 5; // Translate 5 texts at a time to avoid rate limits

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const batchPromises = batch.map(text => this.translate(text, options));
            
            try {
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults.map(result => 
                    result.status === 'fulfilled' ? result.value : {
                        success: false,
                        error: result.reason?.message || 'Translation failed',
                        originalText: '',
                        translation: ''
                    }
                ));
            } catch (error) {
                console.error('❌ ILM: Batch translation failed:', error);
                // Add failed results for this batch
                results.push(...batch.map(text => ({
                    success: false,
                    error: 'Batch translation failed',
                    originalText: text,
                    translation: text
                })));
            }

            // Add delay between batches to respect rate limits
            if (i + batchSize < texts.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    /**
     * Get language auto-detection
     * @param {string} text - Text to detect language for
     * @returns {Promise<Object>} Detection result
     */
    async detectLanguage(text) {
        try {
            const result = await this.translate(text, {
                from: 'auto',
                to: this.userPreferences.targetLanguage,
                includeAlternatives: false
            });

            return {
                success: true,
                detectedLanguage: result.detectedLanguage || result.sourceLanguage,
                confidence: result.confidence || 0,
                languageInfo: this.supportedLanguages.get(result.detectedLanguage)
            };
        } catch (error) {
            console.error('❌ ILM: Language detection failed:', error);
            return {
                success: false,
                error: error.message,
                detectedLanguage: 'unknown',
                confidence: 0
            };
        }
    }

    /**
     * Generate cache key for translation
     * @param {string} text - Text to translate
     * @param {Object} options - Translation options
     * @returns {string} Cache key
     */
    generateCacheKey(text, options) {
        const keyData = {
            text: text.toLowerCase().trim(),
            from: options.from,
            to: options.to,
            provider: options.provider
        };
        return btoa(JSON.stringify(keyData));
    }

    /**
     * Check if cached translation is still valid
     * @param {Object} cached - Cached translation object
     * @returns {boolean} True if cache is valid
     */
    isCacheValid(cached) {
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        return (Date.now() - cached.timestamp) < maxAge;
    }

    /**
     * Cache translation result
     * @param {string} key - Cache key
     * @param {Object} result - Translation result
     */
    cacheTranslation(key, result) {
        this.translationCache.set(key, {
            result: result,
            timestamp: Date.now()
        });

        // Limit cache size
        if (this.translationCache.size > 1000) {
            const oldestKey = this.translationCache.keys().next().value;
            this.translationCache.delete(oldestKey);
        }

        // Save to storage periodically
        if (this.translationCache.size % 10 === 0) {
            this.saveTranslationCache();
        }
    }

    /**
     * Setup periodic cache cleanup
     */
    setupCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            for (const [key, cached] of this.translationCache.entries()) {
                if (now - cached.timestamp > maxAge) {
                    this.translationCache.delete(key);
                }
            }
            
            if (this.translationCache.size > 0) {
                this.saveTranslationCache();
            }
        }, 60 * 60 * 1000); // Run every hour
    }

    /**
     * Update user preferences
     * @param {Object} newPreferences - New preference values
     */
    async updatePreferences(newPreferences) {
        this.userPreferences = { ...this.userPreferences, ...newPreferences };
        
        try {
            await chrome.storage.local.set({
                translationPreferences: this.userPreferences
            });
            console.log('💾 ILM: Translation preferences updated');
        } catch (error) {
            console.error('❌ ILM: Failed to save translation preferences:', error);
        }
    }

    /**
     * Get supported languages list
     * @returns {Array} Array of language objects
     */
    getSupportedLanguages() {
        return Array.from(this.supportedLanguages.entries()).map(([code, info]) => ({
            code,
            ...info
        }));
    }

    /**
     * Get translation statistics
     * @returns {Object} Translation statistics
     */
    getTranslationStats() {
        return {
            cacheSize: this.translationCache.size,
            supportedLanguages: this.supportedLanguages.size,
            currentProvider: this.userPreferences.provider,
            targetLanguage: this.userPreferences.targetLanguage,
            sourceLanguage: this.userPreferences.sourceLanguage
        };
    }

    /**
     * Clear translation cache
     */
    async clearCache() {
        this.translationCache.clear();
        await chrome.storage.local.remove(['translationCache']);
        console.log('🗑️ ILM: Translation cache cleared');
    }

    /**
     * Export translation cache for backup
     * @returns {Object} Exportable cache data
     */
    exportCache() {
        return {
            cache: Array.from(this.translationCache.entries()),
            preferences: this.userPreferences,
            exportDate: new Date().toISOString(),
            version: '2.0.0'
        };
    }

    /**
     * Import translation cache from backup
     * @param {Object} data - Cache data to import
     */
    async importCache(data) {
        try {
            if (data.cache && Array.isArray(data.cache)) {
                this.translationCache = new Map(data.cache);
                await this.saveTranslationCache();
            }
            
            if (data.preferences) {
                await this.updatePreferences(data.preferences);
            }
            
            console.log('📥 ILM: Translation cache imported successfully');
        } catch (error) {
            console.error('❌ ILM: Failed to import translation cache:', error);
        }
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MultiLanguageTranslator = MultiLanguageTranslator;
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmMultiLanguageTranslator) {
    window.ilmMultiLanguageTranslator = new MultiLanguageTranslator();
}