// Immersive Language Master - Keyboard Shortcuts System
// Comprehensive keyboard shortcut management with customizable bindings and help system

class KeyboardShortcutsManager {
    constructor() {
        this.isEnabled = true;
        this.shortcuts = new Map();
        this.activeModifiers = new Set();
        this.keySequence = [];
        this.sequenceTimeout = null;
        this.helpVisible = false;
        this.conflictResolver = null;
        
        this.initializeShortcuts();
    }

    async initializeShortcuts() {
        try {
            // Load user preferences and custom shortcuts
            await this.loadShortcutSettings();
            
            // Register default shortcuts
            this.registerDefaultShortcuts();
            
            // Create help overlay
            this.createHelpOverlay();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize conflict detection
            this.initializeConflictDetection();
            
            console.log('⌨️ ILM: Keyboard Shortcuts Manager initialized successfully');
        } catch (error) {
            console.error('❌ ILM: Keyboard Shortcuts initialization failed:', error);
        }
    }

    /**
     * Load user shortcut settings
     */
    async loadShortcutSettings() {
        try {
            const result = await chrome.storage.local.get(['keyboardShortcutsSettings', 'customShortcuts']);
            this.settings = result.keyboardShortcutsSettings || this.getDefaultSettings();
            this.customShortcuts = result.customShortcuts || {};
        } catch (error) {
            console.error('❌ ILM: Failed to load shortcut settings:', error);
            this.settings = this.getDefaultSettings();
            this.customShortcuts = {};
        }
    }

    /**
     * Get default shortcut settings
     */
    getDefaultSettings() {
        return {
            enabled: true,
            showHelpOnStartup: false,
            enableSequenceShortcuts: true,
            sequenceTimeout: 2000,
            enableConflictDetection: true,
            enableCustomShortcuts: true,
            showNotifications: true,
            enableGlobalShortcuts: true,
            enableContextualShortcuts: true
        };
    }

    /**
     * Register all default keyboard shortcuts
     */
    registerDefaultShortcuts() {
        // Learning and Translation Shortcuts
        this.registerShortcut('Ctrl+Shift+T', {
            name: 'Quick Translate',
            description: 'Translate selected text',
            category: 'Translation',
            action: () => this.executeAction('quickTranslate'),
            requiresSelection: true
        });

        this.registerShortcut('Ctrl+Shift+D', {
            name: 'Quick Definition',
            description: 'Show definition for selected word',
            category: 'Translation',
            action: () => this.executeAction('quickDefine'),
            requiresSelection: true
        });

        this.registerShortcut('Ctrl+Shift+P', {
            name: 'Pronounce',
            description: 'Speak selected text',
            category: 'Translation',
            action: () => this.executeAction('quickPronounce'),
            requiresSelection: true
        });

        this.registerShortcut('Ctrl+Shift+F', {
            name: 'Quick Lookup',
            description: 'Open quick lookup widget',
            category: 'Search',
            action: () => this.executeAction('openQuickLookup')
        });

        // Learning Management Shortcuts
        this.registerShortcut('Ctrl+Shift+B', {
            name: 'Bookmark Word',
            description: 'Bookmark selected word',
            category: 'Learning',
            action: () => this.executeAction('bookmarkWord'),
            requiresSelection: true
        });

        this.registerShortcut('Ctrl+Shift+L', {
            name: 'Learning Dashboard',
            description: 'Toggle learning dashboard',
            category: 'Learning',
            action: () => this.executeAction('toggleDashboard')
        });

        this.registerShortcut('Ctrl+Shift+R', {
            name: 'Start Review',
            description: 'Start spaced repetition review',
            category: 'Learning',
            action: () => this.executeAction('startReview')
        });

        // Text Selection Shortcuts
        this.registerShortcut('Ctrl+Shift+C', {
            name: 'Enhanced Copy',
            description: 'Copy with metadata',
            category: 'Selection',
            action: () => this.executeAction('enhancedCopy'),
            requiresSelection: true
        });

        this.registerShortcut('Ctrl+Shift+S', {
            name: 'Speak Selection',
            description: 'Speak selected text',
            category: 'Selection',
            action: () => this.executeAction('speakSelection'),
            requiresSelection: true
        });

        // Practice and Testing Shortcuts
        this.registerShortcut('Ctrl+Shift+E', {
            name: 'Practice Mode',
            description: 'Start practice session',
            category: 'Practice',
            action: () => this.executeAction('startPractice')
        });

        this.registerShortcut('Ctrl+Shift+V', {
            name: 'Vocabulary Test',
            description: 'Start vocabulary assessment',
            category: 'Practice',
            action: () => this.executeAction('startVocabTest')
        });

        // System and UI Shortcuts
        this.registerShortcut('Ctrl+Shift+H', {
            name: 'Show Help',
            description: 'Show keyboard shortcuts help',
            category: 'System',
            action: () => this.toggleHelp()
        });

        this.registerShortcut('Ctrl+Shift+/', {
            name: 'Quick Help',
            description: 'Show contextual help',
            category: 'System',
            action: () => this.showContextualHelp()
        });

        this.registerShortcut('Escape', {
            name: 'Cancel/Close',
            description: 'Close current dialog or cancel action',
            category: 'System',
            action: () => this.executeAction('cancel'),
            global: true
        });

        // Advanced Feature Shortcuts (Sequence-based)
        if (this.settings.enableSequenceShortcuts) {
            // Translation sequences (g + letter)
            this.registerSequence('g t', {
                name: 'Google Translate',
                description: 'Translate with Google',
                category: 'Translation',
                action: () => this.executeAction('translateWithGoogle'),
                requiresSelection: true
            });

            this.registerSequence('g d', {
                name: 'Deep Lookup',
                description: 'Detailed word analysis',
                category: 'Translation',
                action: () => this.executeAction('deepLookup'),
                requiresSelection: true
            });

            // Learning sequences (l + letter)
            this.registerSequence('l b', {
                name: 'Browse Bookmarks',
                description: 'Open bookmarks view',
                category: 'Learning',
                action: () => this.executeAction('browseBookmarks')
            });

            this.registerSequence('l s', {
                name: 'Learning Stats',
                description: 'Show learning statistics',
                category: 'Learning',
                action: () => this.executeAction('showStats')
            });

            this.registerSequence('l h', {
                name: 'Learning History',
                description: 'Show learning history',
                category: 'Learning',
                action: () => this.executeAction('showHistory')
            });

            // Practice sequences (p + letter)
            this.registerSequence('p r', {
                name: 'Practice Random',
                description: 'Practice random words',
                category: 'Practice',
                action: () => this.executeAction('practiceRandom')
            });

            this.registerSequence('p d', {
                name: 'Practice Due',
                description: 'Practice due words',
                category: 'Practice',
                action: () => this.executeAction('practiceDue')
            });

            this.registerSequence('p f', {
                name: 'Practice Favorites',
                description: 'Practice favorite words',
                category: 'Practice',
                action: () => this.executeAction('practiceFavorites')
            });

            // System sequences (s + letter)
            this.registerSequence('s e', {
                name: 'Export Data',
                description: 'Export learning data',
                category: 'System',
                action: () => this.executeAction('exportData')
            });

            this.registerSequence('s i', {
                name: 'Import Data',
                description: 'Import learning data',
                category: 'System',
                action: () => this.executeAction('importData')
            });

            this.registerSequence('s s', {
                name: 'Settings',
                description: 'Open ILM settings',
                category: 'System',
                action: () => this.executeAction('openSettings')
            });
        }
    }

