// Immersive Language Master - Quick Actions System
// 🚀 OPTIMIZED: Fast keyboard shortcuts and hover actions for improved UX

class QuickActions {
    constructor() {
        this.activeElement = null;
        this.quickOverlay = null;
        this.isVisible = false;
        this.shortcuts = new Map();
        
        this.setupKeyboardShortcuts();
        this.setupGlobalEventListeners();
        this.createQuickOverlay();
    }

    setupKeyboardShortcuts() {
        // Define global keyboard shortcuts
        this.shortcuts.set('k', {
            description: 'Mark word as Known',
            action: () => this.markCurrentWordAsKnown(),
            global: true
        });

        this.shortcuts.set('t', {
            description: 'Show Translation',
            action: () => this.showCurrentWordTranslation(),
            global: true
        });

        this.shortcuts.set('i', {
            description: 'Show More Information',
            action: () => this.showCurrentWordInfo(),
            global: true
        });

        this.shortcuts.set('Escape', {
            description: 'Close overlay/card',
            action: () => this.closeAllOverlays(),
            global: true
        });

        this.shortcuts.set('h', {
            description: 'Show Help',
            action: () => this.showKeyboardHelp(),
            global: true
        });

        this.shortcuts.set('?', {
            description: 'Show Help (alternative)',
            action: () => this.showKeyboardHelp(),
            global: true
        });
    }

