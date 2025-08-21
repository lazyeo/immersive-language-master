// Immersive Language Master - Bilingual Translation Popup Component
// Interactive popup for displaying English-to-English translations with multiple complexity levels

class BilingualPopup {
    constructor() {
        this.isEnabled = true;
        this.currentPopup = null;
        this.currentWord = null;
        this.currentLevel = 'intermediate';
        this.translationData = null;
        this.animationDuration = 300;
        
        this.initializePopup();
    }

    async initializePopup() {
        try {
            // Wait for bilingual engine to be ready
            await this.waitForBilingualEngine();
            
            // Load user preferences
            await this.loadPopupSettings();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Create popup template
            this.createPopupTemplate();
            
            console.log('📖 ILM: Bilingual Popup initialized successfully');
        } catch (error) {
            console.error('❌ ILM: Bilingual Popup initialization failed:', error);
        }
    }

    /**
     * Wait for bilingual engine to be available
     */
    async waitForBilingualEngine() {
        return new Promise((resolve) => {
            const checkEngine = () => {
                if (window.ilmBilingualEngine) {
                    resolve();
                } else {
                    setTimeout(checkEngine, 100);
                }
            };
            checkEngine();
        });
    }

    /**
     * Load popup settings
     */
    async loadPopupSettings() {
        try {
            const result = await chrome.storage.local.get(['bilingualPopupSettings']);
            this.settings = result.bilingualPopupSettings || this.getDefaultSettings();
        } catch (error) {
            console.error('❌ ILM: Failed to load bilingual popup settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    /**
     * Get default popup settings
     */
    getDefaultSettings() {
        return {
            enabled: true,
            autoShowLevel: 'intermediate',
            showAllLevels: true,
            showLearningAids: true,
            showExamples: true,
            showAlternatives: true,
            animationsEnabled: true,
            autoClose: false,
            autoCloseDelay: 10000,
            preferredPosition: 'smart' // smart, top, bottom, left, right
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for word lookup requests
        document.addEventListener('ilm-bilingual-lookup', (e) => {
            this.showBilingualTranslation(e.detail.word, e.detail.options);
        });

        // Listen for popup close requests
        document.addEventListener('ilm-close-bilingual', () => {
            this.hidePopup();
        });

        // Listen for level changes
        document.addEventListener('ilm-level-change', (e) => {
            this.switchLevel(e.detail.level);
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.currentPopup && !this.currentPopup.contains(e.target)) {
                const triggerElement = e.target.closest('[data-ilm-word]');
                if (!triggerElement) {
                    this.hidePopup();
                }
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        if (!this.currentPopup || this.currentPopup.style.display === 'none') return;

        switch (e.key) {
            case 'Escape':
                this.hidePopup();
                break;
            case '1':
                if (e.altKey) {
                    e.preventDefault();
                    this.switchLevel('elementary');
                }
                break;
            case '2':
                if (e.altKey) {
                    e.preventDefault();
                    this.switchLevel('intermediate');
                }
                break;
            case '3':
                if (e.altKey) {
                    e.preventDefault();
                    this.switchLevel('advanced');
                }
                break;
            case '4':
                if (e.altKey) {
                    e.preventDefault();
                    this.switchLevel('native');
                }
                break;
        }
    }

    /**
     * Create popup template
     */
    createPopupTemplate() {
        const popup = document.createElement('div');
        popup.id = 'ilm-bilingual-popup';
        popup.className = 'ilm-bilingual-popup ilm-responsive';
        popup.style.cssText = `
            position: fixed;
            z-index: 10030;
            display: none;
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
            transition: all ${this.animationDuration}ms ease;
        `;

        popup.innerHTML = this.generatePopupHTML();
        document.body.appendChild(popup);
        
        this.currentPopup = popup;
        this.setupPopupEventListeners();
    }

    /**
     * Generate popup HTML structure
     */
    generatePopupHTML() {
        return `
            <div class="ilm-bilingual-header">
                <div class="ilm-word-title" id="ilm-bilingual-word-title">Word</div>
                <div class="ilm-header-controls">
                    <div class="ilm-level-selector" id="ilm-level-selector">
                        <button class="ilm-level-btn" data-level="elementary" title="Elementary Level (Alt+1)">Basic</button>
                        <button class="ilm-level-btn active" data-level="intermediate" title="Intermediate Level (Alt+2)">Medium</button>
                        <button class="ilm-level-btn" data-level="advanced" title="Advanced Level (Alt+3)">Hard</button>
                        <button class="ilm-level-btn" data-level="native" title="Native Level (Alt+4)">Expert</button>
                    </div>
                    <button class="ilm-popup-close" title="Close (Esc)">&times;</button>
                </div>
            </div>

            <div class="ilm-bilingual-content">
                <!-- Main explanation section -->
                <div class="ilm-explanation-section" id="ilm-explanation-section">
                    <div class="ilm-explanation-text" id="ilm-explanation-text">
                        Loading explanation...
                    </div>
                    <div class="ilm-simple-example" id="ilm-simple-example">
                        Loading example...
                    </div>
                    <div class="ilm-key-words" id="ilm-key-words">
                        <!-- Key words will be inserted here -->
                    </div>
                </div>

                <!-- Multiple definitions section -->
                <div class="ilm-definitions-section" id="ilm-definitions-section" style="display: none;">
                    <!-- Multiple definitions will be inserted here -->
                </div>

                <!-- Learning aids section -->
                <div class="ilm-learning-aids" id="ilm-learning-aids" style="display: none;">
                    <div class="ilm-aid-section" id="ilm-alternatives-section">
                        <div class="ilm-aid-title">💡 Simpler words you can use:</div>
                        <div class="ilm-alternatives" id="ilm-alternatives">
                            <!-- Alternatives will be inserted here -->
                        </div>
                    </div>

                    <div class="ilm-aid-section" id="ilm-memory-aids-section">
                        <div class="ilm-aid-title">🧠 Memory tricks:</div>
                        <div class="ilm-aid-content" id="ilm-memory-aids">
                            <!-- Memory aids will be inserted here -->
                        </div>
                    </div>

                    <div class="ilm-aid-section" id="ilm-word-family-section">
                        <div class="ilm-aid-title">👨‍👩‍👧‍👦 Word family:</div>
                        <div class="ilm-aid-content" id="ilm-word-family">
                            <!-- Word family will be inserted here -->
                        </div>
                    </div>
                </div>

                <!-- Action buttons -->
                <div class="ilm-popup-actions">
                    <button class="ilm-action-btn" id="ilm-toggle-aids-btn" title="Show/Hide Learning Aids">
                        <span class="ilm-action-icon">🎯</span>
                        <span class="ilm-action-text">Learning Aids</span>
                    </button>
                    <button class="ilm-action-btn" id="ilm-bookmark-word-btn" title="Bookmark This Word">
                        <span class="ilm-action-icon">⭐</span>
                        <span class="ilm-action-text">Bookmark</span>
                    </button>
                    <button class="ilm-action-btn" id="ilm-practice-word-btn" title="Practice This Word">
                        <span class="ilm-action-icon">🎯</span>
                        <span class="ilm-action-text">Practice</span>
                    </button>
                </div>
            </div>

            <!-- Loading indicator -->
            <div class="ilm-loading-overlay" id="ilm-loading-overlay" style="display: none;">
                <div class="ilm-loading-spinner"></div>
                <div class="ilm-loading-text">Finding the best explanation...</div>
            </div>
        `;
    }

    /**
     * Setup popup-specific event listeners
     */
    setupPopupEventListeners() {
        if (!this.currentPopup) return;

        // Close button
        this.currentPopup.querySelector('.ilm-popup-close')?.addEventListener('click', () => {
            this.hidePopup();
        });

        // Level selector buttons
        this.currentPopup.querySelectorAll('.ilm-level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = btn.dataset.level;
                this.switchLevel(level);
            });
        });

        // Toggle learning aids
        this.currentPopup.querySelector('#ilm-toggle-aids-btn')?.addEventListener('click', () => {
            this.toggleLearningAids();
        });

        // Bookmark word
        this.currentPopup.querySelector('#ilm-bookmark-word-btn')?.addEventListener('click', () => {
            this.bookmarkCurrentWord();
        });

        // Practice word
        this.currentPopup.querySelector('#ilm-practice-word-btn')?.addEventListener('click', () => {
            this.practiceCurrentWord();
        });
    }

    /**
     * Show bilingual translation popup
     * @param {string} word - Word to translate
     * @param {Object} options - Display options
     */
    async showBilingualTranslation(word, options = {}) {
        if (!this.settings.enabled || !word) return;

        try {
            this.currentWord = word;
            this.currentLevel = options.level || this.settings.autoShowLevel;

            // Show popup with loading state
            this.showLoadingState(word);
            
            // Position popup
            this.positionPopup(options.element, options.position);

            // Get bilingual translation data
            this.translationData = await window.ilmBilingualEngine.translateBilingually(word, {
                context: options.context,
                paragraph: options.paragraph
            });

            // Update popup content
            this.updatePopupContent();

            // Show popup with animation
            this.showPopup();

            // Setup auto-close if enabled
            if (this.settings.autoClose) {
                this.setupAutoClose();
            }

            // Log usage for analytics
            this.logBilingualUsage(word, this.currentLevel);

        } catch (error) {
            console.error('❌ ILM: Failed to show bilingual translation:', error);
            this.showError('Failed to load translation');
        }
    }

    /**
     * Show loading state
     * @param {string} word - Word being loaded
     */
    showLoadingState(word) {
        const wordTitle = this.currentPopup.querySelector('#ilm-bilingual-word-title');
        const loadingOverlay = this.currentPopup.querySelector('#ilm-loading-overlay');
        
        if (wordTitle) {
            wordTitle.textContent = word;
        }
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }

        // Show popup immediately with loading state
        this.currentPopup.style.display = 'block';
    }

    /**
     * Position popup optimally
     * @param {HTMLElement} element - Reference element
     * @param {string} preferredPosition - Preferred position
     */
    positionPopup(element, preferredPosition) {
        if (!element) {
            // Center on screen if no reference element
            this.centerPopup();
            return;
        }

        const rect = element.getBoundingClientRect();
        const popupRect = this.currentPopup.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let position = preferredPosition || this.settings.preferredPosition;
        
        // Smart positioning if requested
        if (position === 'smart') {
            position = this.calculateSmartPosition(rect, popupRect, viewport);
        }

        const coordinates = this.calculatePosition(rect, popupRect, viewport, position);
        
        this.currentPopup.style.left = `${coordinates.x + window.scrollX}px`;
        this.currentPopup.style.top = `${coordinates.y + window.scrollY}px`;
    }

    /**
     * Calculate smart position based on available space
     * @param {DOMRect} elementRect - Reference element rectangle
     * @param {DOMRect} popupRect - Popup rectangle
     * @param {Object} viewport - Viewport dimensions
     * @returns {string} Best position
     */
    calculateSmartPosition(elementRect, popupRect, viewport) {
        const spaceAbove = elementRect.top;
        const spaceBelow = viewport.height - elementRect.bottom;
        const spaceLeft = elementRect.left;
        const spaceRight = viewport.width - elementRect.right;

        // Prefer positioning below the element
        if (spaceBelow >= popupRect.height + 10) {
            return 'bottom';
        } else if (spaceAbove >= popupRect.height + 10) {
            return 'top';
        } else if (spaceRight >= popupRect.width + 10) {
            return 'right';
        } else if (spaceLeft >= popupRect.width + 10) {
            return 'left';
        } else {
            return 'center';
        }
    }

    /**
     * Calculate exact position coordinates
     * @param {DOMRect} elementRect - Reference element rectangle
     * @param {DOMRect} popupRect - Popup rectangle
     * @param {Object} viewport - Viewport dimensions
     * @param {string} position - Desired position
     * @returns {Object} X,Y coordinates
     */
    calculatePosition(elementRect, popupRect, viewport, position) {
        let x, y;

        switch (position) {
            case 'top':
                x = elementRect.left + elementRect.width / 2 - popupRect.width / 2;
                y = elementRect.top - popupRect.height - 10;
                break;
            case 'bottom':
                x = elementRect.left + elementRect.width / 2 - popupRect.width / 2;
                y = elementRect.bottom + 10;
                break;
            case 'left':
                x = elementRect.left - popupRect.width - 10;
                y = elementRect.top + elementRect.height / 2 - popupRect.height / 2;
                break;
            case 'right':
                x = elementRect.right + 10;
                y = elementRect.top + elementRect.height / 2 - popupRect.height / 2;
                break;
            default: // center
                x = viewport.width / 2 - popupRect.width / 2;
                y = viewport.height / 2 - popupRect.height / 2;
        }

        // Keep within viewport bounds
        x = Math.max(10, Math.min(x, viewport.width - popupRect.width - 10));
        y = Math.max(10, Math.min(y, viewport.height - popupRect.height - 10));

        return { x, y };
    }

    /**
     * Center popup on screen
     */
    centerPopup() {
        this.currentPopup.style.left = '50%';
        this.currentPopup.style.top = '50%';
        this.currentPopup.style.transform = 'translate(-50%, -50%) scale(0.9)';
    }

    /**
     * Update popup content with translation data
     */
    updatePopupContent() {
        if (!this.translationData) return;

        // Hide loading overlay
        const loadingOverlay = this.currentPopup.querySelector('#ilm-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

        // Update word title
        const wordTitle = this.currentPopup.querySelector('#ilm-bilingual-word-title');
        if (wordTitle) {
            wordTitle.textContent = this.currentWord;
        }

        // Update level selector
        this.updateLevelSelector();

        // Update main explanation
        this.updateMainExplanation();

        // Update learning aids if enabled
        if (this.settings.showLearningAids) {
            this.updateLearningAids();
        }

        // Update alternatives if available
        if (this.settings.showAlternatives && this.translationData.metadata.commonAlternatives) {
            this.updateAlternatives();
        }
    }

    /**
     * Update level selector state
     */
    updateLevelSelector() {
        const levelButtons = this.currentPopup.querySelectorAll('.ilm-level-btn');
        levelButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === this.currentLevel);
        });
    }

