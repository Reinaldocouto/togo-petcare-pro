import { useState, useCallback } from 'react';

interface SpeechRecognitionResult {
  transcript: string;
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: SpeechRecognitionResult;
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback((onResult: (text: string) => void, onError?: (error: string) => void) => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const errorMsg = 'Reconhecimento de voz não é suportado neste navegador. Use Google Chrome.';
      if (onError) onError(errorMsg);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

  return { startListening, isListening };
}
