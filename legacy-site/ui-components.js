// UI Components - Handles all UI-related functions
class UIComponents {
  constructor() {
    this.currentView = 'ai';
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.stagedImageUrl = null;
    this.stagedPdfFile = null;
    
    // Drawing properties
    this.currentTool = 'pen';
    this.currentColor = '#ffffff';
    this.currentSize = 2;
    this.isDrawingActive = false;
  }

  // Initialize UI components
  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupDrawingTools();
    this.renderNotes();
    this.showView('ai'); // Start with AI view
  }

  // Setup drawing canvas
  setupCanvas() {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth - 40; // Account for padding
      canvas.height = container.clientHeight - 40;
      ctx.strokeStyle = this.currentColor;
      ctx.lineWidth = this.currentSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  // Setup drawing tools
  setupDrawingTools() {
    const toolButtons = document.querySelectorAll('.tool-button');
    const colorPicker = document.querySelector('.color-picker');
    const sizeSlider = document.querySelector('.size-slider');
    const sizeValue = document.querySelector('.size-value');
    const clearButton = document.querySelector('.clear-button');
    const saveButton = document.querySelector('.save-button');

    // Tool selection
    toolButtons.forEach(button => {
      button.addEventListener('click', () => {
        toolButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.currentTool = button.dataset.tool;
        this.updateDrawingContext();
      });
    });

    // Color picker
    if (colorPicker) {
      colorPicker.addEventListener('change', (e) => {
        this.currentColor = e.target.value;
        this.updateDrawingContext();
      });
    }

    // Size slider
    if (sizeSlider && sizeValue) {
      sizeSlider.addEventListener('input', (e) => {
        this.currentSize = parseInt(e.target.value);
        sizeValue.textContent = this.currentSize;
        this.updateDrawingContext();
      });
    }

    // Clear button
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.clearCanvas();
      });
    }

    // Save button
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        this.saveDrawing();
      });
    }
  }

  // Update drawing context
  updateDrawingContext() {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = this.currentColor;
    ctx.lineWidth = this.currentSize;
    
    if (this.currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  // Clear canvas
  clearCanvas() {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Save drawing
  saveDrawing() {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'ai-dea-drawing.png';
    link.href = canvas.toDataURL();
    link.click();
  }

  // Canvas event handlers
  startDrawing(e) {
    if (this.currentView !== 'drawing') return;
    
    this.isDrawingActive = true;
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
  }

  draw(e) {
    if (!this.isDrawingActive || this.currentView !== 'drawing') return;
    
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    
    [this.lastX, this.lastY] = [currentX, currentY];
  }

  stopDrawing() {
    this.isDrawingActive = false;
  }

  // View management
  showView(view) {
    // Hide all views
    document.querySelectorAll('.view-container').forEach(container => {
      container.style.display = 'none';
    });

    // Show selected view
    const targetView = document.getElementById(`${view}-view`);
    if (targetView) {
      targetView.style.display = 'block';
    }

    // Update menu buttons
    document.querySelectorAll('.menu-button').forEach(button => {
      button.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[data-view="${view}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }

    this.currentView = view;

    // Setup canvas if switching to drawing view
    if (view === 'drawing') {
      setTimeout(() => {
        this.setupCanvas();
      }, 100);
    }

    // Load existing AI responses if switching to notes view
    if (view === 'notes') {
      this.loadExistingAIResponses();
    }
  }

  // Load existing AI responses into the notes AI panel
  loadExistingAIResponses() {
    const aiNotesContent = document.querySelector('.ai-notes-content');
    if (!aiNotesContent) return;

    // Clear existing content
    aiNotesContent.innerHTML = '';

    // Get chat history and filter for AI responses
    const chatHistory = window.storageService.loadChatHistory();
    const aiResponses = chatHistory.filter(message => message.role === 'assistant');

    if (aiResponses.length === 0) {
      aiNotesContent.innerHTML = '<div class="no-responses">No AI responses yet. Start a conversation in the AI Response tab!</div>';
      return;
    }

    // Display each AI response
    aiResponses.forEach(response => {
      const responseDiv = document.createElement('div');
      responseDiv.className = 'ai-response-item';
      responseDiv.innerHTML = `
        <div class="ai-response-content">${this.processAIResponse(response.text)}</div>
        <div class="ai-response-timestamp">${response.timestamp}</div>
      `;
      aiNotesContent.appendChild(responseDiv);
    });

    // Scroll to bottom to show latest responses
    aiNotesContent.scrollTop = aiNotesContent.scrollHeight;
  }

  // Message rendering
  appendMessage(text, imageUrl, pdfFile, isAI = false) {
    const messagesContainer = document.querySelector('.user-messages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = isAI ? 'message ai-message' : 'message user-message';
    
    if (imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = 'Uploaded image';
      messageDiv.appendChild(img);
    }
    
    if (pdfFile) {
      const pdfInfo = document.createElement('div');
      pdfInfo.className = 'pdf-info';
      pdfInfo.innerHTML = `📚 ${pdfFile}`;
      messageDiv.appendChild(pdfInfo);
    }
    
    if (text) {
      if (isAI) {
        // For AI messages, create a proper content container with markdown support
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.processAIResponse(text);
        messageDiv.appendChild(contentDiv);
        
        // Also mirror to notes AI response panel
        this.mirrorToNotesAI(text);
      } else {
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(p);
      }
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Process AI response for better formatting (ChatGPT-style)
  processAIResponse(text) {
    // Enhanced markdown-like processing with ChatGPT-style formatting
    let processed = text
      // Handle code blocks with proper language detection and syntax highlighting
      .replace(/```(\w+)?\s*\n([\s\S]*?)```/g, (match, language, code) => {
        // Auto-detect language if not specified
        let lang = language ? language.toLowerCase() : this.detectCodeLanguage(code);
        const cleanCode = code.trim();
        const codeId = 'code_' + Math.random().toString(36).substr(2, 9);
        
        // Map common language aliases
        const langMap = {
          'js': 'javascript',
          'ts': 'typescript',
          'py': 'python',
          'rb': 'ruby',
          'sh': 'bash',
          'yml': 'yaml',
          'md': 'markdown',
          'cpp': 'cpp',
          'c++': 'cpp',
          'cxx': 'cpp',
          'cc': 'cpp',
          'cs': 'csharp',
          'kt': 'kotlin',
          'rs': 'rust',
          'go': 'go',
          'golang': 'go',
          'php': 'php',
          'swift': 'swift',
          'dart': 'dart',
          'java': 'java',
          'json': 'json',
          'xml': 'xml',
          'yaml': 'yaml'
        };
        
        lang = langMap[lang] || lang || 'plaintext';
        
        return `<div class="code-block-container">
          <div class="code-block-header">
            <span class="code-language">${lang.toUpperCase()}</span>
            <button class="copy-code-btn" onclick="window.uiComponents.copyCodeBlock('${codeId}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
          <pre><code id="${codeId}" class="language-${lang}">${this.escapeHtml(cleanCode)}</code></pre>
        </div>`;
      })
      // Handle inline code with better styling
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      // Handle tables (Markdown style)
      .replace(/\|(.+)\|\s*\n\|[-\s|:]+\|\s*\n((?:\|.+\|\s*\n?)*)/g, (match, header, rows) => {
        const headerCells = header.split('|').map(cell => cell.trim()).filter(cell => cell);
        const rowData = rows.trim().split('\n').map(row => 
          row.split('|').map(cell => cell.trim()).filter(cell => cell)
        );
        
        let tableHtml = '<table class="ai-table"><thead><tr>';
        headerCells.forEach(cell => {
          tableHtml += `<th>${cell}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        
        rowData.forEach(row => {
          tableHtml += '<tr>';
          row.forEach(cell => {
            tableHtml += `<td>${cell}</td>`;
          });
          tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        
        return tableHtml;
      })
      // Handle headers with proper hierarchy
      .replace(/^### (.*$)/gm, '<h3 class="ai-header-3">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="ai-header-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="ai-header-1">$1</h1>')
      // Handle bold and italic text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="ai-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="ai-italic">$1</em>')
      // Handle numbered lists with better detection
      .replace(/^\d+\.\s+(.*)$/gm, '<li class="ai-numbered-item">$1</li>')
      // Handle bullet points with multiple markers
      .replace(/^[-*+]\s+(.*)$/gm, '<li class="ai-bullet-item">$1</li>')
      // Handle step-by-step instructions
      .replace(/^(Steps?:|Step \d+:)/gm, '<div class="ai-step-header">$1</div>')
      // Handle line breaks and paragraphs
      .replace(/\n\n/g, '</p><p>')
      // Wrap in paragraph tags
      .replace(/^(.*)$/gm, '<p>$1</p>')
      // Clean up empty paragraphs and fix list formatting
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<li.*?<\/li>)<\/p>/g, '$1')
      .replace(/(<li.*?<\/li>)(?=<li)/g, '$1')
      .replace(/(<li.*?<\/li>)/g, '<ul>$1</ul>')
      .replace(/<\/ul><ul>/g, '');

    return processed;
  }

  // Helper method to detect code language
  detectCodeLanguage(code) {
    const trimmedCode = code.trim().toLowerCase();
    
    // Rust patterns (check early due to specific syntax)
    if (trimmedCode.includes('fn ') || trimmedCode.includes('let mut ') ||
        trimmedCode.includes('use std::') || trimmedCode.includes('impl ') ||
        trimmedCode.includes('match ') || trimmedCode.includes('cargo ')) {
      return 'rust';
    }
    
    // Swift patterns
    if (trimmedCode.includes('func ') || trimmedCode.includes('var ') ||
        trimmedCode.includes('let ') && (trimmedCode.includes('import foundation') ||
        trimmedCode.includes('import uikit') || trimmedCode.includes('override func'))) {
      return 'swift';
    }
    
    // Kotlin patterns
    if (trimmedCode.includes('fun ') || trimmedCode.includes('val ') ||
        trimmedCode.includes('var ') && (trimmedCode.includes('import kotlin') ||
        trimmedCode.includes('class ') && trimmedCode.includes(': '))) {
      return 'kotlin';
    }
    
    // Java patterns
    if (trimmedCode.includes('public class ') || trimmedCode.includes('private ') ||
        trimmedCode.includes('public static void main') || trimmedCode.includes('import java') ||
        trimmedCode.includes('system.out.println') || trimmedCode.includes('extends ')) {
      return 'java';
    }
    
    // C++ patterns (check before C due to shared keywords)
    if (trimmedCode.includes('#include <iostream>') || trimmedCode.includes('std::') ||
        trimmedCode.includes('namespace ') || trimmedCode.includes('class ') ||
        trimmedCode.includes('cout <<') || trimmedCode.includes('cin >>') ||
        trimmedCode.includes('vector<') || trimmedCode.includes('using namespace std')) {
      return 'cpp';
    }
    
    // C patterns
    if (trimmedCode.includes('#include <stdio.h>') || trimmedCode.includes('printf(') ||
        trimmedCode.includes('scanf(') || trimmedCode.includes('malloc(') ||
        trimmedCode.includes('int main()') || trimmedCode.includes('void main()')) {
      return 'c';
    }
    
    // C# patterns
    if (trimmedCode.includes('using system') || trimmedCode.includes('console.writeline') ||
        trimmedCode.includes('public static void main') || trimmedCode.includes('namespace ') ||
        trimmedCode.includes('class ') && trimmedCode.includes('public ')) {
      return 'csharp';
    }
    
    // Go patterns
    if (trimmedCode.includes('package main') || trimmedCode.includes('import "fmt"') ||
        trimmedCode.includes('func main()') || trimmedCode.includes('fmt.println') ||
        trimmedCode.includes('go ') || trimmedCode.includes('defer ')) {
      return 'go';
    }
    
    // PHP patterns
    if (trimmedCode.includes('<?php') || trimmedCode.includes('echo ') ||
        trimmedCode.includes('$_get') || trimmedCode.includes('$_post') ||
        trimmedCode.includes('function ') && trimmedCode.includes('$')) {
      return 'php';
    }
    
    // Ruby patterns
    if (trimmedCode.includes('def ') || trimmedCode.includes('puts ') ||
        trimmedCode.includes('require ') || trimmedCode.includes('class ') ||
        trimmedCode.includes('end') && trimmedCode.includes('do')) {
      return 'ruby';
    }
    
    // Dart patterns
    if (trimmedCode.includes('void main()') || trimmedCode.includes('import "dart:') ||
        trimmedCode.includes('class ') && trimmedCode.includes('extends widget') ||
        trimmedCode.includes('flutter')) {
      return 'dart';
    }
    
    // JavaScript/TypeScript patterns
    if (trimmedCode.includes('function') || trimmedCode.includes('const ') || 
        trimmedCode.includes('let ') || trimmedCode.includes('var ') ||
        trimmedCode.includes('=>') || trimmedCode.includes('console.log')) {
      return 'javascript';
    }
    
    // Python patterns
    if (trimmedCode.includes('def ') || trimmedCode.includes('import ') ||
        trimmedCode.includes('print(') || trimmedCode.includes('if __name__')) {
      return 'python';
    }
    
    // HTML patterns
    if (trimmedCode.includes('<html') || trimmedCode.includes('<!doctype') ||
        trimmedCode.includes('<div') || trimmedCode.includes('<script')) {
      return 'html';
    }
    
    // CSS patterns
    if (trimmedCode.includes('{') && trimmedCode.includes('}') &&
        (trimmedCode.includes(':') || trimmedCode.includes('px') || 
         trimmedCode.includes('color') || trimmedCode.includes('margin'))) {
      return 'css';
    }
    
    // SQL patterns
    if (trimmedCode.includes('select ') || trimmedCode.includes('from ') ||
        trimmedCode.includes('where ') || trimmedCode.includes('insert ')) {
      return 'sql';
    }
    
    // JSON patterns
    if ((trimmedCode.startsWith('{') && trimmedCode.endsWith('}')) ||
        (trimmedCode.startsWith('[') && trimmedCode.endsWith(']'))) {
      try {
        JSON.parse(code.trim());
        return 'json';
      } catch (e) {
        // Not valid JSON, continue checking other patterns
      }
    }
    
    // XML patterns
    if (trimmedCode.includes('<?xml') || 
        (trimmedCode.includes('<') && trimmedCode.includes('</') && 
         !trimmedCode.includes('<html') && !trimmedCode.includes('<div'))) {
      return 'xml';
    }
    
    // YAML patterns
    if (trimmedCode.includes('---') || 
        (trimmedCode.includes(':') && !trimmedCode.includes('{') && 
         !trimmedCode.includes(';'))) {
      return 'yaml';
    }
    
    // Bash/Shell patterns
    if (trimmedCode.includes('#!/bin/bash') || trimmedCode.includes('echo ') ||
        trimmedCode.includes('cd ') || trimmedCode.includes('ls ')) {
      return 'bash';
    }
    
    return 'plaintext';
  }

  // Helper method to escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Mirror AI responses to the notes AI panel
  mirrorToNotesAI(text) {
    const aiNotesContent = document.querySelector('.ai-notes-content');
    if (!aiNotesContent) return;
    
    const responseDiv = document.createElement('div');
    responseDiv.className = 'ai-response-item';
    responseDiv.innerHTML = `
      <div class="ai-response-content">${this.processAIResponse(text)}</div>
      <div class="ai-response-timestamp">${new Date().toLocaleString()}</div>
    `;
    
    aiNotesContent.appendChild(responseDiv);
    aiNotesContent.scrollTop = aiNotesContent.scrollHeight;
  }

  // Show a 'Thinking...' animation in the chat window
  showThinkingAnimation() {
    const messagesContainer = document.querySelector('.user-messages');
    if (!messagesContainer) return;
    // Remove any existing thinking animation
    const oldThinking = messagesContainer.querySelector('.thinking-message');
    if (oldThinking) oldThinking.remove();
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'message ai-message thinking-message';
    thinkingDiv.innerHTML = `<span class="thinking-dots">Thinking<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></span>`;
    messagesContainer.appendChild(thinkingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Remove the 'Thinking...' animation
  removeThinkingAnimation() {
    const messagesContainer = document.querySelector('.user-messages');
    if (!messagesContainer) return;
    const thinkingDiv = messagesContainer.querySelector('.thinking-message');
    if (thinkingDiv) thinkingDiv.remove();
  }

  // Notes rendering
  renderNotes() {
    const notesList = document.querySelector('.notes-list');
    if (!notesList) {
      console.error('Notes list element not found');
      return;
    }
    
    const notes = window.storageService.loadNotes();
    console.log('Rendering notes, count:', notes.length);
    
    notesList.innerHTML = '';
    notes.forEach((note, index) => {
      console.log('Rendering note:', index, note);
      const noteElement = document.createElement('div');
      noteElement.className = 'note-item';
      
      // Split note text into words and limit to 10 words
      const words = note.text.split(' ');
      const previewText = words.length > 10 
        ? words.slice(0, 10).join(' ') + '...'
        : note.text;
      
      // Create indicators based on note content
      const hasText = note.text && note.text.trim().length > 0;
      const hasImage = note.imageUrl;
      
      noteElement.innerHTML = `
        <div class="note-content" title="Click to view full note">${previewText}</div>
        ${note.imageUrl ? `<img class="note-image" src="${note.imageUrl}" alt="Note image">` : ''}
        <div class="note-indicators">
          ${hasText ? '<div class="note-indicator">📝 Text</div>' : ''}
          ${hasImage ? '<div class="note-indicator">🖼️ Image</div>' : ''}
        </div>
        <div class="note-timestamp">${new Date(note.timestamp).toLocaleString()}</div>
        <div class="note-actions">
          <button onclick="event.stopPropagation(); window.uiComponents.deleteNote(${index})">🗑️</button>
        </div>
      `;
      
      // Add click handler to view full note
      noteElement.addEventListener('click', () => {
        this.viewNote(note);
      });
      
      notesList.appendChild(noteElement);
    });
  }

  // Note operations
  deleteNote(index) {
    if (window.storageService.deleteNote(index)) {
      this.renderNotes();
    }
  }

  viewNote(note) {
    const viewModal = document.getElementById('viewNoteModal');
    const viewContent = viewModal.querySelector('.view-note-content');
    const viewImage = viewModal.querySelector('.view-note-image');
    const viewTimestamp = viewModal.querySelector('.note-timestamp');
    
    viewContent.textContent = note.text || '';
    viewTimestamp.textContent = new Date(note.timestamp).toLocaleString();
    
    if (note.imageUrl) {
      viewImage.src = note.imageUrl;
      viewImage.style.display = 'block';
    } else {
      viewImage.style.display = 'none';
    }
    
    viewModal.style.display = 'flex';
  }

  addNote() {
    const modal = document.getElementById('addNoteModal');
    const form = modal.querySelector('.note-form');
    const textarea = form.querySelector('.note-textarea');
    const imageInput = form.querySelector('.note-image-input');
    const imagePreview = form.querySelector('.note-image-preview');
    const attachButton = form.querySelector('.note-attach-button');
    let stagedImageUrl = null;

    // Reset form
    textarea.value = '';
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    stagedImageUrl = null;
    imageInput.value = '';

    // Show modal
    modal.style.display = 'flex';

    // Remove existing event listeners to prevent duplicates
    attachButton.removeEventListener('click', attachButton._clickHandler);
    imageInput.removeEventListener('change', imageInput._changeHandler);
    form.removeEventListener('submit', form._submitHandler);

    // Handle image upload
    attachButton._clickHandler = () => {
      imageInput.click();
    };
    attachButton.addEventListener('click', attachButton._clickHandler);

    imageInput._changeHandler = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          stagedImageUrl = e.target.result;
          imagePreview.src = stagedImageUrl;
          imagePreview.style.display = 'block';
          console.log('Image loaded successfully:', file.name);
        };
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          alert('Error reading image file. Please try again.');
        };
        reader.readAsDataURL(file);
      }
    };
    imageInput.addEventListener('change', imageInput._changeHandler);

    // Handle form submission
    form._submitHandler = (e) => {
      e.preventDefault();
      const text = textarea.value.trim();
      
      console.log('Form submission - Text:', text ? 'Yes' : 'No', 'Image:', stagedImageUrl ? 'Yes' : 'No');
      
      // Allow saving if there's either text or an image
      if (text || stagedImageUrl) {
        const newNote = {
          text: text || '',
          imageUrl: stagedImageUrl || null,
          timestamp: Date.now()
        };
        
        console.log('Saving note:', newNote);
        
        if (window.storageService.addNote(newNote)) {
          this.renderNotes();
          modal.style.display = 'none';
          
          // Reset the form
          textarea.value = '';
          imagePreview.src = '';
          imagePreview.style.display = 'none';
          stagedImageUrl = null;
          imageInput.value = '';
          
          console.log('Note saved successfully');
        } else {
          console.error('Failed to save note');
          alert('Failed to save note. Please try again.');
        }
      } else {
        console.log('No content to save');
        alert('Please add some text or an image to save the note.');
      }
    };
    form.addEventListener('submit', form._submitHandler);
  }

  // File handling
  handleImageUpload(file) {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target.result;
        this.stagedImageUrl = base64Image;
        this.stagedImageFile = file;
        
        // Show the new preview button
        const imagePreviewBtn = document.querySelector('.image-preview-btn');
        const thumbnail = imagePreviewBtn.querySelector('.preview-thumbnail');
        
        if (imagePreviewBtn && thumbnail) {
          thumbnail.src = base64Image;
          imagePreviewBtn.style.display = 'flex';
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async extractPdfContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async function(event) {
        try {
          const typedarray = new Uint8Array(event.target.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = '';
          
          // Extract text from each page
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }
          
          resolve(fullText);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  async handlePdfUpload(file) {
    if (file) {
      try {
        const pdfContent = await this.extractPdfContent(file);
        this.stagedPdfFile = {
          name: file.name,
          content: pdfContent
        };
        
        // Show the new PDF preview button
        const pdfPreviewBtn = document.querySelector('.pdf-preview-btn');
        const pdfName = pdfPreviewBtn.querySelector('.pdf-name');
        
        if (pdfPreviewBtn && pdfName) {
          pdfName.textContent = file.name;
          pdfPreviewBtn.style.display = 'flex';
        }
      } catch (error) {
        console.error('Error reading PDF:', error);
        alert('Error reading PDF file. Please try another file.');
      }
    }
  }

  // Clear staged content
  clearStagedContent() {
    this.stagedImageUrl = null;
    this.stagedPdfFile = null;
    this.stagedImageFile = null;
    
    // Hide the new preview buttons
    const imagePreviewBtn = document.querySelector('.image-preview-btn');
    const pdfPreviewBtn = document.querySelector('.pdf-preview-btn');
    
    if (imagePreviewBtn) {
      imagePreviewBtn.style.display = 'none';
    }
    if (pdfPreviewBtn) {
      pdfPreviewBtn.style.display = 'none';
    }
    
    // Clear old preview elements (for backward compatibility)
    const imagePreview = document.querySelector('.image-preview');
    const pdfPreview = document.querySelector('.pdf-preview');
    if (imagePreview) {
      imagePreview.src = '';
      imagePreview.style.display = 'none';
    }
    if (pdfPreview) {
      pdfPreview.textContent = '';
      pdfPreview.style.display = 'none';
    }
  }

  // Show file preview modal
  showFilePreview(type) {
    const modal = document.getElementById('filePreviewModal');
    const title = document.getElementById('preview-title');
    const previewImage = modal.querySelector('.preview-image');
    const previewPdf = modal.querySelector('.preview-pdf');
    
    if (type === 'image' && this.stagedImageUrl) {
      title.textContent = 'Image Preview';
      previewImage.src = this.stagedImageUrl;
      previewImage.style.display = 'block';
      previewPdf.style.display = 'none';
    } else if (type === 'pdf' && this.stagedPdfFile) {
      title.textContent = 'PDF Preview';
      const pdfFilename = modal.querySelector('.pdf-filename');
      const pdfContentPreview = modal.querySelector('.pdf-content-preview');
      
      pdfFilename.textContent = this.stagedPdfFile.name;
      
      // Show first 1000 characters of PDF content
      const previewText = this.stagedPdfFile.content.substring(0, 1000);
      const remainingChars = this.stagedPdfFile.content.length - 1000;
      pdfContentPreview.textContent = previewText + (remainingChars > 0 ? `\n\n... and ${remainingChars} more characters` : '');
      
      previewImage.style.display = 'none';
      previewPdf.style.display = 'block';
    }
    
    modal.style.display = 'flex';
  }

  // Remove file
  removeFile(type) {
    if (type === 'image') {
      this.stagedImageUrl = null;
      this.stagedImageFile = null;
      const imagePreviewBtn = document.querySelector('.image-preview-btn');
      if (imagePreviewBtn) {
        imagePreviewBtn.style.display = 'none';
      }
    } else if (type === 'pdf') {
      this.stagedPdfFile = null;
      const pdfPreviewBtn = document.querySelector('.pdf-preview-btn');
      if (pdfPreviewBtn) {
        pdfPreviewBtn.style.display = 'none';
      }
    }
  }

  // Copy code functionality
  copyCodeBlock(codeId) {
    const codeElement = document.getElementById(codeId);
    if (!codeElement) return;
    
    const code = codeElement.textContent;
    navigator.clipboard.writeText(code).then(() => {
      // Show success feedback
      const btn = event.target.closest('.copy-code-btn');
      const originalText = btn.innerHTML;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg> Copied!`;
      btn.style.background = 'rgba(80, 250, 123, 0.2)';
      btn.style.borderColor = 'rgba(80, 250, 123, 0.5)';
      btn.style.color = '#50fa7b';
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = 'rgba(108, 99, 255, 0.1)';
        btn.style.borderColor = 'rgba(108, 99, 255, 0.3)';
        btn.style.color = '#6c63ff';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy code:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  }

  // Setup event listeners
  setupEventListeners() {
    const canvas = document.getElementById('drawing-canvas');
    const addNoteButton = document.querySelector('.add-note-button');

    // Menu button events
    document.querySelectorAll('.menu-button').forEach(button => {
      button.addEventListener('click', (e) => {
        // Allow Home button to redirect normally
        if (button.getAttribute('href') && button.getAttribute('href') !== '#') {
          return; // Let the link work normally
        }
        
        e.preventDefault();
        const view = button.dataset.view;
        this.showView(view);
      });
    });

    // Canvas events
    if (canvas) {
      canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
      canvas.addEventListener('mousemove', (e) => this.draw(e));
      canvas.addEventListener('mouseup', () => this.stopDrawing());
      canvas.addEventListener('mouseout', () => this.stopDrawing());
    }

    // Add note button
    if (addNoteButton) {
      addNoteButton.addEventListener('click', () => this.addNote());
    }

    // Modal close handlers
    document.querySelectorAll('.close-modal, .cancel-note').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(modal => {
          modal.style.display = 'none';
        });
      });
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    });

    // File preview button events
    const imagePreviewBtn = document.querySelector('.image-preview-btn');
    const pdfPreviewBtn = document.querySelector('.pdf-preview-btn');

    if (imagePreviewBtn) {
      imagePreviewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Check if it's the remove button
        if (e.target.classList.contains('remove-file-btn')) {
          this.removeFile('image');
        } else {
          this.showFilePreview('image');
        }
      });
    }

    if (pdfPreviewBtn) {
      pdfPreviewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Check if it's the remove button
        if (e.target.classList.contains('remove-file-btn')) {
          this.removeFile('pdf');
        } else {
          this.showFilePreview('pdf');
        }
      });
    }
  }
}

// Create global instance
window.uiComponents = new UIComponents();

// Debug function to test note saving
window.testNoteSaving = function() {
  console.log('Testing note saving functionality...');
  
  // Test 1: Save a text-only note
  const textNote = {
    text: 'Test text note',
    imageUrl: null,
    timestamp: Date.now()
  };
  
  console.log('Saving text note:', textNote);
  const textResult = window.storageService.addNote(textNote);
  console.log('Text note save result:', textResult);
  
  // Test 2: Save an image-only note
  const imageNote = {
    text: '',
    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    timestamp: Date.now()
  };
  
  console.log('Saving image note:', imageNote);
  const imageResult = window.storageService.addNote(imageNote);
  console.log('Image note save result:', imageResult);
  
  // Test 3: Save a note with both text and image
  const combinedNote = {
    text: 'Test note with image',
    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    timestamp: Date.now()
  };
  
  console.log('Saving combined note:', combinedNote);
  const combinedResult = window.storageService.addNote(combinedNote);
  console.log('Combined note save result:', combinedResult);
  
  // Render notes to see if they appear
  window.uiComponents.renderNotes();
  
  console.log('Test completed. Check the notes list to see if the test notes appear.');
}; 