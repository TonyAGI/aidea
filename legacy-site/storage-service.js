// Storage Service - Handles all local storage operations
class StorageService {
  constructor() {
    this.chatHistoryKey = 'chatHistory';
    this.notesKey = 'notes';
  }

  // Chat History Methods
  saveChatHistory(chatHistory) {
    try {
      localStorage.setItem(this.chatHistoryKey, JSON.stringify(chatHistory));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  loadChatHistory() {
    try {
      const stored = localStorage.getItem(this.chatHistoryKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }

  clearChatHistory() {
    try {
      localStorage.removeItem(this.chatHistoryKey);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }

  // Notes Methods
  saveNotes(notes) {
    try {
      localStorage.setItem(this.notesKey, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  }

  loadNotes() {
    try {
      const stored = localStorage.getItem(this.notesKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  }

  clearNotes() {
    try {
      localStorage.removeItem(this.notesKey);
    } catch (error) {
      console.error('Error clearing notes:', error);
    }
  }

  // Add a single note
  addNote(note) {
    try {
      console.log('StorageService.addNote called with:', note);
      const notes = this.loadNotes();
      console.log('Current notes count:', notes.length);
      notes.unshift(note);
      this.saveNotes(notes);
      console.log('Note added successfully, new count:', notes.length);
      return true;
    } catch (error) {
      console.error('Error adding note:', error);
      return false;
    }
  }

  // Delete a note by index
  deleteNote(index) {
    try {
      const notes = this.loadNotes();
      if (index >= 0 && index < notes.length) {
        notes.splice(index, 1);
        this.saveNotes(notes);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }

  // Add a message to chat history
  addMessage(message) {
    try {
      const chatHistory = this.loadChatHistory();
      chatHistory.push(message);
      this.saveChatHistory(chatHistory);
      return true;
    } catch (error) {
      console.error('Error adding message:', error);
      return false;
    }
  }

  // Get chat history with optional limit
  getChatHistory(limit = null) {
    try {
      const chatHistory = this.loadChatHistory();
      if (limit && limit > 0) {
        return chatHistory.slice(-limit);
      }
      return chatHistory;
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  // Export data methods
  exportData() {
    try {
      return {
        chatHistory: this.loadChatHistory(),
        notes: this.loadNotes(),
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  importData(data) {
    try {
      if (data.chatHistory) {
        this.saveChatHistory(data.chatHistory);
      }
      if (data.notes) {
        this.saveNotes(data.notes);
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Utility methods
  getStorageSize() {
    try {
      const chatHistory = localStorage.getItem(this.chatHistoryKey);
      const notes = localStorage.getItem(this.notesKey);
      return {
        chatHistory: chatHistory ? chatHistory.length : 0,
        notes: notes ? notes.length : 0,
        total: (chatHistory ? chatHistory.length : 0) + (notes ? notes.length : 0)
      };
    } catch (error) {
      console.error('Error getting storage size:', error);
      return { chatHistory: 0, notes: 0, total: 0 };
    }
  }

  clearAllData() {
    try {
      this.clearChatHistory();
      this.clearNotes();
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }
}

// Create global instance
window.storageService = new StorageService(); 