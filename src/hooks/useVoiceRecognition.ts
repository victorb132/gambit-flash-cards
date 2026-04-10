import { useEffect, useRef, useState } from 'react';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { VOICE_COMMANDS } from '@/utils/constants';

type VoiceCommand = 'flip' | 'correct' | 'wrong' | 'doubt' | null;

function parseCommand(text: string): VoiceCommand {
  const lower = text.toLowerCase().trim();
  if (VOICE_COMMANDS.FLIP.some((cmd) => lower.includes(cmd))) return 'flip';
  if (VOICE_COMMANDS.CORRECT.some((cmd) => lower.includes(cmd))) return 'correct';
  if (VOICE_COMMANDS.WRONG.some((cmd) => lower.includes(cmd))) return 'wrong';
  if (VOICE_COMMANDS.DOUBT.some((cmd) => lower.includes(cmd))) return 'doubt';
  return null;
}

const START_OPTIONS = {
  lang: 'pt-BR',
  interimResults: true,
  continuous: true,
} as const;

type SpeechResultEvent = {
  isFinal: boolean;
  results: { transcript: string; confidence: number }[];
};

type SpeechErrorEvent = { error: string };

type SpeechModule = {
  start: (opts: typeof START_OPTIONS) => void;
  stop: () => void;
  abort: () => void;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  addListener: (
    event: string,
    listener: (payload: any) => void
  ) => { remove: () => void };
};

// Returns null (no throw) when the native module isn't built yet.
// This keeps voice features optional without crashing the app.
function getSpeechModule(): SpeechModule | null {
  return requireOptionalNativeModule<SpeechModule>('ExpoSpeechRecognition');
}

export function isSpeechRecognitionAvailable(): boolean {
  return getSpeechModule() !== null;
}

export function useVoiceRecognition(
  onCommand: (command: VoiceCommand) => void,
  enabled: boolean
) {
  const [isListening, setIsListening] = useState(false);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;
  const activeRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const Speech = getSpeechModule();
    if (!Speech) {
      // Native module not yet available — voice is silently disabled until rebuild
      return;
    }

    clearTimeout(restartTimerRef.current);
    activeRef.current = enabled;

    function scheduleRestart(delayMs: number) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = setTimeout(() => {
        if (activeRef.current) Speech.start(START_OPTIONS);
      }, delayMs);
    }

    const subs = [
      Speech.addListener('start', () => setIsListening(true)),

      // Restart after end — iOS has ~1 min session limit, so we must re-trigger
      Speech.addListener('end', () => {
        setIsListening(false);
        if (activeRef.current) scheduleRestart(300);
      }),

      Speech.addListener('result', (event: SpeechResultEvent) => {
        if (!activeRef.current) return;
        const { results, isFinal } = event;
        if (!results?.length) return;
        for (const result of results) {
          // Accept interim results only when confidence is good (< 0 means unavailable)
          const acceptable = isFinal || result.confidence < 0 || result.confidence >= 0.5;
          if (!acceptable) continue;
          const cmd = parseCommand(result.transcript);
          if (cmd) {
            onCommandRef.current(cmd);
            return;
          }
        }
      }),

      Speech.addListener('error', (event: SpeechErrorEvent) => {
        setIsListening(false);
        if (!activeRef.current) return;
        if (event.error === 'not-allowed' || event.error === 'aborted') return;
        scheduleRestart(500);
      }),
    ];

    if (enabled) {
      Speech.requestPermissionsAsync().then(({ granted }) => {
        if (granted && activeRef.current) Speech.start(START_OPTIONS);
      });
    }

    return () => {
      activeRef.current = false;
      clearTimeout(restartTimerRef.current);
      subs.forEach((sub) => sub?.remove());
      Speech.abort();
    };
  }, [enabled]);

  return { isListening };
}
