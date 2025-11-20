import OpenAI from 'openai';

// API Service - Handles OpenRouter API communication
class ApiService {
  constructor() {
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.apiKey = '';
    this.model = ''; // Default model for T-1
    this.systemPrompt = `
You are AI<>DEA, a sophisticated virtual assistant designed to provide clear, well-structured, and visually appealing responses. Your output should feel modern, clean, and professional—similar to leading AI platforms.

**Core Principles:**
1. **Clarity First**: Use clean typography, proper spacing, and logical structure
2. **Visual Hierarchy**: Use headings, bold text, and lists to organize information
3. **Consistent Formatting**: All code blocks follow the same elegant style
4. **Conversational Tone**: Be friendly, knowledgeable, and approachable

**Typography & Styling:**
- Use **bold** for emphasis and key terms
- Use *italics* for notes and annotations
- Maintain consistent spacing between elements
- Use proper heading hierarchy (##, ###) for organization

**Code Presentation (Universal Format):**
All code blocks use the same sleek format, regardless of language:

\`\`\`language
// Code here
\`\`\`

**Default Structure for Code Responses:**
1. Start with a brief overview
2. Provide the complete, functional code
3. End with a clear explanation section

**Explanation Section Always Includes:**
- **What it does**: Brief functionality description
- **Key features**: Bullet points of main capabilities  
- **How to use**: Simple implementation guidance

**Example Format:**
\`\`\`javascript
function example() {
  // Implementation
}
\`\`\`

**Explanation:**
- **What it does**: Concise description
- **Key features**: 
  - Feature one
  - Feature two
- **How to use**: \`example()\`

**Response Aesthetics:**
- Use Open Sans-style clean lettering
- Ensure proper line height (1.6) for readability
- Maintain consistent padding and margins
- Use subtle color indicators for different elements

Remember: You are AI<>DEA, the Temper-1 model. Your responses should be as visually polished as they are informative.

`;

    this.client = this.createClient(this.apiKey);
  }

  createClient(apiKey) {
    return new OpenAI({
      apiKey,
      baseURL: this.baseUrl,
      dangerouslyAllowBrowser: true,
    });
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.client = this.createClient(apiKey);
  }

  setModel(model) {
    // Map UI model names to actual API model names
    const modelMapping = {
      'temper-1': 'openrouter/sherlock-think-alpha',
      'temper-1-colossus': 'deepseek/deepseek-r1-0528:free'
    };
    
    this.model = modelMapping[model] || model;
    console.log('Model set to:', this.model);
  }

  // Prepare message content for API
  prepareMessageContent(messageText, imageUrl = null, pdfContent = null) {
    let content = messageText || '';
    if (pdfContent) {
      const pdfPreview = pdfContent.substring(0, 1000) + '...';
      content = `[Book file attached]\n\nBook content preview:\n${pdfPreview}\n\n${content}`;
    }
    if (imageUrl) {
      content = `[Image attached] ${content}`;
    }
    return content;
  }

  // Send message with conversation history
  async sendMessageWithHistory(messageText, chatHistory = [], imageUrl = null, pdfContent = null) {
    try {
      const content = this.prepareMessageContent(messageText, imageUrl, pdfContent);
      const messages = this.buildMessageHistory(chatHistory, content);

      const apiResponse = await this.client.chat.completions.create({
        model: this.model,
        messages,
        reasoning: { enabled: true },
      });
      const assistantMessage = apiResponse?.choices?.[0]?.message;

      if (assistantMessage) {
        const normalizedContent = this.normalizeAssistantContent(assistantMessage.content);
        
        // Populate reasoning controller if reasoning details exist
        if (window.reasoningController && assistantMessage.reasoning_details) {
          window.reasoningController.populateReasoning(
            assistantMessage.reasoning_details,
            apiResponse.id || `msg_${Date.now()}`
          );
        }
        
        return {
          success: true,
          content: normalizedContent,
          reasoningDetails: assistantMessage.reasoning_details || null,
          usage: apiResponse.usage || null,
          model: apiResponse.model || this.model
        };
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('Error sending message to API:', error);
      return {
        success: false,
        error: error.message,
        content: 'Sorry, I encountered an error while processing your request. Please try again.'
      };
    }
  }

  buildMessageHistory(chatHistory, currentContent) {
    const messages = [{
      role: 'system',
      content: this.systemPrompt
    }];

    const recentHistory = chatHistory.slice(-10);
    recentHistory.forEach((msg) => {
      if (!msg?.role || !msg?.text) return;
      const messagePayload = {
        role: msg.role,
        content: msg.text
      };
      if (msg.role === 'assistant' && msg.reasoningDetails) {
        messagePayload.reasoning_details = msg.reasoningDetails;
      }
      messages.push(messagePayload);
    });

    messages.push({
      role: 'user',
      content: currentContent
    });

    return messages;
  }

  normalizeAssistantContent(content) {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map((part) => {
        if (typeof part === 'string') return part;
        if (part?.text) return part.text;
        if (part?.content) return part.content;
        return '';
      }).join('\n');
    }
    return String(content);
  }

  // Test API connection
  async testConnection() {
    try {
      const result = await this.sendMessageWithHistory('Hello, this is a test message.');
      return result.success;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  // Get available models (if API supports it)
  async getAvailableModels() {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI<>DEA'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching available models:', error);
      return [];
    }
  }

  // Process response content for display
  processResponseContent(content) {
    if (!content) return '';

    return content
      // Remove unnecessary # symbols from the beginning of lines
      .replace(/^#+\s*/gm, '')
      // Handle code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        return `<pre><code class="language-${language || 'plaintext'}">${code.trim()}</code></pre>`;
      })
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  // Apply syntax highlighting to code blocks
  applySyntaxHighlighting() {
    document.querySelectorAll('pre code').forEach((block) => {
      if (window.hljs) {
        window.hljs.highlightElement(block);
      }
    });
  }
}

export const apiService = new ApiService();

if (typeof window !== 'undefined') {
  window.apiService = apiService;
}

export default apiService;