    /**
     * Register a keyboard shortcut
     * @param {string} keys - Key combination (e.g., 'Ctrl+Shift+T')
     * @param {Object} shortcut - Shortcut configuration
     */
    registerShortcut(keys, shortcut) {
        const normalizedKeys = this.normalizeKeys(keys);
        
        // Check for conflicts
        if (this.settings.enableConflictDetection && this.shortcuts.has(normalizedKeys)) {
            console.warn(`⚠️ ILM: Shortcut conflict detected for ${keys}`);
            if (this.conflictResolver) {
                this.conflictResolver.resolve(normalizedKeys, shortcut);
            }
        }

        this.shortcuts.set(normalizedKeys, {
            ...shortcut,
            keys: normalizedKeys,
            originalKeys: keys,
            type: 'single'
        });
    }

    /**
     * Register a key sequence shortcut
     * @param {string} sequence - Key sequence (e.g., 'g t')
     * @param {Object} shortcut - Shortcut configuration
     */
    registerSequence(sequence, shortcut) {
        const normalizedSequence = sequence.toLowerCase().replace(/\s+/g, ' ');
        
        this.shortcuts.set(`sequence:${normalizedSequence}`, {
            ...shortcut,
            sequence: normalizedSequence,
            type: 'sequence'
        });
    }

