import { useEffect, useRef, useState } from 'react';
import { JournalEntry, Energy, Mood } from '../../types/journal';
import { calculateLightPoints } from '../../services/journalAIService';
import { TextArea } from '../atoms/TextArea';
import { Button } from '../atoms/Button';
import { useTranslation } from '../../i18n/I18nProvider';

type EntryEditorProps = {
  onSave: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
};

type Message = {
  role: 'system' | 'user';
  text: string;
};

type QuestionType = 'text' | 'textarea' | 'options';

type Question = {
  id: 'feeling' | 'energy' | 'body' | 'focus' | 'mood';
  key: string;
  type: QuestionType;
  options?: Array<{ value: string; label: string }>;
};

const questions: Question[] = [
  {
    id: 'feeling',
    key: 'journal.chat.question.feeling',
    type: 'text',
  },
  {
    id: 'energy',
    key: 'journal.chat.question.energy',
    type: 'options',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'high', label: 'High' },
    ],
  },
  {
    id: 'body',
    key: 'journal.chat.question.body',
    type: 'text',
  },
  {
    id: 'focus',
    key: 'journal.chat.question.focus',
    type: 'textarea',
  },
  {
    id: 'mood',
    key: 'journal.chat.question.mood',
    type: 'options',
    options: Array.from({ length: 10 }, (_, index) => ({
      value: String(index + 1),
      label: String(index + 1),
    })),
  },
];

const followUpOptions = [
  { value: 'more', labelKey: 'journal.chat.option.moreSameTopic' },
  { value: 'different', labelKey: 'journal.chat.option.differentTopic' },
  { value: 'no', labelKey: 'journal.chat.option.noThanks' },
];

const initialEntryState = {
  mood: 7 as Mood,
  energy: 'moderate' as Energy,
  bodyFocus: '',
  content: '',
};

