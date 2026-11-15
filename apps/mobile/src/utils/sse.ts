export type SseEvent = { event: string; data: string };

/**
 * Parser incrementale per Server-Sent Events: riceve pezzi di testo così come arrivano
 * dalla rete (anche spezzati a metà) e restituisce gli eventi completi.
 */
export function createSseParser() {
  let buffer = '';

  const parseBlock = (block: string): SseEvent | null => {
    let event = 'message';
    let data = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    return data ? { event, data } : null;
  };

  return {
    push(chunk: string): SseEvent[] {
      buffer += chunk.replace(/\r\n/g, '\n');
      const events: SseEvent[] = [];
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const parsed = parseBlock(buffer.slice(0, idx));
        buffer = buffer.slice(idx + 2);
        if (parsed) events.push(parsed);
      }
      return events;
    },
    flush(): SseEvent[] {
      const parsed = buffer.trim() ? parseBlock(buffer) : null;
      buffer = '';
      return parsed ? [parsed] : [];
    },
  };
}