    /**
     * Setup event listeners for keyboard events
     */
    setupEventListeners() {
        // Main keydown handler
        document.addEventListener('keydown', (e) => {
            if (!this.settings.enabled) return;
            
            this.handleKeyDown(e);
        });

        // Keyup handler for modifier tracking
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });

        // Focus events to manage context
        document.addEventListener('focusin', (e) => {
            this.updateContext(e.target);
        });

        // Prevent default for registered shortcuts in input fields
        document.addEventListener('keydown', (e) => {
            if (this.shouldPreventDefault(e)) {
                e.preventDefault();
            }
        }, true);
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        // Update modifier tracking
        this.updateModifiers(e);

        // Build current key combination
        const currentKeys = this.buildKeyString(e);
        
        // Handle escape key specially
        if (e.key === 'Escape') {
            this.handleEscape();
            return;
        }

        // Check for direct shortcut match
        if (this.shortcuts.has(currentKeys)) {
            const shortcut = this.shortcuts.get(currentKeys);
            if (this.canExecuteShortcut(shortcut)) {
                e.preventDefault();
                this.executeShortcut(shortcut);
                return;
            }
        }

        // Handle sequence shortcuts
        if (this.settings.enableSequenceShortcuts && !this.hasModifiers(e)) {
            this.handleSequenceKey(e);
        }
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyUp(e) {
        this.updateModifiers(e, false);
    }

    /**
     * Handle sequence key input
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleSequenceKey(e) {
        // Ignore modifier keys and special keys
        if (e.key.length > 1 && !['Space', 'Enter'].includes(e.key)) {
            return;
        }

        const key = e.key.toLowerCase();
        
        // Add to sequence
        this.keySequence.push(key);
        
        // Clear sequence timeout
        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
        }

        // Check for sequence match
        const sequenceString = this.keySequence.join(' ');
        const sequenceKey = `sequence:${sequenceString}`;
        
        if (this.shortcuts.has(sequenceKey)) {
            const shortcut = this.shortcuts.get(sequenceKey);
            if (this.canExecuteShortcut(shortcut)) {
                e.preventDefault();
                this.executeShortcut(shortcut);
                this.clearSequence();
                return;
            }
        }

        // Set timeout to clear sequence
        this.sequenceTimeout = setTimeout(() => {
            this.clearSequence();
        }, this.settings.sequenceTimeout);
    }

    /**
     * Execute a keyboard shortcut
     * @param {Object} shortcut - Shortcut to execute
     */
    executeShortcut(shortcut) {
        try {
            // Show notification if enabled
            if (this.settings.showNotifications) {
                this.showShortcutNotification(shortcut);
            }

            // Execute the action
            if (typeof shortcut.action === 'function') {
                shortcut.action();
            } else if (typeof shortcut.action === 'string') {
                this.executeAction(shortcut.action);
            }

            // Log usage for analytics
            this.logShortcutUsage(shortcut);

        } catch (error) {
            console.error('❌ ILM: Shortcut execution failed:', error);
            this.showNotification('Shortcut execution failed', 'error');
        }
    }

    /**
     * Execute predefined actions
     * @param {string} actionName - Name of action to execute
     */
    executeAction(actionName) {
        const actions = {
            // Translation actions
            quickTranslate: () => {
                if (window.ilmContextMenu?.quickTranslate) {
                    window.ilmContextMenu.quickTranslate();
                }
            },

            quickDefine: () => {
                if (window.ilmContextMenu?.quickDefine) {
                    window.ilmContextMenu.quickDefine();
                }
            },

            quickPronounce: () => {
                if (window.ilmContextMenu?.quickPronounce) {
                    window.ilmContextMenu.quickPronounce();
                }
            },

            translateWithGoogle: () => {
                if (window.ilmContextMenu?.translateToLanguage) {
                    window.ilmContextMenu.translateToLanguage('zh');
                }
            },

            deepLookup: () => {
                if (window.ilmContextMenu?.deepLookup) {
                    window.ilmContextMenu.deepLookup();
                }
            },

            // Search actions
            openQuickLookup: () => {
                if (window.ilmQuickLookup?.showSearchWidget) {
                    window.ilmQuickLookup.showSearchWidget();
                }
            },

            // Learning actions
            bookmarkWord: () => {
                if (window.ilmTextSelectionEnhancer?.bookmarkSelection) {
                    window.ilmTextSelectionEnhancer.bookmarkSelection();
                }
            },

            toggleDashboard: () => {
                if (window.ilmLearningDashboard?.toggleDashboard) {
                    window.ilmLearningDashboard.toggleDashboard();
                }
            },

            startReview: () => {
                if (window.ilmLearningDashboard?.startReviewSession) {
                    window.ilmLearningDashboard.startReviewSession();
                }
            },

            browseBookmarks: () => {
                if (window.ilmLearningDashboard) {
                    window.ilmLearningDashboard.showDashboard();
                    window.ilmLearningDashboard.switchView('bookmarks');
                }
            },

            showStats: () => {
                if (window.ilmLearningDashboard) {
                    window.ilmLearningDashboard.showDashboard();
                    window.ilmLearningDashboard.switchView('stats');
                }
            },

            showHistory: () => {
                if (window.ilmQuickLookup?.showHistory) {
                    window.ilmQuickLookup.showHistory();
                }
            },

            // Selection actions
            enhancedCopy: () => {
                if (window.ilmTextSelectionEnhancer?.enhancedCopy) {
                    window.ilmTextSelectionEnhancer.enhancedCopy();
                }
            },

            speakSelection: () => {
                if (window.ilmTextSelectionEnhancer?.speakSelection) {
                    window.ilmTextSelectionEnhancer.speakSelection();
                }
            },

            // Practice actions
            startPractice: () => {
                if (window.ilmUniversalProcessor?.previewSystem?.startPractice) {
                    window.ilmUniversalProcessor.previewSystem.startPractice();
                }
            },

            startVocabTest: async () => {
                // Load vocabulary test system and start test
                try {
                    // Load test system if not already loaded
                    if (!window.ilmVocabularyTest) {
                        await this.loadVocabularyTestSystem();
                    }
                    
                    // Get words from learning manager
                    const words = await this.getTestWords();
                    if (words.length === 0) {
                        this.showNotification('No words available for testing');
                        return;
                    }
                    
                    // Create and show test UI
                    this.showVocabularyTestUI(words);
                    this.showNotification('Vocabulary test started!');
                } catch (error) {
                    console.error('Failed to start vocabulary test:', error);
                    this.showNotification('Failed to start test');
                }
            },

            practiceRandom: async () => {
                // Start random practice mode
                try {
                    // Get random words from learning manager
                    const words = await this.getRandomPracticeWords();
                    if (words.length === 0) {
                        this.showNotification('No words available for practice');
                        return;
                    }
                    
                    // Start practice session
                    this.startPracticeSession(words, 'random');
                    this.showNotification('Random practice started!');
                } catch (error) {
                    console.error('Failed to start practice:', error);
                    this.showNotification('Failed to start practice');
                }
            },

            practiceDue: () => {
                if (window.ilmLearningDashboard?.startReviewSession) {
                    window.ilmLearningDashboard.startReviewSession();
                }
            },

            practiceFavorites: async () => {
                // Start favorites practice mode
                try {
                    // Get favorite words from learning manager
                    const words = await this.getFavoritePracticeWords();
                    if (words.length === 0) {
                        this.showNotification('No favorite words available');
                        return;
                    }
                    
                    // Start practice session
                    this.startPracticeSession(words, 'favorites');
                    this.showNotification('Favorites practice started!');
                } catch (error) {
                    console.error('Failed to start favorites practice:', error);
                    this.showNotification('Failed to start practice');
                }
            },

            // System actions
            exportData: () => {
                if (window.ilmLearningDashboard?.exportData) {
                    window.ilmLearningDashboard.exportData();
                }
            },

            importData: () => {
                // Create file input and trigger import
                this.showImportDialog();
            },

            openSettings: () => {
                // Open settings page
                this.showSettingsUI();
            },

            cancel: () => {
                this.handleCancel();
            }
        };

        if (actions[actionName]) {
            actions[actionName]();
        } else {
            console.warn(`⚠️ ILM: Unknown action: ${actionName}`);
        }
    }

    /**
     * Handle escape key and cancel actions
     */
    handleEscape() {
        // Clear sequence
        this.clearSequence();

        // Close help if visible
        if (this.helpVisible) {
            this.hideHelp();
            return;
        }

        // Execute cancel action
        this.executeAction('cancel');
    }

    /**
     * Handle cancel action
     */
    handleCancel() {
        // Close various UI elements
        const elements = [
            { obj: window.ilmLearningDashboard, method: 'hideDashboard' },
            { obj: window.ilmQuickLookup, method: 'hideSearchWidget' },
            { obj: window.ilmTextSelectionEnhancer, method: 'clearSelection' },
            { obj: window.ilmContextMenu, method: 'hideContextMenu' }
        ];

        elements.forEach(({ obj, method }) => {
            if (obj && obj[method]) {
                obj[method]();
            }
        });
    }

    /**
     * Check if shortcut can be executed
     * @param {Object} shortcut - Shortcut to check
     * @returns {boolean} True if can execute
     */
    canExecuteShortcut(shortcut) {
        // Check if selection is required
        if (shortcut.requiresSelection) {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            if (!selectedText || selectedText.length === 0) {
                this.showNotification('Text selection required for this action', 'warning');
                return false;
            }
        }

        // Check context restrictions
        if (shortcut.context && !this.matchesContext(shortcut.context)) {
            return false;
        }

        return true;
    }

    /**
     * Check if current context matches requirement
     * @param {string|Array} context - Required context
     * @returns {boolean} True if matches
     */
    matchesContext(context) {
        const activeElement = document.activeElement;
        const contexts = Array.isArray(context) ? context : [context];
        
        return contexts.some(ctx => {
            switch (ctx) {
                case 'input':
                    return ['INPUT', 'TEXTAREA'].includes(activeElement.tagName) || 
                           activeElement.contentEditable === 'true';
                case 'not-input':
                    return !['INPUT', 'TEXTAREA'].includes(activeElement.tagName) && 
                           activeElement.contentEditable !== 'true';
                case 'page':
                    return activeElement === document.body || 
                           activeElement === document.documentElement;
                default:
                    return true;
            }
        });
    }

    /**
     * Show shortcut execution notification
     * @param {Object} shortcut - Executed shortcut
     */
    showShortcutNotification(shortcut) {
        const message = `⌨️ ${shortcut.name}`;
        this.showNotification(message, 'info', 1500);
    }

    /**
     * Create help overlay
     */
    createHelpOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'ilm-shortcuts-help';
        overlay.className = 'ilm-shortcuts-help-overlay';
        overlay.innerHTML = this.generateHelpHTML();

        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10050;
            display: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(10px);
        `;

        document.body.appendChild(overlay);
        this.helpOverlay = overlay;

        // Setup help event listeners
        this.setupHelpEventListeners();
    }

    /**
     * Generate help overlay HTML
     */
    generateHelpHTML() {
        const categories = this.groupShortcutsByCategory();
        
        return `
            <div class="ilm-help-container">
                <div class="ilm-help-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="ilm-help-close" title="Close (Esc)">&times;</button>
                </div>
                
                <div class="ilm-help-content">
                    ${Object.entries(categories).map(([category, shortcuts]) => `
                        <div class="ilm-help-category">
                            <h3>${category}</h3>
                            <div class="ilm-help-shortcuts">
                                ${shortcuts.map(shortcut => `
                                    <div class="ilm-help-shortcut">
                                        <div class="ilm-help-keys">
                                            ${this.formatKeysForDisplay(shortcut)}
                                        </div>
                                        <div class="ilm-help-description">
                                            <div class="ilm-help-name">${shortcut.name}</div>
                                            <div class="ilm-help-desc">${shortcut.description}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="ilm-help-footer">
                    <div class="ilm-help-info">
                        <p>Press <kbd>Ctrl+Shift+H</kbd> to toggle this help</p>
                        <p>Sequence shortcuts: Type the keys in order (e.g., "g" then "t" for Google Translate)</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Group shortcuts by category
     */
    groupShortcutsByCategory() {
        const categories = {};
        
        for (const shortcut of this.shortcuts.values()) {
            const category = shortcut.category || 'Other';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(shortcut);
        }

        // Sort shortcuts within each category
        Object.keys(categories).forEach(category => {
            categories[category].sort((a, b) => a.name.localeCompare(b.name));
        });

        return categories;
    }

    /**
     * Format keys for display in help
     * @param {Object} shortcut - Shortcut object
     * @returns {string} Formatted keys HTML
     */
    formatKeysForDisplay(shortcut) {
        if (shortcut.type === 'sequence') {
            return shortcut.sequence.split(' ').map(key => `<kbd>${key}</kbd>`).join(' → ');
        } else {
            return shortcut.originalKeys.split('+').map(key => `<kbd>${key}</kbd>`).join(' + ');
        }
    }

    /**
     * Setup help overlay event listeners
     */
    setupHelpEventListeners() {
        if (!this.helpOverlay) return;

        // Close button
        this.helpOverlay.querySelector('.ilm-help-close')?.addEventListener('click', () => {
            this.hideHelp();
        });

        // Click outside to close
        this.helpOverlay.addEventListener('click', (e) => {
            if (e.target === this.helpOverlay) {
                this.hideHelp();
            }
        });
    }

    /**
     * Show keyboard shortcuts help
     */
    showHelp() {
        if (!this.helpOverlay) return;

        this.helpVisible = true;
        this.helpOverlay.style.display = 'flex';
        this.helpOverlay.style.justifyContent = 'center';
        this.helpOverlay.style.alignItems = 'center';
        this.helpOverlay.style.opacity = '0';

        requestAnimationFrame(() => {
            this.helpOverlay.style.transition = 'opacity 0.3s ease';
            this.helpOverlay.style.opacity = '1';
        });
    }

    /**
     * Hide keyboard shortcuts help
     */
    hideHelp() {
        if (!this.helpOverlay || !this.helpVisible) return;

        this.helpVisible = false;
        this.helpOverlay.style.opacity = '0';

        setTimeout(() => {
            this.helpOverlay.style.display = 'none';
        }, 300);
    }

    /**
     * Toggle help visibility
     */
    toggleHelp() {
        if (this.helpVisible) {
            this.hideHelp();
        } else {
            this.showHelp();
        }
    }

    /**
     * Show contextual help
     */
    showContextualHelp() {
        const activeElement = document.activeElement;
        let contextualShortcuts = [];

        // Get contextual shortcuts based on current focus
        if (window.ilmLearningDashboard?.isVisible) {
            contextualShortcuts = this.getShortcutsForContext('learning');
        } else if (window.ilmQuickLookup?.isWidgetVisible()) {
            contextualShortcuts = this.getShortcutsForContext('search');
        } else if (window.getSelection().toString().trim()) {
            contextualShortcuts = this.getShortcutsForContext('selection');
        } else {
            contextualShortcuts = this.getShortcutsForContext('general');
        }

        this.showContextualHelpPopup(contextualShortcuts);
    }

    /**
     * Get shortcuts for specific context
     * @param {string} context - Context name
     * @returns {Array} Relevant shortcuts
     */
    getShortcutsForContext(context) {
        const contextMappings = {
            learning: ['Learning', 'Practice'],
            search: ['Search', 'Translation'],
            selection: ['Selection', 'Translation'],
            general: ['System', 'Translation']
        };

        const relevantCategories = contextMappings[context] || ['System'];
        const shortcuts = [];

        for (const shortcut of this.shortcuts.values()) {
            if (relevantCategories.includes(shortcut.category)) {
                shortcuts.push(shortcut);
            }
        }

        return shortcuts.slice(0, 5); // Limit to 5 most relevant
    }

    /**
     * Show contextual help popup
     * @param {Array} shortcuts - Shortcuts to show
     */
    showContextualHelpPopup(shortcuts) {
        const popup = document.createElement('div');
        popup.className = 'ilm-contextual-help-popup';
        popup.innerHTML = `
            <div class="ilm-contextual-help-content">
                <h4>💡 Quick Shortcuts</h4>
                <div class="ilm-contextual-shortcuts">
                    ${shortcuts.map(shortcut => `
                        <div class="ilm-contextual-shortcut">
                            <span class="ilm-contextual-keys">${this.formatKeysForDisplay(shortcut)}</span>
                            <span class="ilm-contextual-name">${shortcut.name}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="ilm-contextual-footer">
                    Press <kbd>Ctrl+Shift+H</kbd> for all shortcuts
                </div>
            </div>
        `;

        popup.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            z-index: 10040;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
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
     * Update modifier key tracking
     * @param {KeyboardEvent} e - Keyboard event
     * @param {boolean} isPressed - True if key is pressed
     */
    updateModifiers(e, isPressed = true) {
        const modifiers = ['ctrl', 'shift', 'alt', 'meta'];
        
        modifiers.forEach(mod => {
            const key = `${mod}Key`;
            if (e[key] !== undefined) {
                if (isPressed && e[key]) {
                    this.activeModifiers.add(mod);
                } else if (!isPressed) {
                    this.activeModifiers.delete(mod);
                }
            }
        });
    }

    /**
     * Build key string from event
     * @param {KeyboardEvent} e - Keyboard event
     * @returns {string} Key combination string
     */
    buildKeyString(e) {
        const parts = [];
        
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        if (e.metaKey) parts.push('Meta');
        
        // Add the main key
        let key = e.key;
        if (key === ' ') key = 'Space';
        if (key.length === 1) key = key.toUpperCase();
        
        parts.push(key);
        
        return parts.join('+');
    }

    /**
     * Normalize key string for consistent comparison
     * @param {string} keys - Key combination string
     * @returns {string} Normalized key string
     */
    normalizeKeys(keys) {
        return keys.split('+')
            .map(key => key.trim())
            .sort((a, b) => {
                const order = ['Ctrl', 'Alt', 'Shift', 'Meta'];
                const aIndex = order.indexOf(a);
                const bIndex = order.indexOf(b);
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return a.localeCompare(b);
            })
            .join('+');
    }

    /**
     * Check if event has modifier keys
     * @param {KeyboardEvent} e - Keyboard event
     * @returns {boolean} True if has modifiers
     */
    hasModifiers(e) {
        return e.ctrlKey || e.altKey || e.shiftKey || e.metaKey;
    }

    /**
     * Check if default should be prevented
     * @param {KeyboardEvent} e - Keyboard event
     * @returns {boolean} True if should prevent default
     */
    shouldPreventDefault(e) {
        const keyString = this.buildKeyString(e);
        const shortcut = this.shortcuts.get(keyString);
        
        if (!shortcut) return false;
        
        // Prevent default for registered shortcuts in input fields
        const activeElement = document.activeElement;
        const isInputField = ['INPUT', 'TEXTAREA'].includes(activeElement.tagName) ||
                            activeElement.contentEditable === 'true';
        
        return isInputField && this.canExecuteShortcut(shortcut);
    }

    /**
     * Clear key sequence
     */
    clearSequence() {
        this.keySequence = [];
        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
            this.sequenceTimeout = null;
        }
    }

    /**
     * Update context tracking
     * @param {Element} element - Active element
     */
    updateContext(element) {
        this.activeElement = element;
        this.context = this.determineContext(element);
    }

    /**
     * Determine current context
     * @param {Element} element - Active element
     * @returns {string} Context name
     */
    determineContext(element) {
        if (['INPUT', 'TEXTAREA'].includes(element.tagName)) {
            return 'input';
        }
        if (element.contentEditable === 'true') {
            return 'editable';
        }
        return 'page';
    }

    /**
     * Log shortcut usage for analytics
     * @param {Object} shortcut - Used shortcut
     */
    logShortcutUsage(shortcut) {
        // TODO: Implement usage analytics
        console.log(`📊 ILM: Shortcut used: ${shortcut.name}`);
    }

    /**
     * Initialize conflict detection
     */
    initializeConflictDetection() {
        this.conflictResolver = {
            resolve: (keys, newShortcut) => {
                const existingShortcut = this.shortcuts.get(keys);
                console.warn(`⚠️ ILM: Resolving conflict for ${keys}:`, {
                    existing: existingShortcut.name,
                    new: newShortcut.name
                });
                
                // For now, allow override
                // TODO: Implement user choice dialog
            }
        };
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = 3000) {
        if (window.ilmWordProcessor?.showTemporaryFeedback) {
            window.ilmWordProcessor.showTemporaryFeedback(
                document.body,
                message,
                type,
                duration
            );
        } else {
            console.log(`📢 ILM: ${message}`);
        }
    }

    /**
     * Get all registered shortcuts
     * @returns {Map} Map of shortcuts
     */
    getAllShortcuts() {
        return new Map(this.shortcuts);
    }

    /**
     * Get shortcuts by category
     * @param {string} category - Category name
     * @returns {Array} Shortcuts in category
     */
    getShortcutsByCategory(category) {
        return Array.from(this.shortcuts.values())
            .filter(shortcut => shortcut.category === category);
    }

    /**
     * Remove shortcut
     * @param {string} keys - Key combination to remove
     */
    removeShortcut(keys) {
        const normalizedKeys = this.normalizeKeys(keys);
        this.shortcuts.delete(normalizedKeys);
    }

    /**
     * Enable keyboard shortcuts
     */
    enable() {
        this.settings.enabled = true;
        this.saveSettings();
    }

    /**
     * Disable keyboard shortcuts
     */
    disable() {
        this.settings.enabled = false;
        this.hideHelp();
        this.clearSequence();
        this.saveSettings();
    }

    /**
     * Toggle keyboard shortcuts
     */
    toggle() {
        if (this.settings.enabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    /**
     * Save settings to storage
     */
    async saveSettings() {
        try {
            await chrome.storage.local.set({
                keyboardShortcutsSettings: this.settings
            });
        } catch (error) {
            console.error('❌ ILM: Failed to save keyboard shortcuts settings:', error);
        }
    }

    /**
     * Update settings
     * @param {Object} newSettings - New settings
     */
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        await this.saveSettings();
    }

    /**
     * Load vocabulary test system
     */
    async loadVocabularyTestSystem() {
        // Dynamically load the vocabulary test module
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('services/vocabulary-test.js');
        document.head.appendChild(script);
        
        // Wait for module to load
        return new Promise((resolve) => {
            script.onload = () => {
                window.ilmVocabularyTest = new VocabularyTestSystem();
                resolve();
            };
        });
    }

    /**
     * Get words for testing
     */
    async getTestWords() {
        if (window.ilmLearningManager) {
            const bookmarks = Array.from(window.ilmLearningManager.bookmarkedWords.values());
            return bookmarks.filter(word => word.status !== 'mastered');
        }
        return [];
    }

    /**
     * Get random practice words
     */
    async getRandomPracticeWords() {
        if (window.ilmLearningManager) {
            const bookmarks = Array.from(window.ilmLearningManager.bookmarkedWords.values());
            // Shuffle and return up to 20 words
            return this.shuffleArray(bookmarks).slice(0, 20);
        }
        return [];
    }

    /**
     * Get favorite practice words
     */
    async getFavoritePracticeWords() {
        if (window.ilmLearningManager) {
            const bookmarks = Array.from(window.ilmLearningManager.bookmarkedWords.values());
            // Filter for favorited words (you can add a favorite flag to bookmarks)
            return bookmarks.filter(word => word.tags && word.tags.includes('favorite'));
        }
        return [];
    }

    /**
     * Show vocabulary test UI
     */
    showVocabularyTestUI(words) {
        // Create test using the vocabulary test system
        const test = window.ilmVocabularyTest.createTest(words, {
            testType: 'recognition',
            questionCount: Math.min(20, words.length),
            adaptive: true
        });
        
        // Create and show test UI overlay
        this.createTestOverlay(test);
    }

    /**
     * Create test overlay UI
     */
    createTestOverlay(test) {
        // Remove any existing overlay
        const existingOverlay = document.getElementById('ilm-test-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Create overlay HTML
        const overlay = document.createElement('div');
        overlay.id = 'ilm-test-overlay';
        overlay.className = 'ilm-test-overlay';
        overlay.innerHTML = `
            <div class="ilm-test-container">
                <div class="ilm-test-header">
                    <h2>Vocabulary Test</h2>
                    <button class="ilm-test-close">×</button>
                </div>
                <div class="ilm-test-progress">
                    <div class="ilm-test-progress-bar" style="width: 0%"></div>
                    <span class="ilm-test-progress-text">Question 1 of ${test.questions.length}</span>
                </div>
                <div class="ilm-test-content">
                    <div class="ilm-test-question"></div>
                    <div class="ilm-test-options"></div>
                    <div class="ilm-test-feedback"></div>
                </div>
                <div class="ilm-test-footer">
                    <button class="ilm-test-hint">Hint</button>
                    <button class="ilm-test-skip">Skip</button>
                    <button class="ilm-test-next" style="display: none;">Next</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Setup event listeners
        this.setupTestEventListeners(overlay, test);
        
        // Display first question
        this.displayQuestion(test.getCurrentQuestion(), test);
    }

    /**
     * Setup test event listeners
     */
    setupTestEventListeners(overlay, test) {
        const closeBtn = overlay.querySelector('.ilm-test-close');
        const hintBtn = overlay.querySelector('.ilm-test-hint');
        const skipBtn = overlay.querySelector('.ilm-test-skip');
        const nextBtn = overlay.querySelector('.ilm-test-next');
        
        closeBtn.addEventListener('click', () => {
            overlay.remove();
        });
        
        hintBtn.addEventListener('click', () => {
            const result = window.ilmVocabularyTest.useHint();
            if (result.success) {
                this.showTestFeedback(result.hint, 'hint');
            }
        });
        
        skipBtn.addEventListener('click', () => {
            this.submitTestAnswer(null, test, overlay);
        });
        
        nextBtn.addEventListener('click', () => {
            this.nextQuestion(test, overlay);
        });
    }

    /**
     * Display test question
     */
    displayQuestion(question, test) {
        if (!question) {
            this.showTestResults(test);
            return;
        }
        
        const questionEl = document.querySelector('.ilm-test-question');
        const optionsEl = document.querySelector('.ilm-test-options');
        const feedbackEl = document.querySelector('.ilm-test-feedback');
        
        questionEl.textContent = question.prompt;
        feedbackEl.innerHTML = '';
        
        // Display options
        optionsEl.innerHTML = '';
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'ilm-test-option';
            button.textContent = option;
            button.addEventListener('click', () => {
                this.submitTestAnswer(option, test, document.getElementById('ilm-test-overlay'));
            });
            optionsEl.appendChild(button);
        });
    }

    /**
     * Submit test answer
     */
    submitTestAnswer(answer, test, overlay) {
        const result = window.ilmVocabularyTest.submitAnswer(answer);
        
        if (result.success) {
            // Show feedback
            this.showTestFeedback(result.explanation, result.isCorrect ? 'correct' : 'incorrect');
            
            // Update progress
            this.updateTestProgress(result.progress, overlay);
            
            // Show next button
            const nextBtn = overlay.querySelector('.ilm-test-next');
            const skipBtn = overlay.querySelector('.ilm-test-skip');
            nextBtn.style.display = 'block';
            skipBtn.style.display = 'none';
            
            // Disable options
            const options = overlay.querySelectorAll('.ilm-test-option');
            options.forEach(opt => opt.disabled = true);
        }
    }

    /**
     * Show test feedback
     */
    showTestFeedback(message, type) {
        const feedbackEl = document.querySelector('.ilm-test-feedback');
        feedbackEl.className = `ilm-test-feedback ilm-test-feedback-${type}`;
        feedbackEl.textContent = message;
    }

    /**
     * Update test progress
     */
    updateTestProgress(progress, overlay) {
        const progressBar = overlay.querySelector('.ilm-test-progress-bar');
        const progressText = overlay.querySelector('.ilm-test-progress-text');
        
        const percentage = (progress.current / progress.total) * 100;
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `Question ${progress.current} of ${progress.total} - Score: ${progress.score}/${progress.current}`;
    }

    /**
     * Next question
     */
    nextQuestion(test, overlay) {
        const nextBtn = overlay.querySelector('.ilm-test-next');
        const skipBtn = overlay.querySelector('.ilm-test-skip');
        nextBtn.style.display = 'none';
        skipBtn.style.display = 'block';
        
        const question = test.getCurrentQuestion();
        if (question) {
            this.displayQuestion(question, test);
        } else {
            this.showTestResults(test);
        }
    }

    /**
     * Show test results
     */
    showTestResults(test) {
        const overlay = document.getElementById('ilm-test-overlay');
        if (!overlay) return;
        
        const stats = test.statistics;
        const container = overlay.querySelector('.ilm-test-container');
        
        container.innerHTML = `
            <div class="ilm-test-header">
                <h2>Test Complete!</h2>
                <button class="ilm-test-close">×</button>
            </div>
            <div class="ilm-test-results">
                <div class="ilm-test-score">
                    <h3>Your Score: ${stats.accuracy}</h3>
                    <p>Grade: ${stats.grade}</p>
                </div>
                <div class="ilm-test-stats">
                    <p>✅ Correct: ${stats.correctAnswers}</p>
                    <p>❌ Incorrect: ${stats.incorrectAnswers}</p>
                    <p>⏱ Time: ${stats.totalTime}</p>
                    <p>📊 Average: ${stats.averageTimePerQuestion}</p>
                </div>
                <button class="ilm-test-retry">Try Again</button>
                <button class="ilm-test-review">Review Mistakes</button>
            </div>
        `;
        
        // Setup result event listeners
        overlay.querySelector('.ilm-test-close').addEventListener('click', () => {
            overlay.remove();
        });
        
        overlay.querySelector('.ilm-test-retry').addEventListener('click', async () => {
            const words = await this.getTestWords();
            this.showVocabularyTestUI(words);
        });
    }

    /**
     * Start practice session
     */
    startPracticeSession(words, type) {
        // Similar to test but with different UI and no scoring
        const test = window.ilmVocabularyTest.createTest(words, {
            testType: 'production',
            questionCount: words.length,
            adaptive: false
        });
        
        this.showNotification(`Starting ${type} practice with ${words.length} words`);
        this.createTestOverlay(test);
    }

    /**
     * Show import dialog
     */
    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        await this.importData(data);
                        this.showNotification('Data imported successfully!');
                    } catch (error) {
                        console.error('Import failed:', error);
                        this.showNotification('Import failed: Invalid file format');
                    }
                };
                reader.readAsText(file);
            }
        });
        input.click();
    }

    /**
     * Import data
     */
    async importData(data) {
        if (window.ilmLearningManager && data.bookmarkedWords) {
            // Import bookmarked words
            for (const [id, word] of Object.entries(data.bookmarkedWords)) {
                window.ilmLearningManager.bookmarkedWords.set(id, word);
            }
            await window.ilmLearningManager.saveData();
        }
    }

    /**
     * Show settings UI
     */
    showSettingsUI() {
        // Create settings overlay
        const overlay = document.createElement('div');
        overlay.id = 'ilm-settings-overlay';
        overlay.className = 'ilm-settings-overlay';
        overlay.innerHTML = `
            <div class="ilm-settings-container">
                <div class="ilm-settings-header">
                    <h2>Extension Settings</h2>
                    <button class="ilm-settings-close">×</button>
                </div>
                <div class="ilm-settings-content">
                    <h3>Learning Settings</h3>
                    <label>
                        <input type="checkbox" id="ilm-spaced-repetition" checked>
                        Enable Spaced Repetition
                    </label>
                    <label>
                        <input type="number" id="ilm-daily-goal" value="20" min="1" max="100">
                        Daily Goal (words)
                    </label>
                    <h3>Display Settings</h3>
                    <label>
                        <input type="checkbox" id="ilm-show-tooltips" checked>
                        Show Tooltips
                    </label>
                    <label>
                        <input type="checkbox" id="ilm-highlight-words" checked>
                        Highlight Words
                    </label>
                </div>
                <div class="ilm-settings-footer">
                    <button class="ilm-settings-save">Save Settings</button>
                    <button class="ilm-settings-cancel">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Setup event listeners
        overlay.querySelector('.ilm-settings-close').addEventListener('click', () => {
            overlay.remove();
        });
        
        overlay.querySelector('.ilm-settings-cancel').addEventListener('click', () => {
            overlay.remove();
        });
        
        overlay.querySelector('.ilm-settings-save').addEventListener('click', async () => {
            // Save settings
            const settings = {
                spacedRepetition: overlay.querySelector('#ilm-spaced-repetition').checked,
                dailyGoal: parseInt(overlay.querySelector('#ilm-daily-goal').value),
                showTooltips: overlay.querySelector('#ilm-show-tooltips').checked,
                highlightWords: overlay.querySelector('#ilm-highlight-words').checked
            };
            
            if (window.ilmLearningManager) {
                window.ilmLearningManager.preferences = {
                    ...window.ilmLearningManager.preferences,
                    ...settings
                };
                await window.ilmLearningManager.saveData();
            }
            
            this.showNotification('Settings saved!');
            overlay.remove();
        });
    }

    /**
     * Shuffle array helper
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// CSS styles for keyboard shortcuts
const keyboardShortcutsStyles = `
<style id="ilm-keyboard-shortcuts-styles">
.ilm-shortcuts-help-overlay {
    font-size: 14px;
    line-height: 1.5;
}

.ilm-help-container {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 800px;
    max-height: 80vh;
    width: 90%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.ilm-help-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #e2e8f0;
    background: linear-gradient(135deg, #2d3748, #4a5568);
    color: white;
}

.ilm-help-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
}

.ilm-help-close {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.15s ease;
}

.ilm-help-close:hover {
    background: rgba(255, 255, 255, 0.1);
}

.ilm-help-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
}