export function EntryEditor({ onSave }: EntryEditorProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', text: t(questions[0].key) },
  ]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [entryDraft, setEntryDraft] = useState({ ...initialEntryState });
  const [mode, setMode] = useState<'questions' | 'followup' | 'append' | 'finished'>('questions');
  const [isThinking, setIsThinking] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const thinkingTimeoutRef = useRef<number | null>(null);

  const appendMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const showThinkingThenSystemMessage = (text: string, showOptionsAfter = false, defaultValue = '') => {
    if (thinkingTimeoutRef.current) {
      window.clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }

    setIsThinking(true);
    setShowOptions(false);
    if (defaultValue) {
      setCurrentAnswer(defaultValue);
    }

    thinkingTimeoutRef.current = window.setTimeout(() => {
      setIsThinking(false);
      appendMessage({ role: 'system', text });
      setShowOptions(showOptionsAfter);
      thinkingTimeoutRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    const container = chatWindowRef.current;
    if (!container) return;
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isThinking]);

  useEffect(() => {
    return () => {
      if (thinkingTimeoutRef.current) {
        window.clearTimeout(thinkingTimeoutRef.current);
      }
    };
  }, []);

  const saveEntry = (entryData: typeof entryDraft) => {
    if (!entryData.content.trim()) return;

    const now = new Date();
    const dateTimeString = now.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const promptMap: Record<string, string> = {
      feeling: 'Feeling',
      energy: 'Energy',
      body: 'Body',
      focus: 'Exploration',
      mood: 'Mood',
    };

    const formattedLines = [dateTimeString];

    messages.forEach((msg, index) => {
      if (msg.role === 'system') {
        const matchingQuestion = questions.find((q) => t(q.key) === msg.text);
        if (matchingQuestion) {
          const label = promptMap[matchingQuestion.id] || matchingQuestion.id;
          const nextMsg = messages[index + 1];
          if (nextMsg?.role === 'user') {
            formattedLines.push(`${label}: ${nextMsg.text}`);
          }
        }
      }
    });

    const formattedContent = formattedLines.join('\n');
    const lightPoints = calculateLightPoints(entryData.content.length, false);
    const entry: Omit<JournalEntry, 'id' | 'timestamp'> = {
      content: formattedContent,
      mood: entryData.mood,
      energy: entryData.energy,
      tags: [],
      aiTags: [],
      bodyFocus: entryData.bodyFocus,
      lightPointsEarned: lightPoints,
    };

    onSave(entry);
  };

  const nextQuestion = () => {
    const nextIndex = activeQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setActiveQuestionIndex(nextIndex);
      const nextQuestion = questions[nextIndex];
      showThinkingThenSystemMessage(
        t(nextQuestion.key),
        nextQuestion.type === 'options',
        nextQuestion.id === 'mood' ? '7' : ''
      );
      setCurrentAnswer('');
    } else {
      setMode('followup');
      showThinkingThenSystemMessage(t('journal.chat.followUp'), true);
      setCurrentAnswer('');
    }
  };

  const handleQuestionSubmit = (answer: string) => {
    const question = questions[activeQuestionIndex];
    appendMessage({ role: 'user', text: answer });

    setEntryDraft((prev) => {
      if (question.id === 'feeling') {
        return { ...prev, content: answer.trim() };
      }
      if (question.id === 'focus') {
        const updatedContent = prev.content ? `${prev.content}\n\n${answer.trim()}` : answer.trim();
        return { ...prev, content: updatedContent };
      }
      if (question.id === 'body') {
        return { ...prev, bodyFocus: answer.trim() };
      }
      if (question.id === 'energy') {
        return { ...prev, energy: answer as Energy };
      }
      if (question.id === 'mood') {
        return { ...prev, mood: Number(answer) as Mood };
      }
      return prev;
    });

    nextQuestion();
  };

  const handleFollowUpSelection = (choice: 'more' | 'different' | 'no') => {
    appendMessage({
      role: 'user',
      text: t(
        `journal.chat.option.${
          choice === 'more'
            ? 'moreSameTopic'
            : choice === 'different'
            ? 'differentTopic'
            : 'noThanks'
        }`
      ),
    });

    if (choice === 'more') {
      setMode('append');
      showThinkingThenSystemMessage(t('journal.chat.tellMeMore'));
      setCurrentAnswer('');
      return;
    }

    saveEntry(entryDraft);

    if (choice === 'different') {
      setEntryDraft({ ...initialEntryState });
      setActiveQuestionIndex(0);
      setMode('questions');
      showThinkingThenSystemMessage(t(questions[0].key));
      setCurrentAnswer('');
      return;
    }

    setMode('finished');
    showThinkingThenSystemMessage(t('journal.chat.encouragement'));
  };

  const handleAppendSubmit = () => {
    if (!currentAnswer.trim()) return;
    appendMessage({ role: 'user', text: currentAnswer });
    const updatedContent = entryDraft.content ? `${entryDraft.content}\n\n${currentAnswer.trim()}` : currentAnswer.trim();
    const nextDraft = { ...entryDraft, content: updatedContent };
    setEntryDraft(nextDraft);
    saveEntry(nextDraft);
    setMode('finished');
    showThinkingThenSystemMessage(t('journal.chat.encouragement'));
    setCurrentAnswer('');
  };

  const currentQuestion = questions[activeQuestionIndex];

  const renderChoiceActions = () => {
    if (!showOptions) {
      return null;
    }

    if (mode === 'questions' && currentQuestion?.type === 'options') {
      if (currentQuestion.id === 'mood') {
        return (
          <div className="choice-group range-group fade-in-group">
            <label className="range-label">{t('journal.chat.question.mood')}</label>
            <div className="range-control">
              <input
                type="range"
                min="1"
                max="10"
                value={Number(currentAnswer) || 7}
                onChange={(event) => setCurrentAnswer(event.target.value)}
              />
              <span className="range-value">{Number(currentAnswer) || 7}</span>
            </div>
            <button
              type="button"
              className="choice-button cta-button primary"
              onClick={() => handleQuestionSubmit(currentAnswer || '7')}
            >
              {t('journal.finish')}
            </button>
          </div>
        );
      }

      return (
        <div className="choice-group fade-in-group">
          {currentQuestion.options?.map((option, index) => (
            <button
              key={option.value}
              type="button"
              className="choice-button cta-button secondary"
              style={{ animationDelay: `${index * 120}ms` }}
              onClick={() => handleQuestionSubmit(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      );
    }

    if (mode === 'followup') {
      return (
        <div className="choice-group fade-in-group">
          {followUpOptions.map((option, index) => (
            <button
              key={option.value}
              type="button"
              className="choice-button cta-button secondary"
              style={{ animationDelay: `${index * 120}ms` }}
              onClick={() => handleFollowUpSelection(option.value as 'more' | 'different' | 'no')}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="entry-editor chat-editor">
      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
            <p>{message.text}</p>
          </div>
        ))}
        {isThinking && (
          <div className="chat-message system thinking">
            <div className="typing-indicator" aria-label={t('journal.chat.thinking')}>
              <span />
              <span />
              <span />
            </div>
            <p>{t('journal.chat.thinking')}</p>
          </div>
        )}
        {renderChoiceActions()}
      </div>

      <div className="chat-input">
        {mode === 'questions' && currentQuestion && currentQuestion.type !== 'options' && (
          <>
            <TextArea
              value={currentAnswer}
              onChange={setCurrentAnswer}
              placeholder={t('journal.placeholder')}
            />
            <Button label={t('journal.finish')} onClick={() => handleQuestionSubmit(currentAnswer)} variant="primary" />
          </>
        )}

        {mode === 'append' && (
          <>
            <TextArea
              value={currentAnswer}
              onChange={setCurrentAnswer}
              placeholder={t('journal.placeholder')}
            />
            <Button label={t('journal.finish')} onClick={handleAppendSubmit} variant="primary" />
          </>
        )}

        {mode === 'finished' && (
          <div className="chat-complete">
            <p>{t('journal.chat.complete')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
