import { useEffect } from "react";

export default function useSessionTimeout(
  onTimeout,
  timeoutMinutes = 15
) {
  useEffect(() => {
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        onTimeout();
      }, timeoutMinutes * 60 * 1000);
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      clearTimeout(timer);

      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [onTimeout, timeoutMinutes]);
}