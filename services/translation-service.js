// Immersive Language Master - Translation Service
// Supports multiple translation providers: Google Translate, AI models, and English definitions

// Prevent duplicate class definition
if (typeof TranslationService === 'undefined') {

// Define provider classes first (they will be defined later in the file)
let GoogleTranslateProvider, DeepLProvider, ClaudeProvider, ChatGPTProvider, XAIProvider, GeminiProvider;

class TranslationService {
    constructor() {
        // Initialize providers only if they exist
        this.providers = {};
        
        this.defaultProvider = 'google';
        this.settings = {};
        this.cache = new Map();
        this.maxCacheSize = 1000;
        
        this.loadSettings();
        
        // Initialize providers after class definitions (will be done later)
        this.initializeProviders();
    }

    async loadSettings() {
        try {
            // Check if chrome.storage API is available
            if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                console.warn('⚠️ ILM: Chrome storage API not available, using default settings');
                this.settings = {
                    provider: 'google',
                    targetLanguage: 'zh-CN',
                    apiKeys: {
                        google: '',
                        deepl: '',
                        claude: '',
                        openai: '',
                        xai: '',
                        gemini: ''
                    },
                    enabled: true,
                    showOnHover: true
                };
                return;
            }

            const result = await chrome.storage.local.get([
                'translationProvider',
                'translationLanguage',
                'googleTranslateApiKey',
                'deeplApiKey',
                'claudeApiKey',
                'openaiApiKey',
                'xaiApiKey',
                'geminiApiKey',
                'translationEnabled',
                'showTranslationOnHover'
            ]);

            this.settings = {
                provider: result.translationProvider || 'google',
                targetLanguage: result.translationLanguage || 'zh-CN',
                apiKeys: {
                    google: result.googleTranslateApiKey || '',
                    deepl: result.deeplApiKey || '',
                    claude: result.claudeApiKey || '',
                    openai: result.openaiApiKey || '',
                    xai: result.xaiApiKey || '',
                    gemini: result.geminiApiKey || ''
                },
                enabled: result.translationEnabled !== false,
                showOnHover: result.showTranslationOnHover !== false
            };

            console.log('🌐 Translation settings loaded:', this.settings);
        } catch (error) {
            console.error('🌐 Failed to load translation settings:', error);
            // Use default settings on error
            this.settings = {
                provider: 'google',
                targetLanguage: 'zh-CN',
                apiKeys: {
                    google: '',
                    deepl: '',
                    claude: '',
                    openai: '',
                    xai: '',
                    gemini: ''
                },
                enabled: true,
                showOnHover: true
            };
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.local.set({
                translationProvider: this.settings.provider,
                translationLanguage: this.settings.targetLanguage,
                googleTranslateApiKey: this.settings.apiKeys.google,
                deeplApiKey: this.settings.apiKeys.deepl,
                claudeApiKey: this.settings.apiKeys.claude,
                openaiApiKey: this.settings.apiKeys.openai,
                xaiApiKey: this.settings.apiKeys.xai,
                geminiApiKey: this.settings.apiKeys.gemini,
                translationEnabled: this.settings.enabled,
                showTranslationOnHover: this.settings.showOnHover
            });
        } catch (error) {
            console.error('🌐 Failed to save translation settings:', error);
        }
    }

    updateSettings(newSettings) {
        this.settings = {
            ...this.settings,
            ...newSettings
        };
        console.log('🌐 Translation service settings updated:', this.settings);
    }

    initializeProviders() {
        // Initialize providers only after they are defined
        if (typeof GoogleTranslateProvider !== 'undefined') {
            this.providers.google = new GoogleTranslateProvider();
        }
        if (typeof DeepLProvider !== 'undefined') {
            this.providers.deepl = new DeepLProvider();
        }
        if (typeof ClaudeProvider !== 'undefined') {
            this.providers.claude = new ClaudeProvider();
        }
        if (typeof ChatGPTProvider !== 'undefined') {
            this.providers.chatgpt = new ChatGPTProvider();
        }
        if (typeof XAIProvider !== 'undefined') {
            this.providers.xai = new XAIProvider();
        }
        if (typeof GeminiProvider !== 'undefined') {
            this.providers.gemini = new GeminiProvider();
        }
    }

    async translate(text, options = {}) {
        if (!this.settings.enabled || !text?.trim()) {
            return null;
        }

        const cacheKey = `${this.settings.provider}_${text}_${this.settings.targetLanguage}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Use multi-language translator if available
        if (window.ilmMultiLanguageTranslator) {
            try {
                const result = await window.ilmMultiLanguageTranslator.translate(text, {
                    to: options.targetLanguage || this.settings.targetLanguage,
                    from: options.from || 'auto',
                    context: options.context || '',
                    provider: options.provider || this.settings.provider,
                    includeAlternatives: options.includeAlternatives !== false
                });
                
                // Cache the result using our local cache
                if (result.success) {
                    const legacyResult = {
                        text: result.translation,
                        provider: result.provider,
                        detectedLanguage: result.detectedLanguage || result.sourceLanguage,
                        alternatives: result.alternatives,
                        confidence: result.confidence
                    };
                    this.cache.set(cacheKey, legacyResult);
                    return legacyResult;
                }
            } catch (error) {
                console.warn('🌐 Multi-language translator failed, falling back to legacy providers:', error);
            }
        }

        // Fallback to legacy provider system
        const provider = options.provider || this.settings.provider;
        const targetLang = options.targetLanguage || this.settings.targetLanguage;

        try {
            const translationProvider = this.providers[provider];
            if (!translationProvider) {
                throw new Error(`Unknown provider: ${provider}`);
            }

            const result = await translationProvider.translate(text, {
                targetLanguage: targetLang,
                apiKey: this.settings.apiKeys[provider],
                ...options
            });

            // Cache the result
            this.cache.set(cacheKey, result);
            
            // Limit cache size
            if (this.cache.size > this.maxCacheSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            return result;
        } catch (error) {
            console.error(`🌐 Translation failed with ${provider}:`, error);
            
            // Try fallback provider if main provider fails
            if (provider !== 'google' && this.providers.google) {
                try {
                    return await this.providers.google.translate(text, {
                        targetLanguage: targetLang,
                        apiKey: this.settings.apiKeys.google
                    });
                } catch (fallbackError) {
                    console.error('🌐 Fallback translation also failed:', fallbackError);
                }
            }
            
            return { error: error.message, text: null };
        }
    }

    async batchTranslate(texts, options = {}) {
        const results = await Promise.allSettled(
            texts.map(text => this.translate(text, options))
        );

        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                console.error(`🌐 Batch translation failed for text ${index}:`, result.reason);
                return { error: result.reason, text: null };
            }
        });
    }

    clearCache() {
        this.cache.clear();
        console.log('🌐 Translation cache cleared');
    }

    isProviderAvailable(provider) {
        return this.providers[provider] && this.settings.apiKeys[provider];
    }

    getAvailableProviders() {
        return Object.keys(this.providers).filter(provider => 
            this.isProviderAvailable(provider) || provider === 'google'
        );
    }

    /**
     * Enhanced word lookup with multiple definitions and context
     * @param {string} word - Word to look up
     * @param {Object} options - Lookup options
     * @returns {Promise<Object>} Enhanced word information
     */
    async getEnhancedWordInfo(word, options = {}) {
        try {
            // Check cache first
            const cacheKey = `enhanced_${word.toLowerCase()}`;
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
                return cached;
            }

            // Get basic translation first
            const basicTranslation = await this.translate(word, options);
            
            // Enhanced information structure with comprehensive data
            const enhancedInfo = {
                word: word.toLowerCase(),
                originalCase: word,
                pronunciation: await this.getWordPronunciation(word),
                partOfSpeech: await this.getPartOfSpeech(word),
                definitions: await this.getMultipleDefinitions(word),
                examples: await this.getExampleSentences(word),
                etymology: await this.getWordEtymology(word),
                frequency: this.getWordFrequency(word),
                difficulty: this.getWordDifficulty(word),
                synonyms: await this.getWordSynonyms(word),
                antonyms: await this.getWordAntonyms(word),
                collocations: await this.getWordCollocations(word),
                translation: basicTranslation?.text || '',
                forms: await this.getWordForms(word),
                level: this.getVocabularyLevel(word),
                timestamp: Date.now()
            };

            // Cache the enhanced information
            this.cache.set(cacheKey, enhancedInfo);
            
            return enhancedInfo;
        } catch (error) {
            console.error('❌ ILM: Enhanced word lookup failed:', error);
            return this.getFallbackWordInfo(word);
        }
    }

    /**
     * Get word pronunciation with phonetic symbols
     * @param {string} word - Word to get pronunciation for
     * @returns {Promise<Object>} Pronunciation data
     */
    async getWordPronunciation(word) {
        try {
            // Enhanced pronunciation system with multiple sources
            const pronunciationData = {
                ipa: await this.getIPAPronunciation(word),
                audio: await this.getAudioSources(word),
                syllables: this.getSyllables(word),
                stress: this.getStressPattern(word),
                phonemes: this.getPhonemes(word),
                rhyme: this.getRhymeInfo(word),
                americanIpa: await this.getAmericanIPA(word),
                britishIpa: await this.getBritishIPA(word)
            };
            
            return pronunciationData;
        } catch (error) {
            console.error('❌ ILM: Pronunciation lookup failed:', error);
            return { ipa: '', audio: '', syllables: [], stress: [], phonemes: [], rhyme: {} };
        }
    }

    /**
     * Get IPA pronunciation notation
     * @param {string} word - Word to get IPA for
     * @returns {Promise<string>} IPA notation
     */
    async getIPAPronunciation(word) {
        // Comprehensive phonetic mapping with IPA transcription
        const pronunciationMap = {
            // Language learning related terms
            'portfolio': '/pɔːrtˈfoʊlioʊ/',
            'immersive': '/ɪˈmɜːrsɪv/',
            'learning': '/ˈlɜːrnɪŋ/',
            'master': '/ˈmæstər/',
            'language': '/ˈlæŋɡwɪdʒ/',
            'vocabulary': '/voʊˈkæbjəˌleri/',
            'pronunciation': '/prəˌnʌnsiˈeɪʃən/',
            'phonetic': '/fəˈnetɪk/',
            'syllable': '/ˈsɪləbəl/',
            'accent': '/ˈæksent/',
            'fluent': '/ˈfluənt/',
            'grammar': '/ˈɡræmər/',
            
            // Common words with clear IPA
            'the': '/ðə/',
            'and': '/ænd/',
            'for': '/fɔːr/',
            'are': '/ɑːr/',
            'but': '/bʌt/',
            'not': '/nɑːt/',
            'you': '/juː/',
            'all': '/ɔːl/',
            'can': '/kæn/',
            'had': '/hæd/',
            'her': '/hər/',
            'was': '/wʌz/',
            'one': '/wʌn/',
            'our': '/ɑːr/',
            'out': '/aʊt/',
            'day': '/deɪ/',
            'get': '/ɡet/',
            'has': '/hæz/',
            'him': '/hɪm/',
            'his': '/hɪz/',
            'how': '/haʊ/',
            'man': '/mæn/',
            'new': '/nuː/',
            'now': '/naʊ/',
            'old': '/oʊld/',
            'see': '/siː/',
            'two': '/tuː/',
            'way': '/weɪ/',
            'who': '/huː/',
            'boy': '/bɔɪ/',
            'did': '/dɪd/',
            'its': '/ɪts/',
            'let': '/let/',
            'put': '/pʊt/',
            'say': '/seɪ/',
            'she': '/ʃiː/',
            'too': '/tuː/',
            'use': '/juːz/',
            'hello': '/həˈloʊ/',
            'world': '/wɜːrld/',
            'time': '/taɪm/',
            'work': '/wɜːrk/',
            'life': '/laɪf/',
            'love': '/lʌv/',
            'good': '/ɡʊd/',
            'make': '/meɪk/',
            'know': '/noʊ/',
            'take': '/teɪk/',
            'come': '/kʌm/',
            'give': '/ɡɪv/',
            'look': '/lʊk/',
            'think': '/θɪŋk/',
            'want': '/wɑːnt/',
            'first': '/fɜːrst/',
            'last': '/læst/',
            'long': '/lɔːŋ/',
            'great': '/ɡreɪt/',
            'little': '/ˈlɪtəl/',
            'right': '/raɪt/',
            'high': '/haɪ/',
            'different': '/ˈdɪfərənt/',
            'small': '/smɔːl/',
            'large': '/lɑːrdʒ/',
            'next': '/nekst/',
            'early': '/ˈɜːrli/',
            'young': '/jʌŋ/',
            'important': '/ɪmˈpɔːrtənt/',
            'few': '/fjuː/',
            'public': '/ˈpʌblɪk/',
            'bad': '/bæd/',
            'same': '/seɪm/',
            'able': '/ˈeɪbəl/',
            
            // Technology and modern terms
            'computer': '/kəmˈpjuːtər/',
            'internet': '/ˈɪntərˌnet/',
            'website': '/ˈwebsaɪt/',
            'email': '/ˈiːmeɪl/',
            'digital': '/ˈdɪdʒɪtəl/',
            'online': '/ˌɔːnˈlaɪn/',
            'software': '/ˈsɔːftwer/',
            'application': '/ˌæplɪˈkeɪʃən/',
            'technology': '/tekˈnɑːlədʒi/',
            'mobile': '/ˈmoʊbaɪl/',
            'social': '/ˈsoʊʃəl/',
            'network': '/ˈnetwɜːrk/',
            'system': '/ˈsɪstəm/',
            'program': '/ˈproʊɡræm/',
            'data': '/ˈdeɪtə/',
            'information': '/ˌɪnfərˈmeɪʃən/',
            'service': '/ˈsɜːrvɪs/',
            'platform': '/ˈplætfɔːrm/',
            'development': '/dɪˈveləpmənt/',
            'business': '/ˈbɪznəs/'
        };

        const lowerWord = word.toLowerCase();
        if (pronunciationMap[lowerWord]) {
            return pronunciationMap[lowerWord];
        }

        // Fallback: Generate approximate IPA using phonetic rules
        return this.generateApproximateIPA(lowerWord);
    }

    /**
     * Get part of speech information
     * @param {string} word - Word to analyze
     * @returns {Promise<Array>} Array of part of speech data
     */
    async getPartOfSpeech(word) {
        try {
            // Basic POS tagging based on word patterns and common words
            const posMap = {
                'portfolio': ['noun'],
                'immersive': ['adjective'],
                'learning': ['noun', 'verb'],
                'master': ['noun', 'verb', 'adjective'],
                'language': ['noun'],
                'vocabulary': ['noun'],
                'pronunciation': ['noun']
            };

            const pos = posMap[word.toLowerCase()] || this.guessPOS(word);
            
            return pos.map(partOfSpeech => ({
                pos: partOfSpeech,
                definitions: this.getPOSDefinitions(word, partOfSpeech)
            }));
        } catch (error) {
            console.error('❌ ILM: POS tagging failed:', error);
            return [{ pos: 'unknown', definitions: [] }];
        }
    }

    /**
     * Guess part of speech based on word patterns
     * @param {string} word - Word to analyze
     * @returns {Array} Possible parts of speech
     */
    guessPOS(word) {
        const pos = [];
        
        // Common noun endings
        if (word.match(/-tion$|-sion$|-ment$|-ness$|-ity$|-ism$/)) {
            pos.push('noun');
        }
        
        // Common verb endings
        if (word.match(/-ing$|-ed$|-er$|-est$/)) {
            pos.push('verb');
        }
        
        // Common adjective endings  
        if (word.match(/-ive$|-ous$|-ful$|-less$|-able$|-ible$/)) {
            pos.push('adjective');
        }
        
        // Common adverb endings
        if (word.match(/-ly$/)) {
            pos.push('adverb');
        }
        
        return pos.length > 0 ? pos : ['noun']; // Default to noun
    }

    /**
     * Get definitions for specific part of speech
     * @param {string} word - Word to define
     * @param {string} pos - Part of speech
     * @returns {Array} Definitions for the specific POS
     */
    getPOSDefinitions(word, pos) {
        const posDefinitions = {
            'portfolio': {
                'noun': ['A case for carrying papers', 'A collection of investments']
            },
            'master': {
                'noun': ['An expert in a subject', 'A person in control'],
                'verb': ['To acquire complete knowledge of', 'To overcome'],
                'adjective': ['Having great skill', 'Principal or main']
            },
            'learning': {
                'noun': ['The acquisition of knowledge'],
                'verb': ['Present participle of learn']
            }
        };

        return posDefinitions[word.toLowerCase()]?.[pos] || [`${pos} form of "${word}"`];
    }

    /**
     * Get multiple definitions for different contexts
     * @param {string} word - Word to define
     * @returns {Promise<Array>} Array of definitions
     */
    async getMultipleDefinitions(word) {
        try {
            // Enhanced definition structure
            const definitions = [
                {
                    definition: await this.getPrimaryDefinition(word),
                    context: 'general',
                    examples: await this.getExampleSentences(word),
                    level: 'common'
                },
                {
                    definition: await this.getTechnicalDefinition(word),
                    context: 'technical',
                    examples: [],
                    level: 'advanced'
                }
            ].filter(def => def.definition); // Remove empty definitions

            return definitions;
        } catch (error) {
            console.error('❌ ILM: Multiple definitions lookup failed:', error);
            return [{ definition: `Definition of "${word}"`, context: 'general', examples: [], level: 'common' }];
        }
    }

    /**
     * Get primary definition of word
     * @param {string} word - Word to define
     * @returns {Promise<string>} Primary definition
     */
    async getPrimaryDefinition(word) {
        const definitionMap = {
            'portfolio': 'A case for carrying papers, drawings, photographs, maps and other flat documents',
            'immersive': 'Providing, involving, or characterized by deep absorption or immersion in something',
            'learning': 'The acquisition of knowledge or skills through experience, study, or by being taught',
            'master': 'A person who has acquired complete knowledge or skill in a subject, activity, or job',
            'language': 'The method of human communication, either spoken or written',
            'vocabulary': 'The body of words used in a particular language',
            'pronunciation': 'The way in which a word is pronounced'
        };

        return definitionMap[word.toLowerCase()] || `Primary definition of "${word}"`;
    }

    /**
     * Get technical/specialized definition
     * @param {string} word - Word to define
     * @returns {Promise<string>} Technical definition
     */
    async getTechnicalDefinition(word) {
        const technicalMap = {
            'portfolio': 'A collection of investments held by an individual or organization',
            'immersive': 'Technology that attempts to simulate physical presence in environments',
            'learning': 'A process that leads to change in behavior based on experience',
            'master': 'An advanced academic degree or expert level of skill',
            'language': 'A system of symbols and rules for their manipulation used for communication',
            'vocabulary': 'The set of familiar words within a person\'s language',
            'pronunciation': 'The conventional sound representation of words in spoken form'
        };

        return technicalMap[word.toLowerCase()] || '';
    }

    /**
     * Get example sentences for word usage
     * @param {string} word - Word to get examples for
     * @returns {Promise<Array>} Array of example sentences
     */
    async getExampleSentences(word) {
        // Comprehensive example sentences with context and usage levels
        const exampleMap = {
            // Language learning terms
            'portfolio': [
                { sentence: 'She carried her art portfolio to the interview.', context: 'artistic', level: 'basic', source: 'general' },
                { sentence: 'His investment portfolio includes stocks and bonds.', context: 'financial', level: 'intermediate', source: 'business' },
                { sentence: 'The photographer organized her best work in a portfolio.', context: 'professional', level: 'basic', source: 'general' },
                { sentence: 'Building a diverse portfolio is crucial for long-term success.', context: 'advice', level: 'advanced', source: 'academic' }
            ],
            'immersive': [
                { sentence: 'The VR game provides an immersive experience.', context: 'technology', level: 'basic', source: 'media' },
                { sentence: 'Students benefit from immersive language learning.', context: 'educational', level: 'intermediate', source: 'academic' },
                { sentence: 'The museum offers immersive historical exhibits.', context: 'cultural', level: 'intermediate', source: 'general' },
                { sentence: 'Immersive journalism puts readers directly into the story.', context: 'media', level: 'advanced', source: 'journalism' }
            ],
            'learning': [
                { sentence: 'Learning a new language takes time and practice.', context: 'educational', level: 'basic', source: 'general' },
                { sentence: 'Machine learning is transforming technology.', context: 'technology', level: 'intermediate', source: 'technical' },
                { sentence: 'Continuous learning is essential for career growth.', context: 'professional', level: 'intermediate', source: 'business' },
                { sentence: 'Her learning curve was steep but rewarding.', context: 'personal', level: 'advanced', source: 'general' }
            ],
            
            // Technology terms
            'computer': [
                { sentence: 'She turned on her computer to start working.', context: 'daily', level: 'basic', source: 'general' },
                { sentence: 'The computer processed the data in seconds.', context: 'technical', level: 'intermediate', source: 'technical' },
                { sentence: 'Computer science is a rapidly growing field.', context: 'academic', level: 'intermediate', source: 'academic' },
                { sentence: 'Quantum computers could revolutionize encryption.', context: 'advanced', level: 'expert', source: 'scientific' }
            ],
            'technology': [
                { sentence: 'Technology has changed how we communicate.', context: 'social', level: 'basic', source: 'general' },
                { sentence: 'The latest technology makes tasks easier.', context: 'practical', level: 'basic', source: 'general' },
                { sentence: 'Educational technology enhances learning outcomes.', context: 'educational', level: 'intermediate', source: 'academic' },
                { sentence: 'Emerging technologies pose both opportunities and challenges.', context: 'analytical', level: 'advanced', source: 'business' }
            ],
            'development': [
                { sentence: 'The development of new skills requires practice.', context: 'personal', level: 'basic', source: 'general' },
                { sentence: 'Software development is a collaborative process.', context: 'technical', level: 'intermediate', source: 'technical' },
                { sentence: 'Urban development must consider environmental impact.', context: 'policy', level: 'advanced', source: 'academic' },
                { sentence: 'Research and development drive innovation.', context: 'business', level: 'intermediate', source: 'business' }
            ],
            
            // Business terms  
            'business': [
                { sentence: 'She runs her own business from home.', context: 'entrepreneurial', level: 'basic', source: 'general' },
                { sentence: 'The business grew rapidly in the first year.', context: 'growth', level: 'intermediate', source: 'business' },
                { sentence: 'Business ethics are crucial for long-term success.', context: 'professional', level: 'advanced', source: 'business' },
                { sentence: 'Digital transformation is reshaping business models.', context: 'strategic', level: 'expert', source: 'business' }
            ],
            'service': [
                { sentence: 'The customer service was excellent.', context: 'commercial', level: 'basic', source: 'general' },
                { sentence: 'They provide IT services to small businesses.', context: 'technical', level: 'intermediate', source: 'business' },
                { sentence: 'Public service is a noble career choice.', context: 'civic', level: 'intermediate', source: 'general' },
                { sentence: 'Service-oriented architecture improves system flexibility.', context: 'technical', level: 'expert', source: 'technical' }
            ],
            
            // Academic terms
            'information': [
                { sentence: 'Please provide more information about the topic.', context: 'request', level: 'basic', source: 'general' },
                { sentence: 'The information age has transformed society.', context: 'historical', level: 'intermediate', source: 'academic' },
                { sentence: 'Information security is increasingly important.', context: 'technical', level: 'intermediate', source: 'technical' },
                { sentence: 'Asymmetric information can lead to market failures.', context: 'economic', level: 'expert', source: 'academic' }
            ],
            'important': [
                { sentence: 'It\'s important to eat healthy food.', context: 'health', level: 'basic', source: 'general' },
                { sentence: 'This meeting is very important for our project.', context: 'professional', level: 'basic', source: 'business' },
                { sentence: 'The discovery has important implications for medicine.', context: 'scientific', level: 'advanced', source: 'academic' },
                { sentence: 'Important decisions require careful consideration.', context: 'wisdom', level: 'intermediate', source: 'general' }
            ],
            
            // Common verbs with rich context
            'make': [
                { sentence: 'I need to make dinner tonight.', context: 'domestic', level: 'basic', source: 'general' },
                { sentence: 'Companies make profits by selling products.', context: 'business', level: 'intermediate', source: 'business' },
                { sentence: 'Scientists make discoveries through research.', context: 'academic', level: 'intermediate', source: 'academic' },
                { sentence: 'Leaders make difficult decisions under pressure.', context: 'leadership', level: 'advanced', source: 'business' }
            ],
            'take': [
                { sentence: 'Please take your time to answer.', context: 'polite', level: 'basic', source: 'general' },
                { sentence: 'The flight takes three hours.', context: 'travel', level: 'basic', source: 'general' },
                { sentence: 'Students take exams at the end of the semester.', context: 'academic', level: 'intermediate', source: 'academic' },
                { sentence: 'Entrepreneurs take calculated risks.', context: 'business', level: 'advanced', source: 'business' }
            ],
            'work': [
                { sentence: 'I work in an office downtown.', context: 'employment', level: 'basic', source: 'general' },
                { sentence: 'Hard work leads to success.', context: 'motivational', level: 'basic', source: 'general' },
                { sentence: 'The new system doesn\'t work properly.', context: 'technical', level: 'intermediate', source: 'technical' },
                { sentence: 'Collaborative work produces better results.', context: 'teamwork', level: 'advanced', source: 'business' }
            ],
            
            // Advanced vocabulary
            'comprehensive': [
                { sentence: 'The report provides comprehensive analysis.', context: 'analytical', level: 'advanced', source: 'academic' },
                { sentence: 'We need comprehensive healthcare reform.', context: 'policy', level: 'advanced', source: 'political' },
                { sentence: 'The comprehensive exam covers all topics.', context: 'academic', level: 'intermediate', source: 'academic' },
                { sentence: 'Comprehensive planning prevents future problems.', context: 'strategic', level: 'advanced', source: 'business' }
            ],
            'significant': [
                { sentence: 'There was a significant improvement in sales.', context: 'business', level: 'intermediate', source: 'business' },
                { sentence: 'The research findings are statistically significant.', context: 'scientific', level: 'advanced', source: 'academic' },
                { sentence: 'This represents a significant step forward.', context: 'progress', level: 'intermediate', source: 'general' },
                { sentence: 'Significant changes require careful implementation.', context: 'management', level: 'advanced', source: 'business' }
            ]
        };

        const examples = exampleMap[word.toLowerCase()];
        if (examples) {
            return examples;
        }

        // Fallback: Generate contextual examples based on word patterns
        return this.generateContextualExamples(word);
    }

    /**
     * Get word etymology information with comprehensive analysis
     * @param {string} word - Word to get etymology for
     * @returns {Promise<Object>} Etymology data with root analysis
     */
    async getWordEtymology(word) {
        const comprehensiveEtymologyMap = {
            // Language learning vocabulary
            'portfolio': {
                origin: 'Italian',
                rootWords: [
                    { root: 'port-', meaning: 'to carry', language: 'Latin', examples: ['transport', 'export', 'import'] },
                    { root: 'foglio', meaning: 'sheet of paper', language: 'Italian', examples: ['folio', 'foliate'] }
                ],
                evolution: [
                    { period: '1720s', meaning: 'case for carrying loose papers', context: 'Italian government documents' },
                    { period: '1950s', meaning: 'collection of creative work', context: 'artistic portfolios' },
                    { period: '1960s', meaning: 'investment collection', context: 'financial terminology' }
                ],
                cognates: ['portable', 'porter', 'support', 'report'],
                meaning: 'Originally meaning "a case for carrying loose papers"',
                firstUse: '1722',
                modernUsage: 'Evolved to mean any curated collection of work or investments'
            },
            'immersive': {
                origin: 'Latin',
                rootWords: [
                    { root: 'in-', meaning: 'into, in', language: 'Latin', examples: ['inside', 'include', 'involve'] },
                    { root: 'merg-', meaning: 'to dip, plunge', language: 'Latin', examples: ['merge', 'submerge', 'emerge'] },
                    { root: '-ive', meaning: 'having the quality of', language: 'Latin', examples: ['active', 'creative', 'native'] }
                ],
                evolution: [
                    { period: '1600s', meaning: 'act of immersing (baptism)', context: 'religious ceremonies' },
                    { period: '1960s', meaning: 'fully engaging experience', context: 'educational methods' },
                    { period: '1990s', meaning: 'virtual reality experience', context: 'technology advancement' }
                ],
                cognates: ['immerse', 'submerge', 'emerge', 'merger'],
                meaning: 'From Latin "immergere" meaning to plunge into',
                firstUse: '1965',
                modernUsage: 'Now primarily used in technology and education contexts'
            },
            'comprehensive': {
                origin: 'Latin',
                rootWords: [
                    { root: 'com-', meaning: 'together, with', language: 'Latin', examples: ['combine', 'complete', 'compose'] },
                    { root: 'prehend-', meaning: 'to grasp, seize', language: 'Latin', examples: ['comprehend', 'apprehend', 'prehensile'] },
                    { root: '-ive', meaning: 'having the quality of', language: 'Latin', examples: ['extensive', 'intensive', 'expensive'] }
                ],
                evolution: [
                    { period: '1600s', meaning: 'able to comprehend', context: 'intellectual capacity' },
                    { period: '1700s', meaning: 'including much', context: 'academic writing' },
                    { period: '1900s', meaning: 'thorough and complete', context: 'modern usage' }
                ],
                cognates: ['comprehend', 'apprehensive', 'prehensile'],
                meaning: 'From Latin meaning "to grasp together completely"',
                firstUse: '1614',
                modernUsage: 'Emphasizes thoroughness and completeness in coverage'
            },
            'technology': {
                origin: 'Greek',
                rootWords: [
                    { root: 'techno-', meaning: 'art, craft, skill', language: 'Greek', examples: ['technique', 'technical', 'technician'] },
                    { root: '-logy', meaning: 'study of, science of', language: 'Greek', examples: ['biology', 'psychology', 'geology'] }
                ],
                evolution: [
                    { period: '1610s', meaning: 'systematic treatment of an art', context: 'academic discourse' },
                    { period: '1800s', meaning: 'practical application of science', context: 'industrial revolution' },
                    { period: '1960s', meaning: 'electronic and computer systems', context: 'digital age' }
                ],
                cognates: ['technique', 'architect', 'polytechnic'],
                meaning: 'Greek "tekhnologia" meaning systematic treatment of an art or craft',
                firstUse: '1615',
                modernUsage: 'Primarily refers to advanced electronic and digital systems'
            },
            'analysis': {
                origin: 'Greek',
                rootWords: [
                    { root: 'ana-', meaning: 'up, back, again', language: 'Greek', examples: ['anatomy', 'analogy', 'anagram'] },
                    { root: 'lysis', meaning: 'loosening, dissolving', language: 'Greek', examples: ['paralysis', 'dialysis', 'catalyst'] }
                ],
                evolution: [
                    { period: '1580s', meaning: 'resolution of anything complex', context: 'mathematical context' },
                    { period: '1600s', meaning: 'psychoanalysis method', context: 'psychology development' },
                    { period: '1900s', meaning: 'systematic examination', context: 'scientific methodology' }
                ],
                cognates: ['analyze', 'analyst', 'analytical'],
                meaning: 'Greek "analusis" meaning a breaking up or loosening',
                firstUse: '1581',
                modernUsage: 'Systematic detailed examination in various fields'
            },
            'education': {
                origin: 'Latin',
                rootWords: [
                    { root: 'e-', meaning: 'out, from', language: 'Latin', examples: ['exit', 'export', 'extract'] },
                    { root: 'duc-', meaning: 'to lead', language: 'Latin', examples: ['conduct', 'produce', 'reduce'] },
                    { root: '-tion', meaning: 'action, process', language: 'Latin', examples: ['creation', 'nation', 'station'] }
                ],
                evolution: [
                    { period: '1530s', meaning: 'bringing up of children', context: 'child rearing' },
                    { period: '1600s', meaning: 'systematic instruction', context: 'formal schooling' },
                    { period: '1800s', meaning: 'public education system', context: 'mass education movement' }
                ],
                cognates: ['educate', 'educator', 'deduce'],
                meaning: 'Latin "educationem" meaning a bringing up, rearing',
                firstUse: '1531',
                modernUsage: 'Formal process of teaching and learning in institutions'
            },
            'information': {
                origin: 'Latin',
                rootWords: [
                    { root: 'in-', meaning: 'into', language: 'Latin', examples: ['input', 'inside', 'inspire'] },
                    { root: 'form-', meaning: 'shape, form', language: 'Latin', examples: ['format', 'conform', 'transform'] },
                    { root: '-tion', meaning: 'action, state', language: 'Latin', examples: ['formation', 'transformation', 'reformation'] }
                ],
                evolution: [
                    { period: '1387', meaning: 'act of informing', context: 'legal proceedings' },
                    { period: '1450s', meaning: 'knowledge communicated', context: 'educational context' },
                    { period: '1940s', meaning: 'processed data', context: 'computer science emergence' }
                ],
                cognates: ['inform', 'format', 'formation'],
                meaning: 'Latin "informationem" meaning outline, concept, idea',
                firstUse: '1387',
                modernUsage: 'Processed data or knowledge in digital contexts'
            },
            'communication': {
                origin: 'Latin',
                rootWords: [
                    { root: 'com-', meaning: 'together, with', language: 'Latin', examples: ['combine', 'community', 'common'] },
                    { root: 'mun-', meaning: 'service, duty', language: 'Latin', examples: ['municipal', 'immune', 'remunerate'] },
                    { root: '-tion', meaning: 'action, process', language: 'Latin', examples: ['action', 'creation', 'relation'] }
                ],
                evolution: [
                    { period: '1380s', meaning: 'act of sharing', context: 'religious communion' },
                    { period: '1600s', meaning: 'means of communicating', context: 'transportation routes' },
                    { period: '1920s', meaning: 'electronic transmission', context: 'radio and telephone' }
                ],
                cognates: ['communicate', 'commune', 'community'],
                meaning: 'Latin "communicationem" meaning sharing, imparting',
                firstUse: '1383',
                modernUsage: 'Exchange of information through various media and technologies'
            },
            'development': {
                origin: 'French',
                rootWords: [
                    { root: 'de-', meaning: 'un-, reverse', language: 'Latin', examples: ['decode', 'defrost', 'decompose'] },
                    { root: 'velop-', meaning: 'wrap, envelope', language: 'French', examples: ['envelope', 'develop'] },
                    { root: '-ment', meaning: 'result, process', language: 'Latin', examples: ['movement', 'treatment', 'agreement'] }
                ],
                evolution: [
                    { period: '1750s', meaning: 'gradual unfolding', context: 'biological growth' },
                    { period: '1850s', meaning: 'economic progress', context: 'industrial development' },
                    { period: '1940s', meaning: 'software creation', context: 'computer programming' }
                ],
                cognates: ['develop', 'envelope', 'involve'],
                meaning: 'French "développer" meaning to unwrap, unfold',
                firstUse: '1756',
                modernUsage: 'Process of growth, progress, or creation in various contexts'
            },
            'performance': {
                origin: 'Old French',
                rootWords: [
                    { root: 'per-', meaning: 'through, completely', language: 'Latin', examples: ['perfect', 'permanent', 'persist'] },
                    { root: 'form-', meaning: 'shape, fashion', language: 'Latin', examples: ['format', 'uniform', 'transform'] },
                    { root: '-ance', meaning: 'quality, state', language: 'Latin', examples: ['appearance', 'urance', 'resistance'] }
                ],
                evolution: [
                    { period: '1400s', meaning: 'accomplishment of work', context: 'completing tasks' },
                    { period: '1500s', meaning: 'dramatic presentation', context: 'theatrical performance' },
                    { period: '1900s', meaning: 'measurable output', context: 'business and sports metrics' }
                ],
                cognates: ['perform', 'format', 'conform'],
                meaning: 'Old French "parfournir" meaning to carry out, accomplish',
                firstUse: '1450s',
                modernUsage: 'Execution of action or presentation, often measured quantitatively'
            }
        };

        const wordLower = word.toLowerCase();
        const etymologyData = comprehensiveEtymologyMap[wordLower];

        if (etymologyData) {
            return etymologyData;
        }

        // Enhanced fallback with basic root analysis
        return this.generateEtymologyFromRoots(wordLower);
    }

    /**
     * Generate basic etymology from common roots and patterns
     * @param {string} word - Word to analyze
     * @returns {Object} Basic etymology information
     */
    generateEtymologyFromRoots(word) {
        const commonPrefixes = {
            'un-': { meaning: 'not, opposite', language: 'Old English', examples: ['undo', 'unfair', 'unhappy'] },
            're-': { meaning: 'again, back', language: 'Latin', examples: ['return', 'rebuild', 'review'] },
            'pre-': { meaning: 'before', language: 'Latin', examples: ['preview', 'prevent', 'prepare'] },
            'dis-': { meaning: 'not, apart', language: 'Latin', examples: ['disagree', 'discover', 'dislike'] },
            'mis-': { meaning: 'wrong, bad', language: 'Old English', examples: ['mistake', 'mislead', 'misuse'] },
            'over-': { meaning: 'too much, above', language: 'Old English', examples: ['overdo', 'overcome', 'overlap'] },
            'under-': { meaning: 'below, not enough', language: 'Old English', examples: ['understand', 'undergo', 'underestimate'] },
            'out-': { meaning: 'beyond, more than', language: 'Old English', examples: ['outside', 'outstanding', 'outgoing'] },
            'sub-': { meaning: 'under, below', language: 'Latin', examples: ['subway', 'submarine', 'subject'] },
            'super-': { meaning: 'above, over', language: 'Latin', examples: ['superhuman', 'superior', 'supermarket'] },
            'inter-': { meaning: 'between, among', language: 'Latin', examples: ['international', 'interact', 'interview'] },
            'trans-': { meaning: 'across, through', language: 'Latin', examples: ['transport', 'translate', 'transform'] },
            'anti-': { meaning: 'against, opposite', language: 'Greek', examples: ['antiwar', 'antisocial', 'antibiotic'] },
            'auto-': { meaning: 'self', language: 'Greek', examples: ['automatic', 'automobile', 'autobiography'] }
        };

        const commonSuffixes = {
            '-tion': { meaning: 'action, state', language: 'Latin', examples: ['creation', 'information', 'education'] },
            '-sion': { meaning: 'action, state', language: 'Latin', examples: ['decision', 'extension', 'confusion'] },
            '-ment': { meaning: 'result, state', language: 'Latin', examples: ['development', 'movement', 'agreement'] },
            '-ness': { meaning: 'state, quality', language: 'Old English', examples: ['kindness', 'happiness', 'darkness'] },
            '-ity': { meaning: 'state, quality', language: 'Latin', examples: ['activity', 'reality', 'ability'] },
            '-ly': { meaning: 'in a manner', language: 'Old English', examples: ['quickly', 'easily', 'carefully'] },
            '-ing': { meaning: 'action, present', language: 'Old English', examples: ['running', 'thinking', 'learning'] },
            '-ed': { meaning: 'past, completed', language: 'Old English', examples: ['walked', 'talked', 'finished'] },
            '-er': { meaning: 'one who does', language: 'Old English', examples: ['teacher', 'worker', 'player'] },
            '-or': { meaning: 'one who does', language: 'Latin', examples: ['actor', 'doctor', 'professor'] },
            '-ist': { meaning: 'one who practices', language: 'Greek', examples: ['artist', 'scientist', 'pianist'] },
            '-able': { meaning: 'capable of', language: 'Latin', examples: ['readable', 'capable', 'valuable'] },
            '-ible': { meaning: 'capable of', language: 'Latin', examples: ['visible', 'possible', 'terrible'] },
            '-ful': { meaning: 'full of', language: 'Old English', examples: ['helpful', 'beautiful', 'wonderful'] },
            '-less': { meaning: 'without', language: 'Old English', examples: ['helpless', 'careless', 'homeless'] }
        };

        const rootWords = [];
        const evolution = [];
        let origin = 'Unknown';
        let meaning = `Etymology analysis for "${word}"`;
        let firstUse = 'Unknown';
        let cognates = [];

        // Check for prefixes
        for (const [prefix, info] of Object.entries(commonPrefixes)) {
            if (word.startsWith(prefix.replace('-', ''))) {
                rootWords.push({
                    root: prefix,
                    meaning: info.meaning,
                    language: info.language,
                    examples: info.examples
                });
                origin = info.language;
                break;
            }
        }

        // Check for suffixes
        for (const [suffix, info] of Object.entries(commonSuffixes)) {
            if (word.endsWith(suffix.replace('-', ''))) {
                rootWords.push({
                    root: suffix,
                    meaning: info.meaning,
                    language: info.language,
                    examples: info.examples
                });
                if (origin === 'Unknown') {
                    origin = info.language;
                }
                break;
            }
        }

        // Generate basic evolution if roots found
        if (rootWords.length > 0) {
            evolution.push({
                period: 'Modern English',
                meaning: `Word formed with ${rootWords.map(r => r.root).join(' + ')}`,
                context: 'morphological formation'
            });
            
            meaning = `Formed from ${rootWords.map(r => `${r.root} (${r.meaning})`).join(' + ')}`;
        }

        // Generate basic cognates based on patterns
        if (word.endsWith('tion')) {
            const base = word.replace('tion', '');
            cognates = [`${base}`, `${base}al`, `${base}ary`].filter(w => w !== word);
        } else if (word.endsWith('ment')) {
            const base = word.replace('ment', '');
            cognates = [`${base}`, `${base}al`, `${base}ary`].filter(w => w !== word);
        } else if (word.endsWith('ly')) {
            const base = word.replace('ly', '');
            cognates = [`${base}`, `${base}ness`, `${base}er`].filter(w => w !== word);
        }

        return {
            origin,
            rootWords,
            evolution,
            cognates,
            meaning,
            firstUse,
            modernUsage: rootWords.length > 0 ? 
                `Modern usage combines elements meaning ${rootWords.map(r => r.meaning).join(' and ')}` :
                'Etymology not available in database'
        };
    }

    /**
     * Get word frequency ranking
     * @param {string} word - Word to check frequency
     * @returns {number} Frequency ranking
     */
    getWordFrequency(word) {
        // Integration with COCA frequency data
        if (window.ilmTextAnalyzer && window.ilmTextAnalyzer.frequencyMap) {
            return window.ilmTextAnalyzer.frequencyMap.get(word.toLowerCase()) || 9999;
        }
        return 9999;
    }

    /**
     * Get word difficulty level with advanced multi-factor analysis
     * @param {string} word - Word to assess
     * @returns {string} Difficulty level
     */
    getWordDifficulty(word) {
        const difficultyScore = this.calculateAdvancedDifficultyScore(word);
        
        // CEFR-aligned difficulty mapping based on comprehensive analysis
        if (difficultyScore <= 0.2) return 'Basic';
        if (difficultyScore <= 0.35) return 'Elementary';
        if (difficultyScore <= 0.5) return 'Intermediate';
        if (difficultyScore <= 0.65) return 'Upper-Intermediate';
        if (difficultyScore <= 0.8) return 'Advanced';
        return 'Expert';
    }

    /**
     * Calculate advanced difficulty score using multiple linguistic factors
     * @param {string} word - Word to analyze
     * @returns {number} Difficulty score between 0 and 1
     */
    calculateAdvancedDifficultyScore(word) {
        const factors = {
            frequency: this.calculateFrequencyScore(word),
            morphological: this.calculateMorphologicalComplexity(word),
            phonological: this.calculatePhonologicalComplexity(word),
            semantic: this.calculateSemanticComplexity(word),
            orthographic: this.calculateOrthographicComplexity(word)
        };

        // Weighted combination of factors
        const weights = {
            frequency: 0.4,      // Frequency is most important
            morphological: 0.2,   // Word formation complexity
            phonological: 0.15,   // Pronunciation difficulty
            semantic: 0.15,       // Meaning complexity
            orthographic: 0.1     // Spelling difficulty
        };

        let totalScore = 0;
        for (const [factor, score] of Object.entries(factors)) {
            totalScore += score * weights[factor];
        }

        return Math.min(1, Math.max(0, totalScore));
    }

    /**
     * Calculate frequency-based difficulty score
     * @param {string} word - Word to analyze
     * @returns {number} Score between 0 (easy) and 1 (difficult)
     */
    calculateFrequencyScore(word) {
        const frequency = this.getWordFrequency(word);
        
        // Logarithmic scaling for better distribution
        if (frequency <= 100) return 0;           // Top 100 words: very easy
        if (frequency <= 500) return 0.1;        // Top 500: easy
        if (frequency <= 1000) return 0.2;       // Top 1K: basic
        if (frequency <= 2000) return 0.35;      // Top 2K: elementary
        if (frequency <= 3000) return 0.5;       // Top 3K: intermediate
        if (frequency <= 5000) return 0.65;      // Top 5K: upper-intermediate
        if (frequency <= 8000) return 0.8;       // Top 8K: advanced
        return 0.95;                             // Beyond 8K: expert
    }

    /**
     * Calculate morphological complexity based on affixes and word structure
     * @param {string} word - Word to analyze
     * @returns {number} Score between 0 and 1
     */
    calculateMorphologicalComplexity(word) {
        const lowerWord = word.toLowerCase();
        let complexity = 0;

        // Common prefixes with difficulty weights
        const prefixes = {
            'un-': 0.1, 're-': 0.1, 'pre-': 0.2, 'dis-': 0.2, 'in-': 0.15,
            'anti-': 0.3, 'counter-': 0.35, 'inter-': 0.3, 'super-': 0.25,
            'ultra-': 0.4, 'pseudo-': 0.45, 'quasi-': 0.5, 'circum-': 0.55
        };

        // Common suffixes with difficulty weights
        const suffixes = {
            '-ed': 0.05, '-ing': 0.05, '-ly': 0.1, '-tion': 0.2, '-sion': 0.2,
            '-ness': 0.15, '-ment': 0.2, '-ity': 0.25, '-ous': 0.2, '-ious': 0.25,
            '-ological': 0.5, '-ization': 0.45, '-ification': 0.5
        };

        // Check for prefixes
        for (const [prefix, weight] of Object.entries(prefixes)) {
            if (lowerWord.startsWith(prefix.slice(0, -1))) {
                complexity += weight;
            }
        }

        // Check for suffixes
        for (const [suffix, weight] of Object.entries(suffixes)) {
            if (lowerWord.endsWith(suffix.slice(1))) {
                complexity += weight;
            }
        }

        // Additional complexity for compound words
        if (lowerWord.length > 10) complexity += 0.1;
        if (lowerWord.length > 15) complexity += 0.2;

        return Math.min(1, complexity);
    }

    /**
     * Calculate phonological complexity based on pronunciation patterns
     * @param {string} word - Word to analyze
     * @returns {number} Score between 0 and 1
     */
    calculatePhonologicalComplexity(word) {
        const lowerWord = word.toLowerCase();
        let complexity = 0;

        // Consonant clusters increase difficulty
        const consonantClusters = /[bcdfghjklmnpqrstvwxyz]{3,}/gi;
        const clusters = (lowerWord.match(consonantClusters) || []).length;
        complexity += clusters * 0.15;

        // Silent letters and irregular patterns
        const silentPatterns = [
            /ght$/, /mb$/, /kn/, /wr/, /ps/, /sc/, /gn/
        ];
        
        for (const pattern of silentPatterns) {
            if (pattern.test(lowerWord)) {
                complexity += 0.2;
            }
        }

        // Vowel complexity (diphthongs, etc.)
        const complexVowels = /[aeiou]{2,}/g;
        const vowelGroups = (lowerWord.match(complexVowels) || []).length;
        complexity += vowelGroups * 0.1;

        return Math.min(1, complexity);
    }

    /**
     * Calculate semantic complexity based on word abstractness
     * @param {string} word - Word to analyze
     * @returns {number} Score between 0 and 1
     */
    calculateSemanticComplexity(word) {
        const lowerWord = word.toLowerCase();
        
        // Abstract concepts are more difficult
        const abstractIndicators = [
            'concept', 'theory', 'principle', 'philosophy', 'methodology',
            'paradigm', 'phenomenon', 'hypothesis', 'ideology', 'metaphor',
            'consciousness', 'perception', 'abstraction', 'interpretation'
        ];

        // Technical/academic terms
        const technicalSuffixes = [
            'ology', 'ography', 'ometry', 'istics', 'ism', 'ics'
        ];

        let complexity = 0.2; // Base semantic complexity

        // Check for abstract indicators
        for (const indicator of abstractIndicators) {
            if (lowerWord.includes(indicator)) {
                complexity += 0.3;
                break;
            }
        }

        // Check for technical suffixes
        for (const suffix of technicalSuffixes) {
            if (lowerWord.endsWith(suffix)) {
                complexity += 0.2;
                break;
            }
        }

        // Domain-specific complexity
        if (this.isDomainSpecificTerm(lowerWord)) {
            complexity += 0.25;
        }

        return Math.min(1, complexity);
    }

    /**
     * Calculate orthographic complexity based on spelling patterns
     * @param {string} word - Word to analyze
     * @returns {number} Score between 0 and 1
     */
    calculateOrthographicComplexity(word) {
        const lowerWord = word.toLowerCase();
        let complexity = 0;

        // Double letters
        const doubleLetters = /(.)\1/g;
        const doubles = (lowerWord.match(doubleLetters) || []).length;
        complexity += doubles * 0.1;

        // Unusual letter combinations
        const unusualPatterns = [
            /ph/, /gh/, /ch/, /th/, /qu/, /x/, /z/
        ];

        for (const pattern of unusualPatterns) {
            if (pattern.test(lowerWord)) {
                complexity += 0.05;
            }
        }

        // Length-based complexity
        if (lowerWord.length > 8) complexity += 0.1;
        if (lowerWord.length > 12) complexity += 0.2;

        return Math.min(1, complexity);
    }

    /**
     * Check if word is domain-specific (technical/academic)
     * @param {string} word - Word to check
     * @returns {boolean} True if domain-specific
     */
    isDomainSpecificTerm(word) {
        const domains = {
            medical: ['diagnosis', 'syndrome', 'therapy', 'clinical', 'pathology'],
            legal: ['jurisdiction', 'litigation', 'statutory', 'constitutional'],
            scientific: ['hypothesis', 'empirical', 'methodology', 'quantitative'],
            technical: ['algorithm', 'optimization', 'implementation', 'architecture'],
            academic: ['theoretical', 'conceptual', 'analytical', 'comprehensive']
        };

        for (const domainTerms of Object.values(domains)) {
            if (domainTerms.some(term => word.includes(term))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get vocabulary level classification with CEFR and advanced metrics
     * @param {string} word - Word to classify
     * @returns {string} Vocabulary level
     */
    getVocabularyLevel(word) {
        const difficultyScore = this.calculateAdvancedDifficultyScore(word);
        const frequency = this.getWordFrequency(word);
        const cefrLevel = this.getCEFRLevel(word);
        
        // Create comprehensive level description
        const frequencyBand = this.getFrequencyBand(frequency);
        
        return `${cefrLevel} (${frequencyBand})`;
    }

    /**
     * Get CEFR (Common European Framework of Reference) level for word
     * @param {string} word - Word to classify
     * @returns {string} CEFR level (A1, A2, B1, B2, C1, C2)
     */
    getCEFRLevel(word) {
        const difficultyScore = this.calculateAdvancedDifficultyScore(word);
        const frequency = this.getWordFrequency(word);
        
        // CEFR mapping based on frequency and complexity
        // A1: Most basic survival vocabulary
        if (frequency <= 300 && difficultyScore <= 0.15) return 'A1';
        
        // A2: Elementary vocabulary for daily situations
        if (frequency <= 800 && difficultyScore <= 0.25) return 'A2';
        
        // B1: Intermediate vocabulary for familiar topics
        if (frequency <= 2000 && difficultyScore <= 0.4) return 'B1';
        
        // B2: Upper-intermediate for complex topics
        if (frequency <= 4000 && difficultyScore <= 0.6) return 'B2';
        
        // C1: Advanced vocabulary for nuanced communication
        if (frequency <= 8000 && difficultyScore <= 0.8) return 'C1';
        
        // C2: Near-native proficiency vocabulary
        return 'C2';
    }

    /**
     * Get frequency band description
     * @param {number} frequency - Word frequency rank
     * @returns {string} Frequency band description
     */
    getFrequencyBand(frequency) {
        if (frequency <= 100) return 'Essential';
        if (frequency <= 500) return 'Core';
        if (frequency <= 1000) return 'High Frequency';
        if (frequency <= 2000) return 'Medium Frequency';
        if (frequency <= 3000) return 'Low Frequency';
        if (frequency <= 5000) return 'Academic';
        if (frequency <= 8000) return 'Specialized';
        return 'Rare/Technical';
    }

    /**
     * Get detailed difficulty breakdown for educational purposes
     * @param {string} word - Word to analyze
     * @returns {Object} Detailed difficulty analysis
     */
    getDifficultyBreakdown(word) {
        const factors = {
            frequency: this.calculateFrequencyScore(word),
            morphological: this.calculateMorphologicalComplexity(word),
            phonological: this.calculatePhonologicalComplexity(word),
            semantic: this.calculateSemanticComplexity(word),
            orthographic: this.calculateOrthographicComplexity(word)
        };

        const overallScore = this.calculateAdvancedDifficultyScore(word);
        const cefrLevel = this.getCEFRLevel(word);
        const difficulty = this.getWordDifficulty(word);

        return {
            overall: {
                score: overallScore,
                difficulty: difficulty,
                cefrLevel: cefrLevel
            },
            factors: factors,
            recommendations: this.getDifficultyRecommendations(overallScore, factors),
            learningTips: this.getLearningTips(word, factors)
        };
    }

    /**
     * Get learning recommendations based on difficulty analysis
     * @param {number} overallScore - Overall difficulty score
     * @param {Object} factors - Individual difficulty factors
     * @returns {Array} Array of learning recommendations
     */
    getDifficultyRecommendations(overallScore, factors) {
        const recommendations = [];

        if (factors.frequency > 0.6) {
            recommendations.push('📚 Focus on understanding context - this is a less common word');
        }

        if (factors.morphological > 0.3) {
            recommendations.push('🔬 Break down the word parts (prefix, root, suffix) to understand meaning');
        }

        if (factors.phonological > 0.4) {
            recommendations.push('🔊 Practice pronunciation carefully - this word has complex sounds');
        }

        if (factors.semantic > 0.4) {
            recommendations.push('🧠 Study multiple contexts - this word has abstract or specialized meaning');
        }

        if (factors.orthographic > 0.3) {
            recommendations.push('✍️ Practice spelling - this word has unusual letter patterns');
        }

        if (overallScore > 0.7) {
            recommendations.push('⭐ Advanced vocabulary - consider using spaced repetition for retention');
        }

        return recommendations;
    }

    /**
     * Get specific learning tips based on word characteristics
     * @param {string} word - Word to analyze
     * @param {Object} factors - Difficulty factors
     * @returns {Object} Learning tips organized by category
     */
    getLearningTips(word, factors) {
        const tips = {
            pronunciation: [],
            spelling: [],
            usage: [],
            memory: []
        };

        // Pronunciation tips
        if (factors.phonological > 0.3) {
            tips.pronunciation.push('Listen to native speaker pronunciation');
            tips.pronunciation.push('Break word into syllables for practice');
        }

        // Spelling tips
        if (factors.orthographic > 0.3) {
            tips.spelling.push('Write the word multiple times');
            tips.spelling.push('Look for patterns in similar words');
        }

        // Usage tips
        if (factors.semantic > 0.4) {
            tips.usage.push('Read the word in different contexts');
            tips.usage.push('Create your own example sentences');
        }

        // Memory tips
        if (factors.morphological > 0.3) {
            tips.memory.push('Connect to word family (same root/prefix)');
            tips.memory.push('Create visual or story associations');
        }

        return tips;
    }

    /**
     * Get word synonyms
     * @param {string} word - Word to find synonyms for
     * @returns {Promise<Array>} Array of synonyms
     */
    async getWordSynonyms(word) {
        const synonymMap = {
            'portfolio': ['collection', 'folder', 'case', 'dossier'],
            'immersive': ['absorbing', 'engaging', 'captivating', 'enveloping'],
            'learning': ['education', 'instruction', 'study', 'training'],
            'master': ['expert', 'specialist', 'authority', 'professional']
        };

        return synonymMap[word.toLowerCase()] || [];
    }

    /**
     * Get word antonyms
     * @param {string} word - Word to find antonyms for
     * @returns {Promise<Array>} Array of antonyms
     */
    async getWordAntonyms(word) {
        const antonymMap = {
            'master': ['novice', 'beginner', 'amateur', 'student'],
            'immersive': ['superficial', 'shallow', 'detached'],
            'learning': ['ignorance', 'forgetting', 'unlearning']
        };

        return antonymMap[word.toLowerCase()] || [];
    }

    /**
     * Get word collocations (common word combinations)
     * @param {string} word - Word to find collocations for
     * @returns {Promise<Array>} Array of collocations
     */
    async getWordCollocations(word) {
        const collocationMap = {
            'portfolio': ['investment portfolio', 'portfolio management', 'diverse portfolio', 'portfolio review'],
            'immersive': ['immersive experience', 'immersive learning', 'immersive technology', 'immersive environment'],
            'learning': ['machine learning', 'learning process', 'continuous learning', 'online learning'],
            'master': ['master degree', 'master plan', 'master key', 'master class']
        };

        return collocationMap[word.toLowerCase()] || [];
    }

    /**
     * Get different word forms
     * @param {string} word - Base word
     * @returns {Promise<Object>} Different word forms
     */
    async getWordForms(word) {
        const formsMap = {
            'learn': {
                noun: 'learning',
                verb: ['learn', 'learned/learnt', 'learning'],
                adjective: 'learned',
                adverb: ''
            },
            'master': {
                noun: ['master', 'mastery'],
                verb: ['master', 'mastered', 'mastering'],
                adjective: 'masterful',
                adverb: 'masterfully'
            }
        };

        return formsMap[word.toLowerCase()] || {
            noun: word,
            verb: [word],
            adjective: '',
            adverb: ''
        };
    }

    /**
     * Get fallback word information when enhanced lookup fails
     * @param {string} word - Word to create fallback for
     * @returns {Object} Basic word information
     */
    getFallbackWordInfo(word) {
        return {
            word: word.toLowerCase(),
            originalCase: word,
            pronunciation: { ipa: '', audio: '', syllables: [], stress: [] },
            partOfSpeech: [{ pos: 'unknown', definitions: [] }],
            definitions: [{
                definition: `Definition of "${word}"`,
                context: 'general',
                examples: [],
                level: 'common'
            }],
            examples: [],
            etymology: { origin: 'Unknown', rootWords: [], meaning: 'Not available', firstUse: 'Unknown' },
            frequency: 9999,
            difficulty: 'Unknown',
            synonyms: [],
            antonyms: [],
            collocations: [],
            translation: '',
            forms: { noun: word, verb: [word], adjective: '', adverb: '' },
            level: 'Unknown',
            timestamp: Date.now()
        };
    }

    /**
     * Get syllable breakdown
     * @param {string} word - Word to syllabify
     * @returns {Array} Array of syllables
     */
    getSyllables(word) {
        // Basic syllable detection
        const syllables = word.toLowerCase().split(/[aeiouy]+/);
        return syllables.filter(s => s.length > 0);
    }

    /**
     * Get stress pattern
     * @param {string} word - Word to get stress for
     * @returns {Array} Stress pattern
     */
    getStressPattern(word) {
        // Enhanced stress pattern detection with common English patterns
        const syllableCount = this.getSyllables(word).length;
        const pattern = new Array(syllableCount).fill('unstressed');
        
        // Apply common English stress patterns
        if (syllableCount <= 2) {
            // Most 1-2 syllable words have primary stress on first syllable
            if (pattern.length > 0) pattern[0] = 'primary';
        } else if (word.endsWith('tion') || word.endsWith('sion')) {
            // Words ending in -tion/-sion: stress on syllable before ending
            if (pattern.length >= 2) pattern[pattern.length - 2] = 'primary';
        } else if (word.endsWith('ic') || word.endsWith('ical')) {
            // Words ending in -ic/-ical: stress on syllable before ending
            if (pattern.length >= 2) pattern[pattern.length - 2] = 'primary';
        } else {
            // Default: stress on first syllable for other words
            if (pattern.length > 0) pattern[0] = 'primary';
        }
        
        return pattern;
    }

    /**
     * Get multiple audio sources for pronunciation
     * @param {string} word - Word to get audio for
     * @returns {Promise<Object>} Audio sources object
     */
    async getAudioSources(word) {
        const audioSources = {
            primary: `https://ssl.gstatic.com/dictionary/static/sounds/oxford/${word}--_us_1.mp3`,
            cambridge: `https://dictionary.cambridge.org/us/media/english/us_pron/${word.charAt(0)}/${word}.mp3`,
            merriam: `https://media.merriam-webster.com/audio/prons/en/us/mp3/${word.charAt(0)}/${word}.mp3`,
            forvo: `https://apifree.forvo.com/key/YOUR_API_KEY/format/json/action/word-pronunciations/word/${word}/language/en/`,
            speechSynthesis: true // Indicates Web Speech API is available as fallback
        };
        
        return audioSources;
    }

    /**
     * Generate approximate IPA using basic phonetic rules
     * @param {string} word - Word to convert to IPA
     * @returns {string} Approximate IPA notation
     */
    generateApproximateIPA(word) {
        // Basic phonetic conversion rules for English
        let ipa = word;
        
        // Common consonant mappings
        ipa = ipa.replace(/ch/g, 'tʃ');
        ipa = ipa.replace(/sh/g, 'ʃ');
        ipa = ipa.replace(/th/g, 'θ'); // voiceless th
        ipa = ipa.replace(/ng/g, 'ŋ');
        ipa = ipa.replace(/ph/g, 'f');
        ipa = ipa.replace(/gh/g, 'f');
        
        // Common vowel mappings (simplified)
        ipa = ipa.replace(/ee/g, 'iː');
        ipa = ipa.replace(/ea/g, 'iː');
        ipa = ipa.replace(/oo/g, 'uː');
        ipa = ipa.replace(/ou/g, 'aʊ');
        ipa = ipa.replace(/ow/g, 'aʊ');
        ipa = ipa.replace(/oy/g, 'ɔɪ');
        ipa = ipa.replace(/oi/g, 'ɔɪ');
        ipa = ipa.replace(/ai/g, 'eɪ');
        ipa = ipa.replace(/ay/g, 'eɪ');
        ipa = ipa.replace(/ar/g, 'ɑːr');
        ipa = ipa.replace(/er/g, 'ər');
        ipa = ipa.replace(/or/g, 'ɔːr');
        ipa = ipa.replace(/ur/g, 'ɜːr');
        
        // Single vowel approximations
        ipa = ipa.replace(/a(?!.*[eiou])/g, 'æ'); // final 'a'
        ipa = ipa.replace(/e(?!.*[aiou])/g, 'e'); // final 'e' (often silent)
        ipa = ipa.replace(/i(?!.*[aeou])/g, 'ɪ'); // final 'i'
        ipa = ipa.replace(/o(?!.*[aeiou])/g, 'ɒ'); // final 'o'
        ipa = ipa.replace(/u(?!.*[aeio])/g, 'ʌ'); // final 'u'
        
        return `/${ipa}/`;
    }

    /**
     * Get American English IPA pronunciation
     * @param {string} word - Word to get American IPA for
     * @returns {Promise<string>} American IPA notation
     */
    async getAmericanIPA(word) {
        // Use the main IPA method which is American-focused
        return await this.getIPAPronunciation(word);
    }

    /**
     * Get British English IPA pronunciation
     * @param {string} word - Word to get British IPA for
     * @returns {Promise<string>} British IPA notation
     */
    async getBritishIPA(word) {
        const americanIPA = await this.getIPAPronunciation(word);
        
        // Convert American to British IPA (basic conversions)
        let britishIPA = americanIPA;
        
        // Common American to British conversions
        britishIPA = britishIPA.replace(/ɑːr/g, 'ɑː');  // car: /kɑːr/ → /kɑː/
        britishIPA = britishIPA.replace(/ɔːr/g, 'ɔː');  // for: /fɔːr/ → /fɔː/  
        britishIPA = britishIPA.replace(/ɜːr/g, 'ɜː');  // her: /hɜːr/ → /hɜː/
        britishIPA = britishIPA.replace(/ər/g, 'ə');    // butter: /bʌtər/ → /bʌtə/
        britishIPA = britishIPA.replace(/æ/g, 'ɑː');    // bath: /bæθ/ → /bɑːθ/ (some words)
        britishIPA = britishIPA.replace(/ɑːnt/g, 'ænt'); // can't: American /kɑːnt/ → British /kænt/
        
        return britishIPA;
    }

    /**
     * Get phonemes breakdown for word
     * @param {string} word - Word to analyze
     * @returns {Array} Array of phonemes
     */
    getPhonemes(word) {
        // Extract individual phonemes from IPA transcription
        // This is a simplified version - real implementation would use full IPA parsing
        const phonemes = [];
        const basicPhonemes = ['p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'h', 'm', 'n', 'ŋ', 'l', 'r', 'w', 'j', 'tʃ', 'dʒ'];
        const vowels = ['iː', 'ɪ', 'e', 'æ', 'ɑː', 'ɒ', 'ɔː', 'ʊ', 'uː', 'ʌ', 'ɜː', 'ə', 'eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'əʊ', 'ɪə', 'eə', 'ʊə'];
        
        // Basic phoneme extraction (simplified approach)
        for (let i = 0; i < word.length; i++) {
            const char = word[i].toLowerCase();
            if (basicPhonemes.includes(char) || vowels.includes(char)) {
                phonemes.push(char);
            }
        }
        
        return phonemes;
    }

    /**
     * Get rhyme information for word
     * @param {string} word - Word to get rhyme info for
     * @returns {Object} Rhyme information
     */
    getRhymeInfo(word) {
        const lastVowelIndex = word.search(/[aeiou](?=[^aeiou]*$)/i);
        const rhyme = lastVowelIndex >= 0 ? word.substring(lastVowelIndex) : word;
        
        // Common rhyme patterns
        const rhymePatterns = {
            'ight': ['light', 'bright', 'night', 'sight', 'right', 'fight'],
            'ound': ['sound', 'found', 'ground', 'round', 'bound'],
            'tion': ['nation', 'station', 'creation', 'education'],
            'ing': ['sing', 'ring', 'bring', 'thing', 'spring'],
            'ness': ['goodness', 'kindness', 'darkness', 'business']
        };
        
        const pattern = Object.keys(rhymePatterns).find(pattern => 
            word.toLowerCase().endsWith(pattern)
        );
        
        return {
            rhyme: rhyme,
            pattern: pattern || 'unique',
            commonRhymes: pattern ? rhymePatterns[pattern].filter(w => w !== word.toLowerCase()) : []
        };
    }

    /**
     * Generate contextual examples based on word patterns and type
     * @param {string} word - Word to generate examples for
     * @returns {Array} Array of contextual example objects
     */
    generateContextualExamples(word) {
        const lowerWord = word.toLowerCase();
        const examples = [];
        
        // Determine word type and generate appropriate examples
        if (word.endsWith('ing')) {
            // Present participle or gerund
            examples.push(
                { sentence: `${word} is an important activity in daily life.`, context: 'general', level: 'basic', source: 'generated' },
                { sentence: `Many people enjoy ${word} in their free time.`, context: 'leisure', level: 'basic', source: 'generated' },
                { sentence: `${word} requires skill and practice to master.`, context: 'skill', level: 'intermediate', source: 'generated' }
            );
        } else if (word.endsWith('tion') || word.endsWith('sion')) {
            // Abstract nouns
            examples.push(
                { sentence: `The ${word} was completed successfully.`, context: 'achievement', level: 'intermediate', source: 'generated' },
                { sentence: `This ${word} will have lasting impact.`, context: 'consequence', level: 'intermediate', source: 'generated' },
                { sentence: `Careful ${word} leads to better results.`, context: 'process', level: 'advanced', source: 'generated' }
            );
        } else if (word.endsWith('ment')) {
            // Action or result nouns
            examples.push(
                { sentence: `The ${word} was announced yesterday.`, context: 'announcement', level: 'intermediate', source: 'generated' },
                { sentence: `This ${word} represents significant progress.`, context: 'progress', level: 'intermediate', source: 'generated' },
                { sentence: `Effective ${word} requires good planning.`, context: 'management', level: 'advanced', source: 'generated' }
            );
        } else if (word.endsWith('ly')) {
            // Adverbs
            examples.push(
                { sentence: `She completed the task ${word}.`, context: 'manner', level: 'basic', source: 'generated' },
                { sentence: `The project was ${word} managed.`, context: 'evaluation', level: 'intermediate', source: 'generated' },
                { sentence: `He approached the problem ${word}.`, context: 'approach', level: 'intermediate', source: 'generated' }
            );
        } else if (word.endsWith('ed')) {
            // Past participles or adjectives
            examples.push(
                { sentence: `The team ${word} successfully.`, context: 'achievement', level: 'basic', source: 'generated' },
                { sentence: `Results were ${word} by experts.`, context: 'validation', level: 'intermediate', source: 'generated' },
                { sentence: `The process was carefully ${word}.`, context: 'process', level: 'intermediate', source: 'generated' }
            );
        } else if (word.endsWith('er') || word.endsWith('or')) {
            // Agent nouns
            examples.push(
                { sentence: `The ${word} completed the task efficiently.`, context: 'professional', level: 'basic', source: 'generated' },
                { sentence: `As a skilled ${word}, she provides expert service.`, context: 'expertise', level: 'intermediate', source: 'generated' },
                { sentence: `The ${word} demonstrated exceptional ability.`, context: 'performance', level: 'intermediate', source: 'generated' }
            );
        } else {
            // Generic examples for other words
            examples.push(
                { sentence: `The ${word} is important in this context.`, context: 'general', level: 'basic', source: 'generated' },
                { sentence: `Understanding ${word} helps improve communication.`, context: 'educational', level: 'intermediate', source: 'generated' },
                { sentence: `This concept of ${word} applies to many situations.`, context: 'conceptual', level: 'advanced', source: 'generated' }
            );
        }
        
        // Add a quotation-style example for literary effect
        examples.push({
            sentence: `"${word}" is a word that carries significant meaning in English.`,
            context: 'meta',
            level: 'basic',
            source: 'educational'
        });
        
        return examples;
    }
}

// Base provider class
class TranslationProvider {
    constructor(name) {
        this.name = name;
    }

    async translate(text, options) {
        throw new Error('translate method must be implemented');
    }
}

// Google Translate provider (free)
class GoogleTranslateProvider extends TranslationProvider {
    constructor() {
        super('google');
        this.baseUrl = 'https://translate.googleapis.com/translate_a/single';
    }

    async translate(text, options = {}) {
        const { targetLanguage = 'zh-CN' } = options;
        
        try {
            // Use Google Translate's unofficial API (free but limited)
            const url = new URL(this.baseUrl);
            url.searchParams.append('client', 'gtx');
            url.searchParams.append('sl', 'auto');
            url.searchParams.append('tl', targetLanguage);
            url.searchParams.append('dt', 't');
            url.searchParams.append('q', text);

            const response = await fetch(url.toString());
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data && data[0] && data[0][0]) {
                const translatedText = data[0].map(item => item[0]).join('');
                return {
                    text: translatedText,
                    provider: 'google',
                    detectedLanguage: data[2] || 'unknown'
                };
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('🌐 Google Translate error:', error);
            throw error;
        }
    }
}

// DeepL provider
class DeepLProvider extends TranslationProvider {
    constructor() {
        super('deepl');
        this.baseUrl = 'https://api-free.deepl.com/v2/translate';
    }

    async translate(text, options = {}) {
        const { targetLanguage = 'ZH', apiKey } = options;
        
        if (!apiKey) {
            throw new Error('DeepL API key is required');
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `DeepL-Auth-Key ${apiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'text': text,
                    'target_lang': targetLanguage,
                    'source_lang': 'EN'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.translations && data.translations[0]) {
                return {
                    text: data.translations[0].text,
                    provider: 'deepl',
                    detectedLanguage: data.translations[0].detected_source_language
                };
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('🌐 DeepL error:', error);
            throw error;
        }
    }
}

// Claude provider
class ClaudeProvider extends TranslationProvider {
    constructor() {
        super('claude');
        this.baseUrl = 'https://api.anthropic.com/v1/messages';
    }

    async translate(text, options = {}) {
        const { targetLanguage = 'Chinese', apiKey } = options;
        
        if (!apiKey) {
            throw new Error('Claude API key is required');
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1000,
                    messages: [{
                        role: 'user',
                        content: `Translate this English text to ${targetLanguage}. Only return the translation, no explanations: "${text}"`
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.content && data.content[0] && data.content[0].text) {
                return {
                    text: data.content[0].text.trim(),
                    provider: 'claude',
                    detectedLanguage: 'en'
                };
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('🌐 Claude error:', error);
            throw error;
        }
    }
}

// ChatGPT provider
class ChatGPTProvider extends TranslationProvider {
    constructor() {
        super('chatgpt');
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';
    }

    async translate(text, options = {}) {
        const { targetLanguage = 'Chinese', apiKey } = options;
        
        if (!apiKey) {
            throw new Error('OpenAI API key is required');
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{
                        role: 'user',
                        content: `Translate this English text to ${targetLanguage}. Only return the translation, no explanations: "${text}"`
                    }],
                    max_tokens: 1000,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return {
                    text: data.choices[0].message.content.trim(),
                    provider: 'chatgpt',
                    detectedLanguage: 'en'
                };
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('🌐 ChatGPT error:', error);
            throw error;
        }
    }
}

// xAI provider
class XAIProvider extends TranslationProvider {
    constructor() {
        super('xai');
        this.baseUrl = 'https://api.x.ai/v1/chat/completions';
    }

    async translate(text, options = {}) {
        const { targetLanguage = 'Chinese', apiKey } = options;
        
        if (!apiKey) {
            throw new Error('xAI API key is required');
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'grok-beta',
                    messages: [{
                        role: 'user',
                        content: `Translate this English text to ${targetLanguage}. Only return the translation, no explanations: "${text}"`
                    }],
                    max_tokens: 1000,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return {
                    text: data.choices[0].message.content.trim(),
                    provider: 'xai',
                    detectedLanguage: 'en'
                };
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('🌐 xAI error:', error);
            throw error;
        }
    }
}

// Gemini provider
class GeminiProvider extends TranslationProvider {
    constructor() {
        super('gemini');
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    async translate(text, options = {}) {
        const { targetLanguage = 'Chinese', apiKey } = options;
        
        if (!apiKey) {
            throw new Error('Gemini API key is required');
        }

        try {
            const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Translate this English text to ${targetLanguage}. Only return the translation, no explanations: "${text}"`
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return {
                    text: data.candidates[0].content.parts[0].text.trim(),
                    provider: 'gemini',
                    detectedLanguage: 'en'
                };
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('🌐 Gemini error:', error);
            throw error;
        }
    }
}

// Define provider classes
GoogleTranslateProvider = GoogleTranslateProvider || class {};
DeepLProvider = DeepLProvider || class {};
ClaudeProvider = ClaudeProvider || class {};
ChatGPTProvider = ChatGPTProvider || class {};
XAIProvider = XAIProvider || class {};
GeminiProvider = GeminiProvider || class {};

// Export singleton instance
if (typeof window !== 'undefined' && !window.ilmTranslationService) {
    window.ilmTranslationService = new TranslationService();
    // Re-initialize providers now that classes are defined
    window.ilmTranslationService.initializeProviders();
}

} // End of TranslationService class definition check