    /**
     * Update main explanation content
     */
    updateMainExplanation() {
        const levelExplanations = this.translationData.bilingualExplanations[this.currentLevel];
        if (!levelExplanations || levelExplanations.length === 0) return;

        const primaryExplanation = levelExplanations[0]; // Use the best explanation

        // Update explanation text
        const explanationText = this.currentPopup.querySelector('#ilm-explanation-text');
        if (explanationText) {
            explanationText.textContent = primaryExplanation.definition;
        }

        // Update simple example
        const simpleExample = this.currentPopup.querySelector('#ilm-simple-example');
        if (simpleExample) {
            simpleExample.textContent = primaryExplanation.simpleExample;
        }

        // Update key words
        this.updateKeyWords(primaryExplanation.keyWords);
    }

    /**
     * Update key words display
     * @param {Array} keyWords - Array of key words
     */
    updateKeyWords(keyWords) {
        const keyWordsContainer = this.currentPopup.querySelector('#ilm-key-words');
        if (!keyWordsContainer || !keyWords) return;

        keyWordsContainer.innerHTML = '';
        
        keyWords.forEach(word => {
            const keyWordElement = document.createElement('span');
            keyWordElement.className = 'ilm-key-word';
            keyWordElement.textContent = word;
            keyWordsContainer.appendChild(keyWordElement);
        });
    }

