import { useCallback } from "react";
import * as Speech from "expo-speech";

// Set a specific voice identifier here, or null to use the system default.
// Run getAvailableVoices() once to see what's available on your device.
const VOICE_IDENTIFIER: string | null = null;

export function useTextToSpeech() {
  const speak = useCallback((text: string) => {
    Speech.stop();
    Speech.speak(text, {
      language: "pt-BR",
      pitch: 1.0,
      rate: 0.9,
      ...(VOICE_IDENTIFIER ? { voice: VOICE_IDENTIFIER } : {}),
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
  }, []);

  // Call this once (ex: via console.log) to discover voices available on the device
  const getAvailableVoices = useCallback(async () => {
    const voices = await Speech.getAvailableVoicesAsync();
    const ptVoices = voices.filter((v) => v.language.startsWith("pt"));
    console.log("=== Vozes pt-BR disponíveis ===");
    ptVoices.forEach((v) =>
      console.log(
        `name: ${v.name} | id: ${v.identifier} | quality: ${v.quality}`,
      ),
    );
    console.log("=== Todas as vozes ===", voices);
    return voices;
  }, []);

  return { speak, stop, getAvailableVoices };
}
