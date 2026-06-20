"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useCoachSpeech(initialEnabled = true) {
  const [speechEnabled, setSpeechEnabled] = useState(initialEnabled)
  const enabledRef = useRef(speechEnabled)

  useEffect(() => {
    enabledRef.current = speechEnabled
  }, [speechEnabled])

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.getVoices()
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!enabledRef.current || typeof window === "undefined" || !text.trim()) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.92
    utterance.pitch = 1.05
    utterance.volume = 1

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      return (
        voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ??
        voices.find((v) => v.lang.startsWith("en-US")) ??
        voices.find((v) => v.lang.startsWith("en")) ??
        voices[0]
      )
    }

    utterance.voice = pickVoice()
    if (!utterance.voice) {
      window.speechSynthesis.onvoiceschanged = () => {
        utterance.voice = pickVoice()
        window.speechSynthesis.speak(utterance)
      }
    } else {
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis.cancel()
  }, [])

  const toggleSpeech = useCallback(() => {
    setSpeechEnabled((v) => {
      if (v) stop()
      return !v
    })
  }, [stop])

  return { speechEnabled, speak, stop, toggleSpeech, setSpeechEnabled }
}
