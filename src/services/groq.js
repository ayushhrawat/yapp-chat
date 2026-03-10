import axios from 'axios';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Send a message to Groq AI and get a response
 * @param {string} message - The user's question/message
 * @param {string} systemPrompt - Optional system prompt to set context
 * @returns {Promise<{success: boolean, response?: string, error?: string}>}
 */
export const askGroqAI = async (message, systemPrompt = "You are a helpful AI assistant integrated into a chat application. Provide clear, concise, and accurate answers.") => {
  try {
   const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.1-8b-instant',
       messages: [
          {
            role: 'system',
           content: systemPrompt
          },
          {
            role: 'user',
           content: message
          }
        ],
        temperature: 0.7,
       max_tokens: 1024
      },
      {
       headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

   if (response.data && response.data.choices && response.data.choices.length > 0) {
     return {
        success: true,
       response: response.data.choices[0].message.content
      };
    } else {
     return {
        success: false,
        error: 'No response from AI'
      };
    }
  } catch (error) {
   console.error('❌ Groq API Error:', error);
    
   if (error.response) {
      // API returned an error response
     if (error.response.status === 401) {
       return {
          success: false,
          error: 'Invalid API key'
        };
      } else if (error.response.status === 429) {
       return {
          success: false,
          error: 'Rate limit exceeded. Please wait a moment.'
        };
      } else if (error.response.status === 500) {
       return {
          success: false,
          error: 'AI service temporarily unavailable'
        };
      }
    } else if (error.code === 'ECONNABORTED') {
     return {
        success: false,
        error: 'Request timed out. Please try again.'
      };
    }
    
   return {
      success: false,
      error: error.message || 'Failed to get AI response'
    };
  }
};

/**
 * Check if a message is an AI command
 * @param {string} message - The message to check
 * @returns {boolean}
 */
export const isAICommand = (message) => {
  if (!message || typeof message !== 'string') return false;
 return message.trim().startsWith('/ask');
};

/**
 * Extract the actual question from an AI command
 * @param {string} message - The full message with /ask command
 * @returns {string} - The extracted question
 */
export const extractAIQuestion = (message) => {
  if (!message) return '';
  
  // Remove /ask command and trim whitespace
  const question = message.replace(/^\/ask\s*/i, '').trim();
 return question;
};

/**
 * Get a typing indicator message for AI responses
 * @returns {string}
 */
export const getAITypingIndicator = () => {
  const indicators = [
    '🤔 Thinking...',
    '💭 Processing...',
    '⚡ AI is responding...',
    '🧠 Analyzing...'
  ];
 return indicators[Math.floor(Math.random() * indicators.length)];
};
