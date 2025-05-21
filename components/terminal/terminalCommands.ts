interface XTerm {
  write: (text: string) => void;
  clear: () => void;
}

export const createCommands = (term: XTerm | null) => {
  const commands: Record<string, string | (() => void)> = {
    help: 'Available commands: help, ls, cd, cat, open github, clear\r\n',
    ls: 'about  projects  contact\r\n',
    'cd projects': 'Now in /projects\r\n',
    'cat about': 'I am a developer who prefers the terminal over dropdowns.\r\n',
    
    'open github': () => {
      window.open('https://github.com/your-username', '_blank');
      term?.write('Opening GitHub...\r\n');
    },
    
    clear: () => {
      term?.clear();
      term?.write('Welcome to my portfolio 👨‍💻\r\n');
    },
  };

  return commands;
};

export const handleCommand = (cmd: string, term: XTerm | null) => {
  const commands = createCommands(term);
  const result = commands[cmd];
  
  if (typeof result === 'string') {
    term?.write(result);
  } else if (typeof result === 'function') {
    result();
  } else {
    term?.write(`Command not found: ${cmd}\r\n`);
  }
};

export const handleKeyInput = (
  key: string, 
  domEvent: KeyboardEvent, 
  buffer: string, 
  setBuffer: (buffer: string) => void,
  term: XTerm | null
) => {
  const char = domEvent.key;

  if (char === 'Enter') {
    term?.write('\r\n');
    handleCommand(buffer.trim(), term);
    setBuffer('');
    term?.write('$ ');
  } else if (char === 'Backspace') {
    if (buffer.length > 0) {
      setBuffer(buffer.slice(0, -1));
      term?.write('\b \b');
    }
  } else if (char.length === 1 && !domEvent.ctrlKey && !domEvent.altKey) {
    setBuffer(buffer + key);
    term?.write(key);
  }
};