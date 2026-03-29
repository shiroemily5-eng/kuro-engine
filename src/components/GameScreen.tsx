import { useEffect, useRef } from 'react';

interface Props {
  messages: { role: string; content: string }[];
  loading: boolean;
}

function GameScreen({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="game-screen">
      {messages.length === 0 && (
        <div className="message system">
          Welcome to AI TextRPG. Create a character to begin your adventure.
        </div>
      )}
      
      {messages.map((msg, i) => (
        <div key={i} className={`message ${msg.role}`}>
          {msg.content}
        </div>
      ))}
      
      {loading && (
        <div className="message system">
          <em>Thinking...</em>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
}

export default GameScreen;
