import { useState, useEffect, useRef } from "react";

const useStreamingText = (text, speed = 12) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!text) { setDisplayed(""); setDone(false); indexRef.current = 0; return; }

    indexRef.current = 0;
    setDisplayed("");
    setDone(false);

    const CHUNK = 4; // characters per tick

    const tick = () => {
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        setDone(true);
        return;
      }
      indexRef.current = Math.min(indexRef.current + CHUNK, text.length);
      setDisplayed(text.slice(0, indexRef.current));
      timerRef.current = setTimeout(tick, speed);
    };

    timerRef.current = setTimeout(tick, 10);
    return () => clearTimeout(timerRef.current);
  }, [text]);

  return { displayed, done };
};

export default useStreamingText;