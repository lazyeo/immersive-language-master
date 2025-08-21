// Immersive Language Master - UI Integration Enhancer
// Integrates UI Optimizer with existing components for seamless user experience

class UIIntegrationEnhancer {
    constructor() {
        this.isEnabled = true;
        this.enhancedComponents = new Set();
        this.integrationHandlers = new Map();
        
        this.initializeIntegration();
    }

    async initializeIntegration() {
        try {
            // Wait for UI Optimizer to be ready
            await this.waitForUIOptimizer();
            
            // Enhance existing components
            this.enhanceExistingComponents();
            
            // Setup integration handlers
            this.setupIntegrationHandlers();
            
            // Monitor for new components
            this.monitorNewComponents();
            
            console.log('🔗 ILM: UI Integration Enhancer initialized successfully');
        } catch (error) {
            console.error('❌ ILM: UI Integration Enhancer initialization failed:', error);
        }
    }

    /**
     * Wait for UI Optimizer to be available
     */
    async waitForUIOptimizer() {
        return new Promise((resolve) => {
            const checkUIOptimizer = () => {
                if (window.ilmUIOptimizer) {
                    resolve();
                } else {
                    setTimeout(checkUIOptimizer, 100);
                }
            };
            checkUIOptimizer();
        });
    }

    /**
     * Enhance all existing ILM components
     */
    enhanceExistingComponents() {
        // Enhance Context Menu
        this.enhanceContextMenu();
        
        // Enhance Quick Lookup
        this.enhanceQuickLookup();
        
        // Enhance Text Selection
        this.enhanceTextSelection();
        
        // Enhance Learning Dashboard
        this.enhanceLearningDashboard();
        
        // Enhance Keyboard Shortcuts
        this.enhanceKeyboardShortcuts();
        
        // Enhance Word Processor Popups
        this.enhanceWordProcessor();
    }

    /**
     * Enhance Context Menu with UI optimizations
     */
    enhanceContextMenu() {
        if (!window.ilmContextMenu || this.enhancedComponents.has('contextMenu')) return;

        const originalShowContextMenu = window.ilmContextMenu.showContextMenu;
        window.ilmContextMenu.showContextMenu = (x, y) => {
            // Use optimized popup creation
            const menu = window.ilmContextMenu.menuElement;
            if (menu) {
                // Apply responsive classes
                menu.classList.add('ilm-responsive');
                
                // Add accessibility attributes
                menu.setAttribute('role', 'menu');
                menu.setAttribute('aria-label', 'Quick actions menu');
                
                // Enhance menu items
                this.enhanceMenuItems(menu);
                
                // Use optimized animation
                window.ilmUIOptimizer.animate(menu, 'scaleIn');
                
                // Position with optimization
                const position = window.ilmUIOptimizer.calculateMenuPosition?.call(
                    window.ilmContextMenu, x, y
                ) || { x, y };
                
                menu.style.left = `${position.x}px`;
                menu.style.top = `${position.y}px`;
                menu.style.display = 'block';
                
                // Dispatch optimized popup event
                document.dispatchEvent(new CustomEvent('ilm-popup-open', {
                    detail: { popup: menu, type: 'context-menu' }
                }));
            }
        };

        const originalHideContextMenu = window.ilmContextMenu.hideContextMenu;
        window.ilmContextMenu.hideContextMenu = async () => {
            const menu = window.ilmContextMenu.menuElement;
            if (menu && menu.style.display !== 'none') {
                await window.ilmUIOptimizer.animate(menu, 'fadeOut');
                menu.style.display = 'none';
                
                document.dispatchEvent(new CustomEvent('ilm-popup-close', {
                    detail: { popup: menu, type: 'context-menu' }
                }));
            }
        };

        this.enhancedComponents.add('contextMenu');
        console.log('✨ Enhanced Context Menu with UI optimizations');
    }

