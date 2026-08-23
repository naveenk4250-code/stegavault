import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Intersection Observer Hook ────────────────────────────────────────────
// Returns a ref and whether the element has entered the viewport
export function useInView(
  options: IntersectionObserverInit = { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect(); // fire once
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, inView } as const;
}

// ─── Staggered children animation hook ────────────────────────────────────
export function useStaggerInView(count: number, delay = 80) {
  const ref = useRef<HTMLElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let i = 0;
        const tick = () => {
          setVisibleCount((prev) => {
            const next = prev + 1;
            if (next < count) {
              setTimeout(tick, delay);
            }
            return next;
          });
          i++;
        };
        setTimeout(tick, 0);
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [count, delay]);

  return { ref, visibleCount } as const;
}

// ─── Mouse parallax hook ───────────────────────────────────────────────────
export function useMouseParallax(strength = 0.02) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = useCallback((e: MouseEvent) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    setOffset({
      x: (e.clientX - cx) * strength,
      y: (e.clientY - cy) * strength,
    });
  }, [strength]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [handleMove]);

  return offset;
}

// ─── Counting number animation ─────────────────────────────────────────────
export function useCountUp(target: number, duration = 1800, started = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, started]);

  return value;
}

// ─── Typewriter effect hook ────────────────────────────────────────────────
export function useTypewriter(words: string[], speed = 80, pause = 2000) {
  const [displayed, setDisplayed] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIndex % words.length];

    if (!deleting && charIndex < word.length) {
      const t = setTimeout(() => setCharIndex((c) => c + 1), speed);
      return () => clearTimeout(t);
    }
    if (!deleting && charIndex === word.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && charIndex > 0) {
      const t = setTimeout(() => setCharIndex((c) => c - 1), speed / 2);
      return () => clearTimeout(t);
    }
    if (deleting && charIndex === 0) {
      setDeleting(false);
      setWordIndex((w) => w + 1);
    }
  }, [charIndex, deleting, wordIndex, words, speed, pause]);

  useEffect(() => {
    const word = words[wordIndex % words.length];
    setDisplayed(word.slice(0, charIndex));
  }, [charIndex, wordIndex, words]);

  return displayed;
}
