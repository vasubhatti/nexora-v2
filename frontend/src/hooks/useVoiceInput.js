import { useState, useRef, useCallback } from "react";

const useVoiceInput = ({ onTranscript, onError }) => {
  const [listening, setListening] = useState(false);

  const [supported] = useState(
    () =>
      "webkitSpeechRecognition" in window ||
      "SpeechRecognition" in window
  );

  const recognitionRef = useRef(null);

  const startListening = useCallback(() => {
    if (!supported) {
      onError?.(
        "Voice input is not supported in this browser. Try Chrome or Edge."
      );
      return;
    }

    // Prevent multiple recognition instances
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    // Stores the final transcript for this recognition session
    let finalTranscript = "";

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      let currentInterim = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          currentInterim += transcript;
        }
      }

      // Always send the complete current transcript.
      // ChatInput should replace the previous voice preview
      // instead of appending every interim result.
      const fullTranscript =
        finalTranscript + currentInterim;

      onTranscript?.(
        fullTranscript.trim(),
        Boolean(finalTranscript.trim())
      );
    };

    recognition.onerror = (event) => {
      setListening(false);

      if (event.error === "not-allowed") {
        onError?.(
          "Microphone access denied. Please allow microphone permission."
        );
      } else if (event.error === "no-speech") {
        onError?.(
          "No speech detected. Please try again."
        );
      } else if (event.error !== "aborted") {
        onError?.(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    recognition.start();
  }, [supported, onTranscript, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  }, [listening, startListening, stopListening]);

  return {
    listening,
    supported,
    toggleListening,
    stopListening,
  };
};

export default useVoiceInput;