    /**
     * Enhance Quick Lookup with UI optimizations
     */
    enhanceQuickLookup() {
        if (!window.ilmQuickLookup || this.enhancedComponents.has('quickLookup')) return;

        const originalShowSearchWidget = window.ilmQuickLookup.showSearchWidget;
        window.ilmQuickLookup.showSearchWidget = (initialQuery = '') => {
            const widget = window.ilmQuickLookup.searchWidget;
            if (!widget) return;

            // Apply responsive and accessibility enhancements
            widget.classList.add('ilm-responsive');
            widget.setAttribute('role', 'dialog');
            widget.setAttribute('aria-modal', 'true');
            widget.setAttribute('aria-label', 'Quick lookup search');

            // Create backdrop with UI optimizer
            this.createOptimizedBackdrop('lookup-backdrop', () => {
                window.ilmQuickLookup.hideSearchWidget();
            });

            // Show with optimized animation
            widget.style.display = 'block';
            window.ilmUIOptimizer.animate(widget, 'scaleIn');

            // Focus management
            const input = widget.querySelector('#ilm-lookup-input');
            if (input) {
                if (initialQuery) {
                    input.value = initialQuery;
                    window.ilmQuickLookup.performLookup(initialQuery);
                }
                setTimeout(() => input.focus(), 100);
            }

            // Dispatch event
            document.dispatchEvent(new CustomEvent('ilm-popup-open', {
                detail: { popup: widget, type: 'quick-lookup' }
            }));
        };

        const originalHideSearchWidget = window.ilmQuickLookup.hideSearchWidget;
        window.ilmQuickLookup.hideSearchWidget = async () => {
            const widget = window.ilmQuickLookup.searchWidget;
            if (widget && widget.style.display !== 'none') {
                await window.ilmUIOptimizer.animate(widget, 'scaleIn'); // Scale out
                widget.style.display = 'none';
                
                this.removeOptimizedBackdrop('lookup-backdrop');
                
                document.dispatchEvent(new CustomEvent('ilm-popup-close', {
                    detail: { popup: widget, type: 'quick-lookup' }
                }));
            }
        };

        // Enhance search results display
        const originalDisplayResults = window.ilmQuickLookup.displayResults;
        window.ilmQuickLookup.displayResults = (result) => {
            originalDisplayResults.call(window.ilmQuickLookup, result);
            
            // Add loading animation to results
            const resultsSection = window.ilmQuickLookup.searchWidget?.querySelector('#ilm-results-section');
            if (resultsSection) {
                window.ilmUIOptimizer.animate(resultsSection, 'fadeIn');
            }
        };

        this.enhancedComponents.add('quickLookup');
        console.log('✨ Enhanced Quick Lookup with UI optimizations');
    }

    /**
     * Enhance Text Selection with UI optimizations
     */
    enhanceTextSelection() {
        if (!window.ilmTextSelectionEnhancer || this.enhancedComponents.has('textSelection')) return;

        const originalShowMiniPopup = window.ilmTextSelectionEnhancer.showMiniPopup;
        window.ilmTextSelectionEnhancer.showMiniPopup = () => {
            const popup = window.ilmTextSelectionEnhancer.miniPopup;
            if (!popup || !window.ilmTextSelectionEnhancer.currentSelection) return;

            // Apply optimizations
            popup.classList.add('ilm-responsive');
            popup.setAttribute('role', 'dialog');
            popup.setAttribute('aria-label', 'Text selection actions');

            // Update content
            window.ilmTextSelectionEnhancer.updateMiniPopupContent();

            // Position with optimization
            const position = window.ilmTextSelectionEnhancer.calculatePopupPosition();
            popup.style.left = `${position.x}px`;
            popup.style.top = `${position.y}px`;
            popup.style.display = 'block';

            // Animate with UI optimizer
            window.ilmUIOptimizer.animate(popup, 'scaleIn');

            document.dispatchEvent(new CustomEvent('ilm-popup-open', {
                detail: { popup, type: 'text-selection' }
            }));
        };

        const originalHideMiniPopup = window.ilmTextSelectionEnhancer.hideMiniPopup;
        window.ilmTextSelectionEnhancer.hideMiniPopup = async () => {
            const popup = window.ilmTextSelectionEnhancer.miniPopup;
            if (popup && popup.style.display !== 'none') {
                await window.ilmUIOptimizer.animate(popup, 'fadeOut');
                popup.style.display = 'none';
                
                document.dispatchEvent(new CustomEvent('ilm-popup-close', {
                    detail: { popup, type: 'text-selection' }
                }));
            }
        };

        this.enhancedComponents.add('textSelection');
        console.log('✨ Enhanced Text Selection with UI optimizations');
    }

