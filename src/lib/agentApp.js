// Main Agent Application - Coordinates all services and handles main logic

// Single, unified initAgentApp function
export function initAgentApp() {
  // Initialize the regular AgentApp
  const app = new AgentApp();
  app.init();
  if (typeof window !== 'undefined') {
    window.agentApp = app;
  }
  return app;
}

import { searchService } from './searchService';

export class AgentApp {
  constructor() {
    // Support both old and new KIMI-style selectors
    this.messageInput = document.querySelector('.message-input') || document.querySelector('.kimi-input-field');
    this.sendButton = document.querySelector('.send-button') || document.querySelector('.kimi-send');
    this.attachButton = document.querySelector('.attach-button');
    this.browserModeButton = document.querySelector('.browser-mode-button');
    this.bookButton = document.querySelector('.book-button') || document.querySelector('.pdf-attach-button');
    this.imageInput = document.querySelector('.image-input');
    this.pdfInput = document.querySelector('.pdf-input');
  }

  // Initialize the application
  init() {
    this.setupEventListeners();
    this.setupModelDropdown();
    window.uiComponents.init();
    console.log('AI<>DEA Agent initialized successfully');

    // Set default model
    window.apiService.setModel('temper-1');
  }

  // Setup model dropdown functionality
  setupModelDropdown() {
    const modelButton = document.getElementById('model-button');
    const modelDropdown = document.getElementById('model-dropdown');
    const modelOptions = document.querySelectorAll('.model-option');
    const modelName = document.querySelector('.model-name');

    if (!modelButton || !modelDropdown) return;

    // Toggle dropdown
    modelButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = modelDropdown.classList.contains('show');

      if (isOpen) {
        modelDropdown.classList.remove('show');
        modelButton.classList.remove('active');
      } else {
        modelDropdown.classList.add('show');
        modelButton.classList.add('active');
      }
    });

    // Handle model selection
    modelOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();

        // Don't allow selection of disabled options
        if (option.classList.contains('disabled')) {
          return;
        }

        const modelValue = option.dataset.model;
        const shortName = option.querySelector('.model-short').textContent;

        // Update active state
        modelOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');

        // Update button text
        modelName.textContent = shortName;

        // Set the model in API service
        window.apiService.setModel(modelValue);

        // Close dropdown
        modelDropdown.classList.remove('show');
        modelButton.classList.remove('active');
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!modelButton.contains(e.target) && !modelDropdown.contains(e.target)) {
        modelDropdown.classList.remove('show');
        modelButton.classList.remove('active');
      }
    });
  }

  // Setup event listeners for user interactions
  setupEventListeners() {
    // Send message events
    if (this.sendButton) {
      this.sendButton.addEventListener('click', () => this.handleSendMessage());
    }

    if (this.messageInput) {
      this.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    // File upload events
    if (this.attachButton && this.imageInput) {
      this.attachButton.addEventListener('click', () => {
        this.imageInput.click();
      });

      this.imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          window.uiComponents.handleImageUpload(file);
        }
      });
    }

    if (this.bookButton && this.pdfInput) {
      this.bookButton.addEventListener('click', () => {
        this.pdfInput.click();
      });

      this.pdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          window.uiComponents.handlePdfUpload(file);
        }
      });
    }
  }

  // Handle sending messages
  async handleSendMessage() {
    const messageText = this.messageInput.value.trim();
    const stagedImageUrl = window.uiComponents.stagedImageUrl;
    const stagedPdfFile = window.uiComponents.stagedPdfFile;

    if (!messageText && !stagedImageUrl && !stagedPdfFile) return;

    // Create user message object
    const userMessage = {
      role: 'user',
      text: messageText,
      imageUrl: stagedImageUrl,
      pdfFile: stagedPdfFile ? stagedPdfFile.name : null,
      timestamp: new Date().toLocaleString()
    };

    // Save to storage and render immediately
    window.storageService.addMessage(userMessage);
    window.uiComponents.appendMessage(userMessage.text, userMessage.imageUrl, userMessage.pdfFile);
    this.messageInput.value = '';
    window.uiComponents.clearStagedContent();

    // Show 'Thinking...' animation if model is a thinking model
    const activeModelOption = document.querySelector('.model-option.active');
    const selectedModel = activeModelOption ? activeModelOption.dataset.model : 'temper-1';
    if (selectedModel.includes('temper-1') || selectedModel.includes('colossus')) {
      window.uiComponents.showThinkingAnimation();
    }

    try {
      // Check if Browser Mode is active
      let searchContext = '';
      if (this.browserModeButton && this.browserModeButton.classList.contains('active')) {
        // Perform search
        const searchResults = await window.searchService.search(messageText);
        searchContext = window.searchService.formatResultsForAI(searchResults);

        // Optional: You could append a system message to the UI saying "Searched for..."
        // For now, we just silently enhance the context
      }

      // Get chat history for context
      const chatHistory = window.storageService.loadChatHistory();
      // Send message to API with history
      const result = await window.apiService.sendMessageWithHistory(
        messageText + searchContext,
        chatHistory,
        stagedImageUrl,
        stagedPdfFile ? stagedPdfFile.content : null
      );
      // Remove 'Thinking...' animation
      window.uiComponents.removeThinkingAnimation();
      if (result.success) {
        // Create AI response object
        const aiMessage = {
          role: 'assistant',
          text: result.content,
          reasoningDetails: result.reasoningDetails || null,
          timestamp: new Date().toLocaleString()
        };
        // Save to storage and render
        window.storageService.addMessage(aiMessage);
        window.uiComponents.appendMessage(aiMessage.text, null, null, true, result.reasoningDetails);
      } else {
        // Handle error
        const errorMessage = {
          role: 'assistant',
          text: result.content, // This will be the error message
          timestamp: new Date().toLocaleString()
        };
        window.storageService.addMessage(errorMessage);
        window.uiComponents.appendMessage(errorMessage.text, null, null, true);
      }
    } catch (error) {
      window.uiComponents.removeThinkingAnimation();
      console.error('Error in handleSendMessage:', error);
      const errorMessage = {
        role: 'assistant',
        text: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toLocaleString()
      };
      window.storageService.addMessage(errorMessage);
      window.uiComponents.appendMessage(errorMessage.text, null, null, true);
    }
  }

  // Utility methods for external access
  getChatHistory() {
    return window.storageService.loadChatHistory();
  }

  getNotes() {
    return window.storageService.loadNotes();
  }

  clearAllData() {
    if (window.storageService.clearAllData()) {
      window.uiComponents.renderHistory();
      window.uiComponents.renderNotes();
      return true;
    }
    return false;
  }

  exportData() {
    return window.storageService.exportData();
  }

  importData(data) {
    if (window.storageService.importData(data)) {
      window.uiComponents.renderHistory();
      window.uiComponents.renderNotes();
      return true;
    }
    return false;
  }

  // API configuration methods
  setApiKey(apiKey) {
    window.apiService.setApiKey(apiKey);
  }

  setModel(model) {
    window.apiService.setModel(model);
  }

  async testApiConnection() {
    return await window.apiService.testConnection();
  }

  async getAvailableModels() {
    return await window.apiService.getAvailableModels();
  }

  // UI utility methods
  switchView(view) {
    window.uiComponents.showView(view);
  }

  addNote() {
    window.uiComponents.addNote();
  }

  // File handling methods
  handleImageUpload(file) {
    window.uiComponents.handleImageUpload(file);
  }

  async handlePdfUpload(file) {
    await window.uiComponents.handlePdfUpload(file);
  }

  // Storage utility methods
  getStorageSize() {
    return window.storageService.getStorageSize();
  }

  clearChatHistory() {
    window.storageService.clearChatHistory();
    window.uiComponents.renderHistory();
  }

  clearNotes() {
    window.storageService.clearNotes();
    window.uiComponents.renderNotes();
  }

  // Drawing utility methods
  clearCanvas() {
    window.uiComponents.clearCanvas();
  }

  saveDrawing() {
    window.uiComponents.saveDrawing();
  }

  setDrawingTool(tool) {
    window.uiComponents.currentTool = tool;
    window.uiComponents.updateDrawingContext();
  }

  setDrawingColor(color) {
    window.uiComponents.currentColor = color;
    window.uiComponents.updateDrawingContext();
  }

  setDrawingSize(size) {
    window.uiComponents.currentSize = size;
    window.uiComponents.updateDrawingContext();
  }
}

