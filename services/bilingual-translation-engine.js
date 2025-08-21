// Immersive Language Master - Bilingual Translation Engine
// Advanced English-to-English translation system with context-aware definitions and explanations

class BilingualTranslationEngine {
    constructor() {
        this.isEnabled = true;
        this.translationCache = new Map();
        this.contextAnalyzer = null;
        this.definitionProviders = new Map();
        this.simplificationLevels = ['elementary', 'intermediate', 'advanced', 'native'];
        this.currentLevel = 'intermediate';
        
        this.initializeEngine();
    }

    async initializeEngine() {
        try {
            // Load user preferences and level settings
            await this.loadBilingualSettings();
            
            // Initialize definition providers
            this.initializeDefinitionProviders();
            
            // Setup context analyzer
            this.initializeContextAnalyzer();
            
            // Load vocabulary databases
            await this.loadVocabularyDatabases();
            
            // Initialize simplification algorithms
            this.initializeSimplificationEngine();
            
            console.log('🔄 ILM: Bilingual Translation Engine initialized successfully');
        } catch (error) {
            console.error('❌ ILM: Bilingual Translation Engine initialization failed:', error);
        }
    }

    /**
     * Load bilingual translation settings
     */
    async loadBilingualSettings() {
        try {
            const result = await chrome.storage.local.get(['bilingualSettings']);
            this.settings = result.bilingualSettings || this.getDefaultSettings();
        } catch (error) {
            console.error('❌ ILM: Failed to load bilingual settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    /**
     * Get default bilingual translation settings
     */
    getDefaultSettings() {
        return {
            enabled: true,
            defaultLevel: 'intermediate',
            showMultipleLevels: true,
            includeExamples: true,
            includeSynonyms: true,
            includeAntonyms: true,
            includeCollocations: true,
            contextAwareness: true,
            adaptiveLevel: true,
            maxDefinitions: 3,
            preferredSources: ['wordnet', 'oxford', 'cambridge', 'collins'],
            simplificationStrength: 'moderate' // mild, moderate, strong
        };
    }

    /**
     * Initialize multiple definition providers
     */
    initializeDefinitionProviders() {
        // WordNet-style provider
        this.definitionProviders.set('wordnet', {
            name: 'WordNet',
            priority: 1,
            getDefinition: this.getWordNetDefinition.bind(this),
            supports: ['definitions', 'synonyms', 'antonyms', 'hyponyms', 'hypernyms']
        });

        // Cambridge-style provider
        this.definitionProviders.set('cambridge', {
            name: 'Cambridge',
            priority: 2,
            getDefinition: this.getCambridgeStyleDefinition.bind(this),
            supports: ['definitions', 'examples', 'collocations', 'grammar']
        });

        // Oxford-style provider
        this.definitionProviders.set('oxford', {
            name: 'Oxford',
            priority: 3,
            getDefinition: this.getOxfordStyleDefinition.bind(this),
            supports: ['definitions', 'etymology', 'examples', 'pronunciation']
        });

        // Collins-style provider
        this.definitionProviders.set('collins', {
            name: 'Collins',
            priority: 4,
            getDefinition: this.getCollinsStyleDefinition.bind(this),
            supports: ['definitions', 'examples', 'frequency', 'trends']
        });
    }

    /**
     * Initialize context analyzer for better definitions
     */
    initializeContextAnalyzer() {
        this.contextAnalyzer = {
            // Analyze surrounding text for context clues
            analyzeContext: (word, sentence, paragraph = '') => {
                const context = {
                    word: word.toLowerCase(),
                    sentence: sentence,
                    paragraph: paragraph,
                    wordPosition: sentence.toLowerCase().indexOf(word.toLowerCase()),
                    surroundingWords: this.extractSurroundingWords(word, sentence),
                    semanticField: this.identifySemanticField(sentence),
                    grammarRole: this.identifyGrammarRole(word, sentence),
                    difficulty: this.assessContextDifficulty(sentence)
                };
                
                return context;
            },

            // Determine most appropriate definition based on context
            selectBestDefinition: (definitions, context) => {
                return definitions.map(def => ({
                    ...def,
                    contextScore: this.calculateContextScore(def, context)
                })).sort((a, b) => b.contextScore - a.contextScore);
            }
        };
    }

    /**
     * Load vocabulary databases for reference
     */
    async loadVocabularyDatabases() {
        try {
            // Load existing COCA data for frequency analysis
            if (window.vocabData) {
                this.frequencyData = window.vocabData;
            }

            // Load common word patterns
            this.commonPatterns = {
                prefixes: ['un-', 're-', 'pre-', 'dis-', 'mis-', 'over-', 'under-', 'out-'],
                suffixes: ['-ing', '-ed', '-er', '-est', '-ly', '-tion', '-sion', '-ness', '-ment'],
                roots: ['act', 'form', 'port', 'dict', 'fact', 'struct', 'spect', 'tract']
            };

            // Load academic word lists
            this.academicWords = new Set([
                'analyze', 'concept', 'constitute', 'data', 'derive', 'establish',
                'evidence', 'factor', 'function', 'indicate', 'method', 'occur',
                'percent', 'period', 'policy', 'principle', 'research', 'structure'
            ]);

        } catch (error) {
            console.error('❌ ILM: Failed to load vocabulary databases:', error);
        }
    }

    /**
     * Initialize text simplification engine
     */
    initializeSimplificationEngine() {
        this.simplificationEngine = {
            // Simplify complex words to easier alternatives
            simplifyWord: (word, level) => {
                const simplifications = {
                    elementary: {
                        'demonstrate': 'show',
                        'utilize': 'use',
                        'commence': 'start',
                        'terminate': 'end',
                        'facilitate': 'help',
                        'accommodate': 'fit',
                        'acquire': 'get',
                        'implement': 'do'
                    },
                    intermediate: {
                        'exemplify': 'show as example',
                        'substantiate': 'prove',
                        'corroborate': 'confirm',
                        'ameliorate': 'improve',
                        'exacerbate': 'make worse',
                        'elucidate': 'explain'
                    }
                };

                return simplifications[level]?.[word.toLowerCase()] || word;
            },

            // Simplify complex sentences
            simplifySentence: (sentence, level) => {
                const words = sentence.split(' ');
                return words.map(word => {
                    const cleanWord = word.replace(/[^\w]/g, '');
                    const simplified = this.simplificationEngine.simplifyWord(cleanWord, level);
                    return word.replace(cleanWord, simplified);
                }).join(' ');
            }
        };
    }

    /**
     * Main bilingual translation method
     * @param {string} word - Word to translate
     * @param {Object} options - Translation options
     * @returns {Promise<Object>} Bilingual translation result
     */
    async translateBilingually(word, options = {}) {
        try {
            const cacheKey = `${word}-${JSON.stringify(options)}`;
            
            // Check cache first
            if (this.translationCache.has(cacheKey)) {
                return this.translationCache.get(cacheKey);
            }

            // Analyze context if provided
            const context = options.context ? 
                this.contextAnalyzer.analyzeContext(word, options.context, options.paragraph) : 
                null;

            // Get definitions from multiple providers
            const definitions = await this.getMultiSourceDefinitions(word, context);

            // Create bilingual explanations at different levels
            const bilingualExplanations = this.createBilingualExplanations(word, definitions, context);

            // Generate examples and usage patterns
            const examples = await this.generateContextualExamples(word, definitions, context);

            // Create learning aids
            const learningAids = this.createLearningAids(word, definitions);

            const result = {
                word: word,
                timestamp: Date.now(),
                context: context,
                definitions: definitions,
                bilingualExplanations: bilingualExplanations,
                examples: examples,
                learningAids: learningAids,
                metadata: {
                    frequency: this.getWordFrequency(word),
                    difficulty: this.assessWordDifficulty(word),
                    academicLevel: this.academicWords.has(word.toLowerCase()),
                    commonAlternatives: this.findCommonAlternatives(word)
                }
            };

            // Cache the result
            this.translationCache.set(cacheKey, result);

            return result;

        } catch (error) {
            console.error('❌ ILM: Bilingual translation failed:', error);
            throw error;
        }
    }

    /**
     * Get definitions from multiple sources
     * @param {string} word - Word to define
     * @param {Object} context - Context information
     * @returns {Promise<Array>} Array of definitions
     */
    async getMultiSourceDefinitions(word, context) {
        const allDefinitions = [];

        // Get definitions from each enabled provider
        for (const [providerName, provider] of this.definitionProviders.entries()) {
            if (this.settings.preferredSources.includes(providerName)) {
                try {
                    const definitions = await provider.getDefinition(word, context);
                    if (definitions && definitions.length > 0) {
                        allDefinitions.push(...definitions.map(def => ({
                            ...def,
                            source: providerName,
                            priority: provider.priority
                        })));
                    }
                } catch (error) {
                    console.warn(`❌ Provider ${providerName} failed:`, error);
                }
            }
        }

        // Sort by relevance and priority
        const sortedDefinitions = context ? 
            this.contextAnalyzer.selectBestDefinition(allDefinitions, context) :
            allDefinitions.sort((a, b) => a.priority - b.priority);

        // Return top definitions
        return sortedDefinitions.slice(0, this.settings.maxDefinitions);
    }

    /**
     * WordNet-style definition provider
     * @param {string} word - Word to define
     * @param {Object} context - Context information
     * @returns {Promise<Array>} WordNet-style definitions
     */
    async getWordNetDefinition(word, context) {
        // Simulate WordNet-style hierarchical definitions
        const baseDefinitions = await this.getBaseDefinitions(word);
        
        return baseDefinitions.map(def => ({
            definition: def.definition,
            partOfSpeech: def.partOfSpeech,
            synonyms: this.findSynonyms(word, def.partOfSpeech),
            antonyms: this.findAntonyms(word, def.partOfSpeech),
            hypernyms: this.findHypernyms(word), // broader categories
            hyponyms: this.findHyponyms(word), // specific instances
            level: 'advanced',
            confidence: 0.9
        }));
    }

    /**
     * Cambridge-style definition provider
     * @param {string} word - Word to define
     * @param {Object} context - Context information
     * @returns {Promise<Array>} Cambridge-style definitions
     */
    async getCambridgeStyleDefinition(word, context) {
        const baseDefinitions = await this.getBaseDefinitions(word);
        
        return baseDefinitions.map(def => ({
            definition: def.definition,
            partOfSpeech: def.partOfSpeech,
            examples: this.generateLearnerExamples(word, def),
            collocations: this.findCollocations(word),
            grammarInfo: this.getGrammarInfo(word, def.partOfSpeech),
            level: 'intermediate',
            confidence: 0.85
        }));
    }

    /**
     * Oxford-style definition provider
     * @param {string} word - Word to define
     * @param {Object} context - Context information
     * @returns {Promise<Array>} Oxford-style definitions
     */
    async getOxfordStyleDefinition(word, context) {
        const baseDefinitions = await this.getBaseDefinitions(word);
        
        return baseDefinitions.map(def => ({
            definition: def.definition,
            partOfSpeech: def.partOfSpeech,
            etymology: this.getEtymology(word),
            examples: this.generateFormalExamples(word, def),
            pronunciation: this.getPronunciationGuide(word),
            level: 'advanced',
            confidence: 0.95
        }));
    }

    /**
     * Collins-style definition provider
     * @param {string} word - Word to define
     * @param {Object} context - Context information
     * @returns {Promise<Array>} Collins-style definitions
     */
    async getCollinsStyleDefinition(word, context) {
        const baseDefinitions = await this.getBaseDefinitions(word);
        
        return baseDefinitions.map(def => ({
            definition: def.definition,
            partOfSpeech: def.partOfSpeech,
            examples: this.generateContemporaryExamples(word, def),
            frequency: this.getWordFrequency(word),
            trends: this.getUsageTrends(word),
            register: this.getRegisterInfo(word), // formal, informal, etc.
            level: 'intermediate',
            confidence: 0.8
        }));
    }

    /**
     * Create bilingual explanations at different complexity levels
     * @param {string} word - Word to explain
     * @param {Array} definitions - Available definitions
     * @param {Object} context - Context information
     * @returns {Object} Bilingual explanations
     */
    createBilingualExplanations(word, definitions, context) {
        const explanations = {};

        this.simplificationLevels.forEach(level => {
            explanations[level] = definitions.map(def => {
                let explanation = def.definition;

                // Simplify based on level
                if (level === 'elementary') {
                    explanation = this.simplifyToElementary(explanation, word);
                } else if (level === 'intermediate') {
                    explanation = this.simplifyToIntermediate(explanation, word);
                }

                return {
                    definition: explanation,
                    simpleExample: this.createSimpleExample(word, level),
                    keyWords: this.extractKeyWords(explanation),
                    difficulty: level,
                    partOfSpeech: def.partOfSpeech,
                    contextFit: context ? this.calculateContextFit(def, context) : 0.5
                };
            });
        });

        return explanations;
    }

    /**
     * Simplify definition to elementary level
     * @param {string} definition - Original definition
     * @param {string} word - Target word
     * @returns {string} Simplified definition
     */
    simplifyToElementary(definition, word) {
        let simplified = definition;

        // Replace complex words with simpler alternatives
        const complexToSimple = {
            'indicates': 'shows',
            'represents': 'means',
            'constitutes': 'makes up',
            'demonstrates': 'shows',
            'facilitates': 'helps',
            'approximately': 'about',
            'subsequently': 'then',
            'consequently': 'so',
            'therefore': 'so',
            'however': 'but',
            'nevertheless': 'but',
            'furthermore': 'also',
            'moreover': 'also'
        };

        Object.entries(complexToSimple).forEach(([complex, simple]) => {
            simplified = simplified.replace(new RegExp(`\\b${complex}\\b`, 'gi'), simple);
        });

        // Simplify sentence structure
        simplified = simplified.replace(/;\s*/g, '. ');
        simplified = simplified.replace(/,\s*which\s+/gi, '. This ');
        simplified = simplified.replace(/,\s*that\s+/gi, '. It ');

        // Make it more direct
        simplified = simplified.replace(/^(A|An|The)\s+(.+?)\s+(is|are)\s+/, '');
        simplified = `"${word}" means ${simplified}`;

        return simplified;
    }

    /**
     * Simplify definition to intermediate level
     * @param {string} definition - Original definition
     * @param {string} word - Target word
     * @returns {string} Simplified definition
     */
    simplifyToIntermediate(definition, word) {
        let simplified = definition;

        // Replace very academic terms but keep moderate complexity
        const academicToModerate = {
            'exemplifies': 'shows as an example',
            'corroborates': 'supports',
            'substantiates': 'proves',
            'elucidates': 'explains clearly',
            'ameliorates': 'improves',
            'exacerbates': 'makes worse'
        };

        Object.entries(academicToModerate).forEach(([academic, moderate]) => {
            simplified = simplified.replace(new RegExp(`\\b${academic}\\b`, 'gi'), moderate);
        });

        return simplified;
    }

    /**
     * Generate contextual examples based on definitions and context
     * @param {string} word - Target word
     * @param {Array} definitions - Available definitions
     * @param {Object} context - Context information
     * @returns {Promise<Array>} Contextual examples
     */
    async generateContextualExamples(word, definitions, context) {
        const examples = [];

        for (const def of definitions) {
            // Generate examples for each definition
            const defExamples = [
                this.createBasicExample(word, def),
                this.createAdvancedExample(word, def),
                context ? this.createContextualExample(word, def, context) : null
            ].filter(Boolean);

            examples.push({
                definition: def.definition,
                partOfSpeech: def.partOfSpeech,
                examples: defExamples,
                source: def.source
            });
        }

        return examples;
    }

    /**
     * Create learning aids for the word
     * @param {string} word - Target word
     * @param {Array} definitions - Available definitions
     * @returns {Object} Learning aids
     */
    createLearningAids(word, definitions) {
        return {
            // Memory techniques
            mnemonics: this.generateMnemonics(word, definitions),
            
            // Word associations
            associations: this.findWordAssociations(word),
            
            // Common mistakes
            commonMistakes: this.getCommonMistakes(word),
            
            // Usage tips
            usageTips: this.generateUsageTips(word, definitions),
            
            // Related words family
            wordFamily: this.buildWordFamily(word),
            
            // Difficulty progression
            progressionPath: this.createProgressionPath(word)
        };
    }

    /**
     * Generate mnemonics for better memorization
     * @param {string} word - Target word
     * @param {Array} definitions - Available definitions
     * @returns {Array} Mnemonic devices
     */
    generateMnemonics(word, definitions) {
        const mnemonics = [];

        // Sound-based mnemonics
        if (word.length > 4) {
            const soundAlike = this.findSoundAlikeWords(word);
            if (soundAlike.length > 0) {
                mnemonics.push({
                    type: 'sound',
                    technique: `"${word}" sounds like "${soundAlike[0]}" - think of how they might be related`,
                    example: this.createSoundMnemonic(word, soundAlike[0], definitions[0])
                });
            }
        }

        // Visual mnemonics
        if (this.hasVisualPotential(word)) {
            mnemonics.push({
                type: 'visual',
                technique: `Picture this when you think of "${word}":`,
                example: this.createVisualMnemonic(word, definitions[0])
            });
        }

        // Story mnemonics
        mnemonics.push({
            type: 'story',
            technique: 'Remember this mini-story:',
            example: this.createStoryMnemonic(word, definitions[0])
        });

        return mnemonics;
    }

    /**
     * Get base definitions for a word (simulated dictionary lookup)
     * @param {string} word - Word to define
     * @returns {Promise<Array>} Base definitions
     */
    async getBaseDefinitions(word) {
        // This would normally connect to a real dictionary API
        // For now, we'll simulate comprehensive definitions
        
        const commonDefinitions = {
            'understand': [
                {
                    definition: 'to know the meaning of something',
                    partOfSpeech: 'verb',
                    example: 'I understand what you mean.'
                },
                {
                    definition: 'to know why or how something happens',
                    partOfSpeech: 'verb',
                    example: 'I understand how this machine works.'
                }
            ],
            'important': [
                {
                    definition: 'having great worth or significance',
                    partOfSpeech: 'adjective',
                    example: 'This is an important decision.'
                }
            ],
            'develop': [
                {
                    definition: 'to grow or change into something bigger or more advanced',
                    partOfSpeech: 'verb',
                    example: 'The city developed rapidly.'
                },
                {
                    definition: 'to create something new over time',
                    partOfSpeech: 'verb',
                    example: 'They developed a new product.'
                }
            ]
        };

        // If we have predefined definitions, use them
        if (commonDefinitions[word.toLowerCase()]) {
            return commonDefinitions[word.toLowerCase()];
        }

        // Otherwise, generate basic definitions
        return [{
            definition: `a word meaning related to ${word}`,
            partOfSpeech: 'unknown',
            example: `Here is ${word} used in a sentence.`
        }];
    }

    /**
     * Extract surrounding words for context analysis
     * @param {string} word - Target word
     * @param {string} sentence - Containing sentence
     * @returns {Array} Surrounding words
     */
    extractSurroundingWords(word, sentence) {
        const words = sentence.toLowerCase().split(/\s+/);
        const wordIndex = words.findIndex(w => w.includes(word.toLowerCase()));
        
        if (wordIndex === -1) return [];
        
        const start = Math.max(0, wordIndex - 2);
        const end = Math.min(words.length, wordIndex + 3);
        
        return words.slice(start, end).filter(w => !w.includes(word.toLowerCase()));
    }

    /**
     * Identify semantic field of the sentence
     * @param {string} sentence - Sentence to analyze
     * @returns {string} Semantic field
     */
    identifySemanticField(sentence) {
        const fields = {
            science: ['research', 'study', 'analysis', 'data', 'experiment', 'theory'],
            business: ['company', 'market', 'profit', 'customer', 'product', 'service'],
            technology: ['computer', 'software', 'system', 'digital', 'internet', 'application'],
            education: ['learn', 'teach', 'student', 'school', 'knowledge', 'skill'],
            health: ['medicine', 'patient', 'doctor', 'treatment', 'health', 'disease']
        };

        const lowerSentence = sentence.toLowerCase();
        
        for (const [field, keywords] of Object.entries(fields)) {
            if (keywords.some(keyword => lowerSentence.includes(keyword))) {
                return field;
            }
        }
        
        return 'general';
    }

    /**
     * Create simple examples for different levels
     * @param {string} word - Target word
     * @param {string} level - Complexity level
     * @returns {string} Simple example
     */
    createSimpleExample(word, level) {
        const templates = {
            elementary: [
                `The ${word} is very important.`,
                `I can ${word} this easily.`,
                `This ${word} is helpful.`
            ],
            intermediate: [
                `Understanding ${word} requires practice.`,
                `The concept of ${word} is fundamental.`,
                `We should ${word} this carefully.`
            ],
            advanced: [
                `The implications of ${word} extend beyond initial observations.`,
                `This ${word} exemplifies the complexity of the subject.`,
                `The ${word} demonstrates sophisticated understanding.`
            ]
        };

        const levelTemplates = templates[level] || templates.intermediate;
        return levelTemplates[Math.floor(Math.random() * levelTemplates.length)];
    }

    /**
     * Calculate context fit score
     * @param {Object} definition - Definition object
     * @param {Object} context - Context object
     * @returns {number} Context fit score (0-1)
     */
    calculateContextFit(definition, context) {
        let score = 0.5; // base score

        // Check if definition matches semantic field
        if (definition.definition.toLowerCase().includes(context.semanticField)) {
            score += 0.2;
        }

        // Check part of speech consistency
        if (definition.partOfSpeech === context.grammarRole) {
            score += 0.2;
        }

        // Check surrounding word relevance
        const defWords = definition.definition.toLowerCase().split(/\s+/);
        const contextWords = context.surroundingWords;
        const overlap = defWords.filter(word => contextWords.includes(word)).length;
        
        if (overlap > 0) {
            score += Math.min(0.1 * overlap, 0.1);
        }

        return Math.min(score, 1);
    }

    /**
     * Get word frequency from COCA data
     * @param {string} word - Word to check
     * @returns {number} Frequency ranking
     */
    getWordFrequency(word) {
        if (this.frequencyData && this.frequencyData[word.toLowerCase()]) {
            return this.frequencyData[word.toLowerCase()].rank || 5000;
        }
        return 5000; // Default to less common
    }

    /**
     * Assess word difficulty
     * @param {string} word - Word to assess
     * @returns {string} Difficulty level
     */
    assessWordDifficulty(word) {
        const frequency = this.getWordFrequency(word);
        const isAcademic = this.academicWords.has(word.toLowerCase());
        const syllables = this.countSyllables(word);

        if (frequency <= 1000 && !isAcademic && syllables <= 2) {
            return 'elementary';
        } else if (frequency <= 3000 || syllables <= 3) {
            return 'intermediate';
        } else if (isAcademic || frequency > 3000) {
            return 'advanced';
        }

        return 'native';
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
     * Update user's proficiency level based on interactions
     * @param {string} word - Word that was looked up
     * @param {string} selectedLevel - Level user selected
     */
    updateUserLevel(word, selectedLevel) {
        if (!this.settings.adaptiveLevel) return;

        // This would implement adaptive level adjustment
        // based on user interactions and preferences
        console.log(`📊 ILM: User selected ${selectedLevel} for ${word}`);
    }

    /**
     * Get bilingual explanation for specific level
     * @param {string} word - Target word
     * @param {string} level - Desired level
     * @param {Object} context - Context information
     * @returns {Promise<Object>} Level-specific explanation
     */
    async getBilingualExplanation(word, level = this.currentLevel, context = null) {
        const result = await this.translateBilingually(word, { context });
        return result.bilingualExplanations[level] || result.bilingualExplanations.intermediate;
    }

    /**
     * Clear translation cache
     */
    clearCache() {
        this.translationCache.clear();
        console.log('🗑️ ILM: Bilingual translation cache cleared');
    }

    /**
     * Update settings
     * @param {Object} newSettings - New settings
     */
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        try {
            await chrome.storage.local.set({
                bilingualSettings: this.settings
            });
            
            console.log('💾 ILM: Bilingual translation settings updated');
        } catch (error) {
            console.error('❌ ILM: Failed to save bilingual settings:', error);
        }
    }

    /**
     * Find common alternatives for a word
     * @param {string} word - Target word
     * @returns {Array} Alternative words
     */
    findCommonAlternatives(word) {
        const alternatives = {
            'understand': ['know', 'get', 'see', 'grasp'],
            'important': ['key', 'main', 'big', 'major'],
            'develop': ['grow', 'build', 'make', 'create'],
            'analyze': ['study', 'look at', 'examine', 'check'],
            'demonstrate': ['show', 'prove', 'display'],
            'facilitate': ['help', 'make easier', 'support'],
            'utilize': ['use', 'employ', 'apply']
        };

        return alternatives[word.toLowerCase()] || [];
    }

    // Additional helper methods would be implemented here
    // (findSynonyms, findAntonyms, createBasicExample, etc.)
    // These are simplified implementations for the demo

    findSynonyms(word, partOfSpeech) {
        // Simplified synonym finder
        return ['similar word 1', 'similar word 2'];
    }

    findAntonyms(word, partOfSpeech) {
        // Simplified antonym finder  
        return ['opposite word 1', 'opposite word 2'];
    }

    createBasicExample(word, definition) {
        return `Here is ${word} in a basic sentence.`;
    }

    createAdvancedExample(word, definition) {
        return `This demonstrates ${word} in a more complex context.`;
    }

    generateMnemonics(word, definitions) {
        return [{
            type: 'memory',
            technique: `Remember ${word} by thinking of...`,
            example: 'A helpful memory device'
        }];
    }
}

// CSS styles for bilingual translation
const bilingualTranslationStyles = `
<style id="ilm-bilingual-translation-styles">
.ilm-bilingual-popup {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    max-width: 450px;
    min-width: 350px;
}

.ilm-bilingual-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.ilm-word-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #2d3748;
}

.ilm-level-selector {
    display: flex;
    gap: 4px;
    background: #f7fafc;
    border-radius: 6px;
    padding: 2px;
}

.ilm-level-btn {
    padding: 4px 8px;
    font-size: 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    background: transparent;
    color: #4a5568;
}

.ilm-level-btn.active {
    background: #38b2ac;
    color: white;
}

.ilm-bilingual-content {
    padding: 16px 20px;
}

.ilm-explanation-section {
    margin-bottom: 16px;
}

.ilm-explanation-text {
    color: #2d3748;
    line-height: 1.5;
    margin-bottom: 8px;
}

.ilm-simple-example {
    background: #e6fffa;
    padding: 8px 12px;
    border-radius: 6px;
    font-style: italic;
    color: #2c7a7b;
    font-size: 0.875rem;
}

.ilm-key-words {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
}

.ilm-key-word {
    background: #fed7e2;
    color: #97266d;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
}

.ilm-learning-aids {
    border-top: 1px solid #e2e8f0;
    padding-top: 16px;
    margin-top: 16px;
}

.ilm-aid-section {
    margin-bottom: 12px;
}

.ilm-aid-title {
    font-weight: 600;
    color: #2d3748;
    font-size: 0.875rem;
    margin-bottom: 4px;
}

.ilm-aid-content {
    color: #4a5568;
    font-size: 0.875rem;
    line-height: 1.4;
}

.ilm-alternatives {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.ilm-alternative {
    background: #e6fffa;
    color: #319795;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
}

@media (prefers-color-scheme: dark) {
    .ilm-bilingual-popup {
        background: #2d3748;
        border-color: #4a5568;
        color: #e2e8f0;
    }
    
    .ilm-word-title,
    .ilm-explanation-text {
        color: #e2e8f0;
    }
    
    .ilm-level-selector {
        background: #4a5568;
    }
    
    .ilm-simple-example {
        background: #1a365d;
        color: #63b3ed;
    }
}
</style>
`;

// Add styles to document
if (!document.getElementById('ilm-bilingual-translation-styles')) {
    document.head.insertAdjacentHTML('beforeend', bilingualTranslationStyles);
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.BilingualTranslationEngine = BilingualTranslationEngine;
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmBilingualEngine) {
    window.ilmBilingualEngine = new BilingualTranslationEngine();
}