    /**
     * Enhance Learning Dashboard with UI optimizations
     */
    enhanceLearningDashboard() {
        if (!window.ilmLearningDashboard || this.enhancedComponents.has('learningDashboard')) return;

        const originalShowDashboard = window.ilmLearningDashboard.showDashboard;
        window.ilmLearningDashboard.showDashboard = () => {
            const dashboard = window.ilmLearningDashboard.dashboardElement;
            if (!dashboard) return;

            // Apply responsive design
            dashboard.classList.add('ilm-responsive');
            dashboard.setAttribute('role', 'main');
            dashboard.setAttribute('aria-label', 'Learning dashboard');

            // Create backdrop
            this.createOptimizedBackdrop('dashboard-backdrop', () => {
                window.ilmLearningDashboard.hideDashboard();
            });

            // Show with animation
            dashboard.style.display = 'block';
            window.ilmUIOptimizer.animate(dashboard, 'slideIn');

            // Enhance charts and visualizations
            this.enhanceDashboardVisualizations(dashboard);

            document.dispatchEvent(new CustomEvent('ilm-popup-open', {
                detail: { popup: dashboard, type: 'learning-dashboard' }
            }));
        };

        const originalHideDashboard = window.ilmLearningDashboard.hideDashboard;
        window.ilmLearningDashboard.hideDashboard = async () => {
            const dashboard = window.ilmLearningDashboard.dashboardElement;
            if (dashboard && dashboard.style.display !== 'none') {
                await window.ilmUIOptimizer.animate(dashboard, 'slideIn'); // Slide out
                dashboard.style.display = 'none';
                
                this.removeOptimizedBackdrop('dashboard-backdrop');
                
                document.dispatchEvent(new CustomEvent('ilm-popup-close', {
                    detail: { popup: dashboard, type: 'learning-dashboard' }
                }));
            }
        };

        this.enhancedComponents.add('learningDashboard');
        console.log('✨ Enhanced Learning Dashboard with UI optimizations');
    }

    /**
     * Enhance Keyboard Shortcuts with UI optimizations
     */
    enhanceKeyboardShortcuts() {
        if (!window.ilmKeyboardShortcuts || this.enhancedComponents.has('keyboardShortcuts')) return;

        const originalShowHelp = window.ilmKeyboardShortcuts.showHelp;
        window.ilmKeyboardShortcuts.showHelp = () => {
            const helpOverlay = window.ilmKeyboardShortcuts.helpOverlay;
            if (!helpOverlay) return;

            // Apply responsive design
            helpOverlay.classList.add('ilm-responsive');
            
            // Create backdrop
            this.createOptimizedBackdrop('shortcuts-backdrop', () => {
                window.ilmKeyboardShortcuts.hideHelp();
            });

            // Show with animation
            helpOverlay.style.display = 'flex';
            helpOverlay.style.justifyContent = 'center';
            helpOverlay.style.alignItems = 'center';
            
            const container = helpOverlay.querySelector('.ilm-help-container');
            if (container) {
                window.ilmUIOptimizer.animate(container, 'scaleIn');
            }

            window.ilmKeyboardShortcuts.helpVisible = true;

            document.dispatchEvent(new CustomEvent('ilm-popup-open', {
                detail: { popup: helpOverlay, type: 'keyboard-shortcuts' }
            }));
        };

        const originalHideHelp = window.ilmKeyboardShortcuts.hideHelp;
        window.ilmKeyboardShortcuts.hideHelp = async () => {
            const helpOverlay = window.ilmKeyboardShortcuts.helpOverlay;
            if (!helpOverlay || !window.ilmKeyboardShortcuts.helpVisible) return;

            const container = helpOverlay.querySelector('.ilm-help-container');
            if (container) {
                await window.ilmUIOptimizer.animate(container, 'fadeOut');
            }
            
            helpOverlay.style.display = 'none';
            window.ilmKeyboardShortcuts.helpVisible = false;
            
            this.removeOptimizedBackdrop('shortcuts-backdrop');

            document.dispatchEvent(new CustomEvent('ilm-popup-close', {
                detail: { popup: helpOverlay, type: 'keyboard-shortcuts' }
            }));
        };

        this.enhancedComponents.add('keyboardShortcuts');
        console.log('✨ Enhanced Keyboard Shortcuts with UI optimizations');
    }

