// Immersive Language Master - Context Menu System
// Advanced right-click context menu for quick translation and word analysis

class ContextMenuSystem {
    constructor() {
        this.isEnabled = true;
        this.currentSelection = null;
        this.menuElement = null;
        this.isVisible = false;
        this.lastClickPosition = { x: 0, y: 0 };
        
        this.initializeContextMenu();
    }

    async initializeContextMenu() {
        try {
            // Load user preferences
            await this.loadPreferences();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Create menu structure
            this.createContextMenu();
            
            console.log('🎯 ILM: Context Menu System initialized successfully');
        } catch (error) {
            console.error('❌ ILM: Context Menu initialization failed:', error);
        }
    }

    /**
     * Load user preferences for context menu
     */
    async loadPreferences() {
        try {
            const result = await chrome.storage.local.get(['contextMenuSettings']);
            this.settings = result.contextMenuSettings || {
                enabled: true,
                showTranslation: true,
                showDefinition: true,
                showPronunciation: true,
                showExamples: true,
                quickLanguages: ['zh', 'es', 'fr', 'de', 'ja'],
                keyboardShortcuts: true,
                position: 'smart' // smart, fixed, mouse
            };
        } catch (error) {
            console.error('❌ ILM: Failed to load context menu preferences:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    /**
     * Get default context menu settings
     */
    getDefaultSettings() {
        return {
            enabled: true,
            showTranslation: true,
            showDefinition: true,
            showPronunciation: true,
            showExamples: true,
            quickLanguages: ['zh', 'es', 'fr', 'de', 'ja'],
            keyboardShortcuts: true,
            position: 'smart'
        };
    }

    /**
     * Setup event listeners for context menu triggers
     */
    setupEventListeners() {
        // Right-click event
        document.addEventListener('contextmenu', (e) => {
            this.handleContextMenu(e);
        });

        // Text selection events
        document.addEventListener('mouseup', (e) => {
            setTimeout(() => this.handleTextSelection(e), 10);
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
                e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                setTimeout(() => this.handleTextSelection(e), 10);
            }
        });

        // Click outside to hide menu
        document.addEventListener('click', (e) => {
            if (!this.menuElement?.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Scroll to hide menu
        document.addEventListener('scroll', () => {
            this.hideContextMenu();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.hideContextMenu();
        });
    }

    /**
     * Handle right-click context menu event
     * @param {Event} e - Context menu event
     */
    handleContextMenu(e) {
        if (!this.settings.enabled) return;

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText && selectedText.length > 0 && selectedText.length < 100) {
            e.preventDefault();
            this.lastClickPosition = { x: e.clientX, y: e.clientY };
            this.currentSelection = {
                text: selectedText,
                range: selection.getRangeAt(0),
                position: { x: e.clientX, y: e.clientY }
            };
            this.showContextMenu(e.clientX, e.clientY);
        }
    }

    /**
     * Handle text selection events
     * @param {Event} e - Selection event
     */
    handleTextSelection(e) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (!selectedText || selectedText.length === 0) {
            this.hideContextMenu();
            this.currentSelection = null;
        } else if (selectedText.length > 0 && selectedText.length < 100) {
            this.currentSelection = {
                text: selectedText,
                range: selection.getRangeAt(0),
                position: this.getSelectionPosition()
            };
        }
    }

    /**
     * Handle keyboard shortcuts for context menu
     * @param {Event} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        if (!this.settings.keyboardShortcuts) return;

        // Ctrl/Cmd + Shift + T: Quick translate
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            if (this.currentSelection) {
                this.quickTranslate();
            }
        }

        // Ctrl/Cmd + Shift + D: Quick definition
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            if (this.currentSelection) {
                this.quickDefine();
            }
        }

        // Ctrl/Cmd + Shift + P: Quick pronunciation
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            if (this.currentSelection) {
                this.quickPronounce();
            }
        }

        // Ctrl/Cmd + E: Bilingual translation
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            if (this.currentSelection) {
                this.showBilingualTranslation();
            }
        }

        // Escape: Hide context menu
        if (e.key === 'Escape') {
            this.hideContextMenu();
        }
    }

    /**
     * Create context menu HTML structure
     */
    createContextMenu() {
        // Remove existing menu
        if (this.menuElement) {
            this.menuElement.remove();
        }

        const menu = document.createElement('div');
        menu.id = 'ilm-context-menu';
        menu.className = 'ilm-context-menu-container';
        menu.innerHTML = this.generateContextMenuHTML();

        // Apply styles
        menu.style.cssText = `
            position: fixed;
            z-index: 10010;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            padding: 8px;
            display: none;
            min-width: 200px;
            max-width: 300px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            backdrop-filter: blur(10px);
            user-select: none;
        `;

        document.body.appendChild(menu);
        this.menuElement = menu;

        // Setup menu item event listeners
        this.setupMenuEventListeners();
    }

    /**
     * Generate context menu HTML content
     */
    generateContextMenuHTML() {
        const quickLangs = this.settings.quickLanguages.slice(0, 5);
        const languageOptions = quickLangs.map(lang => {
            const langInfo = this.getLanguageInfo(lang);
            return `
                <button class="ilm-menu-item ilm-quick-translate" data-lang="${lang}">
                    <span class="ilm-menu-icon">${langInfo.flag}</span>
                    <span class="ilm-menu-text">Translate to ${langInfo.name}</span>
                    <span class="ilm-menu-shortcut">⌘T</span>
                </button>
            `;
        }).join('');

        return `
            <div class="ilm-menu-header">
                <span class="ilm-menu-title">📖 Quick Actions</span>
            </div>
            
            <div class="ilm-menu-section">
                ${this.settings.showTranslation ? `
                    <button class="ilm-menu-item ilm-translate-default">
                        <span class="ilm-menu-icon">🌐</span>
                        <span class="ilm-menu-text">Translate</span>
                        <span class="ilm-menu-shortcut">⌘⇧T</span>
                    </button>
                ` : ''}
                
                ${this.settings.showDefinition ? `
                    <button class="ilm-menu-item ilm-define">
                        <span class="ilm-menu-icon">📚</span>
                        <span class="ilm-menu-text">Define</span>
                        <span class="ilm-menu-shortcut">⌘⇧D</span>
                    </button>
                ` : ''}
                
                <button class="ilm-menu-item ilm-bilingual">
                    <span class="ilm-menu-icon">🔄</span>
                    <span class="ilm-menu-text">Bilingual Translation</span>
                    <span class="ilm-menu-shortcut">⌘E</span>
                </button>
                
                ${this.settings.showPronunciation ? `
                    <button class="ilm-menu-item ilm-pronounce">
                        <span class="ilm-menu-icon">🔊</span>
                        <span class="ilm-menu-text">Pronounce</span>
                        <span class="ilm-menu-shortcut">⌘⇧P</span>
                    </button>
                ` : ''}
            </div>

            ${quickLangs.length > 0 ? `
                <div class="ilm-menu-divider"></div>
                <div class="ilm-menu-section">
                    <div class="ilm-menu-subtitle">Quick Translate</div>
                    ${languageOptions}
                </div>
            ` : ''}

            <div class="ilm-menu-divider"></div>
            <div class="ilm-menu-section">
                <button class="ilm-menu-item ilm-bookmark">
                    <span class="ilm-menu-icon">⭐</span>
                    <span class="ilm-menu-text">Bookmark Word</span>
                </button>
                
                <button class="ilm-menu-item ilm-lookup">
                    <span class="ilm-menu-icon">🔍</span>
                    <span class="ilm-menu-text">Deep Lookup</span>
                </button>
                
                ${this.settings.showExamples ? `
                    <button class="ilm-menu-item ilm-examples">
                        <span class="ilm-menu-icon">💡</span>
                        <span class="ilm-menu-text">Show Examples</span>
                    </button>
                ` : ''}
            </div>

            <div class="ilm-menu-divider"></div>
            <div class="ilm-menu-section">
                <button class="ilm-menu-item ilm-practice">
                    <span class="ilm-menu-icon">🎯</span>
                    <span class="ilm-menu-text">Practice Mode</span>
                </button>
            </div>
        `;
    }

    /**
     * Setup event listeners for menu items
     */
    setupMenuEventListeners() {
        if (!this.menuElement) return;

        // Default translate
        this.menuElement.querySelector('.ilm-translate-default')?.addEventListener('click', () => {
            this.quickTranslate();
        });

        // Define
        this.menuElement.querySelector('.ilm-define')?.addEventListener('click', () => {
            this.quickDefine();
        });

        // Bilingual Translation
        this.menuElement.querySelector('.ilm-bilingual')?.addEventListener('click', () => {
            this.showBilingualTranslation();
        });

        // Pronounce
        this.menuElement.querySelector('.ilm-pronounce')?.addEventListener('click', () => {
            this.quickPronounce();
        });

        // Quick language translations
        this.menuElement.querySelectorAll('.ilm-quick-translate').forEach(btn => {
            btn.addEventListener('click', () => {
                this.translateToLanguage(btn.dataset.lang);
            });
        });

        // Bookmark
        this.menuElement.querySelector('.ilm-bookmark')?.addEventListener('click', () => {
            this.bookmarkWord();
        });

        // Deep lookup
        this.menuElement.querySelector('.ilm-lookup')?.addEventListener('click', () => {
            this.deepLookup();
        });

        // Examples
        this.menuElement.querySelector('.ilm-examples')?.addEventListener('click', () => {
            this.showExamples();
        });

        // Practice mode
        this.menuElement.querySelector('.ilm-practice')?.addEventListener('click', () => {
            this.startPractice();
        });
    }

    /**
     * Show context menu at specified position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    showContextMenu(x, y) {
        if (!this.menuElement || !this.currentSelection) return;

        this.menuElement.style.display = 'block';
        this.isVisible = true;

        // Position menu intelligently
        const position = this.calculateMenuPosition(x, y);
        this.menuElement.style.left = `${position.x}px`;
        this.menuElement.style.top = `${position.y}px`;

        // Add show animation
        this.menuElement.style.opacity = '0';
        this.menuElement.style.transform = 'scale(0.9) translateY(-10px)';
        
        requestAnimationFrame(() => {
            this.menuElement.style.transition = 'all 0.2s ease';
            this.menuElement.style.opacity = '1';
            this.menuElement.style.transform = 'scale(1) translateY(0)';
        });

        // Update menu content based on selection
        this.updateMenuForSelection();
    }

    /**
     * Hide context menu
     */
    hideContextMenu() {
        if (!this.menuElement || !this.isVisible) return;

        this.menuElement.style.transition = 'all 0.15s ease';
        this.menuElement.style.opacity = '0';
        this.menuElement.style.transform = 'scale(0.9) translateY(-5px)';

        setTimeout(() => {
            this.menuElement.style.display = 'none';
            this.isVisible = false;
        }, 150);
    }

    /**
     * Calculate optimal menu position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object} Position coordinates
     */
    calculateMenuPosition(x, y) {
        const menuWidth = 250;
        const menuHeight = 400;
        const padding = 10;
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        let posX = x + scrollX;
        let posY = y + scrollY;

        // Adjust horizontal position
        if (posX + menuWidth > scrollX + viewportWidth - padding) {
            posX = scrollX + viewportWidth - menuWidth - padding;
        }
        if (posX < scrollX + padding) {
            posX = scrollX + padding;
        }

        // Adjust vertical position
        if (posY + menuHeight > scrollY + viewportHeight - padding) {
            posY = posY - menuHeight - 20; // Show above cursor
        }
        if (posY < scrollY + padding) {
            posY = scrollY + padding;
        }

        return { x: posX, y: posY };
    }

    /**
     * Get selection position for positioning
     */
    getSelectionPosition() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return { x: 0, y: 0 };

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        return {
            x: rect.left + rect.width / 2,
            y: rect.bottom + 5
        };
    }

    /**
     * Update menu content based on current selection
     */
    updateMenuForSelection() {
        if (!this.currentSelection || !this.menuElement) return;

        const text = this.currentSelection.text;
        const isWord = /^[a-zA-Z]+$/.test(text);
        const isPhrase = text.split(' ').length > 1;

        // Update menu title
        const title = this.menuElement.querySelector('.ilm-menu-title');
        if (title) {
            if (isWord) {
                title.textContent = `📖 "${text}"`;
            } else if (isPhrase) {
                title.textContent = `📝 "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`;
            } else {
                title.textContent = '📖 Quick Actions';
            }
        }

        // Hide/show pronunciation for non-words
        const pronounceBtn = this.menuElement.querySelector('.ilm-pronounce');
        if (pronounceBtn) {
            pronounceBtn.style.display = isWord ? 'flex' : 'none';
        }

        // Update bookmark button text
        const bookmarkBtn = this.menuElement.querySelector('.ilm-bookmark .ilm-menu-text');
        if (bookmarkBtn) {
            bookmarkBtn.textContent = isWord ? 'Bookmark Word' : 'Bookmark Text';
        }
    }

    /**
     * Quick translate using default language
     */
    async quickTranslate() {
        if (!this.currentSelection) return;

        this.hideContextMenu();
        await this.performTranslation(this.currentSelection.text);
    }

    /**
     * Translate to specific language
     * @param {string} targetLang - Target language code
     */
    async translateToLanguage(targetLang) {
        if (!this.currentSelection) return;

        this.hideContextMenu();
        await this.performTranslation(this.currentSelection.text, targetLang);
    }

    /**
     * Perform translation and show result
     * @param {string} text - Text to translate
     * @param {string} targetLang - Target language (optional)
     */
    async performTranslation(text, targetLang = null) {
        try {
            // Show loading indicator
            this.showLoadingIndicator();

            // Use multi-language translator if available
            if (window.ilmMultiLanguageTranslator) {
                const result = await window.ilmMultiLanguageTranslator.translate(text, {
                    to: targetLang || 'zh'
                });

                if (result.success) {
                    this.showTranslationResult(result);
                } else {
                    this.showError('Translation failed');
                }
            } else if (window.translationService) {
                // Fallback to legacy translation service
                const result = await window.translationService.translate(text, {
                    targetLanguage: targetLang || 'zh-CN'
                });

                if (result.text) {
                    this.showTranslationResult({
                        success: true,
                        originalText: text,
                        translation: result.text,
                        provider: result.provider
                    });
                } else {
                    this.showError('Translation failed');
                }
            } else {
                this.showError('Translation service not available');
            }

        } catch (error) {
            console.error('❌ ILM: Translation error:', error);
            this.showError('Translation failed');
        } finally {
            this.hideLoadingIndicator();
        }
    }

    /**
     * Quick definition lookup
     */
    async quickDefine() {
        if (!this.currentSelection) return;

        this.hideContextMenu();

        try {
            if (window.translationService?.getEnhancedWordInfo) {
                this.showLoadingIndicator();
                const wordInfo = await window.translationService.getEnhancedWordInfo(this.currentSelection.text);
                this.showDefinitionResult(wordInfo);
            } else {
                this.deepLookup();
            }
        } catch (error) {
            console.error('❌ ILM: Definition lookup error:', error);
            this.showError('Definition lookup failed');
        } finally {
            this.hideLoadingIndicator();
        }
    }

    /**
     * Quick pronunciation
     */
    async quickPronounce() {
        if (!this.currentSelection) return;

        this.hideContextMenu();

        try {
            const text = this.currentSelection.text;
            
            // Use Web Speech API for pronunciation
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'en-US';
                utterance.rate = 0.8;
                utterance.pitch = 1;
                speechSynthesis.speak(utterance);
                
                this.showNotification(`🔊 Playing pronunciation: "${text}"`);
            } else {
                this.showError('Speech synthesis not supported');
            }
        } catch (error) {
            console.error('❌ ILM: Pronunciation error:', error);
            this.showError('Pronunciation failed');
        }
    }

    /**
     * Bookmark selected word/text
     */
    async bookmarkWord() {
        if (!this.currentSelection) return;

        this.hideContextMenu();

        try {
            if (window.ilmLearningManager) {
                const word = this.currentSelection.text.toLowerCase().trim();
                await window.ilmLearningManager.bookmarkWord(word, {
                    originalCase: this.currentSelection.text,
                    context: this.getSelectionContext(),
                    source: window.location.href,
                    timestamp: Date.now()
                });
                
                this.showNotification(`⭐ Bookmarked: "${this.currentSelection.text}"`);
            } else {
                this.showError('Learning Manager not available');
            }
        } catch (error) {
            console.error('❌ ILM: Bookmark error:', error);
            this.showError('Bookmark failed');
        }
    }

    /**
     * Deep lookup using existing word processor
     */
    deepLookup() {
        if (!this.currentSelection) return;

        this.hideContextMenu();

        try {
            if (window.ilmWordProcessor) {
                // Use existing word processor for detailed lookup
                const element = document.createElement('span');
                element.textContent = this.currentSelection.text;
                element.style.position = 'absolute';
                element.style.left = `${this.currentSelection.position.x}px`;
                element.style.top = `${this.currentSelection.position.y}px`;
                document.body.appendChild(element);

                window.ilmWordProcessor.showEnhancedPopup(
                    element,
                    this.currentSelection.text,
                    { source: 'context-menu' }
                );

                // Clean up temporary element
                setTimeout(() => element.remove(), 100);
            } else {
                this.showError('Word processor not available');
            }
        } catch (error) {
            console.error('❌ ILM: Deep lookup error:', error);
            this.showError('Deep lookup failed');
        }
    }

    /**
     * Show examples for selected text
     */
    async showExamples() {
        if (!this.currentSelection) return;

        this.hideContextMenu();

        try {
            if (window.translationService?.getExampleSentences) {
                this.showLoadingIndicator();
                const examples = await window.translationService.getExampleSentences(this.currentSelection.text);
                this.showExamplesResult(examples);
            } else {
                this.showError('Examples service not available');
            }
        } catch (error) {
            console.error('❌ ILM: Examples error:', error);
            this.showError('Examples lookup failed');
        } finally {
            this.hideLoadingIndicator();
        }
    }

    /**
     * Show bilingual translation for selected text
     */
    async showBilingualTranslation() {
        if (!this.currentSelection) return;

        this.hideContextMenu();

        try {
            // Check if bilingual popup system is available
            if (window.ilmBilingualPopup) {
                const word = this.currentSelection.text.trim();
                const context = this.getSelectionContext();
                
                // Create a temporary element for positioning
                const tempElement = document.createElement('span');
                tempElement.style.position = 'absolute';
                tempElement.style.left = `${this.currentSelection.position.x}px`;
                tempElement.style.top = `${this.currentSelection.position.y}px`;
                tempElement.style.pointerEvents = 'none';
                document.body.appendChild(tempElement);
                
                // Show bilingual translation popup
                await window.ilmBilingualPopup.showBilingualTranslation(word, {
                    element: tempElement,
                    context: context,
                    paragraph: this.getSelectionParagraph(),
                    level: 'intermediate',
                    position: 'smart'
                });
                
                // Clean up temporary element
                setTimeout(() => tempElement.remove(), 100);
                
                this.showNotification(`🔄 Showing bilingual translation for: "${word}"`);
            } else {
                // Fallback to regular translation if bilingual system not available
                await this.quickTranslate();
                this.showNotification('Bilingual system not available, using regular translation');
            }
        } catch (error) {
            console.error('❌ ILM: Bilingual translation error:', error);
            this.showError('Bilingual translation failed');
        }
    }

    /**
     * Get paragraph context for better translation
     */
    getSelectionParagraph() {
        if (!this.currentSelection?.range) return '';

        try {
            const range = this.currentSelection.range;
            const container = range.commonAncestorContainer;
            
            // Find the paragraph or block element
            let paragraph = container.nodeType === Node.TEXT_NODE ? 
                container.parentElement : container;
            
            // Walk up the DOM to find a paragraph-like element
            while (paragraph && paragraph !== document.body) {
                const tagName = paragraph.tagName?.toLowerCase();
                if (tagName && ['p', 'div', 'article', 'section', 'span'].includes(tagName)) {
                    break;
                }
                paragraph = paragraph.parentElement;
            }
            
            return paragraph?.textContent?.trim() || '';
        } catch (error) {
            console.error('❌ ILM: Paragraph extraction error:', error);
            return '';
        }
    }

    /**
     * Start practice mode with selected word
     */
    startPractice() {
        if (!this.currentSelection) return;

        this.hideContextMenu();

        try {
            if (window.ilmUniversalProcessor?.previewSystem) {
                const practiceWords = [{
                    word: this.currentSelection.text.toLowerCase(),
                    frequency: 1,
                    vocabRank: 50
                }];

                window.ilmUniversalProcessor.previewSystem.currentWords = practiceWords;
                window.ilmUniversalProcessor.previewSystem.startPractice();
                
                this.showNotification(`🎯 Starting practice with: "${this.currentSelection.text}"`);
            } else {
                this.showError('Practice system not available');
            }
        } catch (error) {
            console.error('❌ ILM: Practice mode error:', error);
            this.showError('Practice mode failed');
        }
    }

    /**
     * Get context around selected text
     */
    getSelectionContext() {
        if (!this.currentSelection?.range) return '';

        try {
            const range = this.currentSelection.range;
            const container = range.commonAncestorContainer;
            const parentElement = container.nodeType === Node.TEXT_NODE ? 
                container.parentElement : container;
            
            const fullText = parentElement.textContent || '';
            const selectedText = this.currentSelection.text;
            const index = fullText.indexOf(selectedText);
            
            if (index === -1) return '';
            
            const contextStart = Math.max(0, index - 50);
            const contextEnd = Math.min(fullText.length, index + selectedText.length + 50);
            
            return fullText.substring(contextStart, contextEnd);
        } catch (error) {
            console.error('❌ ILM: Context extraction error:', error);
            return '';
        }
    }

    /**
     * Get language information
     * @param {string} langCode - Language code
     * @returns {Object} Language information
     */
    getLanguageInfo(langCode) {
        const languages = {
            'zh': { name: 'Chinese', flag: '🇨🇳' },
            'es': { name: 'Spanish', flag: '🇪🇸' },
            'fr': { name: 'French', flag: '🇫🇷' },
            'de': { name: 'German', flag: '🇩🇪' },
            'ja': { name: 'Japanese', flag: '🇯🇵' },
            'ko': { name: 'Korean', flag: '🇰🇷' },
            'pt': { name: 'Portuguese', flag: '🇵🇹' },
            'ru': { name: 'Russian', flag: '🇷🇺' },
            'it': { name: 'Italian', flag: '🇮🇹' },
            'ar': { name: 'Arabic', flag: '🇸🇦' }
        };
        
        return languages[langCode] || { name: 'Unknown', flag: '🌐' };
    }

    /**
     * Show translation result popup
     * @param {Object} result - Translation result
     */
    showTranslationResult(result) {
        const popup = this.createResultPopup();
        popup.innerHTML = `
            <div class="ilm-result-header">
                <h4>🌐 Translation</h4>
                <button class="ilm-result-close">&times;</button>
            </div>
            <div class="ilm-result-content">
                <div class="ilm-original-text">"${result.originalText}"</div>
                <div class="ilm-translation-result">${result.translation}</div>
                ${result.alternatives?.length > 0 ? `
                    <div class="ilm-alternatives">
                        <strong>Alternatives:</strong>
                        ${result.alternatives.slice(0, 3).map(alt => `<span class="ilm-alt-text">${alt.text}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="ilm-provider">via ${result.provider}</div>
            </div>
        `;
        
        this.showResultPopup(popup);
    }

    /**
     * Show definition result popup
     * @param {Object} wordInfo - Word information
     */
    showDefinitionResult(wordInfo) {
        const popup = this.createResultPopup();
        popup.innerHTML = `
            <div class="ilm-result-header">
                <h4>📚 Definition</h4>
                <button class="ilm-result-close">&times;</button>
            </div>
            <div class="ilm-result-content">
                <div class="ilm-word-title">${wordInfo.originalCase}</div>
                ${wordInfo.pronunciation?.ipa ? `
                    <div class="ilm-pronunciation">[${wordInfo.pronunciation.ipa}]</div>
                ` : ''}
                ${wordInfo.definitions?.length > 0 ? `
                    <div class="ilm-definitions">
                        ${wordInfo.definitions.slice(0, 2).map(def => `
                            <div class="ilm-definition-item">
                                <strong>${def.context}:</strong> ${def.definition}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                ${wordInfo.examples?.length > 0 ? `
                    <div class="ilm-example">
                        <em>"${wordInfo.examples[0].sentence}"</em>
                    </div>
                ` : ''}
            </div>
        `;
        
        this.showResultPopup(popup);
    }

    /**
     * Show examples result popup
     * @param {Array} examples - Example sentences
     */
    showExamplesResult(examples) {
        const popup = this.createResultPopup();
        popup.innerHTML = `
            <div class="ilm-result-header">
                <h4>💡 Examples</h4>
                <button class="ilm-result-close">&times;</button>
            </div>
            <div class="ilm-result-content">
                <div class="ilm-examples-list">
                    ${examples.slice(0, 3).map(example => `
                        <div class="ilm-example-item">
                            <div class="ilm-example-sentence">"${example.sentence}"</div>
                            <div class="ilm-example-meta">${example.context} • ${example.level}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.showResultPopup(popup);
    }

    /**
     * Create result popup element
     * @returns {HTMLElement} Popup element
     */
    createResultPopup() {
        const popup = document.createElement('div');
        popup.className = 'ilm-result-popup';
        popup.style.cssText = `
            position: fixed;
            z-index: 10020;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            max-width: 400px;
            min-width: 300px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            backdrop-filter: blur(10px);
        `;
        
        return popup;
    }

    /**
     * Show result popup with positioning
     * @param {HTMLElement} popup - Popup element
     */
    showResultPopup(popup) {
        document.body.appendChild(popup);
        
        // Position popup
        const position = this.calculatePopupPosition();
        popup.style.left = `${position.x}px`;
        popup.style.top = `${position.y}px`;
        
        // Add animation
        popup.style.opacity = '0';
        popup.style.transform = 'scale(0.9) translateY(-10px)';
        
        requestAnimationFrame(() => {
            popup.style.transition = 'all 0.3s ease';
            popup.style.opacity = '1';
            popup.style.transform = 'scale(1) translateY(0)';
        });
        
        // Setup close button
        popup.querySelector('.ilm-result-close').addEventListener('click', () => {
            popup.style.opacity = '0';
            popup.style.transform = 'scale(0.9) translateY(-10px)';
            setTimeout(() => popup.remove(), 300);
        });
        
        // Auto-close after 10 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.style.opacity = '0';
                setTimeout(() => popup.remove(), 300);
            }
        }, 10000);
    }

    /**
     * Calculate popup position
     * @returns {Object} Position coordinates
     */
    calculatePopupPosition() {
        const padding = 20;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let x = this.currentSelection?.position.x || viewportWidth / 2;
        let y = this.currentSelection?.position.y || viewportHeight / 2;
        
        // Keep popup within viewport
        if (x + 400 > viewportWidth - padding) {
            x = viewportWidth - 400 - padding;
        }
        if (x < padding) {
            x = padding;
        }
        
        if (y + 300 > viewportHeight - padding) {
            y = y - 350; // Show above selection
        }
        if (y < padding) {
            y = padding;
        }
        
        return { x, y };
    }

    /**
     * Show loading indicator
     */
    showLoadingIndicator() {
        this.showNotification('⏳ Loading...', 2000);
    }

    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        // Loading indicator auto-hides
    }

    /**
     * Show notification message
     * @param {string} message - Notification message
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(message, duration = 3000) {
        if (window.ilmWordProcessor?.showTemporaryFeedback) {
            window.ilmWordProcessor.showTemporaryFeedback(
                document.body,
                message,
                'info',
                duration
            );
        } else {
            // Fallback notification
            console.log(`📢 ILM: ${message}`);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showNotification(`❌ ${message}`, 5000);
    }

    /**
     * Update user preferences
     * @param {Object} newSettings - New settings
     */
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        try {
            await chrome.storage.local.set({
                contextMenuSettings: this.settings
            });
            
            // Recreate menu with new settings
            this.createContextMenu();
            
            console.log('💾 ILM: Context menu settings updated');
        } catch (error) {
            console.error('❌ ILM: Failed to save context menu settings:', error);
        }
    }

