// Immersive Language Master - Learning Dashboard Component
// Comprehensive learning progress visualization and bookmark management

class LearningDashboard {
    constructor() {
        this.isVisible = false;
        this.currentView = 'overview';
        this.refreshInterval = null;
        
        this.initializeDashboard();
    }

    async initializeDashboard() {
        try {
            // Wait for learning manager to be available
            await this.waitForLearningManager();
            
            // Create dashboard UI
            this.createDashboardUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('📊 ILM: Learning Dashboard initialized successfully');
        } catch (error) {
            console.error('❌ ILM: Learning Dashboard initialization failed:', error);
        }
    }

    /**
     * Wait for learning manager to be available
     * @returns {Promise} Resolves when learning manager is ready
     */
    async waitForLearningManager() {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                if (window.ilmLearningManager) {
                    clearInterval(checkInterval);
                    resolve();
                } else if (Date.now() > Date.now() + 10000) { // 10 second timeout
                    clearInterval(checkInterval);
                    reject(new Error('Learning Manager not available'));
                }
            }, 100);
        });
    }

    /**
     * Create main dashboard UI structure
     */
    createDashboardUI() {
        // Remove existing dashboard if present
        const existing = document.getElementById('ilm-learning-dashboard');
        if (existing) {
            existing.remove();
        }

        const dashboard = document.createElement('div');
        dashboard.id = 'ilm-learning-dashboard';
        dashboard.className = 'ilm-dashboard-container';
        dashboard.innerHTML = this.generateDashboardHTML();

        // Position dashboard (initially hidden)
        dashboard.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 380px;
            height: 100vh;
            background: white;
            box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
            z-index: 10005;
            transition: right 0.3s ease;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        document.body.appendChild(dashboard);
        this.dashboardElement = dashboard;
    }

    /**
     * Generate HTML content for dashboard
     * @returns {string} Dashboard HTML
     */
    generateDashboardHTML() {
        return `
            <div class="ilm-dashboard-header">
                <div class="ilm-dashboard-title">
                    <h2>📚 Learning Progress</h2>
                    <button class="ilm-dashboard-close" title="Close Dashboard">&times;</button>
                </div>
                <div class="ilm-dashboard-tabs">
                    <button class="ilm-tab-btn active" data-view="overview">Overview</button>
                    <button class="ilm-tab-btn" data-view="bookmarks">Bookmarks</button>
                    <button class="ilm-tab-btn" data-view="review">Review</button>
                    <button class="ilm-tab-btn" data-view="stats">Statistics</button>
                </div>
            </div>

            <div class="ilm-dashboard-content">
                <div class="ilm-view-container" data-view="overview">
                    ${this.generateOverviewSection()}
                </div>
                
                <div class="ilm-view-container" data-view="bookmarks" style="display: none;">
                    ${this.generateBookmarksSection()}
                </div>
                
                <div class="ilm-view-container" data-view="review" style="display: none;">
                    ${this.generateReviewSection()}
                </div>
                
                <div class="ilm-view-container" data-view="stats" style="display: none;">
                    ${this.generateStatisticsSection()}
                </div>
            </div>
        `;
    }

    /**
     * Generate overview section HTML
     * @returns {string} Overview section HTML
     */
    generateOverviewSection() {
        const stats = window.ilmWordProcessor ? 
            window.ilmWordProcessor.getLearningStatistics() : 
            { totalBookmarks: 0, currentStreak: 0, wordsForReview: 0, todayStudied: 0 };

        return `
            <div class="ilm-overview-section">
                <div class="ilm-quick-stats">
                    <div class="ilm-stat-card">
                        <div class="ilm-stat-icon">📖</div>
                        <div class="ilm-stat-info">
                            <div class="ilm-stat-number">${stats.totalBookmarks}</div>
                            <div class="ilm-stat-label">Bookmarked Words</div>
                        </div>
                    </div>
                    
                    <div class="ilm-stat-card">
                        <div class="ilm-stat-icon">🔥</div>
                        <div class="ilm-stat-info">
                            <div class="ilm-stat-number">${stats.currentStreak}</div>
                            <div class="ilm-stat-label">Day Streak</div>
                        </div>
                    </div>
                    
                    <div class="ilm-stat-card">
                        <div class="ilm-stat-icon">📝</div>
                        <div class="ilm-stat-info">
                            <div class="ilm-stat-number">${stats.wordsForReview}</div>
                            <div class="ilm-stat-label">Due for Review</div>
                        </div>
                    </div>
                    
                    <div class="ilm-stat-card">
                        <div class="ilm-stat-icon">⭐</div>
                        <div class="ilm-stat-info">
                            <div class="ilm-stat-number">${stats.todayStudied}</div>
                            <div class="ilm-stat-label">Studied Today</div>
                        </div>
                    </div>
                </div>

                <div class="ilm-quick-actions">
                    <h3>Quick Actions</h3>
                    <button class="ilm-action-btn" onclick="window.ilmLearningDashboard.startReview()">
                        📚 Start Review Session
                    </button>
                    <button class="ilm-action-btn" onclick="window.ilmLearningDashboard.showBookmarks()">
                        📖 View All Bookmarks
                    </button>
                    <button class="ilm-action-btn" onclick="window.ilmLearningDashboard.exportData()">
                        💾 Export Learning Data
                    </button>
                </div>

                <div class="ilm-recent-activity" id="ilm-recent-activity">
                    <h3>Recent Activity</h3>
                    <div class="ilm-activity-loading">Loading recent activity...</div>
                </div>
            </div>
        `;
    }

    /**
     * Generate bookmarks section HTML
     * @returns {string} Bookmarks section HTML
     */
    generateBookmarksSection() {
        return `
            <div class="ilm-bookmarks-section">
                <div class="ilm-bookmarks-header">
                    <div class="ilm-bookmarks-controls">
                        <input type="text" class="ilm-search-input" placeholder="Search bookmarks..." id="ilm-bookmark-search">
                        <select class="ilm-filter-select" id="ilm-bookmark-filter">
                            <option value="all">All Categories</option>
                            <option value="noun">Nouns</option>
                            <option value="verb">Verbs</option>
                            <option value="adjective">Adjectives</option>
                            <option value="adverb">Adverbs</option>
                        </select>
                    </div>
                    <div class="ilm-bookmarks-count" id="ilm-bookmarks-count">
                        Loading bookmarks...
                    </div>
                </div>
                
                <div class="ilm-bookmarks-list" id="ilm-bookmarks-list">
                    <div class="ilm-loading-placeholder">
                        <div class="ilm-loading-spinner"></div>
                        <p>Loading your bookmarked words...</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate review section HTML
     * @returns {string} Review section HTML
     */
    generateReviewSection() {
        return `
            <div class="ilm-review-section">
                <div class="ilm-review-header">
                    <h3>📚 Review Session</h3>
                    <p>Practice words that are due for review using spaced repetition.</p>
                </div>
                
                <div class="ilm-review-stats" id="ilm-review-stats">
                    <div class="ilm-review-stat">
                        <span class="ilm-review-stat-number" id="ilm-due-count">0</span>
                        <span class="ilm-review-stat-label">Due Now</span>
                    </div>
                    <div class="ilm-review-stat">
                        <span class="ilm-review-stat-number" id="ilm-overdue-count">0</span>
                        <span class="ilm-review-stat-label">Overdue</span>
                    </div>
                </div>

                <div class="ilm-review-controls">
                    <button class="ilm-start-review-btn" id="ilm-start-review" onclick="window.ilmLearningDashboard.startReviewSession()">
                        🎯 Start Review Session
                    </button>
                    <button class="ilm-practice-btn" onclick="window.ilmLearningDashboard.startPracticeMode()">
                        ✍️ Practice Mode
                    </button>
                </div>

                <div class="ilm-review-queue" id="ilm-review-queue">
                    <h4>Up Next:</h4>
                    <div class="ilm-review-queue-list" id="ilm-review-queue-list">
                        Loading review queue...
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate statistics section HTML
     * @returns {string} Statistics section HTML
     */
    generateStatisticsSection() {
        return `
            <div class="ilm-statistics-section">
                <div class="ilm-stats-overview">
                    <h3>📊 Learning Analytics</h3>
                    
                    <div class="ilm-progress-charts">
                        <div class="ilm-chart-container">
                            <h4>Weekly Progress</h4>
                            <div class="ilm-weekly-chart" id="ilm-weekly-chart">
                                <!-- Weekly progress chart will be generated here -->
                            </div>
                        </div>
                        
                        <div class="ilm-chart-container">
                            <h4>Mastery Distribution</h4>
                            <div class="ilm-mastery-chart" id="ilm-mastery-chart">
                                <!-- Mastery distribution will be generated here -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="ilm-detailed-stats" id="ilm-detailed-stats">
                        Loading detailed statistics...
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for dashboard interactions
     */
    setupEventListeners() {
        const dashboard = this.dashboardElement;

        // Close button
        dashboard.querySelector('.ilm-dashboard-close').addEventListener('click', () => {
            this.hideDashboard();
        });

        // Tab switching
        dashboard.querySelectorAll('.ilm-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchView(btn.dataset.view);
            });
        });

        // Search functionality
        const searchInput = dashboard.querySelector('#ilm-bookmark-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterBookmarks(e.target.value);
            });
        }

        // Filter functionality
        const filterSelect = dashboard.querySelector('#ilm-bookmark-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterBookmarks(null, e.target.value);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + L: Toggle Learning Dashboard
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                this.toggleDashboard();
            }
            
            // Escape: Close dashboard
            if (e.key === 'Escape' && this.isVisible) {
                this.hideDashboard();
            }
        });
    }

    /**
     * Show learning dashboard
     */
    showDashboard() {
        if (!this.dashboardElement) return;

        this.isVisible = true;
        this.dashboardElement.style.right = '0px';
        
        // Load content for current view
        this.loadViewContent(this.currentView);
        
        // Start auto-refresh
        this.startAutoRefresh();
        
        // Add backdrop
        this.createBackdrop();
    }

    /**
     * Hide learning dashboard
     */
    hideDashboard() {
        if (!this.dashboardElement) return;

        this.isVisible = false;
        this.dashboardElement.style.right = '-400px';
        
        // Stop auto-refresh
        this.stopAutoRefresh();
        
        // Remove backdrop
        this.removeBackdrop();
    }

    /**
     * Toggle dashboard visibility
     */
    toggleDashboard() {
        if (this.isVisible) {
            this.hideDashboard();
        } else {
            this.showDashboard();
        }
    }

    /**
     * Switch between different views
     * @param {string} viewName - Name of view to switch to
     */
    switchView(viewName) {
        // Update active tab
        this.dashboardElement.querySelectorAll('.ilm-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Update active view container
        this.dashboardElement.querySelectorAll('.ilm-view-container').forEach(container => {
            container.style.display = container.dataset.view === viewName ? 'block' : 'none';
        });

        this.currentView = viewName;
        
        // Load content for new view
        this.loadViewContent(viewName);
    }

    /**
     * Load content for specific view
     * @param {string} viewName - Name of view to load
     */
    async loadViewContent(viewName) {
        try {
            switch (viewName) {
                case 'overview':
                    await this.loadOverviewContent();
                    break;
                case 'bookmarks':
                    await this.loadBookmarksContent();
                    break;
                case 'review':
                    await this.loadReviewContent();
                    break;
                case 'stats':
                    await this.loadStatisticsContent();
                    break;
            }
        } catch (error) {
            console.error(`❌ ILM: Failed to load ${viewName} content:`, error);
        }
    }

    /**
     * Load overview content with recent activity
     */
    async loadOverviewContent() {
        const activityContainer = document.getElementById('ilm-recent-activity');
        if (!activityContainer || !window.ilmLearningManager) return;

        try {
            // Get recent study sessions
            const sessions = window.ilmLearningManager.studySessions.slice(-10);
            const loadingEl = activityContainer.querySelector('.ilm-activity-loading');
            
            if (sessions.length === 0) {
                loadingEl.textContent = 'No recent activity. Start learning!';
                return;
            }

            const activityHTML = sessions.reverse().map(session => `
                <div class="ilm-activity-item">
                    <div class="ilm-activity-icon">${session.correct ? '✅' : '❌'}</div>
                    <div class="ilm-activity-details">
                        <div class="ilm-activity-word">${session.word}</div>
                        <div class="ilm-activity-time">${this.formatTimeAgo(session.timestamp)}</div>
                    </div>
                    <div class="ilm-activity-score">${session.masteryLevel}%</div>
                </div>
            `).join('');

            loadingEl.outerHTML = `<div class="ilm-activity-list">${activityHTML}</div>`;

        } catch (error) {
            console.error('❌ ILM: Failed to load overview content:', error);
        }
    }

    /**
     * Load bookmarks content with search and filter
     */
    async loadBookmarksContent() {
        const bookmarksContainer = document.getElementById('ilm-bookmarks-list');
        const countContainer = document.getElementById('ilm-bookmarks-count');
        
        if (!bookmarksContainer || !window.ilmLearningManager) return;

        try {
            const bookmarks = Array.from(window.ilmLearningManager.bookmarkedWords.values());
            
            if (countContainer) {
                countContainer.textContent = `${bookmarks.length} bookmarked words`;
            }

            if (bookmarks.length === 0) {
                bookmarksContainer.innerHTML = `
                    <div class="ilm-empty-state">
                        <div class="ilm-empty-icon">📖</div>
                        <h4>No bookmarks yet</h4>
                        <p>Start exploring content and bookmark interesting words!</p>
                    </div>
                `;
                return;
            }

            const bookmarksHTML = bookmarks.map(bookmark => `
                <div class="ilm-bookmark-item" data-word="${bookmark.word}" data-category="${bookmark.category}">
                    <div class="ilm-bookmark-header">
                        <div class="ilm-bookmark-word">${bookmark.originalCase}</div>
                        <div class="ilm-bookmark-meta">
                            <span class="ilm-bookmark-level">${bookmark.cefrLevel || 'B1'}</span>
                            <span class="ilm-bookmark-difficulty">${bookmark.difficulty || 'Medium'}</span>
                        </div>
                    </div>
                    
                    <div class="ilm-bookmark-content">
                        <div class="ilm-bookmark-translation">${bookmark.translation || 'No translation available'}</div>
                        ${bookmark.pronunciation ? `<div class="ilm-bookmark-pronunciation">[${bookmark.pronunciation}]</div>` : ''}
                        ${bookmark.examples && bookmark.examples.length > 0 ? 
                            `<div class="ilm-bookmark-example">"${bookmark.examples[0]}"</div>` : ''}
                    </div>
                    
                    <div class="ilm-bookmark-actions">
                        <button class="ilm-bookmark-study" onclick="window.ilmLearningDashboard.studyWord('${bookmark.id}')">
                            📚 Study
                        </button>
                        <button class="ilm-bookmark-remove" onclick="window.ilmLearningDashboard.removeBookmark('${bookmark.id}')">
                            🗑️ Remove
                        </button>
                    </div>
                </div>
            `).join('');

            bookmarksContainer.innerHTML = bookmarksHTML;

        } catch (error) {
            console.error('❌ ILM: Failed to load bookmarks:', error);
            bookmarksContainer.innerHTML = '<div class="ilm-error">Failed to load bookmarks</div>';
        }
    }

    /**
     * Load review content and queue
     */
    async loadReviewContent() {
        if (!window.ilmLearningManager) return;

        try {
            const reviewWords = window.ilmLearningManager.getWordsForReview();
            const now = Date.now();
            
            // Update counters
            const dueCount = reviewWords.filter(word => word.nextReview <= now).length;
            const overdueCount = reviewWords.filter(word => word.nextReview < now - (24 * 60 * 60 * 1000)).length;
            
            document.getElementById('ilm-due-count').textContent = dueCount;
            document.getElementById('ilm-overdue-count').textContent = overdueCount;
            
            // Update queue display
            const queueContainer = document.getElementById('ilm-review-queue-list');
            if (reviewWords.length === 0) {
                queueContainer.innerHTML = '<p>No words due for review! 🎉</p>';
            } else {
                const queueHTML = reviewWords.slice(0, 5).map(word => `
                    <div class="ilm-queue-item">
                        <span class="ilm-queue-word">${word.originalCase}</span>
                        <span class="ilm-queue-time">${this.formatTimeUntil(word.nextReview)}</span>
                    </div>
                `).join('');
                queueContainer.innerHTML = queueHTML;
            }

        } catch (error) {
            console.error('❌ ILM: Failed to load review content:', error);
        }
    }

    /**
     * Load detailed statistics and charts
     */
    async loadStatisticsContent() {
        if (!window.ilmLearningManager) return;

        try {
            const stats = window.ilmLearningManager.getLearningStatistics();
            
            // Update detailed stats
            const detailedContainer = document.getElementById('ilm-detailed-stats');
            detailedContainer.innerHTML = `
                <div class="ilm-stat-grid">
                    <div class="ilm-stat-item">
                        <h5>Mastery Levels</h5>
                        <div class="ilm-mastery-breakdown">
                            <div class="ilm-mastery-item">
                                <span class="ilm-mastery-label">Mastered:</span>
                                <span class="ilm-mastery-value">${stats.mastery.mastered}</span>
                            </div>
                            <div class="ilm-mastery-item">
                                <span class="ilm-mastery-label">Learning:</span>
                                <span class="ilm-mastery-value">${stats.mastery.learning}</span>
                            </div>
                            <div class="ilm-mastery-item">
                                <span class="ilm-mastery-label">Reviewing:</span>
                                <span class="ilm-mastery-value">${stats.mastery.reviewing}</span>
                            </div>
                            <div class="ilm-mastery-item">
                                <span class="ilm-mastery-label">Bookmarked:</span>
                                <span class="ilm-mastery-value">${stats.mastery.bookmarked}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ilm-stat-item">
                        <h5>Difficulty Levels</h5>
                        <div class="ilm-difficulty-breakdown">
                            <div class="ilm-difficulty-item">
                                <span class="ilm-difficulty-label">Basic:</span>
                                <span class="ilm-difficulty-value">${stats.difficulty.basic || 0}</span>
                            </div>
                            <div class="ilm-difficulty-item">
                                <span class="ilm-difficulty-label">Intermediate:</span>
                                <span class="ilm-difficulty-value">${stats.difficulty.intermediate || 0}</span>
                            </div>
                            <div class="ilm-difficulty-item">
                                <span class="ilm-difficulty-label">Advanced:</span>
                                <span class="ilm-difficulty-value">${stats.difficulty.advanced || 0}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ilm-stat-item">
                        <h5>Goals Progress</h5>
                        <div class="ilm-goals-progress">
                            <div class="ilm-goal-item">
                                <span class="ilm-goal-label">Daily:</span>
                                <div class="ilm-goal-bar">
                                    <div class="ilm-goal-fill" style="width: ${Math.min(100, (stats.goals.daily.completed / stats.goals.daily.target) * 100)}%"></div>
                                </div>
                                <span class="ilm-goal-text">${stats.goals.daily.completed}/${stats.goals.daily.target}</span>
                            </div>
                            <div class="ilm-goal-item">
                                <span class="ilm-goal-label">Weekly:</span>
                                <div class="ilm-goal-bar">
                                    <div class="ilm-goal-fill" style="width: ${Math.min(100, (stats.goals.weekly.completed / stats.goals.weekly.target) * 100)}%"></div>
                                </div>
                                <span class="ilm-goal-text">${stats.goals.weekly.completed}/${stats.goals.weekly.target}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('❌ ILM: Failed to load statistics:', error);
        }
    }

    /**
     * Filter bookmarks by search term and category
     * @param {string} searchTerm - Search term
     * @param {string} category - Category filter
     */
    filterBookmarks(searchTerm, category) {
        const bookmarkItems = document.querySelectorAll('.ilm-bookmark-item');
        const search = searchTerm?.toLowerCase() || document.getElementById('ilm-bookmark-search')?.value.toLowerCase() || '';
        const filter = category || document.getElementById('ilm-bookmark-filter')?.value || 'all';

        let visibleCount = 0;

        bookmarkItems.forEach(item => {
            const word = item.dataset.word.toLowerCase();
            const itemCategory = item.dataset.category.toLowerCase();
            
            const matchesSearch = !search || word.includes(search);
            const matchesFilter = filter === 'all' || itemCategory === filter;
            
            if (matchesSearch && matchesFilter) {
                item.style.display = 'block';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Update count
        const countContainer = document.getElementById('ilm-bookmarks-count');
        if (countContainer) {
            const total = bookmarkItems.length;
            countContainer.textContent = visibleCount === total ? 
                `${total} bookmarked words` : 
                `${visibleCount} of ${total} bookmarked words`;
        }
    }

    /**
     * Start review session
     */
    startReviewSession() {
        // Implementation will depend on existing practice system
        console.log('🎯 Starting review session...');
        
        if (window.ilmUniversalProcessor?.previewSystem) {
            // Get words for review
            const reviewWords = window.ilmLearningManager.getWordsForReview();
            
            if (reviewWords.length === 0) {
                this.showNotification('No words due for review!', 'info');
                return;
            }

            // Convert to practice format
            const practiceWords = reviewWords.map(word => ({
                word: word.word,
                frequency: 1,
                vocabRank: word.masteryLevel || 50
            }));

            // Start practice mode
            window.ilmUniversalProcessor.previewSystem.currentWords = practiceWords;
            window.ilmUniversalProcessor.previewSystem.startPractice();
            
            // Hide dashboard during practice
            this.hideDashboard();
        }
    }

    /**
     * Show notification message
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        if (window.ilmWordProcessor) {
            window.ilmWordProcessor.showTemporaryFeedback(
                document.body,
                message,
                type
            );
        }
    }

    /**
     * Format time ago for activity display
     * @param {number} timestamp - Timestamp to format
     * @returns {string} Formatted time string
     */
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    /**
     * Format time until for review queue
     * @param {number} timestamp - Future timestamp
     * @returns {string} Formatted time string
     */
    formatTimeUntil(timestamp) {
        const now = Date.now();
        const diff = timestamp - now;
        
        if (diff <= 0) return 'Due now';
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        return `${minutes}m`;
    }

    /**
     * Create backdrop overlay
     */
    createBackdrop() {
        const backdrop = document.createElement('div');
        backdrop.id = 'ilm-dashboard-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            z-index: 10004;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        backdrop.addEventListener('click', () => this.hideDashboard());
        document.body.appendChild(backdrop);
        
        // Fade in
        setTimeout(() => {
            backdrop.style.opacity = '1';
        }, 10);
    }

    /**
     * Remove backdrop overlay
     */
    removeBackdrop() {
        const backdrop = document.getElementById('ilm-dashboard-backdrop');
        if (backdrop) {
            backdrop.style.opacity = '0';
            setTimeout(() => backdrop.remove(), 300);
        }
    }

    /**
     * Start auto-refresh interval
     */
    startAutoRefresh() {
        this.stopAutoRefresh(); // Clear any existing interval
        
        this.refreshInterval = setInterval(() => {
            if (this.isVisible) {
                this.loadViewContent(this.currentView);
            }
        }, 30000); // Refresh every 30 seconds
    }

    /**
     * Stop auto-refresh interval
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Export learning data
     */
    exportData() {
        if (!window.ilmLearningManager) {
            this.showNotification('Learning Manager not available', 'error');
            return;
        }

        try {
            const data = {
                bookmarks: Array.from(window.ilmLearningManager.bookmarkedWords.entries()),
                learningRecords: Array.from(window.ilmLearningManager.learningRecords.entries()),
                studySessions: window.ilmLearningManager.studySessions,
                statistics: window.ilmLearningManager.getLearningStatistics(),
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `ilm-learning-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showNotification('Learning data exported successfully!', 'success');

        } catch (error) {
            console.error('❌ ILM: Export failed:', error);
            this.showNotification('Export failed', 'error');
        }
    }
}

// CSS styles for dashboard
const dashboardStyles = `
<style id="ilm-dashboard-styles">
.ilm-dashboard-container {
    font-size: 14px;
    line-height: 1.4;
}

.ilm-dashboard-header {
    padding: 16px;
    background: linear-gradient(135deg, #2d3748, #4a5568);
    color: white;
    border-bottom: 1px solid #e2e8f0;
}

.ilm-dashboard-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.ilm-dashboard-title h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.ilm-dashboard-close {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s ease;
}

.ilm-dashboard-close:hover {
    background: rgba(255, 255, 255, 0.1);
}

.ilm-dashboard-tabs {
    display: flex;
    gap: 4px;
}

.ilm-tab-btn {
    flex: 1;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
}

.ilm-tab-btn.active {
    background: rgba(255, 255, 255, 0.2);
    font-weight: 500;
}

.ilm-tab-btn:hover {
    background: rgba(255, 255, 255, 0.15);
}

.ilm-dashboard-content {
    padding: 16px;
    height: calc(100vh - 120px);
    overflow-y: auto;
}

.ilm-quick-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
}

.ilm-stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f7fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.ilm-stat-icon {
    font-size: 24px;
}

.ilm-stat-info {
    flex: 1;
}

.ilm-stat-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #2d3748;
    line-height: 1;
}

.ilm-stat-label {
    font-size: 0.75rem;
    color: #718096;
    font-weight: 500;
}

.ilm-quick-actions {
    margin-bottom: 20px;
}

.ilm-quick-actions h3 {
    margin: 0 0 12px 0;
    font-size: 1rem;
    color: #2d3748;
}

.ilm-action-btn {
    display: block;
    width: 100%;
    padding: 12px 16px;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #38b2ac, #319795);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.ilm-action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(56, 178, 172, 0.3);
}

.ilm-recent-activity h3 {
    margin: 0 0 12px 0;
    font-size: 1rem;
    color: #2d3748;
}

.ilm-activity-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.ilm-activity-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: #f7fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.ilm-activity-details {
    flex: 1;
}

.ilm-activity-word {
    font-weight: 500;
    color: #2d3748;
}

.ilm-activity-time {
    font-size: 0.75rem;
    color: #718096;
}

.ilm-activity-score {
    font-size: 0.75rem;
    font-weight: 600;
    color: #38b2ac;
}

.ilm-bookmarks-header {
    margin-bottom: 16px;
}

.ilm-bookmarks-controls {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

.ilm-search-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.875rem;
}

.ilm-filter-select {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
}

.ilm-bookmarks-count {
    font-size: 0.75rem;
    color: #718096;
    font-weight: 500;
}

.ilm-bookmark-item {
    padding: 16px;
    background: #f7fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    margin-bottom: 12px;
}

.ilm-bookmark-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
}

.ilm-bookmark-word {
    font-size: 1.125rem;
    font-weight: 600;
    color: #2d3748;
}

.ilm-bookmark-meta {
    display: flex;
    gap: 6px;
}

.ilm-bookmark-level,
.ilm-bookmark-difficulty {
    padding: 2px 6px;
    background: #e2e8f0;
    color: #4a5568;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 600;
}

.ilm-bookmark-translation {
    color: #4a5568;
    margin-bottom: 4px;
}

.ilm-bookmark-pronunciation {
    font-style: italic;
    color: #718096;
    font-size: 0.875rem;
    margin-bottom: 4px;
}

.ilm-bookmark-example {
    font-style: italic;
    color: #4a5568;
    font-size: 0.875rem;
    margin-bottom: 8px;
}

.ilm-bookmark-actions {
    display: flex;
    gap: 8px;
}

.ilm-bookmark-study,
.ilm-bookmark-remove {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.ilm-bookmark-study {
    background: #e6fffa;
    color: #319795;
    border: 1px solid #b2f5ea;
}

.ilm-bookmark-study:hover {
    background: #319795;
    color: white;
}

.ilm-bookmark-remove {
    background: #fed7e2;
    color: #e53e3e;
    border: 1px solid #fbb6ce;
}

.ilm-bookmark-remove:hover {
    background: #e53e3e;
    color: white;
}

.ilm-empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #718096;
}

.ilm-empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.ilm-loading-placeholder {
    text-align: center;
    padding: 40px 20px;
    color: #718096;
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

@media (prefers-color-scheme: dark) {
    .ilm-dashboard-container {
        background: #1a202c;
        color: #e2e8f0;
    }
    
    .ilm-stat-card,
    .ilm-bookmark-item {
        background: #2d3748;
        border-color: #4a5568;
        color: #e2e8f0;
    }
}
</style>
`;

// Add styles to document
if (!document.getElementById('ilm-dashboard-styles')) {
    document.head.insertAdjacentHTML('beforeend', dashboardStyles);
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.LearningDashboard = LearningDashboard;
}

// Initialize global instance
if (typeof window !== 'undefined' && !window.ilmLearningDashboard) {
    window.ilmLearningDashboard = new LearningDashboard();
}