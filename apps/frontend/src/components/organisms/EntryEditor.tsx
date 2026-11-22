import { useEffect, useRef, useState } from 'react';
import { TextArea } from '../atoms/TextArea';
import { Button } from '../atoms/Button';
import { useTranslation } from '../../i18n/I18nProvider';
import { apiGet, ChatMessage, streamChat } from '../../lib/api';
import { DictationButton } from '../atoms/DictationButton';
import { appendDictated, useDictation } from '../../hooks/useDictation';
import { SpeechQueue, speechSupported } from '../../lib/speech';

const SEND_AFTER_PAUSE_MS = 1800;

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
  const { t, locale } = useTranslation();
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  // ── Conversazione a voce: si parla, alla pausa il messaggio parte, Elayra risponde a voce.
  const [voiceMode, setVoiceMode] = useState(false);
  const [elayraSpeaking, setElayraSpeaking] = useState(false);
  const voiceModeRef = useRef(false);
  const spokenRef = useRef('');
  const pauseTimer = useRef<number | undefined>(undefined);
  const speechRef = useRef<SpeechQueue | null>(null);
  const sendRef = useRef<(text?: string) => Promise<void>>(async () => {});

  const scheduleSend = () => {
    window.clearTimeout(pauseTimer.current);
    pauseTimer.current = window.setTimeout(() => {
      const said = spokenRef.current.trim();
      if (!said || !voiceModeRef.current) return;
      spokenRef.current = '';
      conversation.stop();
      void sendRef.current(said);
    }, SEND_AFTER_PAUSE_MS);
  };

  const conversation = useDictation({
    locale,
    onFinal: (piece) => {
      spokenRef.current = appendDictated(spokenRef.current, piece);
      setInputText(spokenRef.current);
      scheduleSend();
    },
    onInterim: () => window.clearTimeout(pauseTimer.current),
  });
  const voiceAvailable = conversation.supported && speechSupported();

  const listenAgain = () => {
    setElayraSpeaking(false);
    if (voiceModeRef.current) conversation.start();
  };

  const toggleVoiceMode = () => {
    if (voiceModeRef.current) {
      voiceModeRef.current = false;
      setVoiceMode(false);
      window.clearTimeout(pauseTimer.current);
      conversation.stop();
      speechRef.current?.stop();
      setElayraSpeaking(false);
      return;
    }
    voiceModeRef.current = true;
    setVoiceMode(true);
    spokenRef.current = '';
    // Su Safari e Chrome la voce va "sbloccata" da un tocco della persona.
    window.speechSynthesis?.getVoices();
    conversation.start();
  };

  useEffect(
    () => () => {
      voiceModeRef.current = false;
      window.clearTimeout(pauseTimer.current);
      speechRef.current?.stop();
    },
    []
  );

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

  const handleSendMessage = async (spoken?: string) => {
    const content = (spoken ?? inputText).trim();
    if (!content || busy) return;
    const speak = voiceModeRef.current;
    if (speak) {
      speechRef.current?.stop();
      speechRef.current = new SpeechQueue(locale, listenAgain);
    }

    setMessages((prev) => [...prev.filter((m) => m.kind !== 'error'), { role: 'user', content }]);
    setInputText('');
    setIsThinking(true);

    let started = false;
    try {
      await streamChat(content, {
        onDelta: (text) => {
          if (speak) {
            setElayraSpeaking(true);
            speechRef.current?.push(text);
          }
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
        onReset: () => {
          if (!started) return;
          started = false;
          setIsStreaming(false);
          setIsThinking(true);
          setMessages((prev) => prev.slice(0, -1));
        },
        onNote: (text) => setMessages((prev) => [...prev, { role: 'assistant', content: text }]),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : t('chat.error.generic');
      setMessages((prev) => [...prev, { role: 'assistant', content: message, local: true, kind: 'error' }]);
    } finally {
      setIsThinking(false);
      setIsStreaming(false);
      if (speak) {
        if (started) speechRef.current?.flush();
        else listenAgain();
      }
    }
  };
  sendRef.current = handleSendMessage;

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
        <div className="chat-voice-row">
          {!voiceMode && (
            <DictationButton
              disabled={busy}
              onText={(piece) => setInputText((prev) => appendDictated(prev, piece))}
            />
          )}
          {voiceAvailable && (
            <button
              type="button"
              className={`voice-mode-button ${voiceMode ? 'is-on' : ''}`}
              onClick={toggleVoiceMode}
              aria-pressed={voiceMode}
            >
              <span className="voice-mode-orb" aria-hidden="true" />
              {voiceMode ? t('voice.conversationOff') : t('voice.conversationOn')}
            </button>
          )}
          {voiceMode && (
            <span className="dictation-status" aria-live="polite">
              {elayraSpeaking
                ? t('voice.elayraSpeaking')
                : busy
                  ? t('journal.chat.thinking')
                  : conversation.error === 'mic'
                    ? t('voice.micDenied')
                    : conversation.listening
                      ? conversation.interim || t('voice.listening')
                      : ''}
            </span>
          )}
        </div>
        <div className="chat-actions">
          <Button label={t('chat.send')} onClick={() => void handleSendMessage()} variant="primary" disabled={busy || !inputText.trim()} />
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
