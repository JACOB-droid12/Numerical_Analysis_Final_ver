import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function useRunRevealMotion<T extends HTMLElement>(runKey: string | null) {
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !runKey) {
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      return;
    }

    const tween = gsap.fromTo(
      element,
      { opacity: 0.86, y: 8 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
    );

    return () => {
      tween.kill();
    };
  }, [runKey]);

  return elementRef;
}
