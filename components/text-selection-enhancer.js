// Immersive Language Master - Text Selection Enhancement System
// Advanced text selection with smart highlighting, instant preview, and learning integration

class TextSelectionEnhancer {
    constructor() {
        this.isEnabled = true;
        this.currentSelection = null;
        this.selectionTooltip = null;
        this.miniPopup = null;
        this.highlightedElements = new Set();
        this.selectionHistory = [];
        this.autoTranslateEnabled = false;
        
        this.initializeEnhancer();
    }

    async initializeEnhancer() {
        try {
            // Load user preferences
            await this.loadSettings();
            
            // Create UI elements
            this.createSelectionTooltip();
            this.createMiniPopup();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize selection tracking
            this.initializeSelectionTracking();
            
            console.log('✨ ILM: Text Selection Enhancer initialized successfully');
        } catch (error) {
            console.error('❌ ILM: Text Selection Enhancer initialization failed:', error);
        }
    }

    /**
     * Load user settings for text selection enhancement
     */
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['textSelectionSettings']);
            this.settings = result.textSelectionSettings || this.getDefaultSettings();
        } catch (error) {
            console.error('❌ ILM: Failed to load text selection settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    /**
     * Get default text selection settings
     */
    getDefaultSettings() {
        return {
            enabled: true,
            showMiniPopup: true,
            showSelectionTooltip: true,
            instantTranslation: false,
            smartHighlighting: true,
            selectionHistory: true,
            maxHistorySize: 100,
            doubleClickSelect: true,
            tripleClickSelect: true,
            smartWordBoundary: true,
            showWordCount: true,
            showReadingTime: true,
            enhancedCopy: true,
            selectionAnimations: true,
            keyboardShortcuts: true
        };
    }

    /**
     * Create selection tooltip for quick actions
     */
    createSelectionTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'ilm-selection-tooltip';
        tooltip.className = 'ilm-selection-tooltip-container';
        tooltip.innerHTML = this.generateTooltipHTML();

        tooltip.style.cssText = `
            position: absolute;
            z-index: 10030;
            background: #1a202c;
            color: white;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            display: none;
            pointer-events: none;
            user-select: none;
            backdrop-filter: blur(10px);
            opacity: 0;
            transform: translateY(-5px);
            transition: all 0.2s ease;
        `;

        document.body.appendChild(tooltip);
        this.selectionTooltip = tooltip;
    }

    /**
     * Generate tooltip HTML content
     */
    generateTooltipHTML() {
        return `
            <div class="ilm-tooltip-content">
                <span class="ilm-tooltip-text">Text selected</span>
                <span class="ilm-tooltip-actions">
                    ${this.settings.keyboardShortcuts ? '• Right-click for options' : ''}
                </span>
            </div>
        `;
    }

    /**
     * Create mini popup for instant information
     */
    createMiniPopup() {
        const popup = document.createElement('div');
        popup.id = 'ilm-selection-mini-popup';
        popup.className = 'ilm-mini-popup-container';
        popup.innerHTML = this.generateMiniPopupHTML();

        popup.style.cssText = `
            position: absolute;
            z-index: 10025;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            min-width: 200px;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            display: none;
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        `;

        document.body.appendChild(popup);
        this.miniPopup = popup;
        
        // Setup mini popup event listeners
        this.setupMiniPopupEventListeners();
    }

    /**
     * Generate mini popup HTML content
     */
    generateMiniPopupHTML() {
        return `
            <div class="ilm-mini-popup-header">
                <div class="ilm-popup-title">Quick Info</div>
                <button class="ilm-popup-close" title="Close">&times;</button>
            </div>
            
            <div class="ilm-mini-popup-content">
                <div class="ilm-selection-stats" id="ilm-selection-stats">
                    <div class="ilm-stat-item">
                        <span class="ilm-stat-label">Words:</span>
                        <span class="ilm-stat-value" id="ilm-word-count">0</span>
                    </div>
                    <div class="ilm-stat-item">
                        <span class="ilm-stat-label">Characters:</span>
                        <span class="ilm-stat-value" id="ilm-char-count">0</span>
                    </div>
                    <div class="ilm-stat-item">
                        <span class="ilm-stat-label">Reading:</span>
                        <span class="ilm-stat-value" id="ilm-reading-time">0s</span>
                    </div>
                </div>
                
                <div class="ilm-quick-translation" id="ilm-quick-translation" style="display: none;">
                    <div class="ilm-translation-loading">Translating...</div>
                </div>
                
                <div class="ilm-word-analysis" id="ilm-word-analysis" style="display: none;">
                    <div class="ilm-analysis-content"></div>
                </div>
            </div>
            
            <div class="ilm-mini-popup-actions">
                <button class="ilm-mini-action-btn" id="ilm-translate-btn" title="Translate">🌐</button>
                <button class="ilm-mini-action-btn" id="ilm-define-btn" title="Define">📚</button>
                <button class="ilm-mini-action-btn" id="ilm-bilingual-btn" title="Bilingual Translation">🔄</button>
                <button class="ilm-mini-action-btn" id="ilm-bookmark-btn" title="Bookmark">⭐</button>
                <button class="ilm-mini-action-btn" id="ilm-copy-btn" title="Copy">📋</button>
                <button class="ilm-mini-action-btn" id="ilm-speak-btn" title="Speak">🔊</button>
            </div>
        `;
    }

    /**
     * Setup main event listeners for text selection
     */
    setupEventListeners() {
        // Selection events
        document.addEventListener('mouseup', (e) => {
            setTimeout(() => this.handleTextSelection(e), 10);
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
                e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
                e.key === 'Shift') {
                setTimeout(() => this.handleTextSelection(e), 10);
            }
        });

        // Double and triple click enhancements
        if (this.settings.doubleClickSelect) {
            document.addEventListener('dblclick', (e) => {
                this.handleDoubleClick(e);
            });
        }

        // Triple click handling
        let clickCount = 0;
        let clickTimer = null;
        
        document.addEventListener('click', (e) => {
            clickCount++;
            
            if (clickTimer) {
                clearTimeout(clickTimer);
            }
            
            clickTimer = setTimeout(() => {
                if (clickCount === 3 && this.settings.tripleClickSelect) {
                    this.handleTripleClick(e);
                }
                clickCount = 0;
            }, 300);
        });

        // Hide popups on outside click
        document.addEventListener('click', (e) => {
            if (!this.miniPopup?.contains(e.target) && 
                !this.selectionTooltip?.contains(e.target)) {
                this.hideMiniPopup();
                this.hideTooltip();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Scroll to hide popups
        document.addEventListener('scroll', () => {
            this.hideMiniPopup();
            this.hideTooltip();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.hideMiniPopup();
            this.hideTooltip();
        });
    }

    /**
     * Setup mini popup event listeners
     */
    setupMiniPopupEventListeners() {
        if (!this.miniPopup) return;

        // Close button
        this.miniPopup.querySelector('.ilm-popup-close')?.addEventListener('click', () => {
            this.hideMiniPopup();
        });

        // Action buttons
        this.miniPopup.querySelector('#ilm-translate-btn')?.addEventListener('click', () => {
            this.translateSelection();
        });

        this.miniPopup.querySelector('#ilm-define-btn')?.addEventListener('click', () => {
            this.defineSelection();
        });

        this.miniPopup.querySelector('#ilm-bilingual-btn')?.addEventListener('click', () => {
            this.showBilingualTranslation();
        });

        this.miniPopup.querySelector('#ilm-bookmark-btn')?.addEventListener('click', () => {
            this.bookmarkSelection();
        });

        this.miniPopup.querySelector('#ilm-copy-btn')?.addEventListener('click', () => {
            this.copySelection();
        });

        this.miniPopup.querySelector('#ilm-speak-btn')?.addEventListener('click', () => {
            this.speakSelection();
        });
    }

    /**
     * Initialize selection tracking system
     */
    initializeSelectionTracking() {
        // Track selection changes for history
        document.addEventListener('selectionchange', () => {
            this.trackSelectionChange();
        });
    }

    /**
     * Handle text selection events
     * @param {Event} e - Selection event
     */
    handleTextSelection(e) {
        if (!this.settings.enabled) return;

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (!selectedText || selectedText.length === 0) {
            this.clearSelection();
            return;
        }

        // Update current selection
        this.currentSelection = {
            text: selectedText,
            range: selection.getRangeAt(0).cloneRange(),
            timestamp: Date.now(),
            position: this.getSelectionPosition(selection),
            wordCount: this.countWords(selectedText),
            charCount: selectedText.length,
            readingTime: this.calculateReadingTime(selectedText)
        };

        // Add to history
        if (this.settings.selectionHistory) {
            this.addToSelectionHistory(this.currentSelection);
        }

        // Show appropriate UI
        this.showSelectionUI();

        // Perform instant translation if enabled
        if (this.settings.instantTranslation && this.isWord(selectedText)) {
            this.performInstantTranslation(selectedText);
        }

        // Smart highlighting
        if (this.settings.smartHighlighting) {
            this.applySmartHighlighting(selectedText);
        }
    }

    /**
     * Handle double click selection enhancement
     * @param {Event} e - Double click event
     */
    handleDoubleClick(e) {
        if (!this.settings.doubleClickSelect) return;

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText && this.settings.smartWordBoundary) {
            // Expand selection to include full word if partially selected
            this.expandToWordBoundary(selection);
        }
    }

    /**
     * Handle triple click selection enhancement
     * @param {Event} e - Triple click event
     */
    handleTripleClick(e) {
        if (!this.settings.tripleClickSelect) return;

        // Select entire paragraph on triple click
        const target = e.target;
        if (target.nodeType === Node.TEXT_NODE) {
            target = target.parentElement;
        }

        const range = document.createRange();
        range.selectNodeContents(target);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Trigger selection handling
        setTimeout(() => this.handleTextSelection(e), 10);
    }

    /**
     * Handle keyboard shortcuts for selection
     * @param {Event} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        if (!this.settings.keyboardShortcuts || !this.currentSelection) return;

        // Ctrl/Cmd + Shift + C: Enhanced copy
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            this.enhancedCopy();
        }

        // Ctrl/Cmd + Shift + S: Speak selection
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            this.speakSelection();
        }

        // Ctrl/Cmd + Shift + B: Bookmark selection
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
            e.preventDefault();
            this.bookmarkSelection();
        }

        // Escape: Clear selection
        if (e.key === 'Escape') {
            this.clearSelection();
        }
    }

    /**
     * Show selection UI (tooltip and/or mini popup)
     */
    showSelectionUI() {
        if (!this.currentSelection) return;

        // Show tooltip
        if (this.settings.showSelectionTooltip) {
            this.showTooltip();
        }

        // Show mini popup for longer selections or single words
        if (this.settings.showMiniPopup && 
            (this.currentSelection.wordCount >= 1 || this.isWord(this.currentSelection.text))) {
            this.showMiniPopup();
        }
    }

    /**
     * Show selection tooltip
     */
    showTooltip() {
        if (!this.selectionTooltip || !this.currentSelection) return;

        const position = this.currentSelection.position;
        this.selectionTooltip.style.left = `${position.x}px`;
        this.selectionTooltip.style.top = `${position.y - 40}px`;
        this.selectionTooltip.style.display = 'block';

        // Update tooltip content
        const tooltipText = this.selectionTooltip.querySelector('.ilm-tooltip-text');
        if (tooltipText) {
            const wordCount = this.currentSelection.wordCount;
            tooltipText.textContent = wordCount === 1 ? 
                `"${this.currentSelection.text}" selected` : 
                `${wordCount} words selected`;
        }

        // Animate in
        requestAnimationFrame(() => {
            this.selectionTooltip.style.opacity = '1';
            this.selectionTooltip.style.transform = 'translateY(0)';
        });

        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideTooltip();
        }, 3000);
    }

    /**
     * Hide selection tooltip
     */
    hideTooltip() {
        if (!this.selectionTooltip) return;

        this.selectionTooltip.style.opacity = '0';
        this.selectionTooltip.style.transform = 'translateY(-5px)';

        setTimeout(() => {
            this.selectionTooltip.style.display = 'none';
        }, 200);
    }

    /**
     * Show mini popup with selection information
     */
    showMiniPopup() {
        if (!this.miniPopup || !this.currentSelection) return;

        // Update popup content
        this.updateMiniPopupContent();

        // Position popup
        const position = this.calculatePopupPosition();
        this.miniPopup.style.left = `${position.x}px`;
        this.miniPopup.style.top = `${position.y}px`;
        this.miniPopup.style.display = 'block';

        // Animate in
        requestAnimationFrame(() => {
            this.miniPopup.style.opacity = '1';
            this.miniPopup.style.transform = 'scale(1) translateY(0)';
        });
    }

    /**
     * Hide mini popup
     */
    hideMiniPopup() {
        if (!this.miniPopup) return;

        this.miniPopup.style.opacity = '0';
        this.miniPopup.style.transform = 'scale(0.9) translateY(-10px)';

        setTimeout(() => {
            this.miniPopup.style.display = 'none';
        }, 300);
    }

    /**
     * Update mini popup content with current selection data
     */
    updateMiniPopupContent() {
        if (!this.miniPopup || !this.currentSelection) return;

        // Update statistics
        const wordCountEl = this.miniPopup.querySelector('#ilm-word-count');
        const charCountEl = this.miniPopup.querySelector('#ilm-char-count');
        const readingTimeEl = this.miniPopup.querySelector('#ilm-reading-time');

        if (wordCountEl) wordCountEl.textContent = this.currentSelection.wordCount;
        if (charCountEl) charCountEl.textContent = this.currentSelection.charCount;
        if (readingTimeEl) readingTimeEl.textContent = this.formatReadingTime(this.currentSelection.readingTime);

        // Show/hide sections based on selection type
        const isWord = this.isWord(this.currentSelection.text);
        const wordAnalysisEl = this.miniPopup.querySelector('#ilm-word-analysis');
        
        if (wordAnalysisEl) {
            wordAnalysisEl.style.display = isWord ? 'block' : 'none';
        }
    }

    /**
     * Perform instant translation for selected text
     * @param {string} text - Text to translate
     */
    async performInstantTranslation(text) {
        if (!window.ilmMultiLanguageTranslator) return;

        try {
            const translationEl = this.miniPopup?.querySelector('#ilm-quick-translation');
            if (!translationEl) return;

            translationEl.style.display = 'block';
            translationEl.innerHTML = '<div class="ilm-translation-loading">Translating...</div>';

            const result = await window.ilmMultiLanguageTranslator.quickTranslate(text);
            
            if (result && result !== text) {
                translationEl.innerHTML = `
                    <div class="ilm-translation-result">
                        <div class="ilm-translation-text">${result}</div>
                        <div class="ilm-translation-label">Translation</div>
                    </div>
                `;
            } else {
                translationEl.style.display = 'none';
            }
        } catch (error) {
            console.error('❌ ILM: Instant translation failed:', error);
            const translationEl = this.miniPopup?.querySelector('#ilm-quick-translation');
            if (translationEl) {
                translationEl.style.display = 'none';
            }
        }
    }

    /**
     * Apply smart highlighting to similar words
     * @param {string} text - Text to highlight
     */
    applySmartHighlighting(text) {
        if (!this.isWord(text) || text.length < 3) return;

        // Clear previous highlights
        this.clearHighlights();

        // Find and highlight similar words
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.parentElement && 
                !this.isExcludedElement(node.parentElement) &&
                node.textContent.toLowerCase().includes(text.toLowerCase())) {
                textNodes.push(node);
            }
        }

        // Highlight matching words
        textNodes.forEach(textNode => {
            this.highlightWordInNode(textNode, text);
        });
    }

    /**
     * Highlight word in text node
     * @param {Node} textNode - Text node to process
     * @param {string} word - Word to highlight
     */
    highlightWordInNode(textNode, word) {
        const text = textNode.textContent;
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = text.match(regex);

        if (!matches) return;

        const parent = textNode.parentElement;
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        text.replace(regex, (match, index) => {
            // Add text before match
            if (index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));
            }

            // Add highlighted match
            const highlight = document.createElement('span');
            highlight.className = 'ilm-smart-highlight';
            highlight.textContent = match;
            highlight.style.cssText = `
                background: rgba(56, 178, 172, 0.2);
                border-radius: 3px;
                padding: 1px 2px;
                transition: all 0.2s ease;
            `;
            
            fragment.appendChild(highlight);
            this.highlightedElements.add(highlight);

            lastIndex = index + match.length;
            return match;
        });

        // Add remaining text
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        parent.replaceChild(fragment, textNode);
    }

    /**
     * Clear all smart highlights
     */
    clearHighlights() {
        this.highlightedElements.forEach(element => {
            const parent = element.parentElement;
            if (parent) {
                parent.replaceChild(document.createTextNode(element.textContent), element);
                parent.normalize(); // Merge adjacent text nodes
            }
        });
        this.highlightedElements.clear();
    }

    /**
     * Clear current selection and UI
     */
    clearSelection() {
        this.currentSelection = null;
        this.hideTooltip();
        this.hideMiniPopup();
        this.clearHighlights();
        
        // Clear browser selection
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    }

    /**
     * Translate current selection
     */
    async translateSelection() {
        if (!this.currentSelection || !window.ilmContextMenu) return;

        // Use context menu's translation functionality
        window.ilmContextMenu.currentSelection = this.currentSelection;
        await window.ilmContextMenu.quickTranslate();
    }

    /**
     * Define current selection
     */
    async defineSelection() {
        if (!this.currentSelection || !window.ilmQuickLookup) return;

        // Use quick lookup for definition
        await window.ilmQuickLookup.quickLookup(this.currentSelection.text);
    }

    /**
     * Bookmark current selection
     */
    async bookmarkSelection() {
        if (!this.currentSelection || !window.ilmLearningManager) return;

        try {
            await window.ilmLearningManager.bookmarkWord(this.currentSelection.text.toLowerCase(), {
                originalCase: this.currentSelection.text,
                source: 'text-selection',
                context: this.getSelectionContext(),
                timestamp: Date.now()
            });

            this.showNotification(`⭐ Bookmarked: "${this.currentSelection.text}"`);
        } catch (error) {
            console.error('❌ ILM: Bookmark failed:', error);
            this.showNotification('Bookmark failed', 'error');
        }
    }

    /**
     * Copy selection with enhancement
     */
    async copySelection() {
        if (!this.currentSelection) return;

        try {
            let copyText = this.currentSelection.text;

            if (this.settings.enhancedCopy) {
                // Add metadata for enhanced copy
                const metadata = [
                    `Source: ${window.location.href}`,
                    `Selected: ${new Date().toLocaleString()}`,
                    `Words: ${this.currentSelection.wordCount}`,
                    `Reading time: ${this.formatReadingTime(this.currentSelection.readingTime)}`
                ];

                copyText += '\n\n---\n' + metadata.join('\n');
            }

            await navigator.clipboard.writeText(copyText);
            this.showNotification('📋 Copied to clipboard');
        } catch (error) {
            console.error('❌ ILM: Copy failed:', error);
            this.showNotification('Copy failed', 'error');
        }
    }

    /**
     * Speak current selection
     */
    speakSelection() {
        if (!this.currentSelection) return;

        try {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(this.currentSelection.text);
                utterance.lang = 'en-US';
                utterance.rate = 0.8;
                speechSynthesis.speak(utterance);
                
                this.showNotification(`🔊 Speaking: "${this.currentSelection.text.substring(0, 30)}${this.currentSelection.text.length > 30 ? '...' : ''}"`);
            } else {
                this.showNotification('Speech synthesis not supported', 'error');
            }
        } catch (error) {
            console.error('❌ ILM: Speech synthesis failed:', error);
            this.showNotification('Speech synthesis failed', 'error');
        }
    }

    /**
     * Show bilingual translation for selected text
     */
    async showBilingualTranslation() {
        if (!this.currentSelection) return;

        try {
            const selectedText = this.currentSelection.text.trim();
            
            if (window.ilmBilingualPopup) {
                // Hide the mini popup to avoid overlap
                this.hideMiniPopup();
                
                // Get the selection position for positioning the bilingual popup
                const selectionRect = this.currentSelection.range?.getBoundingClientRect();
                
                // Create a temporary element for positioning
                const tempElement = document.createElement('span');
                tempElement.style.position = 'absolute';
                if (selectionRect) {
                    tempElement.style.left = `${selectionRect.left + selectionRect.width / 2}px`;
                    tempElement.style.top = `${selectionRect.bottom + 10}px`;
                } else {
                    tempElement.style.left = '50%';
                    tempElement.style.top = '50%';
                    tempElement.style.transform = 'translate(-50%, -50%)';
                }
                tempElement.style.pointerEvents = 'none';
                document.body.appendChild(tempElement);
                
                // Get context around the selection
                const context = this.getSelectionContext();
                
                // Show bilingual translation popup
                await window.ilmBilingualPopup.showBilingualTranslation(selectedText, {
                    element: tempElement,
                    context: context,
                    paragraph: this.getSelectionParagraph(),
                    level: 'intermediate',
                    position: 'smart'
                });
                
                // Clean up temporary element
                setTimeout(() => tempElement.remove(), 100);
                
                this.showNotification(`🔄 Showing bilingual translation for: "${selectedText.substring(0, 30)}${selectedText.length > 30 ? '...' : ''}"`);
            } else {
                // Fallback to regular translation if bilingual system not available
                await this.translateSelection();
                this.showNotification('Bilingual system not available, using regular translation');
            }
        } catch (error) {
            console.error('❌ ILM: Bilingual translation failed:', error);
            this.showNotification('Bilingual translation failed', 'error');
        }
    }

    /**
     * Get context around the current selection
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
     * Enhanced copy with formatting and metadata
     */
    async enhancedCopy() {
        if (!this.currentSelection) return;

        try {
            const enhancedText = this.createEnhancedCopyText();
            await navigator.clipboard.writeText(enhancedText);
            this.showNotification('📋 Enhanced copy completed');
        } catch (error) {
            console.error('❌ ILM: Enhanced copy failed:', error);
            this.showNotification('Enhanced copy failed', 'error');
        }
    }

    /**
     * Create enhanced copy text with metadata
     */
    createEnhancedCopyText() {
        const selection = this.currentSelection;
        const metadata = {
            text: selection.text,
            source: {
                url: window.location.href,
                title: document.title,
                timestamp: new Date().toISOString()
            },
            analysis: {
                wordCount: selection.wordCount,
                characterCount: selection.charCount,
                readingTime: this.formatReadingTime(selection.readingTime),
                difficulty: this.analyzeDifficulty(selection.text)
            }
        };

        return `${selection.text}

---
Source: ${metadata.source.title}
URL: ${metadata.source.url}
Selected: ${new Date(metadata.source.timestamp).toLocaleString()}
Analysis: ${metadata.analysis.wordCount} words, ${metadata.analysis.characterCount} characters, ${metadata.analysis.readingTime} reading time
Difficulty: ${metadata.analysis.difficulty}

Generated by Immersive Language Master`;
    }

    /**
     * Track selection changes for history
     */
    trackSelectionChange() {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText && selectedText.length > 0 && this.settings.selectionHistory) {
            // Debounce selection tracking
            clearTimeout(this.selectionTrackingTimeout);
            this.selectionTrackingTimeout = setTimeout(() => {
                this.recordSelectionChange(selectedText);
            }, 500);
        }
    }

    /**
     * Record selection change in history
     * @param {string} text - Selected text
     */
    recordSelectionChange(text) {
        if (!this.settings.selectionHistory) return;

        const selectionRecord = {
            text: text,
            timestamp: Date.now(),
            url: window.location.href,
            title: document.title
        };

        this.addToSelectionHistory(selectionRecord);
    }

    /**
     * Add selection to history
     * @param {Object} selection - Selection record
     */
    addToSelectionHistory(selection) {
        // Remove duplicates
        this.selectionHistory = this.selectionHistory.filter(
            item => item.text !== selection.text || 
                    Date.now() - item.timestamp > 60000 // Allow same text after 1 minute
        );

        // Add to beginning of history
        this.selectionHistory.unshift(selection);

        // Limit history size
        if (this.selectionHistory.length > this.settings.maxHistorySize) {
            this.selectionHistory = this.selectionHistory.slice(0, this.settings.maxHistorySize);
        }

        // Save to storage
        this.saveSelectionHistory();
    }

    /**
     * Save selection history to storage
     */
    async saveSelectionHistory() {
        try {
            await chrome.storage.local.set({
                textSelectionHistory: this.selectionHistory
            });
        } catch (error) {
            console.error('❌ ILM: Failed to save selection history:', error);
        }
    }

    /**
     * Get selection position for UI positioning
     * @param {Selection} selection - Browser selection object
     * @returns {Object} Position coordinates
     */
    getSelectionPosition(selection) {
        if (selection.rangeCount === 0) return { x: 0, y: 0 };

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        return {
            x: rect.left + rect.width / 2 + window.scrollX,
            y: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * Calculate popup position to avoid viewport edges
     */
    calculatePopupPosition() {
        if (!this.currentSelection) return { x: 0, y: 0 };

        const position = this.currentSelection.position;
        const popupWidth = 350;
        const popupHeight = 200;
        const padding = 20;

        let x = position.x - popupWidth / 2;
        let y = position.y + position.height + 10;

        // Adjust horizontal position
        if (x < padding) {
            x = padding;
        } else if (x + popupWidth > window.innerWidth - padding) {
            x = window.innerWidth - popupWidth - padding;
        }

        // Adjust vertical position
        if (y + popupHeight > window.innerHeight - padding) {
            y = position.y - popupHeight - 10; // Show above selection
        }

        return {
            x: x + window.scrollX,
            y: y + window.scrollY
        };
    }

    /**
     * Expand selection to word boundary
     * @param {Selection} selection - Browser selection
     */
    expandToWordBoundary(selection) {
        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const text = range.toString();
        
        // If already a complete word, don't expand
        if (/^\w+$/.test(text)) return;

        const startContainer = range.startContainer;
        const endContainer = range.endContainer;

        if (startContainer.nodeType === Node.TEXT_NODE && 
            endContainer.nodeType === Node.TEXT_NODE) {
            
            const fullText = startContainer.textContent;
            const startOffset = range.startOffset;
            const endOffset = range.endOffset;

            // Find word boundaries
            const beforeStart = fullText.substring(0, startOffset);
            const afterEnd = fullText.substring(endOffset);
            
            const wordStartMatch = beforeStart.match(/\w*$/);
            const wordEndMatch = afterEnd.match(/^\w*/);
            
            if (wordStartMatch || wordEndMatch) {
                const newStartOffset = startOffset - (wordStartMatch ? wordStartMatch[0].length : 0);
                const newEndOffset = endOffset + (wordEndMatch ? wordEndMatch[0].length : 0);
                
                range.setStart(startContainer, Math.max(0, newStartOffset));
                range.setEnd(endContainer, Math.min(fullText.length, newEndOffset));
                
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    /**
     * Get context around selection
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
            
            const contextStart = Math.max(0, index - 100);
            const contextEnd = Math.min(fullText.length, index + selectedText.length + 100);
            
            return fullText.substring(contextStart, contextEnd);
        } catch (error) {
            console.error('❌ ILM: Context extraction error:', error);
            return '';
        }
    }

    /**
     * Check if element should be excluded from highlighting
     * @param {Element} element - Element to check
     * @returns {boolean} True if should be excluded
     */
    isExcludedElement(element) {
        const excludedTags = ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'];
        const excludedClasses = ['ilm-', 'no-highlight', 'code', 'syntax'];
        
        if (excludedTags.includes(element.tagName)) return true;
        
        const className = element.className || '';
        return excludedClasses.some(cls => className.includes(cls));
    }

    /**
     * Check if text is a single word
     * @param {string} text - Text to check
     * @returns {boolean} True if single word
     */
    isWord(text) {
        return /^\w+$/.test(text.trim());
    }

    /**
     * Count words in text
     * @param {string} text - Text to count
     * @returns {number} Word count
     */
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Calculate reading time for text
     * @param {string} text - Text to analyze
     * @returns {number} Reading time in seconds
     */
    calculateReadingTime(text) {
        const wordsPerMinute = 200; // Average reading speed
        const wordCount = this.countWords(text);
        return Math.max(1, Math.round((wordCount / wordsPerMinute) * 60));
    }

    /**
     * Format reading time for display
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time
     */
    formatReadingTime(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }

    /**
     * Analyze text difficulty
     * @param {string} text - Text to analyze
     * @returns {string} Difficulty level
     */
    analyzeDifficulty(text) {
        const wordCount = this.countWords(text);
        const avgWordLength = text.replace(/\s+/g, '').length / wordCount;
        const complexWords = text.split(/\s+/).filter(word => word.length > 6).length;
        const complexityRatio = complexWords / wordCount;

        if (avgWordLength < 4 && complexityRatio < 0.2) return 'Easy';
        if (avgWordLength < 5 && complexityRatio < 0.4) return 'Medium';
        return 'Hard';
    }

    /**
     * Show notification message
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
     * Update settings
     * @param {Object} newSettings - New settings
     */
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        try {
            await chrome.storage.local.set({
                textSelectionSettings: this.settings
            });
            
            console.log('💾 ILM: Text selection settings updated');
        } catch (error) {
            console.error('❌ ILM: Failed to save text selection settings:', error);
        }
    }

    /**
     * Enable text selection enhancement
     */
    enable() {
        this.settings.enabled = true;
        this.updateSettings({ enabled: true });
    }

    /**
     * Disable text selection enhancement
     */
    disable() {
        this.settings.enabled = false;
        this.clearSelection();
        this.updateSettings({ enabled: false });
    }

    /**
     * Toggle text selection enhancement
     */
    toggle() {
        if (this.settings.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    /**
     * Get selection history
     * @returns {Array} Selection history
     */
    getSelectionHistory() {
        return this.selectionHistory;
    }

    /**
     * Clear selection history
     */
    async clearSelectionHistory() {
        this.selectionHistory = [];
        await this.saveSelectionHistory();
        this.showNotification('Selection history cleared');
    }

    /**
     * Export selection history
     * @returns {string} JSON string of history
     */
    exportSelectionHistory() {
        return JSON.stringify({
            history: this.selectionHistory,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        }, null, 2);
    }
}

// CSS styles for text selection enhancement
const textSelectionStyles = `
<style id="ilm-text-selection-styles">
.ilm-selection-tooltip-container {
    font-size: 12px;
    line-height: 1.3;
    white-space: nowrap;
}

.ilm-tooltip-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.ilm-tooltip-text {
    font-weight: 500;
}

.ilm-tooltip-actions {
    opacity: 0.7;
    font-size: 11px;
}

.ilm-mini-popup-container {
    font-size: 14px;
    line-height: 1.4;
}

.ilm-mini-popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px 8px;
    border-bottom: 1px solid #e2e8f0;
}

.ilm-popup-title {
    font-weight: 600;
    color: #2d3748;
    font-size: 0.875rem;
}

.ilm-popup-close {
    background: none;
    border: none;
    font-size: 18px;
    color: #a0aec0;
    cursor: pointer;
    padding: 2px;
    border-radius: 3px;
    transition: all 0.15s ease;
}

.ilm-popup-close:hover {
    background: #f7fafc;
    color: #4a5568;
}

.ilm-mini-popup-content {
    padding: 12px 16px;
}

.ilm-selection-stats {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
}

.ilm-stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
}

.ilm-stat-label {
    font-size: 0.75rem;
    color: #718096;
    margin-bottom: 2px;
}

.ilm-stat-value {
    font-weight: 600;
    color: #2d3748;
    font-size: 0.875rem;
}

.ilm-quick-translation {
    margin-bottom: 12px;
    padding: 8px;
    background: #f7fafc;
    border-radius: 6px;
    border-left: 3px solid #38b2ac;
}

.ilm-translation-loading {
    font-size: 0.875rem;
    color: #718096;
    font-style: italic;
}

.ilm-translation-result {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.ilm-translation-text {
    color: #2d3748;
    font-weight: 500;
}

.ilm-translation-label {
    font-size: 0.75rem;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.ilm-mini-popup-actions {
    display: flex;
    gap: 6px;
    padding: 8px 16px 12px;
    border-top: 1px solid #e2e8f0;
    background: #f7fafc;
    border-radius: 0 0 12px 12px;
}

.ilm-mini-action-btn {
    flex: 1;
    padding: 6px 8px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    color: #4a5568;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ilm-mini-action-btn:hover {
    background: #e6fffa;
    border-color: #38b2ac;
    color: #319795;
    transform: translateY(-1px);
}

.ilm-smart-highlight {
    animation: ilm-highlight-pulse 0.3s ease-out;
}

@keyframes ilm-highlight-pulse {
    0% {
        background: rgba(56, 178, 172, 0.4);
        transform: scale(1);
    }
    50% {
        background: rgba(56, 178, 172, 0.6);
        transform: scale(1.02);
    }
    100% {
        background: rgba(56, 178, 172, 0.2);
        transform: scale(1);
    }
}

.ilm-smart-highlight:hover {
    background: rgba(56, 178, 172, 0.3) !important;
    cursor: pointer;
}

@media (prefers-color-scheme: dark) {
    .ilm-mini-popup-container {
        background: #2d3748;
        border-color: #4a5568;
        color: #e2e8f0;
    }
    
    .ilm-popup-title,
    .ilm-stat-value {
        color: #e2e8f0;
    }
    
    .ilm-selection-stats,
    .ilm-mini-popup-actions {
        border-color: #4a5568;
        background: #4a5568;
    }
    
    .ilm-quick-translation {
        background: #4a5568;
        border-color: #38b2ac;
    }
    
    .ilm-mini-action-btn {
        background: #1a202c;
        border-color: #4a5568;
        color: #e2e8f0;
    }
    
    .ilm-mini-action-btn:hover {
        background: #2d3748;
        border-color: #38b2ac;
        color: #38b2ac;
    }
}

@media (max-width: 480px) {
    .ilm-mini-popup-container {
        max-width: calc(100vw - 20px);
        min-width: 280px;
    }
    
    .ilm-selection-stats {
        flex-direction: column;
        gap: 8px;
    }
    
    .ilm-stat-item {
        flex-direction: row;
        justify-content: space-between;
    }
}
</style>
`;

// Add styles to document
if (!document.getElementById('ilm-text-selection-styles')) {
    document.head.insertAdjacentHTML('beforeend', textSelectionStyles);
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.TextSelectionEnhancer = TextSelectionEnhancer;
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmTextSelectionEnhancer) {
    window.ilmTextSelectionEnhancer = new TextSelectionEnhancer();
}