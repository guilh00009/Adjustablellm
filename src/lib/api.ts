const API_URL = '/api/chat';

interface Function {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ChatCompletionRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    name?: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  tools?: Array<{
    type: 'function';
    function: Function;
  }>;
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  functions?: Function[]; // For backward compatibility with our internal code
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      role: 'assistant' | 'tool';
      content: string | null;
      tool_calls?: ToolCall[];
    };
  }>;
}

export const sendMessage = async (request: ChatCompletionRequest) => {
  try {
    // Convert functions to tools format if they exist, but only send one tool
    const tools = request.functions?.length ? [{
      type: 'function' as const,
      function: request.functions[0] // Only send the first function
    }] : undefined;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        model: 'gpt-3.5-turbo',
        tools: tools,
        tool_choice: tools ? 'auto' : 'none',
        functions: undefined, // Remove functions field
        function_call: undefined, // Remove function_call field
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      
      // Construct a more detailed error message
      let errorMessage = `API Error (${response.status})`;
      if (errorData.error) errorMessage += `: ${errorData.error}`;
      if (errorData.details) errorMessage += `\nDetails: ${typeof errorData.details === 'string' ? errorData.details : JSON.stringify(errorData.details)}`;
      
      throw new Error(errorMessage);
    }

    const data: ChatCompletionResponse = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from API');
    }

    return data;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    if (error instanceof Error) {
      throw error; // Re-throw the error with our enhanced message
    }
    throw new Error('An unexpected error occurred while sending the message');
  }
}; 