    /**
     * Update learning aids section
     */
    updateLearningAids() {
        const learningAids = this.translationData.learningAids;
        if (!learningAids) return;

        // Update memory aids
        this.updateMemoryAids(learningAids.mnemonics);

        // Update word family
        this.updateWordFamily(learningAids.wordFamily);
    }

    /**
     * Update memory aids
     * @param {Array} mnemonics - Memory aid techniques
     */
    updateMemoryAids(mnemonics) {
        const memoryAidsContainer = this.currentPopup.querySelector('#ilm-memory-aids');
        if (!memoryAidsContainer || !mnemonics) return;

        const memoryAidHTML = mnemonics.map(mnemonic => `
            <div class="ilm-memory-technique">
                <strong>${mnemonic.type}:</strong> ${mnemonic.example}
            </div>
        `).join('');

        memoryAidsContainer.innerHTML = memoryAidHTML;
    }

    /**
     * Update word family information
     * @param {Object} wordFamily - Word family data
     */
    updateWordFamily(wordFamily) {
        const wordFamilyContainer = this.currentPopup.querySelector('#ilm-word-family');
        if (!wordFamilyContainer || !wordFamily) return;

        wordFamilyContainer.textContent = 'Related words: develop, development, developer, developing';
    }

    /**
     * Update alternatives section
     */
    updateAlternatives() {
        const alternatives = this.translationData.metadata.commonAlternatives;
        const alternativesContainer = this.currentPopup.querySelector('#ilm-alternatives');
        
        if (!alternativesContainer || !alternatives) return;

        alternativesContainer.innerHTML = '';
        
        alternatives.forEach(alt => {
            const altElement = document.createElement('span');
            altElement.className = 'ilm-alternative';
            altElement.textContent = alt;
            altElement.addEventListener('click', () => {
                this.showBilingualTranslation(alt, { level: this.currentLevel });
            });
            alternativesContainer.appendChild(altElement);
        });
    }

