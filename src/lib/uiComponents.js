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

    // Reasoning panel state
    this.reasoningPanel = null;
    this.reasoningStepsList = null;
    this.reasoningToggleButton = null;
    this.reasoningSteps = [];
    this.reasoningTimer = null;
    this.reasoningStageIndex = 0;
    this.reasoningPreviewStages = [
      'Analyzing your prompt',
      'Reviewing context & attachments',
      'Planning the response outline',
      'Drafting the final answer'
    ];
  }

  // Initialize UI components
  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupDrawingTools();
    this.setupReasoningPanel();
    this.renderNotes();
    this.showView('ai'); // Start with AI view
  }

  // Setup drawing canvas
  // Setup drawing canvas
  setupCanvas() {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Remove existing listener if present to avoid duplicates
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    this.resizeHandler = () => {
      const container = canvas.parentElement;
      const newWidth = container.clientWidth - 40; // Account for padding
      const newHeight = container.clientHeight - 40;

      // Only resize if dimensions actually changed
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        // Create temp canvas to save content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Save current content
        if (canvas.width > 0 && canvas.height > 0) {
          tempCtx.drawImage(canvas, 0, 0);
        }

        // Resize main canvas
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Restore content
        ctx.drawImage(tempCanvas, 0, 0);
      }

      // Restore context properties
      ctx.strokeStyle = this.currentColor;
      ctx.lineWidth = this.currentSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    // Initial resize
    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);
  }

  // Setup drawing tools
  setupDrawingTools() {
    // Only select drawing tools from the drawing view, not the input tools
    const drawingView = document.getElementById('drawing-view');
    if (!drawingView) return;

    const toolButtons = drawingView.querySelectorAll('.tool-button[data-tool]');
    const colorPicker = drawingView.querySelector('.color-picker');
    const sizeSlider = drawingView.querySelector('.size-slider');
    const sizeValue = drawingView.querySelector('.size-value');
    const clearButton = drawingView.querySelector('.clear-button');
    const saveButton = drawingView.querySelector('.save-button');

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
    // Hide all views - use !important to override any CSS
    document.querySelectorAll('.view-container').forEach(container => {
      container.style.setProperty('display', 'none', 'important');
    });

    // Show selected view with appropriate display type
    const targetView = document.getElementById(`${view}-view`);
    if (targetView) {
      // AI view needs flex, others can use block
      if (view === 'ai') {
        targetView.style.setProperty('display', 'flex', 'important');
      } else {
        targetView.style.setProperty('display', 'block', 'important');
      }
    }

    // Update menu buttons (old style)
    document.querySelectorAll('.menu-button').forEach(button => {
      button.classList.remove('active');
    });

    const activeButton = document.querySelector(`[data-view="${view}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }

    // Update view switcher buttons (new KIMI style)
    document.querySelectorAll('.view-switch-button').forEach(button => {
      button.classList.remove('active');
    });

    const activeViewButton = document.querySelector(`.view-switch-button[data-view="${view}"]`);
    if (activeViewButton) {
      activeViewButton.classList.add('active');
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
  appendMessage(text, imageUrl, pdfFile, isAI = false, reasoningDetails = null) {
    const messagesContainer = document.querySelector('.user-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = isAI ? 'message ai-message' : 'message user-message';
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    messageDiv.dataset.messageId = messageId;

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

        // Add reasoning toggle button if reasoning details exist
        if (reasoningDetails) {
          const reasoningToggle = this.createReasoningToggle(messageId, reasoningDetails);
          messageDiv.appendChild(reasoningToggle);
        }

        // Also mirror to notes AI response panel
        this.mirrorToNotesAI(text);
      } else {
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(p);
      }
    }

    messagesContainer.appendChild(messageDiv);
    // Smooth scroll to bottom with a small delay to ensure DOM is updated
    setTimeout(() => {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
      });
    }, 50);
  }

  // Create reasoning toggle button for individual messages
  createReasoningToggle(messageId, reasoningDetails) {
    const reasoningContainer = document.createElement('div');
    reasoningContainer.className = 'message-reasoning-container';
    reasoningContainer.dataset.messageId = messageId;

    const toggleButton = document.createElement('button');
    toggleButton.className = 'message-reasoning-toggle';
    toggleButton.type = 'button';
    toggleButton.innerHTML = `
      <span class="reasoning-icon">🧠</span>
      <span class="reasoning-toggle-text">Show reasoning</span>
      <svg class="reasoning-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    const reasoningPanel = document.createElement('div');
    reasoningPanel.className = 'message-reasoning-panel collapsed';
    const steps = this.normalizeReasoningDetails(reasoningDetails);

    if (steps.length > 0) {
      const stepsList = document.createElement('ul');
      stepsList.className = 'message-reasoning-steps';
      steps.forEach((step, index) => {
        const stepItem = document.createElement('li');
        stepItem.className = 'message-reasoning-step';
        stepItem.innerHTML = `
          <span class="step-number">${index + 1}</span>
          <span class="step-text">${this.escapeHtml(step)}</span>
        `;
        stepsList.appendChild(stepItem);
      });
      reasoningPanel.appendChild(stepsList);
    } else {
      reasoningPanel.innerHTML = '<p class="reasoning-placeholder">No additional reasoning steps available.</p>';
    }

    toggleButton.addEventListener('click', () => {
      const isExpanded = reasoningPanel.classList.contains('expanded');
      if (isExpanded) {
        reasoningPanel.classList.remove('expanded');
        reasoningPanel.classList.add('collapsed');
        toggleButton.querySelector('.reasoning-toggle-text').textContent = 'Show reasoning';
        toggleButton.querySelector('.reasoning-chevron').style.transform = 'rotate(0deg)';
      } else {
        reasoningPanel.classList.remove('collapsed');
        reasoningPanel.classList.add('expanded');
        toggleButton.querySelector('.reasoning-toggle-text').textContent = 'Hide reasoning';
        toggleButton.querySelector('.reasoning-chevron').style.transform = 'rotate(180deg)';
      }
    });

    reasoningContainer.appendChild(toggleButton);
    reasoningContainer.appendChild(reasoningPanel);

    return reasoningContainer;
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
      } catch {
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

  setupReasoningPanel() {
    this.reasoningPanel = document.querySelector('.reasoning-panel');
    this.reasoningStepsList = this.reasoningPanel?.querySelector('.reasoning-steps') || null;
    this.reasoningToggleButton = document.querySelector('.reasoning-toggle-button');
    const closeButton = document.querySelector('.reasoning-close-button');

    if (this.reasoningToggleButton) {
      this.reasoningToggleButton.addEventListener('click', () => this.toggleReasoningPanel());
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => this.toggleReasoningPanel(true));
    }

    if (this.reasoningPanel) {
      this.reasoningPanel.classList.add('collapsed');
    }
  }

  toggleReasoningPanel(forceCollapse = null) {
    if (!this.reasoningPanel) return;
    const currentlyCollapsed = this.reasoningPanel.classList.contains('collapsed');
    let shouldCollapse;

    if (forceCollapse === null) {
      shouldCollapse = !currentlyCollapsed;
    } else {
      shouldCollapse = forceCollapse;
    }

    if (shouldCollapse) {
      this.reasoningPanel.classList.add('collapsed');
    } else {
      this.reasoningPanel.classList.remove('collapsed');
    }

    if (this.reasoningToggleButton) {
      this.reasoningToggleButton.dataset.state = shouldCollapse ? 'collapsed' : 'expanded';
      const label = this.reasoningToggleButton.querySelector('.toggle-label');
      if (label) {
        label.textContent = shouldCollapse ? 'Show reasoning' : 'Hide reasoning';
      }
    }
  }

  startReasoningPreview() {
    if (!this.reasoningPanel) return;
    this.stopReasoningPreview({ finalize: false });
    this.reasoningSteps = [{
      label: this.reasoningPreviewStages[0],
      state: 'active'
    }];
    this.reasoningStageIndex = 1;
    this.renderReasoningSteps();

    this.reasoningTimer = setInterval(() => {
      if (this.reasoningStageIndex >= this.reasoningPreviewStages.length) {
        this.finalizeReasoningPreview();
        return;
      }

      this.reasoningSteps = this.reasoningSteps.map((step, idx) => {
        if (idx === this.reasoningSteps.length - 1) {
          return { ...step, state: 'complete' };
        }
        return step;
      });

      this.reasoningSteps.push({
        label: this.reasoningPreviewStages[this.reasoningStageIndex],
        state: 'active'
      });
      this.reasoningStageIndex += 1;
      this.renderReasoningSteps();
    }, 1500);
  }

  stopReasoningPreview({ finalize = true } = {}) {
    if (this.reasoningTimer) {
      clearInterval(this.reasoningTimer);
      this.reasoningTimer = null;
    }
    if (finalize) {
      this.finalizeReasoningPreview();
    }
  }

  finalizeReasoningPreview(message = null) {
    if (!this.reasoningSteps.length && message) {
      this.reasoningSteps = [{ label: message, state: 'complete' }];
    } else if (this.reasoningSteps.length) {
      this.reasoningSteps = this.reasoningSteps.map((step, idx, arr) => {
        if (idx === arr.length - 1) {
          return { ...step, state: 'complete' };
        }
        return step;
      });
    }
    this.renderReasoningSteps();
  }

  renderReasoningSteps(steps = this.reasoningSteps) {
    if (!this.reasoningStepsList) return;

    if (!steps || !steps.length) {
      this.reasoningStepsList.innerHTML = `
        <li class="reasoning-step reasoning-placeholder">
          Reasoning steps will appear here whenever the model shares its thinking process.
        </li>`;
      return;
    }

    this.reasoningStepsList.innerHTML = steps.map((step) => `
      <li class="reasoning-step ${step.state || 'pending'}">
        ${this.escapeHtml(step.label)}
      </li>
    `).join('');
  }

  displayReasoningDetails(details) {
    const normalized = this.normalizeReasoningDetails(details);
    if (normalized.length) {
      this.reasoningSteps = normalized.map((label) => ({
        label,
        state: 'complete'
      }));
      this.renderReasoningSteps();
    } else {
      this.finalizeReasoningPreview('Model completed without exposing additional reasoning steps.');
    }
  }

  normalizeReasoningDetails(details) {
    if (!details) return [];
    if (typeof details === 'string') {
      return details.split(/\n+/).map(line => line.trim()).filter(Boolean);
    }
    if (Array.isArray(details)) {
      return details
        .map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null) {
            if (item.step || item.thought) {
              return `${item.step || 'Step'}: ${item.thought || item.content || ''}`.trim();
            }
            return JSON.stringify(item);
          }
          return String(item);
        })
        .filter(Boolean);
    }
    if (typeof details === 'object') {
      return Object.entries(details).map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}: ${value}`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      });
    }
    return [String(details)];
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
    this.startReasoningPreview();
  }

  // Remove the 'Thinking...' animation
  removeThinkingAnimation() {
    const messagesContainer = document.querySelector('.user-messages');
    if (!messagesContainer) return;
    const thinkingDiv = messagesContainer.querySelector('.thinking-message');
    if (thinkingDiv) thinkingDiv.remove();
    this.stopReasoningPreview();
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
      reader.onload = async function (event) {
        try {
          const typedarray = new Uint8Array(event.target.result);
          const pdfLib = window.pdfjsLib;
          if (!pdfLib) {
            throw new Error('PDF.js library is not available');
          }
          const pdf = await pdfLib.getDocument(typedarray).promise;
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
      const activeEvent = window.event;
      const btn = activeEvent?.target?.closest('.copy-code-btn');
      if (!btn) {
        return;
      }
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

    // Menu button events (old style - for backward compatibility)
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

    // View switcher button events (new KIMI style)
    document.querySelectorAll('.view-switch-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const view = button.dataset.view;
        if (view) {
          this.showView(view);
        }
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

export const uiComponents = new UIComponents();

if (typeof window !== 'undefined') {
  window.uiComponents = uiComponents;
}

// Debug function to test note saving
export const testNoteSaving = function () {
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