.ilm-help-category {
    margin-bottom: 24px;
}

.ilm-help-category:last-child {
    margin-bottom: 0;
}

.ilm-help-category h3 {
    margin: 0 0 12px 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #2d3748;
    border-bottom: 2px solid #38b2ac;
    padding-bottom: 4px;
}

.ilm-help-shortcuts {
    display: grid;
    gap: 8px;
}

.ilm-help-shortcut {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: #f7fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    transition: all 0.15s ease;
}

.ilm-help-shortcut:hover {
    background: #e6fffa;
    border-color: #38b2ac;
}

.ilm-help-keys {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 120px;
    font-weight: 600;
}

.ilm-help-description {
    flex: 1;
}

.ilm-help-name {
    font-weight: 500;
    color: #2d3748;
    margin-bottom: 2px;
}

.ilm-help-desc {
    font-size: 0.875rem;
    color: #718096;
}

.ilm-help-footer {
    padding: 16px 24px;
    border-top: 1px solid #e2e8f0;
    background: #f7fafc;
}

.ilm-help-info {
    font-size: 0.875rem;
    color: #4a5568;
}

.ilm-help-info p {
    margin: 0 0 4px 0;
}

.ilm-help-info p:last-child {
    margin-bottom: 0;
}

kbd {
    display: inline-block;
    padding: 2px 6px;
    background: #e2e8f0;
    color: #2d3748;
    border: 1px solid #cbd5e0;
    border-radius: 4px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
}

