// Immersive Language Master - Quick Lookup Tool System
// Advanced word lookup with multiple data sources and instant results

class QuickLookupTool {
    constructor() {
        this.isEnabled = true;
        this.lookupHistory = [];
        this.favoriteWords = new Set();
        this.recentSearches = [];
        this.maxHistorySize = 1000;
        this.maxRecentSearches = 20;
        
        this.initializeLookupTool();
    }

    async initializeLookupTool() {
        try {
            // Load user preferences and data
            await this.loadLookupData();
            
            // Setup floating lookup button
            this.createFloatingButton();
            
            // Setup search widget
            this.createSearchWidget();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('🔍 ILM: Quick Lookup Tool initialized successfully');
        } catch (error) {
            console.error('❌ ILM: Quick Lookup Tool initialization failed:', error);
        }
    }

    /**
     * Load lookup data from storage
     */
    async loadLookupData() {
        try {
            const result = await chrome.storage.local.get([
                'quickLookupSettings',
                'lookupHistory',
                'favoriteWords',
                'recentSearches'
            ]);

            this.settings = result.quickLookupSettings || this.getDefaultSettings();
            this.lookupHistory = result.lookupHistory || [];
            this.favoriteWords = new Set(result.favoriteWords || []);
            this.recentSearches = result.recentSearches || [];
        } catch (error) {
            console.error('❌ ILM: Failed to load lookup data:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    /**
     * Get default lookup settings
     */
    getDefaultSettings() {
        return {
            enabled: true,
            showFloatingButton: true,
            autoLookupOnDoubleClick: true,
            showDefinitions: true,
            showTranslations: true,
            showPronunciation: true,
            showExamples: true,
            showEtymology: false,
            maxResults: 5,
            preferredLanguage: 'zh',
            instantSearch: true,
            saveHistory: true,
            keyboardShortcuts: true
        };
    }

    /**
     * Create floating lookup button
     */
    createFloatingButton() {
        if (!this.settings.showFloatingButton) return;

        // Remove existing button
        const existingButton = document.getElementById('ilm-floating-lookup');
        if (existingButton) existingButton.remove();

        const button = document.createElement('div');
        button.id = 'ilm-floating-lookup';
        button.innerHTML = '🔍';
        button.title = 'Quick Lookup (Ctrl+Shift+F)';
        
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #38b2ac, #319795);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(56, 178, 172, 0.4);
            z-index: 10000;
            transition: all 0.3s ease;
            user-select: none;
            backdrop-filter: blur(10px);
        `;

        button.addEventListener('click', () => this.showSearchWidget());
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 6px 25px rgba(56, 178, 172, 0.6)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 20px rgba(56, 178, 172, 0.4)';
        });

        document.body.appendChild(button);
        this.floatingButton = button;
    }

    /**
     * Create search widget
     */
    createSearchWidget() {
        const widget = document.createElement('div');
        widget.id = 'ilm-search-widget';
        widget.className = 'ilm-search-widget-container';
        widget.innerHTML = this.generateSearchWidgetHTML();

        widget.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            width: 500px;
            max-width: 90vw;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            z-index: 10015;
            display: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            opacity: 0;
            transition: all 0.3s ease;
            backdrop-filter: blur(20px);
        `;

        document.body.appendChild(widget);
        this.searchWidget = widget;

        // Setup widget event listeners
        this.setupWidgetEventListeners();
    }

    /**
     * Generate search widget HTML
     */
    generateSearchWidgetHTML() {
        return `
            <div class="ilm-widget-header">
                <div class="ilm-widget-title">
                    <span class="ilm-widget-icon">🔍</span>
                    <h3>Quick Lookup</h3>
                </div>
                <button class="ilm-widget-close" title="Close (Esc)">&times;</button>
            </div>

            <div class="ilm-search-section">
                <div class="ilm-search-input-container">
                    <input type="text" class="ilm-search-input" placeholder="Enter word or phrase to lookup..." id="ilm-lookup-input">
                    <button class="ilm-search-clear" id="ilm-search-clear" title="Clear">&times;</button>
                </div>
                
                <div class="ilm-search-suggestions" id="ilm-search-suggestions">
                    ${this.generateSearchSuggestions()}
                </div>
            </div>

            <div class="ilm-results-section" id="ilm-results-section">
                <div class="ilm-results-placeholder">
                    <div class="ilm-placeholder-icon">📚</div>
                    <h4>Enter a word to start looking up</h4>
                    <p>Get instant definitions, translations, and examples</p>
                </div>
            </div>

            <div class="ilm-widget-footer">
                <div class="ilm-quick-actions">
                    <button class="ilm-quick-btn" id="ilm-history-btn" title="Search History">📖 History</button>
                    <button class="ilm-quick-btn" id="ilm-favorites-btn" title="Favorite Words">⭐ Favorites</button>
                    <button class="ilm-quick-btn" id="ilm-settings-btn" title="Lookup Settings">⚙️ Settings</button>
                </div>
            </div>
        `;
    }

    /**
     * Generate search suggestions based on recent searches and favorites
     */
    generateSearchSuggestions() {
        const suggestions = [];
        
        // Add recent searches
        if (this.recentSearches.length > 0) {
            suggestions.push(`
                <div class="ilm-suggestion-group">
                    <h5>Recent Searches</h5>
                    <div class="ilm-suggestion-items">
                        ${this.recentSearches.slice(0, 5).map(search => `
                            <button class="ilm-suggestion-item" data-word="${search.word}">
                                <span class="ilm-suggestion-text">${search.word}</span>
                                <span class="ilm-suggestion-time">${this.formatTimeAgo(search.timestamp)}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `);
        }

        // Add favorite words
        if (this.favoriteWords.size > 0) {
            const favoritesList = Array.from(this.favoriteWords).slice(0, 5);
            suggestions.push(`
                <div class="ilm-suggestion-group">
                    <h5>Favorite Words</h5>
                    <div class="ilm-suggestion-items">
                        ${favoritesList.map(word => `
                            <button class="ilm-suggestion-item" data-word="${word}">
                                <span class="ilm-suggestion-text">${word}</span>
                                <span class="ilm-suggestion-icon">⭐</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `);
        }

        // Add quick examples if no history
        if (suggestions.length === 0) {
            suggestions.push(`
                <div class="ilm-suggestion-group">
                    <h5>Try These Examples</h5>
                    <div class="ilm-suggestion-items">
                        <button class="ilm-suggestion-item" data-word="serendipity">
                            <span class="ilm-suggestion-text">serendipity</span>
                            <span class="ilm-suggestion-desc">pleasant surprise</span>
                        </button>
                        <button class="ilm-suggestion-item" data-word="ephemeral">
                            <span class="ilm-suggestion-text">ephemeral</span>
                            <span class="ilm-suggestion-desc">lasting briefly</span>
                        </button>
                        <button class="ilm-suggestion-item" data-word="ubiquitous">
                            <span class="ilm-suggestion-text">ubiquitous</span>
                            <span class="ilm-suggestion-desc">everywhere</span>
                        </button>
                        <button class="ilm-suggestion-item" data-word="mellifluous">
                            <span class="ilm-suggestion-text">mellifluous</span>
                            <span class="ilm-suggestion-desc">sweet sounding</span>
                        </button>
                    </div>
                </div>
            `);
        }

        return suggestions.join('');
    }

    /**
     * Setup event listeners for search widget
     */
    setupWidgetEventListeners() {
        if (!this.searchWidget) return;

        const input = this.searchWidget.querySelector('#ilm-lookup-input');
        const clearBtn = this.searchWidget.querySelector('#ilm-search-clear');
        const closeBtn = this.searchWidget.querySelector('.ilm-widget-close');
        const suggestions = this.searchWidget.querySelector('#ilm-search-suggestions');

        // Input events
        input?.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performLookup(e.target.value);
            } else if (e.key === 'Escape') {
                this.hideSearchWidget();
            }
        });

        // Clear button
        clearBtn?.addEventListener('click', () => {
            input.value = '';
            input.focus();
            this.clearResults();
        });

        // Close button
        closeBtn?.addEventListener('click', () => {
            this.hideSearchWidget();
        });

        // Suggestion clicks
        suggestions?.addEventListener('click', (e) => {
            const suggestionItem = e.target.closest('.ilm-suggestion-item');
            if (suggestionItem) {
                const word = suggestionItem.dataset.word;
                input.value = word;
                this.performLookup(word);
            }
        });

        // Quick action buttons
        this.searchWidget.querySelector('#ilm-history-btn')?.addEventListener('click', () => {
            this.showHistory();
        });

        this.searchWidget.querySelector('#ilm-favorites-btn')?.addEventListener('click', () => {
            this.showFavorites();
        });

        this.searchWidget.querySelector('#ilm-settings-btn')?.addEventListener('click', () => {
            this.showSettings();
        });
    }

    /**
     * Setup general event listeners
     */
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + F: Open quick lookup
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                this.showSearchWidget();
            }

            // Escape: Close widget
            if (e.key === 'Escape' && this.isWidgetVisible()) {
                this.hideSearchWidget();
            }
        });

        // Double-click lookup
        if (this.settings.autoLookupOnDoubleClick) {
            document.addEventListener('dblclick', (e) => {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();
                
                if (selectedText && selectedText.length > 0 && selectedText.length < 50) {
                    this.quickLookup(selectedText);
                }
            });
        }

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.isWidgetVisible() && 
                !this.searchWidget?.contains(e.target) && 
                !this.floatingButton?.contains(e.target)) {
                this.hideSearchWidget();
            }
        });
    }

    /**
     * Handle search input changes
     * @param {string} value - Input value
     */
    handleSearchInput(value) {
        const trimmedValue = value.trim();
        
        if (trimmedValue.length === 0) {
            this.clearResults();
            this.showSuggestions();
            return;
        }

        if (this.settings.instantSearch && trimmedValue.length >= 2) {
            this.debounceSearch(trimmedValue);
        }

        this.hideSuggestions();
    }

    /**
     * Debounced search function
     */
    debounceSearch = this.debounce((query) => {
        this.performLookup(query);
    }, 300);

    /**
     * Perform word lookup
     * @param {string} word - Word to lookup
     */
    async performLookup(word) {
        if (!word || word.trim().length === 0) return;

        const trimmedWord = word.trim().toLowerCase();
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Add to recent searches
            this.addToRecentSearches(trimmedWord);
            
            // Perform multiple lookups in parallel
            const [
                translationResult,
                definitionResult,
                pronunciationResult,
                examplesResult
            ] = await Promise.allSettled([
                this.getTranslation(trimmedWord),
                this.getDefinition(trimmedWord),
                this.getPronunciation(trimmedWord),
                this.getExamples(trimmedWord)
            ]);

            // Compile results
            const lookupResult = {
                word: trimmedWord,
                originalInput: word,
                timestamp: Date.now(),
                translation: translationResult.status === 'fulfilled' ? translationResult.value : null,
                definition: definitionResult.status === 'fulfilled' ? definitionResult.value : null,
                pronunciation: pronunciationResult.status === 'fulfilled' ? pronunciationResult.value : null,
                examples: examplesResult.status === 'fulfilled' ? examplesResult.value : null
            };

            // Add to history
            if (this.settings.saveHistory) {
                this.addToHistory(lookupResult);
            }

            // Display results
            this.displayResults(lookupResult);

        } catch (error) {
            console.error('❌ ILM: Lookup failed:', error);
            this.showError('Lookup failed. Please try again.');
        }
    }

    /**
     * Quick lookup without showing full widget
     * @param {string} word - Word to lookup
     */
    async quickLookup(word) {
        try {
            const result = await this.performQuickLookup(word);
            this.showQuickResult(result);
        } catch (error) {
            console.error('❌ ILM: Quick lookup failed:', error);
        }
    }

    /**
     * Perform quick lookup with minimal data
     * @param {string} word - Word to lookup
     * @returns {Promise<Object>} Quick lookup result
     */
    async performQuickLookup(word) {
        const [translation, definition] = await Promise.allSettled([
            this.getTranslation(word),
            this.getBasicDefinition(word)
        ]);

        return {
            word: word,
            translation: translation.status === 'fulfilled' ? translation.value : null,
            definition: definition.status === 'fulfilled' ? definition.value : null,
            timestamp: Date.now()
        };
    }

    /**
     * Get translation for word
     * @param {string} word - Word to translate
     * @returns {Promise<Object>} Translation result
     */
    async getTranslation(word) {
        if (!this.settings.showTranslations) return null;

        try {
            if (window.ilmMultiLanguageTranslator) {
                const result = await window.ilmMultiLanguageTranslator.translate(word, {
                    to: this.settings.preferredLanguage
                });
                return result.success ? result : null;
            } else if (window.translationService) {
                const result = await window.translationService.translate(word, {
                    targetLanguage: this.settings.preferredLanguage === 'zh' ? 'zh-CN' : this.settings.preferredLanguage
                });
                return result.text ? { translation: result.text, provider: result.provider } : null;
            }
        } catch (error) {
            console.error('❌ ILM: Translation error:', error);
        }
        
        return null;
    }

    /**
     * Get definition for word
     * @param {string} word - Word to define
     * @returns {Promise<Object>} Definition result
     */
    async getDefinition(word) {
        if (!this.settings.showDefinitions) return null;

        try {
            if (window.translationService?.getEnhancedWordInfo) {
                const wordInfo = await window.translationService.getEnhancedWordInfo(word);
                return {
                    definitions: wordInfo.definitions,
                    partOfSpeech: wordInfo.partOfSpeech,
                    difficulty: wordInfo.difficulty,
                    level: wordInfo.level
                };
            }
        } catch (error) {
            console.error('❌ ILM: Definition error:', error);
        }

        return null;
    }

    /**
     * Get basic definition for quick lookup
     * @param {string} word - Word to define
     * @returns {Promise<string>} Basic definition
     */
    async getBasicDefinition(word) {
        try {
            if (window.translationService?.getPrimaryDefinition) {
                return await window.translationService.getPrimaryDefinition(word);
            }
        } catch (error) {
            console.error('❌ ILM: Basic definition error:', error);
        }

        return null;
    }

    /**
     * Get pronunciation for word
     * @param {string} word - Word to get pronunciation for
     * @returns {Promise<Object>} Pronunciation result
     */
    async getPronunciation(word) {
        if (!this.settings.showPronunciation) return null;

        try {
            if (window.translationService?.getWordPronunciation) {
                const pronunciation = await window.translationService.getWordPronunciation(word);
                return pronunciation;
            }
        } catch (error) {
            console.error('❌ ILM: Pronunciation error:', error);
        }

        return null;
    }

    /**
     * Get examples for word
     * @param {string} word - Word to get examples for
     * @returns {Promise<Array>} Examples array
     */
    async getExamples(word) {
        if (!this.settings.showExamples) return null;

        try {
            if (window.translationService?.getExampleSentences) {
                const examples = await window.translationService.getExampleSentences(word);
                return examples.slice(0, this.settings.maxResults);
            }
        } catch (error) {
            console.error('❌ ILM: Examples error:', error);
        }

        return null;
    }

    /**
     * Display lookup results in widget
     * @param {Object} result - Lookup result
     */
    displayResults(result) {
        const resultsSection = this.searchWidget?.querySelector('#ilm-results-section');
        if (!resultsSection) return;

        const resultHTML = this.generateResultHTML(result);
        resultsSection.innerHTML = resultHTML;

        // Setup result event listeners
        this.setupResultEventListeners(result);
    }

    /**
     * Generate HTML for lookup results
     * @param {Object} result - Lookup result
     * @returns {string} Result HTML
     */
    generateResultHTML(result) {
        return `
            <div class="ilm-result-container">
                <div class="ilm-result-header">
                    <h3 class="ilm-result-word">${result.originalInput}</h3>
                    <div class="ilm-result-actions">
                        <button class="ilm-action-btn ilm-favorite-btn" data-word="${result.word}" title="Add to Favorites">
                            ${this.favoriteWords.has(result.word) ? '⭐' : '☆'}
                        </button>
                        <button class="ilm-action-btn ilm-bookmark-btn" data-word="${result.word}" title="Bookmark Word">📖</button>
                        <button class="ilm-action-btn ilm-bilingual-btn" data-word="${result.word}" title="Bilingual Translation">🔄</button>
                        <button class="ilm-action-btn ilm-speak-btn" data-word="${result.word}" title="Pronounce">🔊</button>
                    </div>
                </div>

                ${result.pronunciation ? `
                    <div class="ilm-result-section">
                        <h4>🔊 Pronunciation</h4>
                        <div class="ilm-pronunciation-content">
                            ${result.pronunciation.ipa ? `<span class="ilm-ipa">${result.pronunciation.ipa}</span>` : ''}
                            ${result.pronunciation.syllables?.length > 0 ? `
                                <div class="ilm-syllables">
                                    <strong>Syllables:</strong> ${result.pronunciation.syllables.join('·')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${result.translation ? `
                    <div class="ilm-result-section">
                        <h4>🌐 Translation</h4>
                        <div class="ilm-translation-content">
                            <div class="ilm-main-translation">${result.translation.translation || result.translation}</div>
                            ${result.translation.alternatives?.length > 0 ? `
                                <div class="ilm-alternatives">
                                    <strong>Alternatives:</strong>
                                    ${result.translation.alternatives.slice(0, 3).map(alt => 
                                        `<span class="ilm-alt-item">${alt.text}</span>`
                                    ).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${result.definition ? `
                    <div class="ilm-result-section">
                        <h4>📚 Definition</h4>
                        <div class="ilm-definition-content">
                            ${result.definition.definitions?.slice(0, 3).map(def => `
                                <div class="ilm-definition-item">
                                    <div class="ilm-definition-text">${def.definition}</div>
                                    <div class="ilm-definition-meta">${def.context} • ${def.level}</div>
                                </div>
                            `).join('') || ''}
                            ${result.definition.difficulty ? `
                                <div class="ilm-difficulty-badge">${result.definition.difficulty}</div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${result.examples?.length > 0 ? `
                    <div class="ilm-result-section">
                        <h4>💡 Examples</h4>
                        <div class="ilm-examples-content">
                            ${result.examples.slice(0, 3).map(example => `
                                <div class="ilm-example-item">
                                    <div class="ilm-example-text">"${example.sentence}"</div>
                                    <div class="ilm-example-meta">${example.context} • ${example.level}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="ilm-result-footer">
                    <div class="ilm-lookup-time">
                        Looked up ${this.formatTimeAgo(result.timestamp)}
                    </div>
                    <div class="ilm-result-actions-extended">
                        <button class="ilm-action-btn ilm-practice-btn" data-word="${result.word}">🎯 Practice</button>
                        <button class="ilm-action-btn ilm-share-btn" data-word="${result.word}">📤 Share</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for result actions
     * @param {Object} result - Lookup result
     */
    setupResultEventListeners(result) {
        const resultsSection = this.searchWidget?.querySelector('#ilm-results-section');
        if (!resultsSection) return;

        // Favorite button
        resultsSection.querySelector('.ilm-favorite-btn')?.addEventListener('click', (e) => {
            this.toggleFavorite(result.word, e.target);
        });

        // Bookmark button
        resultsSection.querySelector('.ilm-bookmark-btn')?.addEventListener('click', () => {
            this.bookmarkWord(result.word);
        });

        // Bilingual translation button
        resultsSection.querySelector('.ilm-bilingual-btn')?.addEventListener('click', () => {
            this.showBilingualTranslation(result.word);
        });

        // Speak button
        resultsSection.querySelector('.ilm-speak-btn')?.addEventListener('click', () => {
            this.speakWord(result.word);
        });

        // Practice button
        resultsSection.querySelector('.ilm-practice-btn')?.addEventListener('click', () => {
            this.startPractice(result.word);
        });

        // Share button
        resultsSection.querySelector('.ilm-share-btn')?.addEventListener('click', () => {
            this.shareWord(result);
        });
    }

    /**
     * Show quick result popup
     * @param {Object} result - Quick lookup result
     */
    showQuickResult(result) {
        const popup = document.createElement('div');
        popup.className = 'ilm-quick-result-popup';
        popup.innerHTML = `
            <div class="ilm-quick-result-content">
                <div class="ilm-quick-word">${result.word}</div>
                ${result.translation ? `<div class="ilm-quick-translation">${result.translation.translation || result.translation}</div>` : ''}
                ${result.definition ? `<div class="ilm-quick-definition">${result.definition}</div>` : ''}
                <div class="ilm-quick-actions">
                    <button class="ilm-quick-action" onclick="window.ilmQuickLookup.showSearchWidget('${result.word}')">More Details</button>
                </div>
            </div>
        `;

        popup.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            width: 300px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            z-index: 10020;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 16px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(popup);

        // Animate in
        requestAnimationFrame(() => {
            popup.style.opacity = '1';
            popup.style.transform = 'translateX(0)';
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translateX(100%)';
            setTimeout(() => popup.remove(), 300);
        }, 5000);
    }

    /**
     * Show search widget
     * @param {string} initialQuery - Initial search query
     */
    showSearchWidget(initialQuery = '') {
        if (!this.searchWidget) return;

        this.searchWidget.style.display = 'block';
        
        requestAnimationFrame(() => {
            this.searchWidget.style.opacity = '1';
            this.searchWidget.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        const input = this.searchWidget.querySelector('#ilm-lookup-input');
        if (input) {
            if (initialQuery) {
                input.value = initialQuery;
                this.performLookup(initialQuery);
            }
            input.focus();
        }

        this.createBackdrop();
    }

    /**
     * Hide search widget
     */
    hideSearchWidget() {
        if (!this.searchWidget) return;

        this.searchWidget.style.opacity = '0';
        this.searchWidget.style.transform = 'translate(-50%, -50%) scale(0.9)';

        setTimeout(() => {
            this.searchWidget.style.display = 'none';
        }, 300);

        this.removeBackdrop();
    }

    /**
     * Check if widget is visible
     * @returns {boolean} True if visible
     */
    isWidgetVisible() {
        return this.searchWidget?.style.display === 'block';
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const resultsSection = this.searchWidget?.querySelector('#ilm-results-section');
        if (!resultsSection) return;

        resultsSection.innerHTML = `
            <div class="ilm-loading-state">
                <div class="ilm-loading-spinner"></div>
                <p>Looking up word...</p>
            </div>
        `;
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const resultsSection = this.searchWidget?.querySelector('#ilm-results-section');
        if (!resultsSection) return;

        resultsSection.innerHTML = `
            <div class="ilm-error-state">
                <div class="ilm-error-icon">❌</div>
                <h4>Error</h4>
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * Clear results and show placeholder
     */
    clearResults() {
        const resultsSection = this.searchWidget?.querySelector('#ilm-results-section');
        if (!resultsSection) return;

        resultsSection.innerHTML = `
            <div class="ilm-results-placeholder">
                <div class="ilm-placeholder-icon">📚</div>
                <h4>Enter a word to start looking up</h4>
                <p>Get instant definitions, translations, and examples</p>
            </div>
        `;
    }

    /**
     * Show suggestions
     */
    showSuggestions() {
        const suggestions = this.searchWidget?.querySelector('#ilm-search-suggestions');
        if (suggestions) {
            suggestions.style.display = 'block';
            suggestions.innerHTML = this.generateSearchSuggestions();
            this.setupSuggestionEventListeners();
        }
    }

    /**
     * Hide suggestions
     */
    hideSuggestions() {
        const suggestions = this.searchWidget?.querySelector('#ilm-search-suggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    }

    /**
     * Setup suggestion event listeners
     */
    setupSuggestionEventListeners() {
        const suggestions = this.searchWidget?.querySelector('#ilm-search-suggestions');
        if (!suggestions) return;

        suggestions.querySelectorAll('.ilm-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const word = item.dataset.word;
                const input = this.searchWidget.querySelector('#ilm-lookup-input');
                if (input) {
                    input.value = word;
                    this.performLookup(word);
                }
            });
        });
    }

    /**
     * Add word to recent searches
     * @param {string} word - Word to add
     */
    addToRecentSearches(word) {
        this.recentSearches = this.recentSearches.filter(search => search.word !== word);
        this.recentSearches.unshift({ word, timestamp: Date.now() });
        
        if (this.recentSearches.length > this.maxRecentSearches) {
            this.recentSearches = this.recentSearches.slice(0, this.maxRecentSearches);
        }

        this.saveData();
    }

    /**
     * Add lookup to history
     * @param {Object} result - Lookup result
     */
    addToHistory(result) {
        this.lookupHistory.unshift(result);
        
        if (this.lookupHistory.length > this.maxHistorySize) {
            this.lookupHistory = this.lookupHistory.slice(0, this.maxHistorySize);
        }

        this.saveData();
    }

    /**
     * Toggle word as favorite
     * @param {string} word - Word to toggle
     * @param {Element} button - Button element
     */
    toggleFavorite(word, button) {
        if (this.favoriteWords.has(word)) {
            this.favoriteWords.delete(word);
            button.textContent = '☆';
            this.showNotification(`Removed "${word}" from favorites`);
        } else {
            this.favoriteWords.add(word);
            button.textContent = '⭐';
            this.showNotification(`Added "${word}" to favorites`);
        }

        this.saveData();
    }

    /**
     * Bookmark word using learning manager
     * @param {string} word - Word to bookmark
     */
    async bookmarkWord(word) {
        try {
            if (window.ilmLearningManager) {
                await window.ilmLearningManager.bookmarkWord(word, {
                    source: 'quick-lookup',
                    timestamp: Date.now()
                });
                this.showNotification(`📖 Bookmarked: "${word}"`);
            } else {
                this.showNotification('Learning Manager not available', 'error');
            }
        } catch (error) {
            console.error('❌ ILM: Bookmark failed:', error);
            this.showNotification('Bookmark failed', 'error');
        }
    }

    /**
     * Speak word using speech synthesis
     * @param {string} word - Word to speak
     */
    speakWord(word) {
        try {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(word);
                utterance.lang = 'en-US';
                utterance.rate = 0.8;
                speechSynthesis.speak(utterance);
                this.showNotification(`🔊 Playing: "${word}"`);
            } else {
                this.showNotification('Speech synthesis not supported', 'error');
            }
        } catch (error) {
            console.error('❌ ILM: Speech synthesis failed:', error);
            this.showNotification('Speech synthesis failed', 'error');
        }
    }

    /**
     * Start practice with word
     * @param {string} word - Word to practice
     */
    startPractice(word) {
        try {
            if (window.ilmUniversalProcessor?.previewSystem) {
                const practiceWords = [{
                    word: word,
                    frequency: 1,
                    vocabRank: 50
                }];

                window.ilmUniversalProcessor.previewSystem.currentWords = practiceWords;
                window.ilmUniversalProcessor.previewSystem.startPractice();
                
                this.hideSearchWidget();
                this.showNotification(`🎯 Starting practice with: "${word}"`);
            } else {
                this.showNotification('Practice system not available', 'error');
            }
        } catch (error) {
            console.error('❌ ILM: Practice start failed:', error);
            this.showNotification('Practice start failed', 'error');
        }
    }

    /**
     * Share word information
     * @param {Object} result - Word result to share
     */
    shareWord(result) {
        const shareText = `📚 Word: ${result.originalInput}\n` +
            `${result.translation ? `🌐 Translation: ${result.translation.translation || result.translation}\n` : ''}` +
            `${result.definition?.definitions?.[0] ? `📖 Definition: ${result.definition.definitions[0].definition}\n` : ''}` +
            `\nShared via Immersive Language Master`;

        if (navigator.share) {
            navigator.share({
                title: `Word: ${result.originalInput}`,
                text: shareText
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Word information copied to clipboard!');
            });
        }
    }

    /**
     * Show history view
     */
    showHistory() {
        // Implementation for showing lookup history
        console.log('📖 Showing lookup history...');
    }

    /**
     * Show favorites view
     */
    showFavorites() {
        // Implementation for showing favorite words
        console.log('⭐ Showing favorite words...');
    }

    /**
     * Show bilingual translation for word
     * @param {string} word - Word to show bilingual translation for
     */
    async showBilingualTranslation(word) {
        try {
            if (window.ilmBilingualPopup) {
                // Hide the search widget first to avoid overlap
                this.hideSearchWidget();
                
                // Create a temporary element for positioning the popup
                const tempElement = document.createElement('span');
                tempElement.style.position = 'fixed';
                tempElement.style.left = '50%';
                tempElement.style.top = '50%';
                tempElement.style.transform = 'translate(-50%, -50%)';
                tempElement.style.pointerEvents = 'none';
                document.body.appendChild(tempElement);
                
                // Show bilingual translation popup
                await window.ilmBilingualPopup.showBilingualTranslation(word, {
                    element: tempElement,
                    level: 'intermediate',
                    position: 'center'
                });
                
                // Clean up temporary element
                setTimeout(() => tempElement.remove(), 100);
                
                this.showNotification(`🔄 Showing bilingual translation for: "${word}"`);
            } else {
                this.showNotification('Bilingual translation system not available', 'error');
                console.log('🔄 ILM: Bilingual translation requested for:', word);
            }
        } catch (error) {
            console.error('❌ ILM: Bilingual translation failed:', error);
            this.showNotification('Bilingual translation failed', 'error');
        }
    }

    /**
     * Show settings view
     */
    showSettings() {
        // Implementation for showing lookup settings
        console.log('⚙️ Showing lookup settings...');
    }

    /**
     * Save data to storage
     */
    async saveData() {
        try {
            await chrome.storage.local.set({
                lookupHistory: this.lookupHistory,
                favoriteWords: Array.from(this.favoriteWords),
                recentSearches: this.recentSearches
            });
        } catch (error) {
            console.error('❌ ILM: Failed to save lookup data:', error);
        }
    }

    /**
     * Format time ago
     * @param {number} timestamp - Timestamp
     * @returns {string} Formatted time
     */
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    /**
     * Create backdrop overlay
     */
    createBackdrop() {
        const backdrop = document.createElement('div');
        backdrop.id = 'ilm-lookup-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            z-index: 10014;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        backdrop.addEventListener('click', () => this.hideSearchWidget());
        document.body.appendChild(backdrop);

        requestAnimationFrame(() => {
            backdrop.style.opacity = '1';
        });
    }

    /**
     * Remove backdrop overlay
     */
    removeBackdrop() {
        const backdrop = document.getElementById('ilm-lookup-backdrop');
        if (backdrop) {
            backdrop.style.opacity = '0';
            setTimeout(() => backdrop.remove(), 300);
        }
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        if (window.ilmWordProcessor?.showTemporaryFeedback) {
            window.ilmWordProcessor.showTemporaryFeedback(
                document.body,
                message,
                type
            );
        } else {
            console.log(`📢 ILM: ${message}`);
        }
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Update settings
     * @param {Object} newSettings - New settings
     */
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        try {
            await chrome.storage.local.set({
                quickLookupSettings: this.settings
            });
            
            // Update UI based on new settings
            if (newSettings.showFloatingButton !== undefined) {
                if (newSettings.showFloatingButton) {
                    this.createFloatingButton();
                } else {
                    this.floatingButton?.remove();
                }
            }
            
            console.log('💾 ILM: Quick lookup settings updated');
        } catch (error) {
            console.error('❌ ILM: Failed to save lookup settings:', error);
        }
    }
}

// CSS styles for quick lookup
const quickLookupStyles = `
<style id="ilm-quick-lookup-styles">
.ilm-search-widget-container {
    font-size: 14px;
    line-height: 1.5;
}

.ilm-widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #e2e8f0;
}

.ilm-widget-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.ilm-widget-icon {
    font-size: 20px;
}

.ilm-widget-title h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
}

.ilm-widget-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #a0aec0;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.15s ease;
}

.ilm-widget-close:hover {
    background: #f7fafc;
    color: #4a5568;
}

.ilm-search-section {
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
}

.ilm-search-input-container {
    position: relative;
    margin-bottom: 16px;
}

.ilm-search-input {
    width: 100%;
    padding: 12px 40px 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.2s ease;
    box-sizing: border-box;
}

.ilm-search-input:focus {
    outline: none;
    border-color: #38b2ac;
    box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
}

.ilm-search-clear {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #a0aec0;
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.15s ease;
}

.ilm-search-clear:hover {
    background: #f7fafc;
    color: #4a5568;
}

.ilm-search-suggestions {
    display: block;
}

.ilm-suggestion-group {
    margin-bottom: 16px;
}

.ilm-suggestion-group h5 {
    margin: 0 0 8px 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #4a5568;
}

.ilm-suggestion-items {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.ilm-suggestion-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    color: #4a5568;
    transition: all 0.15s ease;
}

.ilm-suggestion-item:hover {
    background: #e6fffa;
    border-color: #38b2ac;
    color: #2d3748;
}

.ilm-suggestion-text {
    font-weight: 500;
}

.ilm-suggestion-time,
.ilm-suggestion-desc {
    font-size: 0.75rem;
    color: #718096;
}

.ilm-suggestion-icon {
    color: #f6ad55;
}

.ilm-results-section {
    max-height: 400px;
    overflow-y: auto;
    padding: 20px 24px;
}

.ilm-results-placeholder,
.ilm-loading-state,
.ilm-error-state {
    text-align: center;
    padding: 40px 20px;
    color: #718096;
}

.ilm-placeholder-icon,
.ilm-error-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.ilm-loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #38b2ac;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.ilm-result-container {
    max-width: 100%;
}

.ilm-result-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}

.ilm-result-word {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #2d3748;
}

.ilm-result-actions {
    display: flex;
    gap: 8px;
}

.ilm-action-btn {
    padding: 6px 8px;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    color: #4a5568;
    transition: all 0.15s ease;
}

.ilm-action-btn:hover {
    background: #e6fffa;
    border-color: #38b2ac;
    color: #319795;
}

.ilm-result-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
}

.ilm-result-section:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.ilm-result-section h4 {
    margin: 0 0 12px 0;
    font-size: 1rem;
    font-weight: 600;
    color: #2d3748;
}

.ilm-pronunciation-content,
.ilm-translation-content,
.ilm-definition-content,
.ilm-examples-content {
    color: #4a5568;
}

.ilm-ipa {
    font-family: 'Times New Roman', serif;
    font-style: italic;
    font-size: 1.125rem;
    color: #2d3748;
}

.ilm-syllables {
    margin-top: 8px;
    font-size: 0.875rem;
}

.ilm-main-translation {
    font-size: 1.125rem;
    font-weight: 500;
    color: #2d3748;
    margin-bottom: 8px;
}

.ilm-alternatives {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
}

.ilm-alt-item {
    background: #e6fffa;
    color: #319795;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.875rem;
}

.ilm-definition-item,
.ilm-example-item {
    margin-bottom: 12px;
    padding: 12px;
    background: #f7fafc;
    border-radius: 8px;
    border-left: 4px solid #38b2ac;
}

.ilm-definition-item:last-child,
.ilm-example-item:last-child {
    margin-bottom: 0;
}

.ilm-definition-text,
.ilm-example-text {
    color: #2d3748;
    margin-bottom: 4px;
}

.ilm-definition-meta,
.ilm-example-meta {
    font-size: 0.75rem;
    color: #718096;
}

.ilm-difficulty-badge {
    display: inline-block;
    padding: 4px 8px;
    background: #fed7e2;
    color: #e53e3e;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: 8px;
}

.ilm-widget-footer {
    padding: 16px 24px;
    border-top: 1px solid #e2e8f0;
    background: #f7fafc;
    border-radius: 0 0 16px 16px;
}

.ilm-quick-actions {
    display: flex;
    gap: 8px;
}

.ilm-quick-btn {
    flex: 1;
    padding: 8px 12px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    color: #4a5568;
    transition: all 0.15s ease;
}

.ilm-quick-btn:hover {
    background: #e6fffa;
    border-color: #38b2ac;
    color: #319795;
}

.ilm-result-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
}

.ilm-lookup-time {
    font-size: 0.75rem;
    color: #a0aec0;
}

.ilm-result-actions-extended {
    display: flex;
    gap: 8px;
}

.ilm-quick-result-popup {
    font-size: 14px;
    line-height: 1.4;
}

.ilm-quick-result-content {
    padding: 16px;
}

.ilm-quick-word {
    font-size: 1.125rem;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 8px;
}

.ilm-quick-translation {
    color: #319795;
    font-weight: 500;
    margin-bottom: 6px;
}

.ilm-quick-definition {
    color: #4a5568;
    font-size: 0.875rem;
    margin-bottom: 12px;
}

.ilm-quick-actions {
    text-align: center;
}

.ilm-quick-action {
    padding: 6px 12px;
    background: #38b2ac;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.75rem;
    transition: all 0.15s ease;
}

.ilm-quick-action:hover {
    background: #319795;
}

@media (prefers-color-scheme: dark) {
    .ilm-search-widget-container,
    .ilm-quick-result-popup {
        background: #2d3748;
        color: #e2e8f0;
    }
    
    .ilm-widget-title h3,
    .ilm-result-word {
        color: #e2e8f0;
    }
    
    .ilm-search-input {
        background: #4a5568;
        border-color: #718096;
        color: #e2e8f0;
    }
    
    .ilm-suggestion-item,
    .ilm-definition-item,
    .ilm-example-item {
        background: #4a5568;
        border-color: #718096;
        color: #e2e8f0;
    }
}
</style>
`;

// Add styles to document
if (!document.getElementById('ilm-quick-lookup-styles')) {
    document.head.insertAdjacentHTML('beforeend', quickLookupStyles);
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.QuickLookupTool = QuickLookupTool;
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmQuickLookup) {
    window.ilmQuickLookup = new QuickLookupTool();
}