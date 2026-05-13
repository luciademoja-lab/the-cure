import React, { useEffect } from 'react';
import { JournalEntry } from '../../types/journal';
import '../../styles/EntryModal.css';

interface EntryModalProps {
  entry: JournalEntry;
  onClose: () => void;
}

export function EntryModal({ entry, onClose }: EntryModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const getMoodEmoji = (mood: number) => {
    if (mood <= 3) return '🌧️';
    if (mood <= 5) return '🌙';
    if (mood <= 7) return '☀️';
    return '✨';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="entry-modal-overlay" onClick={onClose}>
      <div className="entry-modal" onClick={e => e.stopPropagation()}>
        <div className="entry-modal-header">
          <div className="entry-modal-meta">
            <span className="entry-modal-mood" title={`Mood: ${entry.mood}/10`}>
              {getMoodEmoji(entry.mood)}
            </span>
            <span className="entry-modal-date">{formatDate(entry.timestamp)}</span>
          </div>
          <button className="entry-modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>
        
        <div className="entry-modal-content">
          {entry.content}
        </div>
        
        <div className="entry-modal-details">
          {entry.energy && <p><strong>Energy:</strong> {entry.energy}</p>}
          {entry.bodyFocus && <p><strong>Body Focus:</strong> {entry.bodyFocus}</p>}
          {entry.promptUsed && <p><strong>Prompt Used:</strong> {entry.promptUsed}</p>}
          
          {(entry.tags?.length > 0 || entry.aiTags?.length > 0) && (
            <div className="entry-modal-tags">
              {entry.tags?.map(tag => (
                <span key={`tag-${tag}`} className="entry-modal-tag">{tag}</span>
              ))}
              {entry.aiTags?.map(tag => (
                <span key={`ai-${tag}`} className="entry-modal-tag">✨ {tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
