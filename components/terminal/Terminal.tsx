"use client";

import { useEffect, useRef, useState } from 'react';
import styles from './Terminal.module.css';
import { handleKeyInput } from './terminalCommands';

interface XTerm {
  open: (element: HTMLElement) => void;
  write: (text: string) => void;
  clear: () => void;
  onKey: (handler: (event: { key: string; domEvent: KeyboardEvent }) => void) => void;
}

declare global {
  interface Window {
    Terminal: new (options: any) => XTerm;
  }
}

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const term = useRef<XTerm | null>(null);
  const [buffer, setBuffer] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Terminal) {
      term.current = new window.Terminal({
        cursorBlink: true,
        theme: {
          background: '#000000',
          foreground: '#00ff00',
        },
        fontFamily: 'monospace',
        fontSize: 14,
      });

      if (terminalRef.current && term.current) {
        term.current.open(terminalRef.current);
        term.current.write('Welcome to my portfolio 👨‍💻\r\n');
        term.current.write('$ ');
      }

      term.current?.onKey(({ key, domEvent }) => {
        handleKeyInput(key, domEvent, buffer, setBuffer, term.current);
      });
    } else {
      console.error('XTerm.js not loaded. Please install xterm.js or load it via CDN.');
    }

    return () => {
      if (term.current) {
        (term.current as any).dispose?.();
      }
    };
  }, [buffer]); // Add buffer as dependency

  if (typeof window !== 'undefined' && !window.Terminal) {
    return (
      <div className={styles.loading}>
        Loading terminal... (XTerm.js required)
      </div>
    );
  }

  return (
    <div 
      ref={terminalRef} 
      className={styles.terminal}
    />
  );
}