    setupGlobalEventListeners() {
        // Global keyboard listener
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
        });

        // DISABLED: Mouse hover triggers to prevent conflict with word-processor tooltip
        // Quick actions can still be triggered via keyboard shortcuts
        /*
        document.addEventListener('mouseover', (e) => {
            this.handleMouseOver(e);
        });

        document.addEventListener('mouseout', (e) => {
            this.handleMouseOut(e);
        });
        */

        // Click outside to close overlays
        document.addEventListener('click', (e) => {
            this.handleDocumentClick(e);
        });
    }

    handleGlobalKeydown(e) {
        // Don't interfere with typing in input fields
        if (this.isTypingInInput(e.target)) {
            return;
        }

        const key = e.key;
        const shortcut = this.shortcuts.get(key);

        if (shortcut && shortcut.global) {
            e.preventDefault();
            e.stopPropagation();
            shortcut.action();
        }
    }

    isTypingInInput(element) {
        const inputTypes = ['input', 'textarea', 'select'];
        const editableTypes = ['contenteditable'];
        
        return (
            inputTypes.includes(element.tagName.toLowerCase()) ||
            element.contentEditable === 'true' ||
            element.closest('[contenteditable="true"]')
        );
    }

    handleMouseOver(e) {
        // Check if hovering over a learning word
        const wordElement = e.target.closest('.ilm-word-learning');
        if (wordElement && !this.isVisible) {
            this.showQuickActionsForElement(wordElement);
        }
    }

    handleMouseOut(e) {
        // Hide quick actions if mouse leaves word area
        const wordElement = e.target.closest('.ilm-word-learning');
        if (wordElement && this.isVisible) {
            // Delay hiding to allow mouse to move to overlay
            setTimeout(() => {
                if (!this.isMouseOverQuickActions(e)) {
                    this.hideQuickActions();
                }
            }, 200);
        }
    }

    handleDocumentClick(e) {
        // Close overlays when clicking outside
        if (this.isVisible && !e.target.closest('.quick-actions-overlay') && !e.target.closest('.ilm-word')) {
            this.hideQuickActions();
        }
    }

    createQuickOverlay() {
        this.quickOverlay = document.createElement('div');
        this.quickOverlay.className = 'quick-actions-overlay';
        this.quickOverlay.innerHTML = `
            <div class="quick-actions-container">
                <div class="quick-action-btn" data-action="known" title="Mark as Known (K)">
                    <span class="action-icon">✓</span>
                    <span class="action-label">Known</span>
                    <span class="action-shortcut">K</span>
                </div>
                <div class="quick-action-btn" data-action="translate" title="Show Translation (T)">
                    <span class="action-icon">译</span>
                    <span class="action-label">Translate</span>
                    <span class="action-shortcut">T</span>
                </div>
                <div class="quick-action-btn" data-action="info" title="More Information (I)">
                    <span class="action-icon">ℹ</span>
                    <span class="action-label">Details</span>
                    <span class="action-shortcut">I</span>
                </div>
                <div class="quick-action-btn" data-action="close" title="Close (Esc)">
                    <span class="action-icon">×</span>
                    <span class="action-label">Close</span>
                    <span class="action-shortcut">Esc</span>
                </div>
            </div>
        `;

        // Add event listeners to quick action buttons
        this.quickOverlay.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.currentTarget.dataset.action;
                this.executeQuickAction(action);
            });

            // Hover effects
            btn.addEventListener('mouseenter', () => {
                btn.classList.add('hover');
            });

            btn.addEventListener('mouseleave', () => {
                btn.classList.remove('hover');
            });
        });

        // Prevent overlay from closing when clicking on it
        this.quickOverlay.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        document.body.appendChild(this.quickOverlay);
        this.hideQuickActions(); // Initially hidden
    }

    showQuickActionsForElement(element) {
        this.activeElement = element;
        this.isVisible = true;

        // Position overlay near the word
        this.positionOverlay(element);

        // Show overlay with animation
        this.quickOverlay.style.display = 'block';
        setTimeout(() => {
            this.quickOverlay.classList.add('visible');
        }, 10);

        // Update overlay content based on word state
        this.updateOverlayForWord(element);
    }

    hideQuickActions() {
        if (!this.isVisible) return;

        this.isVisible = false;
        this.quickOverlay.classList.remove('visible');
        
        setTimeout(() => {
            this.quickOverlay.style.display = 'none';
            this.activeElement = null;
        }, 200);
    }

    positionOverlay(element) {
        const rect = element.getBoundingClientRect();
        const overlayRect = this.quickOverlay.getBoundingClientRect();
        
        // Position above the word by default
        let left = rect.left + (rect.width / 2) - (overlayRect.width / 2);
        let top = rect.top - overlayRect.height - 10;
        
        // Ensure overlay stays within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Horizontal constraints
        if (left < 10) left = 10;
        if (left + overlayRect.width > viewportWidth - 10) {
            left = viewportWidth - overlayRect.width - 10;
        }
        
        // Vertical constraints - flip to bottom if no space above
        if (top < 10) {
            top = rect.bottom + 10;
        }
        
        // Final check for bottom constraint
        if (top + overlayRect.height > viewportHeight - 10) {
            top = viewportHeight - overlayRect.height - 10;
        }
        
        this.quickOverlay.style.left = `${left}px`;
        this.quickOverlay.style.top = `${top}px`;
    }

    updateOverlayForWord(element) {
        const word = element.dataset.word;
        const classification = element.dataset.classification;

        // Update known button based on current state
        const knownBtn = this.quickOverlay.querySelector('[data-action="known"]');
        if (classification === 'known') {
            knownBtn.querySelector('.action-label').textContent = 'Learning';
            knownBtn.querySelector('.action-icon').textContent = '📚';
            knownBtn.title = 'Mark as Learning (K)';
        } else {
            knownBtn.querySelector('.action-label').textContent = 'Known';
            knownBtn.querySelector('.action-icon').textContent = '✓';
            knownBtn.title = 'Mark as Known (K)';
        }
    }

    executeQuickAction(action) {
        if (!this.activeElement) return;

        const word = this.activeElement.dataset.word;
        
        switch(action) {
            case 'known':
                this.markCurrentWordAsKnown();
                break;
            case 'translate':
                this.showCurrentWordTranslation();
                break;
            case 'info':
                this.showCurrentWordInfo();
                break;
            case 'close':
                this.closeAllOverlays();
                break;
        }
    }

    markCurrentWordAsKnown() {
        if (!this.activeElement) {
            this.findCurrentFocusedWord();
        }

        if (this.activeElement && window.ilmWordProcessor) {
            const word = this.activeElement.dataset.word;
            window.ilmWordProcessor.markWordAsKnown(word);
            this.showSuccessFeedback('Word marked as known!');
            this.hideQuickActions();
        }
    }

    showCurrentWordTranslation() {
        if (!this.activeElement) {
            this.findCurrentFocusedWord();
        }

        if (this.activeElement && window.ilmSimplifiedWordCard) {
            const word = this.activeElement.dataset.word;
            window.ilmSimplifiedWordCard.showWord(word, this.activeElement);
            this.hideQuickActions();
        }
    }

    showCurrentWordInfo() {
        if (!this.activeElement) {
            this.findCurrentFocusedWord();
        }

        if (this.activeElement && window.ilmWordProcessor) {
            const word = this.activeElement.dataset.word;
            window.ilmWordProcessor.showWordTooltip(this.activeElement, word);
            this.hideQuickActions();
        }
    }

    closeAllOverlays() {
        // Close quick actions
        this.hideQuickActions();
        
        // Close simplified word card
        if (window.ilmSimplifiedWordCard && window.ilmSimplifiedWordCard.isVisible()) {
            window.ilmSimplifiedWordCard.hideCard();
        }
        
        // Close tooltips
        const tooltips = document.querySelectorAll('.ilm-tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
        
        // Close any other popups
        const popups = document.querySelectorAll('.ilm-definition-popup, .ilm-enhanced-popup');
        popups.forEach(popup => popup.remove());
    }

    findCurrentFocusedWord() {
        // Try to find the currently focused or recently hovered word
        const focusedElement = document.querySelector('.ilm-word:focus');
        if (focusedElement) {
            this.activeElement = focusedElement;
            return;
        }

        // Fallback: find the first learning word on screen
        const learningWords = document.querySelectorAll('.ilm-word-learning');
        if (learningWords.length > 0) {
            this.activeElement = learningWords[0];
        }
    }

    isMouseOverQuickActions(event) {
        const overlay = this.quickOverlay;
        if (!overlay) return false;
        
        const rect = overlay.getBoundingClientRect();
        const mouseX = (event && event.clientX) || 0;
        const mouseY = (event && event.clientY) || 0;
        
        return (
            mouseX >= rect.left &&
            mouseX <= rect.right &&
            mouseY >= rect.top &&
            mouseY <= rect.bottom
        );
    }

    showSuccessFeedback(message) {
        // Create temporary success notification
        const notification = document.createElement('div');
        notification.className = 'quick-action-notification success';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Position notification
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '10001';
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }

    showKeyboardHelp() {
        if (document.querySelector('.keyboard-help-overlay')) {
            return; // Already showing
        }

        const helpOverlay = document.createElement('div');
        helpOverlay.className = 'keyboard-help-overlay';
        helpOverlay.innerHTML = `
            <div class="keyboard-help-content">
                <div class="help-header">
                    <h3>⌨️ Keyboard Shortcuts</h3>
                    <button class="help-close-btn" onclick="this.closest('.keyboard-help-overlay').remove()">×</button>
                </div>
                <div class="help-shortcuts">
                    <div class="shortcut-item">
                        <kbd>K</kbd>
                        <span>Mark word as Known</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>T</kbd>
                        <span>Show Translation</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>I</kbd>
                        <span>Show more Information</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>Esc</kbd>
                        <span>Close overlays</span>
                    </div>
                    <div class="shortcut-item">
                        <kbd>H</kbd> or <kbd>?</kbd>
                        <span>Show this help</span>
                    </div>
                </div>
                <div class="help-footer">
                    <p>💡 Hover over highlighted words to see quick actions</p>
                </div>
            </div>
        `;

        document.body.appendChild(helpOverlay);

        // Close on click outside
        helpOverlay.addEventListener('click', (e) => {
            if (e.target === helpOverlay) {
                helpOverlay.remove();
            }
        });

        // Close on Escape
        const closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                helpOverlay.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        };
        document.addEventListener('keydown', closeOnEscape);
    }
}

// Global instance
window.ilmQuickActions = new QuickActions();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuickActions;
}