    /**
     * Enhance Word Processor popups with UI optimizations
     */
    enhanceWordProcessor() {
        if (!window.ilmWordProcessor || this.enhancedComponents.has('wordProcessor')) return;

        const originalShowEnhancedPopup = window.ilmWordProcessor.showEnhancedPopup;
        window.ilmWordProcessor.showEnhancedPopup = (element, word, options = {}) => {
            // Call original method
            const result = originalShowEnhancedPopup.call(window.ilmWordProcessor, element, word, options);
            
            // Find the created popup
            const popup = document.querySelector('.ilm-word-popup:last-of-type');
            if (popup) {
                // Apply optimizations
                popup.classList.add('ilm-responsive');
                popup.setAttribute('role', 'dialog');
                popup.setAttribute('aria-label', `Word information for ${word}`);
                
                // Animate in
                window.ilmUIOptimizer.animate(popup, 'scaleIn');
                
                // Enhance content loading
                this.enhancePopupContentLoading(popup);
                
                document.dispatchEvent(new CustomEvent('ilm-popup-open', {
                    detail: { popup, type: 'word-processor', word }
                }));
            }
            
            return result;
        };

        this.enhancedComponents.add('wordProcessor');
        console.log('✨ Enhanced Word Processor with UI optimizations');
    }