    /**
     * Enable context menu
     */
    enable() {
        this.settings.enabled = true;
        this.updateSettings({ enabled: true });
    }

    /**
     * Disable context menu
     */
    disable() {
        this.settings.enabled = false;
        this.hideContextMenu();
        this.updateSettings({ enabled: false });
    }

    /**
     * Toggle context menu
     */
    toggle() {
        if (this.settings.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }
}

// CSS styles for context menu
const contextMenuStyles = `
<style id="ilm-context-menu-styles">
.ilm-context-menu-container {
    font-size: 14px;
    line-height: 1.4;
}

.ilm-menu-header {
    padding: 12px 16px 8px;
    border-bottom: 1px solid #f0f0f0;
}

.ilm-menu-title {
    font-weight: 600;
    color: #2d3748;
    font-size: 0.875rem;
}

.ilm-menu-section {
    padding: 4px 0;
}

.ilm-menu-subtitle {
    padding: 8px 16px 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.ilm-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 8px 16px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    color: #2d3748;
    transition: all 0.15s ease;
    text-align: left;
}

.ilm-menu-item:hover {
    background: #f7fafc;
    color: #1a202c;
}

.ilm-menu-item:active {
    background: #e2e8f0;
}

.ilm-menu-icon {
    font-size: 16px;
    width: 18px;
    text-align: center;
}

.ilm-menu-text {
    flex: 1;
    font-weight: 500;
}

.ilm-menu-shortcut {
    font-size: 0.75rem;
    color: #a0aec0;
    font-family: 'SF Mono', Monaco, monospace;
}

.ilm-menu-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 4px 0;
}

.ilm-result-popup {
    font-size: 14px;
    line-height: 1.5;
}

.ilm-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px 12px;
    border-bottom: 1px solid #e2e8f0;
}

.ilm-result-header h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #2d3748;
}

.ilm-result-close {
    background: none;
    border: none;
    font-size: 20px;
    color: #a0aec0;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.15s ease;
}

.ilm-result-close:hover {
    background: #f7fafc;
    color: #4a5568;
}

.ilm-result-content {
    padding: 16px 20px 20px;
}

.ilm-original-text {
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 8px;
}

.ilm-translation-result {
    font-size: 1.125rem;
    font-weight: 500;
    color: #2d3748;
    margin-bottom: 12px;
}

.ilm-word-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 4px;
}

.ilm-pronunciation {
    font-family: 'Times New Roman', serif;
    color: #718096;
    margin-bottom: 12px;
    font-style: italic;
}

.ilm-definitions {
    margin-bottom: 12px;
}

.ilm-definition-item {
    margin-bottom: 8px;
    color: #4a5568;
}

.ilm-alternatives {
    margin-bottom: 12px;
    color: #4a5568;
}

.ilm-alt-text {
    display: inline-block;
    background: #e6fffa;
    color: #319795;
    padding: 2px 6px;
    border-radius: 4px;
    margin-right: 6px;
    margin-top: 4px;
    font-size: 0.875rem;
}

.ilm-provider {
    font-size: 0.75rem;
    color: #a0aec0;
    text-align: right;
}

.ilm-example {
    font-style: italic;
    color: #4a5568;
    margin-top: 12px;
    padding: 12px;
    background: #f7fafc;
    border-radius: 8px;
    border-left: 4px solid #38b2ac;
}

.ilm-examples-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.ilm-example-item {
    padding: 12px;
    background: #f7fafc;
    border-radius: 8px;
    border-left: 4px solid #38b2ac;
}

.ilm-example-sentence {
    font-style: italic;
    color: #2d3748;
    margin-bottom: 4px;
}

.ilm-example-meta {
    font-size: 0.75rem;
    color: #718096;
}

@media (prefers-color-scheme: dark) {
    .ilm-context-menu-container,
    .ilm-result-popup {
        background: #2d3748;
        border-color: #4a5568;
        color: #e2e8f0;
    }
    
    .ilm-menu-title,
    .ilm-result-header h4,
    .ilm-word-title {
        color: #e2e8f0;
    }
    
    .ilm-menu-item {
        color: #e2e8f0;
    }
    
    .ilm-menu-item:hover {
        background: #4a5568;
        color: #f7fafc;
    }
    
    .ilm-menu-divider {
        background: #4a5568;
    }
}
</style>
`;

// Add styles to document
if (!document.getElementById('ilm-context-menu-styles')) {
    document.head.insertAdjacentHTML('beforeend', contextMenuStyles);
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ContextMenuSystem = ContextMenuSystem;
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmContextMenu) {
    window.ilmContextMenu = new ContextMenuSystem();
}