    /**
     * Show popup with animation
     */
    showPopup() {
        if (!this.currentPopup) return;

        this.currentPopup.style.display = 'block';
        
        // Trigger animation
        requestAnimationFrame(() => {
            this.currentPopup.style.opacity = '1';
            this.currentPopup.style.transform = 'scale(1) translateY(0)';
        });

        // Dispatch event
        document.dispatchEvent(new CustomEvent('ilm-popup-open', {
            detail: { popup: this.currentPopup, type: 'bilingual', word: this.currentWord }
        }));
    }

    /**
     * Hide popup with animation
     */
    async hidePopup() {
        if (!this.currentPopup || this.currentPopup.style.display === 'none') return;

        // Animate out
        this.currentPopup.style.opacity = '0';
        this.currentPopup.style.transform = 'scale(0.9) translateY(-10px)';

        // Hide after animation
        setTimeout(() => {
            this.currentPopup.style.display = 'none';
            this.currentWord = null;
            this.translationData = null;
        }, this.animationDuration);

        // Clear auto-close timer
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }

        // Dispatch event
        document.dispatchEvent(new CustomEvent('ilm-popup-close', {
            detail: { popup: this.currentPopup, type: 'bilingual' }
        }));
    }

    /**
     * Switch to different complexity level
     * @param {string} level - New level
     */
    switchLevel(level) {
        if (level === this.currentLevel || !this.translationData) return;

        this.currentLevel = level;
        
        // Update UI
        this.updateLevelSelector();
        this.updateMainExplanation();

        // Log level change for adaptive learning
        if (window.ilmBilingualEngine.updateUserLevel) {
            window.ilmBilingualEngine.updateUserLevel(this.currentWord, level);
        }

        // Animate the change
        const explanationSection = this.currentPopup.querySelector('#ilm-explanation-section');
        if (explanationSection && window.ilmUIOptimizer) {
            window.ilmUIOptimizer.animate(explanationSection, 'fadeIn');
        }
    }

    /**
     * Toggle learning aids visibility
     */
    toggleLearningAids() {
        const learningAids = this.currentPopup.querySelector('#ilm-learning-aids');
        const toggleBtn = this.currentPopup.querySelector('#ilm-toggle-aids-btn');
        
        if (!learningAids || !toggleBtn) return;

        const isVisible = learningAids.style.display !== 'none';
        
        if (isVisible) {
            learningAids.style.display = 'none';
            toggleBtn.querySelector('.ilm-action-text').textContent = 'Show Aids';
        } else {
            learningAids.style.display = 'block';
            toggleBtn.querySelector('.ilm-action-text').textContent = 'Hide Aids';
            
            // Animate in
            if (window.ilmUIOptimizer) {
                window.ilmUIOptimizer.animate(learningAids, 'fadeIn');
            }
        }
    }

    /**
     * Bookmark current word
     */
    async bookmarkCurrentWord() {
        if (!this.currentWord || !window.ilmLearningManager) return;

        try {
            await window.ilmLearningManager.bookmarkWord(this.currentWord, {
                source: 'bilingual-popup',
                level: this.currentLevel,
                timestamp: Date.now(),
                context: this.translationData?.context
            });

            // Show success feedback
            this.showNotification(`⭐ Bookmarked: "${this.currentWord}"`);
            
            // Update button state
            const bookmarkBtn = this.currentPopup.querySelector('#ilm-bookmark-word-btn');
            if (bookmarkBtn) {
                bookmarkBtn.style.background = '#48bb78';
                bookmarkBtn.style.color = 'white';
                setTimeout(() => {
                    bookmarkBtn.style.background = '';
                    bookmarkBtn.style.color = '';
                }, 2000);
            }

        } catch (error) {
            console.error('❌ ILM: Bookmark failed:', error);
            this.showNotification('Bookmark failed', 'error');
        }
    }

    /**
     * Practice current word
     */
    practiceCurrentWord() {
        if (!this.currentWord) return;

        try {
            if (window.ilmUniversalProcessor?.previewSystem) {
                const practiceData = [{
                    word: this.currentWord,
                    level: this.currentLevel,
                    definitions: this.translationData?.bilingualExplanations[this.currentLevel] || [],
                    frequency: this.translationData?.metadata.frequency || 1000
                }];

                window.ilmUniversalProcessor.previewSystem.currentWords = practiceData;
                window.ilmUniversalProcessor.previewSystem.startPractice();
                
                this.hidePopup();
                this.showNotification(`🎯 Starting practice with: "${this.currentWord}"`);
            } else {
                this.showNotification('Practice system not available', 'error');
            }
        } catch (error) {
            console.error('❌ ILM: Practice failed:', error);
            this.showNotification('Practice failed', 'error');
        }
    }

    /**
     * Setup auto-close timer
     */
    setupAutoClose() {
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
        }

        this.autoCloseTimer = setTimeout(() => {
            this.hidePopup();
        }, this.settings.autoCloseDelay);
    }

    /**
     * Show error state
     * @param {string} message - Error message
     */
    showError(message) {
        const explanationText = this.currentPopup.querySelector('#ilm-explanation-text');
        const loadingOverlay = this.currentPopup.querySelector('#ilm-loading-overlay');
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        if (explanationText) {
            explanationText.textContent = `❌ ${message}`;
            explanationText.style.color = '#e53e3e';
        }

        this.showPopup();
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        if (window.ilmUIIntegrationEnhancer?.showUnifiedNotification) {
            window.ilmUIIntegrationEnhancer.showUnifiedNotification(message, type);
        } else {
            console.log(`📢 ILM: ${message}`);
        }
    }

    /**
     * Log bilingual usage for analytics
     * @param {string} word - Looked up word
     * @param {string} level - Selected level
     */
    logBilingualUsage(word, level) {
        console.log(`📊 ILM: Bilingual lookup - Word: ${word}, Level: ${level}`);
        
        // This could be expanded to track:
        // - Most frequently looked up words
        // - Preferred complexity levels
        // - Learning progress patterns
        // - Time spent on different levels
    }

    /**
     * Check if popup is currently visible
     * @returns {boolean} True if visible
     */
    isVisible() {
        return this.currentPopup && this.currentPopup.style.display !== 'none';
    }

    /**
     * Get current translation data
     * @returns {Object} Current translation data
     */
    getCurrentData() {
        return {
            word: this.currentWord,
            level: this.currentLevel,
            data: this.translationData
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
                bilingualPopupSettings: this.settings
            });
            
            console.log('💾 ILM: Bilingual popup settings updated');
        } catch (error) {
            console.error('❌ ILM: Failed to save bilingual popup settings:', error);
        }
    }
}

