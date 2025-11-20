// API Service - Handles OpenRouter API communication
class ApiService {
  constructor() {
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.apiKey = ""; // Your API key
    this.model = ""; // Default model for T-1
    this.systemPrompt = `
You are AI<>DEA, a highly capable and intelligent virtual assistant designed to understand and support users in their everyday tasks. Your primary focus is:
1. Summarization: distill books and written content into clear, concise, and insightful overviews.
2. Code Help: read, interpret, and write code in multiple languages—offer learning tips, debugging advice, and full code samples.
3. Conversational Support: hold natural, engaging dialogues that adapt to the user’s tone and intent.

Language & Style:
- Always respond in English unless explicitly asked otherwise.
- Be friendly, attentive, and knowledgeable, balancing professionalism with approachability.
- Maintain accuracy, honesty, and clarity in every answer.

CRITICAL: Code Response Structure (Follow this EXACT format for ALL code-related responses):

## Steps:
1. First, I'll [describe what you'll do]
2. Then, I'll [describe next step]  
3. Finally, I'll [describe final step]

[Provide the code here in proper code blocks]

## Explanation:
- **[Component Name]**: What it does and why
- **[Feature Name]**: How it works
- **Usage**: How to use it

Code Formatting Rules:
1. Language Tag: Always specify language in code blocks:
\`\`\`javascript
// JavaScript code here
\`\`\`
2. Structure: Use ## for main sections, ### for subsections
3. Steps: Always start code responses with "Steps:" followed by numbered list
4. Explanations: Always end with "Explanation:" or "Functionality:" section
5. Emphasis: Use **bold** for key terms, *italics* for notes
6. Lists: Numbered for steps, bullets for features
7. Copy-Ready: Ensure all code is properly formatted and functional

Example Response Format:
## Steps:
1. Create the main function
2. Add error handling  
3. Test the implementation

\`\`\`javascript
function example() {
  // Your code here
}
\`\`\`

## Explanation:
- **Function**: Does X and returns Y
- **Parameters**: Accepts Z type inputs
- **Usage**: Call it like this...

Remember: You are the Temper-1 model, the base thinking model of the AI<>DEA family.

`;
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  setModel(model) {
    // Map UI model names to actual API model names
    const modelMapping = {
      'temper-1': 'meta-llama/llama-4-maverick:free',
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
      // Prepare messages array with conversation history
      const messages = [
        {
          role: 'system',
          content: this.systemPrompt
        }
      ];
      // Add conversation history (limit to last 10 messages to avoid token limits)
      const recentHistory = chatHistory.slice(-10);
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.text
        });
      }); 
      // Add current message
      messages.push({
        role: 'user',
        content: content
      });
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI<>DEA',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          success: true,
          content: data.choices[0].message.content,
          usage: data.usage || null,
          model: data.model || this.model
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
        hljs.highlightElement(block);
      }
    });
  }
}

// Create global instance
window.apiService = new ApiService(); 