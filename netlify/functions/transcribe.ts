import type { Handler } from '@netlify/functions';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';

// Shared API key for both TTS and STT
const DEEPGRAM_API_KEY = 'e9c8280ba7674083966fd0d553ff2441b81202ea';

interface DeepgramResponse {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
      }>;
    }>;
  };
}

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
    // Parse the multipart form data
    const boundary = event.headers['content-type']?.split('boundary=')[1];
    if (!boundary || !event.body) {
      throw new Error('Invalid request format');
    }

    // Extract the audio data from the form data
    const body = Buffer.from(event.body, 'base64');
    const parts = body.toString().split(boundary);
    const audioPart = parts.find((part: string) => part.includes('name="audio"'));
    if (!audioPart) {
      throw new Error('No audio data found');
    }

    // Extract the actual audio data
    const audioData = audioPart.split('\r\n\r\n')[1].split('\r\n--')[0];
    const audioBuffer = Buffer.from(audioData, 'base64');

    // Send to Deepgram
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm'
      },
      body: audioBuffer
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Deepgram API error: ${response.status} ${error}`);
    }

    const data = await response.json() as DeepgramResponse;
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    if (!transcript) {
      throw new Error('No transcript received from Deepgram');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ text: transcript }),
      headers
    };
  } catch (error) {
    console.error('Transcription error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      headers
    };
  }
}; 