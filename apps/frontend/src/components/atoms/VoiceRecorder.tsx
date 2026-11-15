import React, { useState, useRef } from 'react';
import { useTranslation } from '../../i18n/I18nProvider';

type VoiceRecorderProps = {
  onTranscription?: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
};

export function VoiceRecorder({ onTranscription, onRecordingStateChange }: VoiceRecorderProps) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // MVP: Would send to Whisper API here
        const placeholder = `[Voice recording: ${duration}s - Ready for Whisper transcription]`;
        onTranscription?.(placeholder);
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStateChange?.(true);

      // Timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert(t('voice.microphoneRequired'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      onRecordingStateChange?.(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setDuration(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-recorder">
      <div className="recorder-display">
        {isRecording && <span className="recording-indicator">{t('voice.recording')}</span>}
        <span className="recorder-timer">{formatTime(duration)}</span>
      </div>
      <button
        type="button"
        className={`voice-btn ${isRecording ? 'recording' : ''}`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? t('voice.stopRecording') : t('voice.startVoiceEntry')}
      </button>
      <p className="recorder-hint">
        {isRecording ? t('voice.speakFreely') : t('voice.clickToRecord')}
      </p>
    </div>
  );
}
