// Immersive Language Master - Bilingual Translation Integration Test
// Test script to verify bilingual translation integration across all components

class BilingualIntegrationTest {
    constructor() {
        this.testResults = [];
        this.initializeTest();
    }

    async initializeTest() {
        console.log('🧪 ILM: Starting Bilingual Translation Integration Test');
        
        // Wait for all components to load
        await this.waitForComponents();
        
        // Run integration tests
        await this.runAllTests();
        
        // Display results
        this.displayResults();
    }

    /**
     * Wait for all required components to be available
     */
    async waitForComponents() {
        const requiredComponents = [
            'ilmBilingualEngine',
            'ilmBilingualPopup',
            'ilmContextMenu',
            'ilmQuickLookup',
            'ilmTextSelectionEnhancer'
        ];

        for (const component of requiredComponents) {
            let retries = 0;
            while (!window[component] && retries < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }
            
            if (!window[component]) {
                this.addTestResult(`${component}`, false, `Component not available after ${retries * 100}ms`);
            } else {
                this.addTestResult(`${component}`, true, 'Component loaded successfully');
            }
        }
    }

    /**
     * Run all integration tests
     */
    async runAllTests() {
        await this.testBilingualEngine();
        await this.testBilingualPopup();
        await this.testContextMenuIntegration();
        await this.testQuickLookupIntegration();
        await this.testTextSelectionIntegration();
        await this.testKeyboardShortcuts();
    }

    /**
     * Test bilingual translation engine
     */
    async testBilingualEngine() {
        if (!window.ilmBilingualEngine) {
            this.addTestResult('Bilingual Engine', false, 'Engine not available');
            return;
        }

        try {
            // Test basic translation
            const result = await window.ilmBilingualEngine.translateBilingually('understand', {
                context: 'I understand what you mean.'
            });

            if (result && result.bilingualExplanations) {
                this.addTestResult('Bilingual Engine - Translation', true, 'Translation successful');
                
                // Check if all levels are present
                const levels = ['elementary', 'intermediate', 'advanced', 'native'];
                const missingLevels = levels.filter(level => !result.bilingualExplanations[level]);
                
                if (missingLevels.length === 0) {
                    this.addTestResult('Bilingual Engine - Levels', true, 'All complexity levels available');
                } else {
                    this.addTestResult('Bilingual Engine - Levels', false, `Missing levels: ${missingLevels.join(', ')}`);
                }
            } else {
                this.addTestResult('Bilingual Engine - Translation', false, 'Invalid translation result');
            }
        } catch (error) {
            this.addTestResult('Bilingual Engine - Translation', false, `Error: ${error.message}`);
        }
    }

    /**
     * Test bilingual popup
     */
    async testBilingualPopup() {
        if (!window.ilmBilingualPopup) {
            this.addTestResult('Bilingual Popup', false, 'Popup not available');
            return;
        }

        try {
            // Test popup creation
            const testElement = document.createElement('span');
            testElement.style.position = 'absolute';
            testElement.style.left = '100px';
            testElement.style.top = '100px';
            document.body.appendChild(testElement);

            // Show popup (but hide it quickly for testing)
            await window.ilmBilingualPopup.showBilingualTranslation('develop', {
                element: testElement,
                level: 'intermediate'
            });

            // Check if popup is visible
            const popup = document.querySelector('#ilm-bilingual-popup');
            if (popup && popup.style.display !== 'none') {
                this.addTestResult('Bilingual Popup - Display', true, 'Popup displays correctly');
                
                // Hide the popup
                await window.ilmBilingualPopup.hidePopup();
            } else {
                this.addTestResult('Bilingual Popup - Display', false, 'Popup not displayed');
            }

            // Clean up
            testElement.remove();
        } catch (error) {
            this.addTestResult('Bilingual Popup - Display', false, `Error: ${error.message}`);
        }
    }

    /**
     * Test context menu integration
     */
    async testContextMenuIntegration() {
        if (!window.ilmContextMenu) {
            this.addTestResult('Context Menu Integration', false, 'Context menu not available');
            return;
        }

        try {
            // Check if bilingual button is in menu
            const menuHTML = window.ilmContextMenu.generateContextMenuHTML();
            
            if (menuHTML.includes('ilm-bilingual') && menuHTML.includes('Bilingual Translation')) {
                this.addTestResult('Context Menu - Bilingual Button', true, 'Bilingual button present in menu');
            } else {
                this.addTestResult('Context Menu - Bilingual Button', false, 'Bilingual button missing from menu');
            }

            // Check if showBilingualTranslation method exists
            if (typeof window.ilmContextMenu.showBilingualTranslation === 'function') {
                this.addTestResult('Context Menu - Method', true, 'showBilingualTranslation method exists');
            } else {
                this.addTestResult('Context Menu - Method', false, 'showBilingualTranslation method missing');
            }
        } catch (error) {
            this.addTestResult('Context Menu Integration', false, `Error: ${error.message}`);
        }
    }

