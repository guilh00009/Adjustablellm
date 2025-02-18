import type { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

// Shared API key for both TTS and STT
const DEEPGRAM_API_KEY = 'e9c8280ba7674083966fd0d553ff2441b81202ea';

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers
    };
  }

  try {
    const { text } = JSON.parse(event.body || '{}');
    if (!text) {
      throw new Error('No text provided');
    }

    console.log('TTS Request:', { text });

    const response = await fetch(`https://api.deepgram.com/v1/speak?model=aura-asteria-en`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'text/plain'
      },
      body: text // Send text directly without JSON.stringify
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Deepgram API error: ${response.status} ${error}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);

    return {
      statusCode: 200,
      body: buffer.toString('base64'),
      headers: {
        ...headers,
        'Content-Type': 'audio/mpeg',
        'Content-Transfer-Encoding': 'base64'
      }
    };
  } catch (error) {
    console.error('TTS error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Text-to-speech failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      headers
    };
  }
}; 