    /**
     * Enhance menu items with accessibility and interaction improvements
     * @param {HTMLElement} menu - Menu element
     */
    enhanceMenuItems(menu) {
        const menuItems = menu.querySelectorAll('.ilm-menu-item');
        menuItems.forEach((item, index) => {
            // Add keyboard navigation
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'menuitem');
            
            // Add hover animations
            item.addEventListener('mouseenter', () => {
                if (window.ilmUIOptimizer.settings.animations.enabled) {
                    window.ilmUIOptimizer.animate(item, 'bounce');
                }
            });
            
            // Keyboard interaction
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }

    /**
     * Enhance dashboard visualizations
     * @param {HTMLElement} dashboard - Dashboard element
     */
    enhanceDashboardVisualizations(dashboard) {
        // Animate charts and progress bars
        const charts = dashboard.querySelectorAll('.ilm-chart, .ilm-progress-bar');
        charts.forEach((chart, index) => {
            setTimeout(() => {
                window.ilmUIOptimizer.animate(chart, 'fadeIn');
            }, index * 100);
        });
        
        // Add lazy loading for heavy visualizations
        const heavyElements = dashboard.querySelectorAll('.ilm-heavy-chart');
        heavyElements.forEach(element => {
            element.dataset.src = element.src || '';
            element.classList.add('ilm-lazy-element');
            
            document.dispatchEvent(new CustomEvent('ilm-lazy-element', {
                detail: { element }
            }));
        });
    }

    /**
     * Enhance popup content loading with smooth transitions
     * @param {HTMLElement} popup - Popup element
     */
    enhancePopupContentLoading(popup) {
        // Animate content sections as they load
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList.contains('ilm-content-section')) {
                            window.ilmUIOptimizer.animate(node, 'fadeIn');
                        }
                    }
                });
            });
        });
        
        observer.observe(popup, { childList: true, subtree: true });
        
        // Store observer for cleanup
        popup._contentObserver = observer;
    }

    /**
     * Create optimized backdrop
     * @param {string} id - Backdrop ID
     * @param {Function} clickHandler - Click handler function
     */
    createOptimizedBackdrop(id, clickHandler) {
        // Remove existing backdrop
        this.removeOptimizedBackdrop(id);
        
        const backdrop = document.createElement('div');
        backdrop.id = `ilm-${id}`;
        backdrop.className = 'ilm-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        backdrop.addEventListener('click', clickHandler);
        document.body.appendChild(backdrop);
        
        // Animate in
        requestAnimationFrame(() => {
            backdrop.style.opacity = '1';
        });
    }

    /**
     * Remove optimized backdrop
     * @param {string} id - Backdrop ID
     */
    removeOptimizedBackdrop(id) {
        const backdrop = document.getElementById(`ilm-${id}`);
        if (backdrop) {
            backdrop.style.opacity = '0';
            setTimeout(() => backdrop.remove(), 300);
        }
    }

    /**
     * Setup integration handlers for cross-component communication
     */
    setupIntegrationHandlers() {
        // Handle theme changes
        this.integrationHandlers.set('theme-change', (event) => {
            this.applyThemeToAllComponents(event.detail.theme);
        });
        
        // Handle accessibility changes
        this.integrationHandlers.set('accessibility-change', (event) => {
            this.applyAccessibilityToAllComponents(event.detail.settings);
        });
        
        // Handle performance changes
        this.integrationHandlers.set('performance-change', (event) => {
            this.applyPerformanceToAllComponents(event.detail.settings);
        });
        
        // Setup event listeners
        this.integrationHandlers.forEach((handler, event) => {
            document.addEventListener(`ilm-${event}`, handler);
        });
    }

    /**
     * Apply theme to all enhanced components
     * @param {string} theme - Theme name
     */
    applyThemeToAllComponents(theme) {
        document.querySelectorAll('[class*="ilm-"]').forEach(element => {
            window.ilmUIOptimizer.applyThemeToElement(element);
        });
    }

    /**
     * Apply accessibility settings to all components
     * @param {Object} settings - Accessibility settings
     */
    applyAccessibilityToAllComponents(settings) {
        if (settings.highContrast) {
            document.body.classList.add('ilm-high-contrast');
        } else {
            document.body.classList.remove('ilm-high-contrast');
        }
        
        if (settings.largeText) {
            document.body.classList.add('ilm-large-text');
        } else {
            document.body.classList.remove('ilm-large-text');
        }
    }

    /**
     * Apply performance settings to all components
     * @param {Object} settings - Performance settings
     */
    applyPerformanceToAllComponents(settings) {
        if (!settings.animations) {
            window.ilmUIOptimizer.disableAnimations();
        }
    }

    /**
     * Monitor for new components and enhance them automatically
     */
    monitorNewComponents() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.enhanceNewElement(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        this.componentObserver = observer;
    }

    /**
     * Enhance newly added elements
     * @param {HTMLElement} element - New element
     */
    enhanceNewElement(element) {
        // Check if it's an ILM component
        if (element.className && element.className.includes('ilm-')) {
            // Apply responsive classes
            element.classList.add('ilm-responsive');
            
            // Apply current theme
            window.ilmUIOptimizer.applyThemeToElement(element);
            
            // Add accessibility attributes if needed
            if (element.classList.contains('ilm-popup-container')) {
                element.setAttribute('role', 'dialog');
                element.setAttribute('aria-modal', 'true');
            }
            
            // Animate in if it's a popup
            if (element.classList.contains('ilm-popup-container') || 
                element.classList.contains('ilm-context-menu-container')) {
                window.ilmUIOptimizer.animate(element, 'fadeIn');
            }
        }
    }

    /**
     * Create unified notification system
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @param {number} duration - Duration in milliseconds
     */
    showUnifiedNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `ilm-notification ilm-notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            background: var(--ilm-primary);
            border: 1px solid var(--ilm-border);
            border-radius: 8px;
            box-shadow: 0 4px 12px var(--ilm-shadow);
            z-index: 10050;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        // Type-specific styles
        const typeStyles = {
            success: 'border-left: 4px solid #48bb78;',
            error: 'border-left: 4px solid #f56565;',
            warning: 'border-left: 4px solid #ed8936;',
            info: 'border-left: 4px solid #4299e1;'
        };
        
        notification.style.cssText += typeStyles[type] || typeStyles.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
        
        // Auto-remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
        
        // Screen reader announcement
        if (window.ilmUIOptimizer?.announce) {
            window.ilmUIOptimizer.announce(message, type === 'error' ? 'assertive' : 'polite');
        }
    }

    /**
     * Get enhancement status
     * @returns {Object} Enhancement status
     */
    getEnhancementStatus() {
        return {
            enhancedComponents: Array.from(this.enhancedComponents),
            totalComponents: this.enhancedComponents.size,
            isEnabled: this.isEnabled
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Disconnect observers
        if (this.componentObserver) {
            this.componentObserver.disconnect();
        }
        
        // Remove event listeners
        this.integrationHandlers.forEach((handler, event) => {
            document.removeEventListener(`ilm-${event}`, handler);
        });
        
        // Clean up component observers
        document.querySelectorAll('[class*="ilm-"]').forEach(element => {
            if (element._contentObserver) {
                element._contentObserver.disconnect();
            }
        });
    }
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmUIIntegrationEnhancer) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ilmUIIntegrationEnhancer = new UIIntegrationEnhancer();
        });
    } else {
        window.ilmUIIntegrationEnhancer = new UIIntegrationEnhancer();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.UIIntegrationEnhancer = UIIntegrationEnhancer;
}