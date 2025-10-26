"use client";

import {useState, useEffect, useCallback, useRef} from "react";

const useIdle = (timeout: number, promptDuration: number = 15000) => {
  const [isIdle, setIsIdle] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [countdown, setCountdown] = useState(promptDuration / 1000);

  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  const handleIdle = useCallback(() => {
    setIsIdle(true);
    setIsPrompting(false);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }, []);

  const handlePrompt = useCallback(() => {
    setIsPrompting(true);
    setCountdown(promptDuration / 1000);

    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimer.current) clearInterval(countdownTimer.current);
          handleIdle();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [promptDuration, handleIdle]);

  const resetTimers = useCallback(() => {
    setIsIdle(false);
    setIsPrompting(false);

    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    if (timeout > 0) {
      idleTimer.current = setTimeout(handlePrompt, timeout - promptDuration);
    }
  }, [timeout, promptDuration, handlePrompt]);

  useEffect(() => {
    if (timeout <= 0 || timeout <= promptDuration) {
      return; // Do nothing if timeout is disabled or too short
    }

    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "touchstart",
      "scroll",
    ];
    const handleEvent = () => {
      resetTimers();
    };

    events.forEach((event) => window.addEventListener(event, handleEvent));
    resetTimers();

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      events.forEach((event) => window.removeEventListener(event, handleEvent));
    };
  }, [timeout, promptDuration, resetTimers]);

  return {isIdle, isPrompting, countdown, resetTimers};
};

export default useIdle;
