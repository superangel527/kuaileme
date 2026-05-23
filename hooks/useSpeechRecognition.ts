"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Web Speech API 型別（瀏覽器原生、TypeScript 沒內建完整型別）
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
}
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

/**
 * Web Speech API 語音輸入
 * - 瀏覽器原生、免費
 * - iOS Safari 13+、Android Chrome 支援
 * - LINE / IG WebView 可能不支援 → supported 會是 false
 */
export function useSpeechRecognition(
  onResult: (text: string) => void,
  lang: string = "zh-TW"
) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }).SpeechRecognition || (window as unknown as {
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }).webkitSpeechRecognition;

    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) onResultRef.current(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch {
        /* noop */
      }
    };
  }, [lang]);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec || listening) return;
    try {
      rec.start();
      setListening(true);
    } catch {
      // 已經 started、忽略
    }
  }, [listening]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, start, stop };
}
