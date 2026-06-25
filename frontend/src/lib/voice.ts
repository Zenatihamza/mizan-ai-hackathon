/**
 * Darija voice layer using the browser's native Web Speech API.
 * Free, no API key, runs on the client. Browser support varies for Arabic
 * voices — falls back to whatever Arabic voice is installed on the OS.
 *
 * Tip for the demo: on Windows, install an "Arabic (Saudi Arabia)" voice
 * (Settings -> Time & Language -> Speech -> Add voices) for the best result.
 */

let cachedArabicVoice: SpeechSynthesisVoice | null | undefined;

function pickArabicVoice(): SpeechSynthesisVoice | null {
  if (cachedArabicVoice !== undefined) return cachedArabicVoice;
  if (!("speechSynthesis" in window)) {
    cachedArabicVoice = null;
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  const arabic =
    voices.find((v) => v.lang.toLowerCase().startsWith("ar")) ||
    voices.find((v) => /arab|عرب/i.test(v.name)) ||
    null;
  cachedArabicVoice = arabic;
  return arabic;
}

export function speak(text: string, opts?: { lang?: string; rate?: number }) {
  if (!("speechSynthesis" in window)) {
    console.warn("speechSynthesis not supported in this browser");
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickArabicVoice();
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else {
    u.lang = opts?.lang || "ar-SA";
  }
  u.rate = opts?.rate ?? 0.95;
  u.pitch = 1;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedArabicVoice = undefined;
  };
}
