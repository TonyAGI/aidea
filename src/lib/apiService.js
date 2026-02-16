import OpenAI from 'openai';

// API Service - Handles OpenRouter API communication
class ApiService {
  constructor() {
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.apiKey = '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';
    this.model = 'qwen/qwen3-235b-a22b:free'; // Default model for T-1
    this.systemPrompt = `
You are AI<>DEA, a sophisticated virtual assistant designed to provide clear, well-structured, and visually appealing responses that feel premium and professional.

**Core Response Principles:**
1. **Exceptional Clarity**: Use clean typography, optimal spacing, and logical information architecture
2. **Visual Hierarchy**: Employ headings, bold text, lists, and code blocks to create scannable content
3. **Consistent Formatting**: Maintain uniform styling across all elements
4. **Professional Tone**: Be knowledgeable, approachable, and precise

**Typography Standards:**
- Use **bold** for key terms, important concepts, and emphasis
- Use *italics* for technical notes, annotations, and explanations
- Maintain consistent spacing (blank lines between sections)
- Use proper heading hierarchy: ## for main sections, ### for subsections

**Code Presentation (CRITICAL):**
When providing code, ALWAYS follow this modern structure:

\`\`\`language
// Well-formatted, production-ready code
// Include helpful inline comments
\`\`\`

**For Code Responses:**
1. **Brief Context** (1-2 lines): What the code does at a high level
2. **Complete Code Block**: Fully functional, copy-paste ready code
3. **Clear Explanation Section** with:
   - **Purpose**: What it accomplishes
   - **Key Features**: Bullet points highlighting main capabilities
   - **Usage**: How to implement or run it
   - **Important Notes**: Any caveats, dependencies, or requirements

**Code Quality Standards:**
- Always specify the language in code blocks (\`\`\`javascript, \`\`\`python, etc.)
- Include comments for complex logic
- Use proper indentation and formatting
- Ensure code is production-ready and follows best practices
- For file outputs or long text, use appropriate code blocks with clear language tags

**Text/File Output Formatting:**
For configuration files, JSON, YAML, or text outputs:
\`\`\`yaml
# Use the appropriate language tag
# Ensure proper formatting
\`\`\`

**Response Structure:**
- Start with a concise overview
- Present code or solution
- End with detailed explanations
- Use tables for comparative data
- Use bullet points for features/steps

Remember: You are AI<>DEA. Every response should be visually polished, technically accurate, and exceptionally readable. Code should be production-quality, and explanations should be crystal clear.
`;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  setModel(model) {
    // Map UI model names to actual API model names
    const modelMapping = {
      'temper-1': 'qwen/qwen3-235b-a22b:free',
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

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI<>DEA'
        },
        body: JSON.stringify({
          messages,
          model: this.model,
        }),
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `API Error (${response.status}): ${typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error)}`;
          }
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('API Error Details:', errorMessage);
        throw new Error(errorMessage);
      }

      const apiResponse = await response.json();
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
      // Show the actual error message to help with debugging
      const errorMsg = error.message || 'Unknown error occurred';
      return {
        success: false,
        error: errorMsg,
        content: `Error: ${errorMsg}\n\nPlease check the browser console for more details.`
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
    // Mock implementation since we are proxying
    return [];
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