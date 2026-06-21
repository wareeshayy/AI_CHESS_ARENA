"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const FEMALE_VOICE_HINTS =
  /female|samantha|victoria|zira|karen|moira|fiona|susan|aria|jenny|emma|sara|linda|heather|hazel|laura|nancy|salli|joanna|ivy|kimberly|kendra|amy/i
const MALE_VOICE_HINTS =
  /male|daniel|david|mark|james|thomas|andrew|brian|guy|rishi|aaron|fred|george|michael|christopher|richard|paul|steven|alex|ryan|matthew/i

function pickCoachVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  const english = voices.filter((v) => v.lang.startsWith("en"))

  return (
    english.find((v) => MALE_VOICE_HINTS.test(v.name) && !FEMALE_VOICE_HINTS.test(v.name)) ??
    english.find((v) => v.name.includes("Google") && v.name.toLowerCase().includes("male")) ??
    english.find((v) => !FEMALE_VOICE_HINTS.test(v.name)) ??
    english.find((v) => v.lang.startsWith("en-US")) ??
    english[0] ??
    voices[0] ??
    null
  )
}

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
    utterance.pitch = 0.9
    utterance.volume = 1

    utterance.voice = pickCoachVoice()
    if (!utterance.voice) {
      window.speechSynthesis.onvoiceschanged = () => {
        utterance.voice = pickCoachVoice()
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