    /**
     * Test quick lookup integration
     */
    async testQuickLookupIntegration() {
        if (!window.ilmQuickLookup) {
            this.addTestResult('Quick Lookup Integration', false, 'Quick lookup not available');
            return;
        }

        try {
            // Check if bilingual button exists in results
            const testResult = {
                word: 'test',
                originalInput: 'test'
            };
            
            const resultHTML = window.ilmQuickLookup.generateResultHTML(testResult);
            
            if (resultHTML.includes('ilm-bilingual-btn') && resultHTML.includes('Bilingual Translation')) {
                this.addTestResult('Quick Lookup - Bilingual Button', true, 'Bilingual button present in results');
            } else {
                this.addTestResult('Quick Lookup - Bilingual Button', false, 'Bilingual button missing from results');
            }

            // Check if showBilingualTranslation method exists
            if (typeof window.ilmQuickLookup.showBilingualTranslation === 'function') {
                this.addTestResult('Quick Lookup - Method', true, 'showBilingualTranslation method exists');
            } else {
                this.addTestResult('Quick Lookup - Method', false, 'showBilingualTranslation method missing');
            }
        } catch (error) {
            this.addTestResult('Quick Lookup Integration', false, `Error: ${error.message}`);
        }
    }

    /**
     * Test text selection integration
     */
    async testTextSelectionIntegration() {
        if (!window.ilmTextSelectionEnhancer) {
            this.addTestResult('Text Selection Integration', false, 'Text selection enhancer not available');
            return;
        }

        try {
            // Check if bilingual button exists in mini popup
            const popupHTML = window.ilmTextSelectionEnhancer.generateMiniPopupHTML();
            
            if (popupHTML.includes('ilm-bilingual-btn') && popupHTML.includes('Bilingual Translation')) {
                this.addTestResult('Text Selection - Bilingual Button', true, 'Bilingual button present in mini popup');
            } else {
                this.addTestResult('Text Selection - Bilingual Button', false, 'Bilingual button missing from mini popup');
            }

            // Check if showBilingualTranslation method exists
            if (typeof window.ilmTextSelectionEnhancer.showBilingualTranslation === 'function') {
                this.addTestResult('Text Selection - Method', true, 'showBilingualTranslation method exists');
            } else {
                this.addTestResult('Text Selection - Method', false, 'showBilingualTranslation method missing');
            }
        } catch (error) {
            this.addTestResult('Text Selection Integration', false, `Error: ${error.message}`);
        }
    }

    /**
     * Test keyboard shortcuts
     */
    async testKeyboardShortcuts() {
        if (!window.ilmContextMenu) {
            this.addTestResult('Keyboard Shortcuts', false, 'Context menu not available for shortcut testing');
            return;
        }

        try {
            // Check if Ctrl+E shortcut is handled
            const hasShortcutHandler = window.ilmContextMenu.handleKeyboardShortcuts.toString().includes('key === \'e\'');
            
            if (hasShortcutHandler) {
                this.addTestResult('Keyboard Shortcuts - Ctrl+E', true, 'Ctrl+E shortcut handler exists');
            } else {
                this.addTestResult('Keyboard Shortcuts - Ctrl+E', false, 'Ctrl+E shortcut handler missing');
            }
        } catch (error) {
            this.addTestResult('Keyboard Shortcuts', false, `Error: ${error.message}`);
        }
    }

    /**
     * Add test result
     * @param {string} testName - Name of the test
     * @param {boolean} passed - Whether the test passed
     * @param {string} details - Additional details
     */
    addTestResult(testName, passed, details) {
        this.testResults.push({
            testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Display test results
     */
    displayResults() {
        console.log('\n🧪 ILM: Bilingual Translation Integration Test Results');
        console.log('=' * 60);

        const passedTests = this.testResults.filter(result => result.passed);
        const failedTests = this.testResults.filter(result => !result.passed);

        console.log(`✅ Passed: ${passedTests.length}`);
        console.log(`❌ Failed: ${failedTests.length}`);
        console.log(`📊 Total: ${this.testResults.length}`);
        console.log('');

        // Show details for all tests
        this.testResults.forEach(result => {
            const icon = result.passed ? '✅' : '❌';
            console.log(`${icon} ${result.testName}: ${result.details}`);
        });

        // Summary
        const successRate = (passedTests.length / this.testResults.length * 100).toFixed(1);
        console.log(`\n📈 Success Rate: ${successRate}%`);

        if (failedTests.length === 0) {
            console.log('🎉 All tests passed! Bilingual translation integration is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please review the integration.');
        }

        // Store results for debugging
        window.bilingualIntegrationTestResults = this.testResults;
    }
}

// Auto-run test when script loads (with delay to ensure components are loaded)
if (typeof window !== 'undefined') {
    setTimeout(() => {
        new BilingualIntegrationTest();
    }, 2000);
}

// Export for manual testing
if (typeof window !== 'undefined') {
    window.BilingualIntegrationTest = BilingualIntegrationTest;
}