import { useState, useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const doneCallbackRef = useRef<(() => void) | undefined>(undefined);

  const speak = useCallback((text: string, onDone?: () => void) => {
    Speech.stop();
    doneCallbackRef.current = onDone;
    setIsSpeaking(true);

    Speech.speak(text, {
      language: 'pt-BR',
      rate: 0.9,
      pitch: 1.0,
      onDone: () => {
        setIsSpeaking(false);
        const cb = doneCallbackRef.current;
        doneCallbackRef.current = undefined;
        cb?.();
      },
      onError: () => {
        setIsSpeaking(false);
        const cb = doneCallbackRef.current;
        doneCallbackRef.current = undefined;
        cb?.();
      },
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
    doneCallbackRef.current = undefined;
  }, []);

  return { speak, stop, isSpeaking };
}
