export class ReasoningController {
    constructor(setReasoningData, setShowReasoning) {
      this.setReasoningData = setReasoningData;
      this.setShowReasoning = setShowReasoning;
      this.currentMessageId = null;
      
      // Bind methods
      this.showThinking = this.showThinking.bind(this);
      this.populateReasoning = this.populateReasoning.bind(this);
      this.hideReasoning = this.hideReasoning.bind(this);
      
      // Expose globally for apiService
      window.reasoningController = this;
    }
    
    showThinking(messageId = null) {
      this.currentMessageId = messageId || `msg_${Date.now()}`;
      this.setReasoningData({
        status: 'thinking',
        steps: ['Analyzing your request...', 'Generating response...', 'Processing reasoning...']
      });
      this.setShowReasoning(true);
    }
    
    populateReasoning(reasoningDetails, messageId) {
      if (!reasoningDetails) {
        this.hideReasoning();
        return;
      }
      
      this.currentMessageId = messageId;
      const steps = this.parseReasoningSteps(reasoningDetails);
      
      this.setReasoningData({
        status: 'complete',
        steps: steps,
        raw: reasoningDetails
      });
      
      this.setShowReasoning(true);
    }
    
    parseReasoningSteps(reasoningDetails) {
      if (typeof reasoningDetails === 'string') {
        return reasoningDetails.split('\n').filter(s => s.trim().length > 0);
      }
      
      if (Array.isArray(reasoningDetails)) {
        return reasoningDetails.map(step => step.content || step.text || String(step)).filter(Boolean);
      }
      
      if (reasoningDetails.steps) {
        return reasoningDetails.steps;
      }
      
      if (reasoningDetails.reasoning) {
        return [reasoningDetails.reasoning];
      }
      
      return ['Reasoning completed'];
    }
    
    hideReasoning() {
      this.setShowReasoning(false);
      setTimeout(() => {
        this.setReasoningData(null);
      }, 300);
    }
  }