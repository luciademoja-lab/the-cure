import { useEffect, useRef, useState } from 'react';
import { TextArea } from '../atoms/TextArea';
import { Button } from '../atoms/Button';
import { useTranslation } from '../../i18n/I18nProvider';
import { apiGet, ChatMessage, streamChat } from '../../lib/api';

type EntryEditorProps = {
  /** Chiude la conversazione e la salva come pagina di diario. */
  onFinish: () => Promise<unknown>;
};

type Bubble = ChatMessage & { local?: boolean; kind?: 'error' | 'note' };

/**
 * La finestra di chat con Elayra. I messaggi passano dal backend, che li manda a Claude
 * con la voce di Elayra e li conserva: riaprendo l'app la conversazione è ancora lì.
 */
export function EntryEditor({ onFinish }: EntryEditorProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    apiGet<{ messages: ChatMessage[] }>('/api/chat/history')
      .then((data) => {
        if (!active) return;
        setMessages(
          data.messages.length > 0
            ? data.messages
            : [{ role: 'assistant', content: t('chat.greeting'), local: true }]
        );
      })
      .catch((e) => {
        if (!active) return;
        setMessages([
          { role: 'assistant', content: e instanceof Error ? e.message : t('chat.error.generic'), local: true, kind: 'error' },
        ]);
      })
      .finally(() => {
        if (active) setIsLoadingHistory(false);
      });
    return () => {
      active = false;
    };
    // La cronologia si carica una volta sola all'apertura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const container = chatWindowRef.current;
    if (!container) return;
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isThinking]);

  const busy = isThinking || isStreaming || isSaving || isLoadingHistory;
  const hasUserMessages = messages.some((m) => m.role === 'user');

  const handleSendMessage = async () => {
    const content = inputText.trim();
    if (!content || busy) return;

    setMessages((prev) => [...prev.filter((m) => m.kind !== 'error'), { role: 'user', content }]);
    setInputText('');
    setIsThinking(true);

    let started = false;
    try {
      await streamChat(content, {
        onDelta: (text) => {
          if (!started) {
            started = true;
            setIsThinking(false);
            setIsStreaming(true);
            setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
          } else {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              next[next.length - 1] = { ...last, content: last.content + text };
              return next;
            });
          }
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : t('chat.error.generic');
      setMessages((prev) => [...prev, { role: 'assistant', content: message, local: true, kind: 'error' }]);
    } finally {
      setIsThinking(false);
      setIsStreaming(false);
    }
  };

  const handleFinishAndSave = async () => {
    if (!hasUserMessages || busy) return;
    setIsSaving(true);
    try {
      await onFinish();
      setMessages((prev) => [
        ...prev.filter((m) => m.kind !== 'error'),
        { role: 'assistant', content: t('chat.saved'), local: true, kind: 'note' },
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('chat.error.generic');
      setMessages((prev) => [...prev, { role: 'assistant', content: message, local: true, kind: 'error' }]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div className="entry-editor chat-editor">
      <div className="chat-window" ref={chatWindowRef} role="log" aria-live="polite" aria-label={t('chat.windowLabel')}>
        {messages.map((message, index) => (
          <div
            key={message.id || `${message.role}-${index}`}
            className={`chat-message ${message.role}${message.kind ? ` ${message.kind}` : ''}`}
          >
            <p>{message.content}</p>
          </div>
        ))}
        {(isThinking || isLoadingHistory) && (
          <div className="chat-message assistant thinking">
            <div className="typing-indicator" aria-label={t('journal.chat.thinking')}>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <div className="chat-input">
        <TextArea
          value={inputText}
          onChange={setInputText}
          placeholder={t('journal.placeholder')}
          ariaLabel={t('chat.inputLabel')}
          rows={3}
          maxLength={4000}
          onKeyDown={handleKeyDown}
        />
        <div className="chat-actions">
          <Button label={t('chat.send')} onClick={handleSendMessage} variant="primary" disabled={busy || !inputText.trim()} />
          <Button
            label={isSaving ? t('chat.saving') : t('chat.finish')}
            onClick={handleFinishAndSave}
            variant="secondary"
            disabled={busy || !hasUserMessages}
          />
        </div>
        <p className="chat-disclaimer">{t('chat.disclaimer')}</p>
      </div>
    </div>
  );
}
