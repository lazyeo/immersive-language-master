// Immersive Language Master - Advanced UI & Interaction Optimizer
// Enhanced UI components with smooth animations, responsive design, and accessibility features

class UIOptimizer {
    constructor() {
        this.isEnabled = true;
        this.animations = new Map();
        this.observers = new Map();
        this.themes = new Map();
        this.breakpoints = {
            mobile: 480,
            tablet: 768,
            desktop: 1024
        };
        
        this.initializeOptimizer();
    }

    async initializeOptimizer() {
        try {
            // Load user preferences and settings
            await this.loadUISettings();
            
            // Initialize animation system
            this.initializeAnimationSystem();
            
            // Setup responsive design handlers
            this.setupResponsiveHandlers();
            
            // Initialize accessibility features
            this.initializeAccessibility();
            
            // Create theme system
            this.initializeThemeSystem();
            
            // Setup performance monitoring
            this.initializePerformanceMonitoring();
            
            console.log('🎨 ILM: UI Optimizer initialized successfully');
        } catch (error) {
            console.error('❌ ILM: UI Optimizer initialization failed:', error);
        }
    }

    /**
     * Load UI optimization settings
     */
    async loadUISettings() {
        try {
            const result = await chrome.storage.local.get(['uiOptimizerSettings']);
            this.settings = result.uiOptimizerSettings || this.getDefaultSettings();
        } catch (error) {
            console.error('❌ ILM: Failed to load UI settings:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    /**
     * Get default UI optimizer settings
     */
    getDefaultSettings() {
        return {
            enabled: true,
            animations: {
                enabled: true,
                duration: 'normal', // fast, normal, slow
                reduceMotion: false
            },
            accessibility: {
                highContrast: false,
                largeText: false,
                keyboardNavigation: true,
                screenReader: true
            },
            theme: {
                mode: 'auto', // light, dark, auto
                accentColor: '#38b2ac',
                customColors: {}
            },
            responsive: {
                autoAdaptLayout: true,
                mobileOptimizations: true,
                touchOptimizations: true
            },
            performance: {
                enableOptimizations: true,
                virtualScrolling: true,
                lazyLoading: true,
                caching: true
            }
        };
    }

    /**
     * Initialize advanced animation system
     */
    initializeAnimationSystem() {
        // Animation presets
        this.animationPresets = {
            fadeIn: {
                keyframes: [
                    { opacity: 0, transform: 'translateY(-10px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ],
                options: { duration: 300, easing: 'ease-out' }
            },
            slideIn: {
                keyframes: [
                    { transform: 'translateX(-100%)', opacity: 0 },
                    { transform: 'translateX(0)', opacity: 1 }
                ],
                options: { duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
            },
            scaleIn: {
                keyframes: [
                    { transform: 'scale(0.8)', opacity: 0 },
                    { transform: 'scale(1)', opacity: 1 }
                ],
                options: { duration: 250, easing: 'ease-out' }
            },
            bounce: {
                keyframes: [
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.05)' },
                    { transform: 'scale(1)' }
                ],
                options: { duration: 200, easing: 'ease-in-out' }
            },
            pulse: {
                keyframes: [
                    { opacity: 1 },
                    { opacity: 0.7 },
                    { opacity: 1 }
                ],
                options: { duration: 1000, iterations: Infinity }
            }
        };

        // Adjust animations based on user preferences
        if (this.settings.animations.reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.disableAnimations();
        }

        this.setupAnimationDuration();
    }

    /**
     * Setup animation duration based on user preference
     */
    setupAnimationDuration() {
        const multipliers = {
            fast: 0.7,
            normal: 1,
            slow: 1.5
        };

        const multiplier = multipliers[this.settings.animations.duration] || 1;
        
        Object.values(this.animationPresets).forEach(preset => {
            preset.options.duration *= multiplier;
        });
    }

    /**
     * Disable animations for reduced motion preference
     */
    disableAnimations() {
        Object.values(this.animationPresets).forEach(preset => {
            preset.options.duration = 0;
        });
    }

    /**
     * Animate element with preset or custom animation
     * @param {HTMLElement} element - Element to animate
     * @param {string|Object} animation - Animation preset name or custom config
     * @returns {Promise} Animation promise
     */
    animate(element, animation) {
        if (!this.settings.animations.enabled || !element) {
            return Promise.resolve();
        }

        let animationConfig;
        if (typeof animation === 'string') {
            animationConfig = this.animationPresets[animation];
        } else {
            animationConfig = animation;
        }

        if (!animationConfig) {
            console.warn('❌ ILM: Unknown animation preset:', animation);
            return Promise.resolve();
        }

        const animationInstance = element.animate(
            animationConfig.keyframes,
            animationConfig.options
        );

        // Store animation reference for cleanup
        const animationId = Date.now() + Math.random();
        this.animations.set(animationId, animationInstance);

        return new Promise((resolve) => {
            animationInstance.onfinish = () => {
                this.animations.delete(animationId);
                resolve();
            };
        });
    }

    /**
     * Setup responsive design handlers
     */
    setupResponsiveHandlers() {
        if (!this.settings.responsive.autoAdaptLayout) return;

        // Create responsive breakpoint observers
        Object.entries(this.breakpoints).forEach(([name, width]) => {
            const mediaQuery = window.matchMedia(`(max-width: ${width}px)`);
            
            const handler = (e) => {
                document.body.classList.toggle(`ilm-${name}`, e.matches);
                this.handleBreakpointChange(name, e.matches);
            };
            
            // Initial check
            handler(mediaQuery);
            
            // Listen for changes
            mediaQuery.addListener(handler);
        });

        // Touch device detection
        if ('ontouchstart' in window && this.settings.responsive.touchOptimizations) {
            document.body.classList.add('ilm-touch');
            this.optimizeForTouch();
        }
    }

    /**
     * Handle breakpoint changes
     * @param {string} breakpoint - Breakpoint name
     * @param {boolean} matches - Whether breakpoint matches
     */
    handleBreakpointChange(breakpoint, matches) {
        if (matches) {
            switch (breakpoint) {
                case 'mobile':
                    this.optimizeForMobile();
                    break;
                case 'tablet':
                    this.optimizeForTablet();
                    break;
                case 'desktop':
                    this.optimizeForDesktop();
                    break;
            }
        }
    }

    /**
     * Optimize interface for mobile devices
     */
    optimizeForMobile() {
        // Adjust popup sizes
        this.adjustPopupSizes('mobile');
        
        // Optimize touch targets
        this.optimizeTouchTargets();
        
        // Simplify layouts
        this.simplifyLayouts();
    }

    /**
     * Optimize interface for tablet devices
     */
    optimizeForTablet() {
        this.adjustPopupSizes('tablet');
        this.optimizeTouchTargets();
    }

    /**
     * Optimize interface for desktop devices
     */
    optimizeForDesktop() {
        this.adjustPopupSizes('desktop');
        this.enableAdvancedFeatures();
    }

    /**
     * Optimize for touch devices
     */
    optimizeForTouch() {
        // Increase touch target sizes
        const style = document.createElement('style');
        style.textContent = `
            .ilm-touch .ilm-menu-item,
            .ilm-touch .ilm-action-btn,
            .ilm-touch button {
                min-height: 44px;
                min-width: 44px;
                padding: 12px 16px;
            }
            
            .ilm-touch .ilm-popup-close {
                width: 40px;
                height: 40px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Adjust popup sizes based on screen size
     * @param {string} screenSize - Screen size category
     */
    adjustPopupSizes(screenSize) {
        const sizes = {
            mobile: {
                maxWidth: '95vw',
                maxHeight: '90vh',
                padding: '12px'
            },
            tablet: {
                maxWidth: '80vw',
                maxHeight: '85vh',
                padding: '16px'
            },
            desktop: {
                maxWidth: '500px',
                maxHeight: '80vh',
                padding: '20px'
            }
        };

        const config = sizes[screenSize];
        if (!config) return;

        // Apply size adjustments to all ILM popups
        const style = document.createElement('style');
        style.id = `ilm-responsive-${screenSize}`;
        style.textContent = `
            .ilm-popup-container,
            .ilm-search-widget-container,
            .ilm-context-menu-container {
                max-width: ${config.maxWidth} !important;
                max-height: ${config.maxHeight} !important;
            }
            
            .ilm-popup-content {
                padding: ${config.padding} !important;
            }
        `;

        // Remove previous responsive styles
        Object.keys(this.breakpoints).forEach(bp => {
            const oldStyle = document.getElementById(`ilm-responsive-${bp}`);
            if (oldStyle && bp !== screenSize) {
                oldStyle.remove();
            }
        });

        document.head.appendChild(style);
    }

    /**
     * Optimize touch targets for better usability
     */
    optimizeTouchTargets() {
        document.querySelectorAll('.ilm-menu-item, .ilm-action-btn, button[class*="ilm-"]').forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.height < 44 || rect.width < 44) {
                element.style.minHeight = '44px';
                element.style.minWidth = '44px';
            }
        });
    }

    /**
     * Simplify layouts for smaller screens
     */
    simplifyLayouts() {
        // Hide less important elements on mobile
        const style = document.createElement('style');
        style.id = 'ilm-mobile-simplification';
        style.textContent = `
            .ilm-mobile .ilm-menu-shortcut,
            .ilm-mobile .ilm-secondary-actions {
                display: none !important;
            }
            
            .ilm-mobile .ilm-result-section {
                margin-bottom: 12px !important;
            }
            
            .ilm-mobile .ilm-popup-header {
                padding: 12px 16px !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Enable advanced features for larger screens
     */
    enableAdvancedFeatures() {
        // Show advanced features on desktop
        const style = document.createElement('style');
        style.id = 'ilm-desktop-features';
        style.textContent = `
            .ilm-desktop .ilm-advanced-features {
                display: block !important;
            }
            
            .ilm-desktop .ilm-keyboard-hints {
                display: inline !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Initialize accessibility features
     */
    initializeAccessibility() {
        if (!this.settings.accessibility.keyboardNavigation) return;

        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        
        // Setup ARIA labels
        this.setupAriaLabels();
        
        // Setup focus management
        this.setupFocusManagement();
        
        // Setup screen reader support
        if (this.settings.accessibility.screenReader) {
            this.setupScreenReaderSupport();
        }
    }

    /**
     * Setup keyboard navigation for UI elements
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }

    /**
     * Handle keyboard navigation events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardNavigation(e) {
        const focusableElements = this.getFocusableElements();
        const currentIndex = focusableElements.indexOf(document.activeElement);

        switch (e.key) {
            case 'Tab':
                // Handle custom tab navigation if needed
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.focusNextElement(focusableElements, currentIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.focusPreviousElement(focusableElements, currentIndex);
                break;
            case 'Enter':
            case ' ':
                if (document.activeElement.classList.contains('ilm-menu-item')) {
                    e.preventDefault();
                    document.activeElement.click();
                }
                break;
        }
    }

    /**
     * Get all focusable elements in ILM components
     * @returns {Array} Array of focusable elements
     */
    getFocusableElements() {
        const selectors = [
            '.ilm-menu-item',
            '.ilm-action-btn',
            '.ilm-search-input',
            'button[class*="ilm-"]',
            'input[class*="ilm-"]',
            '[tabindex]:not([tabindex="-1"])'
        ];
        
        return Array.from(document.querySelectorAll(selectors.join(', ')))
            .filter(el => this.isVisible(el) && !el.disabled);
    }

    /**
     * Focus next element in sequence
     * @param {Array} elements - Focusable elements
     * @param {number} currentIndex - Current focused element index
     */
    focusNextElement(elements, currentIndex) {
        const nextIndex = (currentIndex + 1) % elements.length;
        elements[nextIndex]?.focus();
    }

    /**
     * Focus previous element in sequence
     * @param {Array} elements - Focusable elements
     * @param {number} currentIndex - Current focused element index
     */
    focusPreviousElement(elements, currentIndex) {
        const prevIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
        elements[prevIndex]?.focus();
    }

    /**
     * Setup ARIA labels for better accessibility
     */
    setupAriaLabels() {
        // Add ARIA labels to elements missing them
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.addAriaLabels(node);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
        this.observers.set('aria', observer);
    }

    /**
     * Add ARIA labels to element and its children
     * @param {HTMLElement} element - Element to process
     */
    addAriaLabels(element) {
        if (element.classList?.contains('ilm-menu-item') && !element.getAttribute('aria-label')) {
            const text = element.querySelector('.ilm-menu-text')?.textContent;
            if (text) {
                element.setAttribute('aria-label', text);
            }
        }

        if (element.classList?.contains('ilm-popup-close') && !element.getAttribute('aria-label')) {
            element.setAttribute('aria-label', 'Close popup');
        }

        // Process children
        element.querySelectorAll?.('.ilm-menu-item, .ilm-action-btn, .ilm-popup-close').forEach(child => {
            this.addAriaLabels(child);
        });
    }

    /**
     * Setup focus management for popups and modals
     */
    setupFocusManagement() {
        // Track focus when popups open
        document.addEventListener('ilm-popup-open', (e) => {
            this.manageFocusForPopup(e.detail.popup);
        });

        // Restore focus when popups close
        document.addEventListener('ilm-popup-close', (e) => {
            this.restoreFocus();
        });
    }

    /**
     * Manage focus for popup elements
     * @param {HTMLElement} popup - Popup element
     */
    manageFocusForPopup(popup) {
        // Store currently focused element
        this.previousFocus = document.activeElement;

        // Focus first focusable element in popup
        const focusableElements = popup.querySelectorAll(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        // Trap focus within popup
        this.trapFocus(popup);
    }

    /**
     * Trap focus within an element
     * @param {HTMLElement} container - Container element
     */
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        container.addEventListener('keydown', handleTabKey);
        
        // Store handler for cleanup
        this.focusTrapHandler = handleTabKey;
        this.focusTrapContainer = container;
    }

    /**
     * Restore focus to previously focused element
     */
    restoreFocus() {
        if (this.focusTrapContainer && this.focusTrapHandler) {
            this.focusTrapContainer.removeEventListener('keydown', this.focusTrapHandler);
        }

        if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
            this.previousFocus.focus();
        }
    }

    /**
     * Setup screen reader support
     */
    setupScreenReaderSupport() {
        // Add live regions for dynamic content
        this.createLiveRegions();
        
        // Announce important changes
        this.setupAnnouncements();
    }

    /**
     * Create ARIA live regions for announcements
     */
    createLiveRegions() {
        const politeRegion = document.createElement('div');
        politeRegion.id = 'ilm-live-region-polite';
        politeRegion.setAttribute('aria-live', 'polite');
        politeRegion.setAttribute('aria-atomic', 'true');
        politeRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;

        const assertiveRegion = document.createElement('div');
        assertiveRegion.id = 'ilm-live-region-assertive';
        assertiveRegion.setAttribute('aria-live', 'assertive');
        assertiveRegion.setAttribute('aria-atomic', 'true');
        assertiveRegion.style.cssText = politeRegion.style.cssText;

        document.body.appendChild(politeRegion);
        document.body.appendChild(assertiveRegion);
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - Priority level (polite|assertive)
     */
    announce(message, priority = 'polite') {
        const region = document.getElementById(`ilm-live-region-${priority}`);
        if (region) {
            region.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                region.textContent = '';
            }, 1000);
        }
    }

    /**
     * Setup automatic announcements for UI changes
     */
    setupAnnouncements() {
        // Announce popup openings
        document.addEventListener('ilm-popup-open', (e) => {
            const title = e.detail.popup.querySelector('h3, h4, .ilm-popup-title')?.textContent;
            if (title) {
                this.announce(`${title} opened`);
            }
        });

        // Announce translation results
        document.addEventListener('ilm-translation-complete', (e) => {
            this.announce(`Translation complete: ${e.detail.result}`);
        });
    }

    /**
     * Initialize theme system
     */
    initializeThemeSystem() {
        this.createThemes();
        this.applyTheme();
        this.setupThemeToggle();
    }

    /**
     * Create theme definitions
     */
    createThemes() {
        this.themes.set('light', {
            primary: '#ffffff',
            secondary: '#f7fafc',
            accent: this.settings.theme.accentColor,
            text: '#2d3748',
            textSecondary: '#4a5568',
            border: '#e2e8f0',
            shadow: 'rgba(0, 0, 0, 0.1)'
        });

        this.themes.set('dark', {
            primary: '#2d3748',
            secondary: '#4a5568',
            accent: this.settings.theme.accentColor,
            text: '#e2e8f0',
            textSecondary: '#a0aec0',
            border: '#718096',
            shadow: 'rgba(0, 0, 0, 0.3)'
        });
    }

    /**
     * Apply current theme
     */
    applyTheme() {
        const themeMode = this.getEffectiveTheme();
        const theme = this.themes.get(themeMode);
        
        if (!theme) return;

        const root = document.documentElement;
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(`--ilm-${key}`, value);
        });

        document.body.classList.toggle('ilm-dark-theme', themeMode === 'dark');
        document.body.classList.toggle('ilm-light-theme', themeMode === 'light');
    }

    /**
     * Get effective theme based on settings and system preference
     * @returns {string} Theme name
     */
    getEffectiveTheme() {
        if (this.settings.theme.mode === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return this.settings.theme.mode;
    }

    /**
     * Setup theme toggle functionality
     */
    setupThemeToggle() {
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addListener(() => {
            if (this.settings.theme.mode === 'auto') {
                this.applyTheme();
            }
        });
    }

    /**
     * Initialize performance monitoring
     */
    initializePerformanceMonitoring() {
        if (!this.settings.performance.enableOptimizations) return;

        // Monitor animation performance
        this.monitorAnimationPerformance();
        
        // Setup lazy loading
        if (this.settings.performance.lazyLoading) {
            this.setupLazyLoading();
        }
        
        // Setup caching
        if (this.settings.performance.caching) {
            this.setupPerformanceCaching();
        }
    }

    /**
     * Monitor animation performance and adjust accordingly
     */
    monitorAnimationPerformance() {
        let frameTime = 0;
        let frameCount = 0;
        
        const measurePerformance = () => {
            const start = performance.now();
            
            requestAnimationFrame(() => {
                const end = performance.now();
                frameTime += end - start;
                frameCount++;
                
                // Check performance every 60 frames
                if (frameCount % 60 === 0) {
                    const avgFrameTime = frameTime / 60;
                    
                    // If performance is poor, reduce animation quality
                    if (avgFrameTime > 16.67) { // 60fps threshold
                        this.reduceAnimationQuality();
                    }
                    
                    frameTime = 0;
                }
                
                measurePerformance();
            });
        };
        
        measurePerformance();
    }

    /**
     * Reduce animation quality for better performance
     */
    reduceAnimationQuality() {
        // Reduce animation duration for better performance
        Object.values(this.animationPresets).forEach(preset => {
            preset.options.duration *= 0.7;
        });
        
        console.log('📈 ILM: Reduced animation quality for better performance');
    }

    /**
     * Setup lazy loading for better performance
     */
    setupLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadLazyElement(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });

        // Observe elements with lazy loading
        document.addEventListener('ilm-lazy-element', (e) => {
            observer.observe(e.detail.element);
        });
        
        this.observers.set('lazy', observer);
    }

    /**
     * Load lazy element content
     * @param {HTMLElement} element - Element to load
     */
    loadLazyElement(element) {
        const src = element.dataset.src;
        if (src && element.tagName === 'IMG') {
            element.src = src;
        }
        
        element.classList.add('ilm-loaded');
    }

    /**
     * Setup performance caching
     */
    setupPerformanceCaching() {
        this.cache = new Map();
        this.cacheExpiry = new Map();
        
        // Clean expired cache entries every 5 minutes
        setInterval(() => {
            this.cleanExpiredCache();
        }, 5 * 60 * 1000);
    }

    /**
     * Cache data with expiry
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    setCacheData(key, data, ttl = 300000) { // 5 minutes default
        this.cache.set(key, data);
        this.cacheExpiry.set(key, Date.now() + ttl);
    }

    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {*} Cached data or null
     */
    getCacheData(key) {
        const expiry = this.cacheExpiry.get(key);
        if (expiry && Date.now() > expiry) {
            this.cache.delete(key);
            this.cacheExpiry.delete(key);
            return null;
        }
        return this.cache.get(key);
    }

    /**
     * Clean expired cache entries
     */
    cleanExpiredCache() {
        const now = Date.now();
        for (const [key, expiry] of this.cacheExpiry.entries()) {
            if (now > expiry) {
                this.cache.delete(key);
                this.cacheExpiry.delete(key);
            }
        }
    }

    /**
     * Check if element is visible
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} True if visible
     */
    isVisible(element) {
        return element.offsetWidth > 0 && element.offsetHeight > 0;
    }

    /**
     * Enhanced popup creation with optimization
     * @param {Object} config - Popup configuration
     * @returns {HTMLElement} Optimized popup element
     */
    createOptimizedPopup(config) {
        const popup = document.createElement('div');
        popup.className = `ilm-popup-container ${config.className || ''}`;
        
        // Apply responsive classes
        popup.classList.add('ilm-responsive');
        
        // Add accessibility attributes
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-modal', 'true');
        if (config.title) {
            popup.setAttribute('aria-label', config.title);
        }
        
        // Set content
        popup.innerHTML = config.content || '';
        
        // Apply theme
        this.applyThemeToElement(popup);
        
        return popup;
    }

    /**
     * Apply theme to specific element
     * @param {HTMLElement} element - Element to theme
     */
    applyThemeToElement(element) {
        const theme = this.getEffectiveTheme();
        element.classList.add(`ilm-theme-${theme}`);
    }

    /**
     * Show popup with optimizations
     * @param {HTMLElement} popup - Popup element
     * @param {Object} options - Display options
     */
    showOptimizedPopup(popup, options = {}) {
        document.body.appendChild(popup);
        
        // Position popup
        if (options.position) {
            this.positionPopup(popup, options.position);
        }
        
        // Animate in
        this.animate(popup, options.animation || 'fadeIn');
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('ilm-popup-open', {
            detail: { popup, options }
        }));
        
        // Setup auto-close if specified
        if (options.autoClose) {
            setTimeout(() => {
                this.hideOptimizedPopup(popup);
            }, options.autoClose);
        }
    }

    /**
     * Hide popup with optimizations
     * @param {HTMLElement} popup - Popup element
     */
    async hideOptimizedPopup(popup) {
        await this.animate(popup, 'fadeOut');
        popup.remove();
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('ilm-popup-close', {
            detail: { popup }
        }));
    }

    /**
     * Position popup optimally
     * @param {HTMLElement} popup - Popup element
     * @param {Object} position - Position configuration
     */
    positionPopup(popup, position) {
        const rect = popup.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        let x = position.x || viewport.width / 2 - rect.width / 2;
        let y = position.y || viewport.height / 2 - rect.height / 2;
        
        // Keep within viewport
        x = Math.max(10, Math.min(x, viewport.width - rect.width - 10));
        y = Math.max(10, Math.min(y, viewport.height - rect.height - 10));
        
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
    }

    /**
     * Update settings
     * @param {Object} newSettings - New settings
     */
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        try {
            await chrome.storage.local.set({
                uiOptimizerSettings: this.settings
            });
            
            // Apply changes
            this.applySettingsChanges(newSettings);
            
            console.log('💾 ILM: UI Optimizer settings updated');
        } catch (error) {
            console.error('❌ ILM: Failed to save UI Optimizer settings:', error);
        }
    }

    /**
     * Apply settings changes
     * @param {Object} changes - Settings changes
     */
    applySettingsChanges(changes) {
        if (changes.theme) {
            this.applyTheme();
        }
        
        if (changes.animations) {
            this.setupAnimationDuration();
            if (changes.animations.reduceMotion) {
                this.disableAnimations();
            }
        }
        
        if (changes.accessibility) {
            this.initializeAccessibility();
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Stop all animations
        this.animations.forEach(animation => {
            animation.cancel();
        });
        this.animations.clear();
        
        // Disconnect observers
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
        
        // Clear cache
        this.cache?.clear();
        this.cacheExpiry?.clear();
    }
}

// CSS styles for UI optimizer
const uiOptimizerStyles = `
<style id="ilm-ui-optimizer-styles">
:root {
    --ilm-primary: #ffffff;
    --ilm-secondary: #f7fafc;
    --ilm-accent: #38b2ac;
    --ilm-text: #2d3748;
    --ilm-text-secondary: #4a5568;
    --ilm-border: #e2e8f0;
    --ilm-shadow: rgba(0, 0, 0, 0.1);
}

.ilm-responsive {
    box-sizing: border-box;
}

.ilm-popup-container {
    position: fixed;
    background: var(--ilm-primary);
    border: 1px solid var(--ilm-border);
    border-radius: 12px;
    box-shadow: 0 10px 30px var(--ilm-shadow);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 10000;
}

.ilm-theme-dark {
    --ilm-primary: #2d3748;
    --ilm-secondary: #4a5568;
    --ilm-text: #e2e8f0;
    --ilm-text-secondary: #a0aec0;
    --ilm-border: #718096;
    --ilm-shadow: rgba(0, 0, 0, 0.3);
}

/* Mobile optimizations */
.ilm-mobile .ilm-popup-container {
    max-width: 95vw;
    max-height: 90vh;
}

.ilm-mobile .ilm-menu-shortcut {
    display: none;
}

/* Touch optimizations */
.ilm-touch .ilm-menu-item,
.ilm-touch .ilm-action-btn {
    min-height: 44px;
    padding: 12px 16px;
}

/* Accessibility */
.ilm-popup-container:focus-within {
    outline: 2px solid var(--ilm-accent);
    outline-offset: 2px;
}

.ilm-menu-item:focus,
.ilm-action-btn:focus {
    background: var(--ilm-secondary);
    outline: 2px solid var(--ilm-accent);
    outline-offset: -2px;
}

/* High contrast mode */
.ilm-high-contrast {
    --ilm-primary: #ffffff;
    --ilm-text: #000000;
    --ilm-border: #000000;
    --ilm-accent: #0000ff;
}

.ilm-high-contrast.ilm-theme-dark {
    --ilm-primary: #000000;
    --ilm-text: #ffffff;
    --ilm-border: #ffffff;
    --ilm-accent: #ffff00;
}

/* Large text mode */
.ilm-large-text {
    font-size: 1.25em;
}

.ilm-large-text .ilm-menu-item,
.ilm-large-text .ilm-action-btn {
    padding: 16px 20px;
}

/* Animation preferences */
@media (prefers-reduced-motion: reduce) {
    .ilm-popup-container,
    .ilm-menu-item,
    .ilm-action-btn {
        transition: none !important;
        animation: none !important;
    }
}

/* Performance optimizations */
.ilm-popup-container {
    will-change: transform, opacity;
    backface-visibility: hidden;
}

.ilm-menu-item,
.ilm-action-btn {
    will-change: background-color;
}

/* Lazy loading */
.ilm-lazy-element {
    opacity: 0;
    transition: opacity 0.3s ease;
}

.ilm-lazy-element.ilm-loaded {
    opacity: 1;
}

/* Screen reader only content */
.ilm-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
</style>
`;

// Add styles to document
if (!document.getElementById('ilm-ui-optimizer-styles')) {
    document.head.insertAdjacentHTML('beforeend', uiOptimizerStyles);
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.UIOptimizer = UIOptimizer;
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmUIOptimizer) {
    window.ilmUIOptimizer = new UIOptimizer();
}