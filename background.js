// English Listening Assistant - Service Worker
// Manages extension lifecycle and message passing between components

class ExtensionManager {
  constructor() {
    this.initializeExtension();
  }

  initializeExtension() {
    // Listen for extension installation
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    
    // Listen for messages from content scripts and sidebar
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Listen for tab updates to inject content scripts
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    
    // Listen for action icon clicks to open sidebar
    chrome.action.onClicked.addListener(this.handleActionClick.bind(this));
  }

  async handleInstall(details) {
    console.log('English Listening Assistant installed:', details.reason);
    
    // Initialize default settings
    await this.initializeDefaultSettings();
  }

  async initializeDefaultSettings() {
    const defaultSettings = {
      vocabularyLevel: 3000, // Default to 3000 words known
      isFirstTime: true,
      showTranslationOnHover: true,
      subtitlePosition: 'bottom',
      fontSize: 'medium',
      knownWords: new Set(), // Words user has marked as known
      learningWords: new Set(), // Words user is currently learning
      lastAssessmentDate: null
    };

    // Only set defaults if not already set
    const result = await chrome.storage.local.get(['vocabularyLevel']);
    if (!result.vocabularyLevel) {
      await chrome.storage.local.set(defaultSettings);
    }
  }

  async handleMessage(request, sender, sendResponse) {
    console.log('Message received:', request.type);

    switch (request.type) {
      case 'GET_VOCABULARY_LEVEL':
        const settings = await chrome.storage.local.get(['vocabularyLevel']);
        sendResponse({ vocabularyLevel: settings.vocabularyLevel || 3000 });
        break;

      case 'UPDATE_VOCABULARY_LEVEL':
        await chrome.storage.local.set({ vocabularyLevel: request.level });
        sendResponse({ success: true });
        break;

      case 'MARK_WORD_AS_KNOWN':
        await this.markWordAsKnown(request.word);
        sendResponse({ success: true });
        break;

      case 'ADD_TO_LEARNING_LIST':
        await this.addToLearningList(request.words);
        sendResponse({ success: true });
        break;

      case 'GET_LEARNING_WORDS':
        const learningWords = await this.getLearningWords();
        sendResponse({ words: learningWords });
        break;

      case 'TOGGLE_EXTENSION':
        // Forward toggle message to all content scripts in current tab
        console.log('Forwarding TOGGLE_EXTENSION to content scripts:', request.enabled);
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'TOGGLE_EXTENSION',
              enabled: request.enabled
            });
          }
        } catch (error) {
          console.log('Could not forward toggle message:', error);
        }
        sendResponse({ success: true });
        break;

      case 'SUBTITLE_DETECTED':
        // Handle subtitle detection from content scripts
        await this.processSubtitle(request.subtitle, sender.tab.id);
        break;

      default:
        console.log('Unknown message type:', request.type);
    }

    return true; // Keep message channel open for async response
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    // Inject content scripts when pages are loaded
    if (changeInfo.status === 'complete' && tab.url) {
      if (tab.url.includes('youtube.com') || tab.url.includes('netflix.com')) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content-scripts/subtitle-overlay.js']
          });
        } catch (error) {
          console.log('Could not inject script:', error);
        }
      }
    }
  }

  async markWordAsKnown(word) {
    const result = await chrome.storage.local.get(['knownWords']);
    const knownWords = new Set(result.knownWords || []);
    knownWords.add(word.toLowerCase());
    await chrome.storage.local.set({ knownWords: Array.from(knownWords) });
  }

  async addToLearningList(words) {
    const result = await chrome.storage.local.get(['learningWords']);
    const learningWords = new Set(result.learningWords || []);
    
    words.forEach(word => learningWords.add(word.toLowerCase()));
    await chrome.storage.local.set({ learningWords: Array.from(learningWords) });
  }

  async getLearningWords() {
    const result = await chrome.storage.local.get(['learningWords']);
    return result.learningWords || [];
  }

  async handleActionClick(tab) {
    // Open side panel when extension icon is clicked
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      console.log('Side panel opened for tab:', tab.id);
    } catch (error) {
      console.error('Failed to open side panel:', error);
    }
  }

  async processSubtitle(subtitle, tabId) {
    // Process detected subtitles and filter based on vocabulary level
    // This will be expanded in later iterations
    console.log('Processing subtitle:', subtitle);
  }
}

// Initialize the extension manager
new ExtensionManager();