// Additional CSS styles for bilingual popup
const bilingualPopupStyles = `
<style id="ilm-bilingual-popup-styles">
.ilm-bilingual-popup {
    font-size: 14px;
    line-height: 1.5;
}

.ilm-bilingual-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 12px 12px 0 0;
}

.ilm-header-controls {
    display: flex;
    align-items: center;
    gap: 12px;
}

.ilm-level-selector {
    display: flex;
    gap: 2px;
    background: rgba(255, 255, 255, 0.2);
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
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
}

.ilm-level-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    color: white;
}

.ilm-level-btn.active {
    background: white;
    color: #667eea;
    font-weight: 600;
}

.ilm-popup-close {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.15s ease;
}

.ilm-popup-close:hover {
    background: rgba(255, 255, 255, 0.2);
}

.ilm-bilingual-content {
    padding: 20px;
}

.ilm-explanation-section {
    margin-bottom: 20px;
}

.ilm-explanation-text {
    color: #2d3748;
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 12px;
}

.ilm-simple-example {
    background: linear-gradient(135deg, #e6fffa, #b2f5ea);
    padding: 12px 16px;
    border-radius: 8px;
    font-style: italic;
    color: #2c7a7b;
    margin-bottom: 12px;
    border-left: 4px solid #38b2ac;
}

.ilm-key-words {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}

.ilm-key-word {
    background: linear-gradient(135deg, #fed7e2, #fbb6ce);
    color: #97266d;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
}

.ilm-learning-aids {
    border-top: 1px solid #e2e8f0;
    padding-top: 16px;
    margin-top: 16px;
}

.ilm-aid-section {
    margin-bottom: 16px;
}

.ilm-aid-title {
    font-weight: 600;
    color: #2d3748;
    font-size: 0.875rem;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.ilm-aid-content {
    color: #4a5568;
    font-size: 0.875rem;
    line-height: 1.5;
}

.ilm-alternatives {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.ilm-alternative {
    background: linear-gradient(135deg, #e6fffa, #b2f5ea);
    color: #319795;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
}

.ilm-alternative:hover {
    background: linear-gradient(135deg, #319795, #2c7a7b);
    color: white;
    transform: translateY(-1px);
}

.ilm-popup-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
}

.ilm-action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    color: #4a5568;
    transition: all 0.15s ease;
}

.ilm-action-btn:hover {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border-color: #667eea;
    transform: translateY(-1px);
}

.ilm-action-icon {
    font-size: 1rem;
}

.ilm-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    backdrop-filter: blur(5px);
}

.ilm-loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
}

.ilm-loading-text {
    color: #4a5568;
    font-size: 0.875rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.ilm-memory-technique {
    margin-bottom: 8px;
    padding: 8px 12px;
    background: #f7fafc;
    border-radius: 6px;
    border-left: 3px solid #667eea;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
    .ilm-bilingual-popup {
        background: #2d3748;
        color: #e2e8f0;
        border-color: #4a5568;
    }
    
    .ilm-explanation-text {
        color: #e2e8f0;
    }
    
    .ilm-aid-content {
        color: #a0aec0;
    }
    
    .ilm-loading-overlay {
        background: rgba(45, 55, 72, 0.95);
    }
    
    .ilm-memory-technique {
        background: #4a5568;
        border-color: #667eea;
    }
}

/* Mobile responsiveness */
@media (max-width: 480px) {
    .ilm-bilingual-popup {
        max-width: 95vw;
        margin: 10px;
    }
    
    .ilm-level-selector {
        flex-direction: column;
        gap: 1px;
    }
    
    .ilm-level-btn {
        padding: 6px 8px;
        font-size: 0.75rem;
    }
    
    .ilm-popup-actions {
        flex-direction: column;
        gap: 6px;
    }
}
</style>
`;

// Add styles to document
if (!document.getElementById('ilm-bilingual-popup-styles')) {
    document.head.insertAdjacentHTML('beforeend', bilingualPopupStyles);
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.BilingualPopup = BilingualPopup;
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmBilingualPopup) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ilmBilingualPopup = new BilingualPopup();
        });
    } else {
        window.ilmBilingualPopup = new BilingualPopup();
    }
}