.ilm-contextual-help-popup {
    font-size: 13px;
    line-height: 1.4;
}

.ilm-contextual-help-content {
    padding: 16px;
}

.ilm-contextual-help-content h4 {
    margin: 0 0 12px 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #2d3748;
}

.ilm-contextual-shortcuts {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}

.ilm-contextual-shortcut {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: #f7fafc;
    border-radius: 6px;
}

.ilm-contextual-keys {
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 80px;
    font-weight: 600;
}

.ilm-contextual-name {
    flex: 1;
    color: #4a5568;
}

.ilm-contextual-footer {
    font-size: 0.75rem;
    color: #718096;
    text-align: center;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
}

.ilm-contextual-help-popup kbd {
    font-size: 10px;
    padding: 1px 4px;
}

@media (prefers-color-scheme: dark) {
    .ilm-help-container,
    .ilm-contextual-help-popup {
        background: #2d3748;
        color: #e2e8f0;
    }
    
    .ilm-help-category h3,
    .ilm-help-name,
    .ilm-contextual-help-content h4 {
        color: #e2e8f0;
    }
    
    .ilm-help-shortcut,
    .ilm-contextual-shortcut {
        background: #4a5568;
        border-color: #718096;
    }
    
    .ilm-help-shortcut:hover {
        background: #1a202c;
        border-color: #38b2ac;
    }
    
    .ilm-help-footer,
    .ilm-contextual-footer {
        background: #4a5568;
        border-color: #718096;
    }
    
    kbd {
        background: #1a202c;
        color: #e2e8f0;
        border-color: #4a5568;
    }
}

@media (max-width: 600px) {
    .ilm-help-container {
        width: 95%;
        max-height: 90vh;
    }
    
    .ilm-help-content {
        padding: 16px 20px;
    }
    
    .ilm-help-shortcut {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
    
    .ilm-help-keys {
        min-width: auto;
    }
    
    .ilm-contextual-help-popup {
        max-width: calc(100vw - 40px);
        right: 20px;
        left: auto;
    }
}
</style>
`;

// Add styles to document
if (!document.getElementById('ilm-keyboard-shortcuts-styles')) {
    document.head.insertAdjacentHTML('beforeend', keyboardShortcutsStyles);
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.KeyboardShortcutsManager = KeyboardShortcutsManager;
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmKeyboardShortcuts) {
    window.ilmKeyboardShortcuts = new KeyboardShortcutsManager();
}