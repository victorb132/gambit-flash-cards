import { useCallback, useEffect, useRef } from "react";
import * as Speech from "expo-speech";

export function useTextToSpeech() {
  const voiceId = useRef<string | null>(null);

  // On mount, pick the highest-quality pt-BR voice available on the device.
  // iOS: prefers "Enhanced" (neural) voices like "Luciana (Enhanced)".
  // Android: prefers Google's high-quality voices when available.
  useEffect(() => {
    async function pickBestVoice() {
      try {
        const all = await Speech.getAvailableVoicesAsync();
        const pt = all.filter((v) => v.language.startsWith("pt"));

        // Tier 1 – Enhanced quality, pt-BR
        const enhancedBR = pt.find(
          (v) =>
            v.language === "pt-BR" &&
            v.quality === Speech.VoiceQuality.Enhanced
        );
        if (enhancedBR) { voiceId.current = enhancedBR.identifier; return; }

        // Tier 2 – Any Enhanced pt voice
        const enhancedPT = pt.find(
          (v) => v.quality === Speech.VoiceQuality.Enhanced
        );
        if (enhancedPT) { voiceId.current = enhancedPT.identifier; return; }

        // Tier 3 – Default quality pt-BR
        const defaultBR = pt.find((v) => v.language === "pt-BR");
        if (defaultBR) { voiceId.current = defaultBR.identifier; return; }

        // Tier 4 – Any pt voice
        if (pt[0]) voiceId.current = pt[0].identifier;
      } catch {
        // Keep null — system default will be used
      }
    }
    pickBestVoice();
  }, []);

  const speak = useCallback((text: string) => {
    Speech.stop();
    Speech.speak(text, {
      language: "pt-BR",
      pitch: 1.0,
      rate: 0.88,
      ...(voiceId.current ? { voice: voiceId.current } : {}),
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
  }, []);

  return { speak, stop };
}
