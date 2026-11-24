import { useEffect, useRef, useState } from 'react';
import { TextArea } from '../atoms/TextArea';
import { useTranslation } from '../../i18n/I18nProvider';
import { ApiError, apiGet, ChatMessage, streamChat } from '../../lib/api';
import { DictationButton } from '../atoms/DictationButton';
import { UpgradeVoiceButton } from '../atoms/UpgradeVoiceButton';
import { appendDictated, useDictation } from '../../hooks/useDictation';
import { SpeechQueue, speechSupported } from '../../lib/speech';
import { ElayraBubbles } from '../molecules/ElayraBubbles';
import { useDiscovery } from '../../lib/discovery';
import { useAccount } from '../../contexts/AccountContext';

const SEND_AFTER_PAUSE_MS = 1800;

type EntryEditorProps = {
  /** Chiude la conversazione e la salva come pagina di diario. */
  /** Non serve più: a mezzanotte la conversazione del giorno diventa da sola una pagina del Diario. */
  onFinish?: () => Promise<unknown>;
};

type Bubble = ChatMessage & { local?: boolean; kind?: 'error' | 'note' | 'greeting'; live?: boolean };

/**
 * La finestra di chat con Elayra. I messaggi passano dal backend, che li manda a Claude
 * con la voce di Elayra e li conserva: riaprendo l'app la conversazione è ancora lì.
 */
export function EntryEditor(_props: EntryEditorProps = {}) {
  const { t, locale } = useTranslation();
  const discovered = useDiscovery();
  const { account } = useAccount();
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
            : [{ role: 'assistant', content: '', local: true, kind: 'greeting', live: true }]
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

  /**
   * Dopo un'interruzione di rete ricarica la conversazione di oggi (due tentativi, a un secondo e mezzo):
   * se dopo il messaggio appena mandato c'è la risposta di Elayra, la mostra intera al posto dell'errore.
   */
  const recoverReply = async (sent: string): Promise<ChatMessage[] | null> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      await new Promise((r) => window.setTimeout(r, 1500));
      try {
        const { messages: saved } = await apiGet<{ messages: ChatMessage[] }>('/api/chat/history');
        const lastUser = saved.map((m) => m.role).lastIndexOf('user');
        if (lastUser >= 0 && saved[lastUser].content.trim() === sent && saved.slice(lastUser + 1).some((m) => m.role === 'assistant')) {
          return saved;
        }
      } catch {
        /* ancora senza rete: si riprova una volta */
      }
    }
    return null;
  };

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
            setMessages((prev) => [...prev, { role: 'assistant', content: text, live: true }]);
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
        onNote: (text) => setMessages((prev) => [...prev, { role: 'assistant', content: text, live: true }]),
      });
    } catch (e) {
      // Se è caduta solo la connessione, Elayra di solito ha finito e la risposta è già salvata: la si recupera.
      const recovered = e instanceof ApiError && e.status === 0 ? await recoverReply(content) : null;
      if (recovered) {
        setMessages(recovered);
      } else {
        const message = e instanceof Error ? e.message : t('chat.error.generic');
        setMessages((prev) => [...prev, { role: 'assistant', content: message, local: true, kind: 'error' }]);
      }
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div className="entry-editor chat-editor">
      <div className="chat-window" ref={chatWindowRef} role="log" aria-live="polite" aria-label={t('chat.windowLabel')}>
        {messages.map((message, index) => {
          const key = message.id || `${message.role}-${index}`;
          if (message.role === 'assistant' && (!message.kind || message.kind === 'greeting')) {
            // Al primo incontro Elayra si presenta e spiega da dove partire.
            const content =
              message.kind === 'greeting'
                ? discovered && discovered.length === 1
                  ? account?.nickname
                    ? t('chat.greetingGuide', { name: account.nickname })
                    : t('chat.greetingGuideNoName')
                  : t('chat.greeting')
                : message.content;
            return <ElayraBubbles key={key} content={content} live={message.live} />;
          }
          return (
            <div key={key} className={`chat-message ${message.role}${message.kind ? ` ${message.kind}` : ''}`}>
              <p>{message.content}</p>
            </div>
          );
        })}
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
        <div className="chat-compose">
          <TextArea
            value={inputText}
            onChange={setInputText}
            placeholder={t('journal.placeholder')}
            ariaLabel={t('chat.inputLabel')}
            rows={3}
            maxLength={4000}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="chat-send"
            aria-label={t('chat.send')}
            title={t('chat.send')}
            onClick={() => void handleSendMessage()}
            disabled={busy || !inputText.trim()}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="chat-voice-row">
          {!voiceMode && (
            <DictationButton
              disabled={busy}
              onText={(piece) => setInputText((prev) => appendDictated(prev, piece))}
            />
          )}
          {/* La voce di Elayra arriverà con il piano H24: per ora c'è l'invito. */}
          <UpgradeVoiceButton />
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
        <p className="chat-midnight">{t('chat.midnight')}</p>
        <p className="chat-disclaimer">{t('chat.disclaimer')}</p>
      </div>
    </div>
  );
}
