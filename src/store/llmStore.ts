import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  name?: string;
}

interface Function {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

interface LLMStore {
  messages: Message[];
  functions: Function[];
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  addMessage: (message: Message) => void;
  addFunction: (func: Function) => void;
  removeFunction: (name: string) => void;
  clearFunctions: () => void;
  clearHistory: () => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setSystemPrompt: (prompt: string) => void;
}

export const useLLMStore = create<LLMStore>()(
  persist(
    (set) => ({
      messages: [],
      functions: [],
      temperature: 0.5,
      maxTokens: 1000,
      systemPrompt: 'You are a helpful AI assistant.',
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      addFunction: (func) =>
        set((state) => ({ functions: [...state.functions, func] })),
      removeFunction: (name) =>
        set((state) => ({ functions: state.functions.filter(f => f.name !== name) })),
      clearFunctions: () => set({ functions: [] }),
      clearHistory: () => set({ messages: [] }),
      setTemperature: (temp) => set({ temperature: temp }),
      setMaxTokens: (tokens) => set({ maxTokens: tokens }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
    }),
    {
      name: 'llm-storage',
    }
  )
); 