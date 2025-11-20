import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import hljs from 'highlight.js';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import 'highlight.js/styles/atom-one-dark.css';
import '../styles/agent.css';
import '../lib/storageService';
import '../lib/apiService';
import '../lib/uiComponents';
import { initAgentApp } from '../lib/agentApp';

if (typeof window !== 'undefined') {
  window.hljs = hljs;
  window.pdfjsLib = pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

const Agent = () => {
  const [hasMessages, setHasMessages] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const textareaRef = useRef(null);

  // Group messages into conversations
  const groupMessagesIntoConversations = useCallback((messages) => {
    const convos = [];
    let currentConvo = null;

    messages.forEach((msg, idx) => {
      // Start new conversation on user message if previous was assistant or if it's the first message
      if (msg.role === 'user' && (!currentConvo || currentConvo.messages.length > 0 && currentConvo.messages[currentConvo.messages.length - 1].role === 'assistant')) {
        if (currentConvo) {
          convos.push(currentConvo);
        }
        currentConvo = {
          id: `conv_${idx}`,
          title: msg.text?.substring(0, 50) || 'Untitled Chat',
          timestamp: msg.timestamp || new Date().toLocaleString(),
          messages: [msg]
        };
      } else if (currentConvo) {
        currentConvo.messages.push(msg);
        // Update title if it's still the default and we have an assistant response
        if (msg.role === 'assistant' && currentConvo.title === 'Untitled Chat') {
          currentConvo.title = currentConvo.messages[0].text?.substring(0, 50) || 'Untitled Chat';
        }
      }
    });

    if (currentConvo) {
      convos.push(currentConvo);
    }

    return convos;
  }, []);

  const handleNewChat = useCallback(() => {
    if (typeof window !== 'undefined' && window.storageService) {
      // Don't clear all history, just start a new conversation
      const messagesContainer = document.querySelector('.user-messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = '';
      }
      setHasMessages(false);
      // Refresh conversations list
      const history = window.storageService.loadChatHistory();
      const grouped = groupMessagesIntoConversations(history);
      setConversations(grouped);
    }
  }, [groupMessagesIntoConversations]);

  useEffect(() => {
    // Check if there are any messages
    const checkMessages = () => {
      if (typeof window !== 'undefined' && window.storageService) {
        const history = window.storageService.loadChatHistory();
        setHasMessages(history.length > 0);
        // Group messages into conversations
        const grouped = groupMessagesIntoConversations(history);
        setConversations(grouped);
      }
    };

    checkMessages();

    // Initialize agent app
    initAgentApp();

    // Setup textarea auto-resize
    const textarea = textareaRef.current;
    if (textarea) {
      const handleInput = () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
      };
      textarea.addEventListener('input', handleInput);

      // Check messages when new ones are added
      const messageObserver = new MutationObserver(() => {
        checkMessages();
      });

      const messagesContainer = document.querySelector('.user-messages');
      if (messagesContainer) {
        messageObserver.observe(messagesContainer, { childList: true });
      }

      // Keyboard shortcut for new chat (Cmd+K or Ctrl+K)
      const handleKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          handleNewChat();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        textarea.removeEventListener('input', handleInput);
        messageObserver.disconnect();
        document.removeEventListener('keydown', handleKeyDown);
        if (typeof window !== 'undefined') {
          window.uiComponents?.removeThinkingAnimation?.();
          window.agentApp = undefined;
        }
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.uiComponents?.removeThinkingAnimation?.();
        window.agentApp = undefined;
      }
    };
  }, [handleNewChat, groupMessagesIntoConversations]);

  const loadChatSession = (conversation) => {
    // Load a specific conversation
    if (conversation && conversation.messages) {
      const messagesContainer = document.querySelector('.user-messages');
      if (messagesContainer && window.uiComponents) {
        messagesContainer.innerHTML = '';
        conversation.messages.forEach(msg => {
          window.uiComponents.appendMessage(
            msg.text,
            msg.imageUrl || null,
            msg.pdfFile || null,
            msg.role === 'assistant',
            msg.reasoningDetails || null
          );
        });
        setHasMessages(conversation.messages.length > 0);
      }
    }
  };

  const toggleSidebar = () => {
    setIsSidebarMinimized(!isSidebarMinimized);
  };

  return (
    <div className="agent-page kimi-style">
      {/* Left Sidebar */}
      <aside className={`chat-sidebar ${isSidebarMinimized ? 'minimized' : ''}`}>
        <button className="sidebar-toggle" onClick={toggleSidebar} title={isSidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}>
          <svg viewBox="0 0 24 24" fill="none">
            {isSidebarMinimized ? (
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>

        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/ai-dea-logo.png" alt="AI<>DEA Logo" className="sidebar-logo-img" />
          </div>
        </div>

        <div className="sidebar-content">
          <button className="new-chat-button" onClick={handleNewChat} title="New Chat (⌘K or Ctrl+K)">
            <svg className="new-chat-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>New Chat</span>
            {!isSidebarMinimized && (
              <span className="keyboard-shortcut">
                {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
              </span>
            )}
          </button>

          <div className="sidebar-divider" />

          {/* View Switcher */}
          <div className="view-switcher">
            <button
              className="view-switch-button active"
              data-view="ai"
              onClick={() => {
                if (window.uiComponents) {
                  window.uiComponents.showView('ai');
                }
              }}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>AI Response</span>
            </button>
            <button
              className="view-switch-button"
              data-view="drawing"
              onClick={() => {
                if (window.uiComponents) {
                  window.uiComponents.showView('drawing');
                }
              }}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Drawing</span>
            </button>
            <button
              className="view-switch-button"
              data-view="notes"
              onClick={() => {
                if (window.uiComponents) {
                  window.uiComponents.showView('notes');
                }
              }}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Notes</span>
            </button>
          </div>

          <div className="sidebar-divider" />

          <div className="chat-history-section">
            <div className="history-header">
              <svg className="history-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Chat History</span>
            </div>
            <div className="history-list">
              {conversations.length > 0 ? (
                conversations.map((convo) => (
                  <button
                    key={convo.id}
                    className="history-item"
                    onClick={() => loadChatSession(convo)}
                    title={convo.title}
                  >
                    <span className="history-item-title">{convo.title}</span>
                    {!isSidebarMinimized && (
                      <span className="history-item-time">{new Date(convo.timestamp).toLocaleDateString()}</span>
                    )}
                  </button>
                ))
              ) : (
                <p className="history-empty">No chat history yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="login-button">
            <svg className="user-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
              <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Log In</span>
            <svg className="chevron-down" viewBox="0 0 24 24" fill="none">
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content chat-full-window">
        <div className="view-container" id="ai-view">
          {/* Upgrade Plan Button - shown when no messages */}
          {!hasMessages && (
            <div className="upgrade-plan-container">
              <Link to="/pricing" className="upgrade-plan-button">
                <svg className="upgrade-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18V5L21 3V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
                  <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>Upgrade your plan</span>
              </Link>
            </div>
          )}

          <div className="chat-window">
            {/* Logo - shown when no messages, inside chat window */}
            {!hasMessages && (
              <div className="splash-logo-container">
                <div className="splash-logo">
                  <img src="/ai-dea-logo.png" alt="AI<>DEA" className="splash-logo-img" />
                </div>
              </div>
            )}

            <div className="chat-messages user-messages" />
          </div>

          <div className="chat-input-area input-area">
            <div className="input-container kimi-input">
              <div className="input-row">
                {/* Left side controls - in order from left to right */}




                <button
                  className="browser-mode-button"
                  title="Browser Mode"
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.classList.toggle('active');
                  }}
                >
                  <svg className="browser-icon" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M2 12H22" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 2C14.5 4.5 16 8 16 12C16 16 14.5 19.5 12 22C9.5 19.5 8 16 8 12C8 8 9.5 4.5 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Browser Mode</span>
                </button>

                <button
                  className="pdf-attach-button"
                  title="Attach PDF"
                  type="button"
                  onClick={() => {
                    const pdfInput = document.querySelector('.pdf-input');
                    if (pdfInput) pdfInput.click();
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Center input field */}
                <textarea
                  ref={textareaRef}
                  className="message-input kimi-input-field"
                  placeholder="Ask Anything..."
                  rows="1"
                />

                {/* Right side controls */}
                <div className="model-selector kimi-model-selector">
                  <button className="model-button" id="model-button" title="Select AI Model">
                    <span className="model-name">Choose Model....</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="model-dropdown" id="model-dropdown">
                    <div className="model-option active" data-model="temper-1">
                      <span className="model-short">T-1</span>
                      <span className="model-full">Temper 1</span>
                    </div>
                    <div className="model-option disabled" data-model="temper-1-colossus">
                      <span className="model-short">T-1-C</span>
                      <span className="model-full">Temper 1 - Colossus</span>
                      <span className="model-lock">🔒</span>
                    </div>
                  </div>
                </div>



                <button className="tool-button arrow-up" title="Expand" type="button">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <button className="send-button kimi-send" title="Send">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="file-previews">
                <button className="file-preview-btn image-preview-btn" style={{ display: 'none' }} title="Click to preview image">
                  <img className="preview-thumbnail" alt="Image thumbnail" />
                  <span className="remove-file-btn">×</span>
                </button>
                <button className="file-preview-btn pdf-preview-btn" style={{ display: 'none' }} title="Click to preview PDF">
                  <span className="pdf-icon">📄</span>
                  <span className="pdf-name" />
                  <span className="remove-file-btn">×</span>
                </button>
              </div>

              <input type="file" className="image-input" accept="image/*" style={{ display: 'none' }} />
              <input type="file" className="pdf-input" accept=".pdf,.epub,.mobi" style={{ display: 'none' }} />
            </div>
          </div>
        </div>

        {/* Drawing View */}
        <div className="view-container" id="drawing-view" style={{ display: 'none' }}>
          <div className="drawing-layout">
            <div className="drawing-toolbar">
              <div className="tool-group">
                <button className="tool-button active" data-tool="pen" title="Pen">
                  ✏️
                </button>
                <button className="tool-button" data-tool="pencil" title="Pencil">
                  ✏️
                </button>
                <button className="tool-button" data-tool="brush" title="Brush">
                  🖌️
                </button>
                <button className="tool-button" data-tool="eraser" title="Eraser">
                  🧽
                </button>
              </div>
              <div className="tool-group">
                <input type="color" className="color-picker" defaultValue="#ffffff" title="Color" />
                <input type="range" className="size-slider" min="1" max="20" defaultValue="2" title="Size" />
                <span className="size-value">2</span>
              </div>
              <div className="tool-group">
                <button className="clear-button" title="Clear Canvas">
                  🗑️
                </button>
                <button className="save-button" title="Save Drawing">
                  💾
                </button>
              </div>
            </div>
            <div className="drawing-canvas-container">
              <canvas id="drawing-canvas" />
            </div>
          </div>
        </div>

        {/* Notes View */}
        <div className="view-container" id="notes-view" style={{ display: 'none' }}>
          <div className="notes-layout">
            <div className="notes-panel">
              <div className="notes-header">
                <h3>Notes</h3>
                <button className="add-note-button" title="Add new note">
                  +
                </button>
              </div>
              <div className="notes-list" />
            </div>
            <div className="ai-notes-panel">
              <div className="ai-notes-header">
                <h3>AI Response</h3>
              </div>
              <div className="ai-notes-content" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      <div className="modal" id="addNoteModal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Add New Note</h3>
            <button className="close-modal" type="button">
              &times;
            </button>
          </div>
          <form className="note-form">
            <textarea className="note-textarea" placeholder="Write your note here..." />
            <input type="file" className="note-image-input" accept="image/*" style={{ display: 'none' }} />
            <button type="button" className="note-attach-button" title="Attach image">
              📎
            </button>
            <img className="note-image-preview" alt="Note image preview" />
            <div className="note-buttons">
              <button type="button" className="cancel-note">
                Cancel
              </button>
              <button type="submit" className="save-note">
                Save Note
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* View Note Modal */}
      <div className="modal view-note-modal" id="viewNoteModal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>View Note</h3>
            <button className="close-modal" type="button">
              &times;
            </button>
          </div>
          <div className="view-note-content" />
          <img className="view-note-image" alt="Note image" />
          <div className="note-timestamp" />
        </div>
      </div>

      {/* File Preview Modal */}
      <div className="modal" id="filePreviewModal">
        <div className="modal-content">
          <div className="modal-header">
            <h3 id="preview-title" />
            <button className="close-modal" type="button">
              &times;
            </button>
          </div>
          <div className="preview-content">
            <img className="preview-image" alt="Image preview" style={{ display: 'none' }} />
            <div className="preview-pdf" style={{ display: 'none' }}>
              <div className="pdf-info">
                <h4 className="pdf-filename" />
                <p className="pdf-description">This is what the AI will see from your PDF:</p>
              </div>
              <div className="pdf-content-preview" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agent;