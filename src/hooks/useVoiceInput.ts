import { useState, useCallback, useRef } from 'react';

let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: ((...args: any[]) => void) | null = null;

try {
  const mod = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = mod.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
} catch {
  // Native module not available (e.g. Expo Go without custom build)
}

// Only 'idle' | 'recording' — processing state is driven by useChatStateMachine
export type VoiceStatus = 'idle' | 'recording';

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

  // When a final result arrives, reset to idle immediately then call the handler.
  // The state machine will show its own isProcessing spinner.
  useSpeechRecognitionEvent?.('result', (event: any) => {
    if (event.isFinal) {
      const text = event.results[0]?.transcript ?? '';
      updateStatus('idle');
      if (text.trim()) {
        onResultRef.current(text);
      } else {
        onErrorRef.current?.('Nenhuma fala detectada. Tente novamente.');
      }
    }
  });

  // Always reset to idle when recognition ends — regardless of previous status.
  // The old guard (statusRef === 'recording') was the root cause of the infinite
  // loading: once status was 'processing', the 'end' event became a no-op.
  useSpeechRecognitionEvent?.('end', () => {
    updateStatus('idle');
  });

  useSpeechRecognitionEvent?.('error', (event: any) => {
    updateStatus('idle');
    onErrorRef.current?.(event.message ?? event.error ?? 'Erro de reconhecimento');
  });

  const startRecording = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule) {
      onErrorRef.current?.('Reconhecimento de voz não disponível neste ambiente.');
      return;
    }
    if (statusRef.current === 'recording') return; // already active
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
