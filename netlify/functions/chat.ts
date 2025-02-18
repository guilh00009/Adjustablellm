import type { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
}

const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers
    };
  }

  try {
    const API_URL = 'https://ldryyaqtynx7ls-8000.proxy.runpod.net/v1/chat/completions';
    
    if (!event.body) {
      throw new Error('Request body is empty');
    }

    const requestBody = JSON.parse(event.body);
    console.log('Original request body:', JSON.stringify(requestBody, null, 2));

    // Format the request body for RunPod API
    const formattedBody = {
      model: 'gpt-3.5-turbo',
      messages: requestBody.messages.map((msg: Message) => ({
        role: msg.role === 'tool' ? 'assistant' : msg.role, // Convert 'tool' role to 'assistant'
        content: msg.content,
        name: msg.name
      })).filter((msg: Message) => msg.content != null),
      temperature: requestBody.temperature ?? 0.7,
      max_tokens: requestBody.max_tokens ?? 1000,
      tools: requestBody.tools,
      tool_choice: requestBody.tool_choice
    };

    console.log('Formatted request body:', JSON.stringify(formattedBody, null, 2));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedBody),
    });

    const responseText = await response.text();
    console.log('Raw API response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to parse API response',
          details: responseText.slice(0, 500),
          requestBody: formattedBody
        }),
        headers
      };
    }

    if (!response.ok) {
      console.error('RunPod API error:', {
        status: response.status,
        statusText: response.statusText,
        data,
        requestBody: formattedBody
      });

      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: `RunPod API error: ${response.status} ${response.statusText}`,
          details: data,
          requestBody: formattedBody
        }),
        headers
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      }),
      headers
    };
  }
};

export { handler }; 