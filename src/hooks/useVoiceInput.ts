import { useState, useCallback, useRef } from 'react';

let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: ((...args: any[]) => void) | null = null;

try {
  const mod = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch {
  // Native module not available (e.g. running in Expo Go)
}

export type VoiceStatus = 'idle' | 'recording' | 'processing';

export function useVoiceInput(
  onResult: (text: string) => void,
  onError?: (error: string) => void
) {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const statusRef = useRef<VoiceStatus>('idle');
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  onResultRef.current = onResult;
  onErrorRef.current = onError;

  function updateStatus(next: VoiceStatus) {
    statusRef.current = next;
    setStatus(next);
  }

  useSpeechRecognitionEvent?.('result', (event: any) => {
    if (event.isFinal) {
      const text = event.results[0]?.transcript ?? '';
      if (text.trim()) {
        updateStatus('processing');
        onResultRef.current(text);
      } else {
        updateStatus('idle');
        onErrorRef.current?.('Nenhuma fala detectada. Tente novamente.');
      }
    }
  });

  useSpeechRecognitionEvent?.('end', () => {
    if (statusRef.current === 'recording') {
      updateStatus('idle');
    }
  });

  useSpeechRecognitionEvent?.('error', (event: any) => {
    if (statusRef.current !== 'idle') {
      updateStatus('idle');
      onErrorRef.current?.(event.message ?? event.error ?? 'Erro de reconhecimento');
    }
  });

  const startRecording = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule) {
      onErrorRef.current?.('Reconhecimento de voz não disponível neste ambiente.');
      return;
    }
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        onErrorRef.current?.('Permissão de microfone negada. Verifique as configurações do app.');
        return;
      }
      updateStatus('recording');
      ExpoSpeechRecognitionModule.start({
        lang: 'pt-BR',
        interimResults: false,
        maxAlternatives: 1,
        continuous: false,
      });
    } catch {
      updateStatus('idle');
      onErrorRef.current?.('Não foi possível acessar o microfone.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (statusRef.current === 'recording') {
      ExpoSpeechRecognitionModule?.abort();
      updateStatus('idle');
    }
  }, []);

  return { status, startRecording, stopRecording };
}
