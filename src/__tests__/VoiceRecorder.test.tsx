import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoiceRecorder } from '../components/atoms/VoiceRecorder';
import { I18nProvider } from '../i18n/I18nProvider';
import { AuthProvider } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock I18nProvider
vi.mock('../i18n/I18nProvider', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'voice.startVoiceEntry': '🎤 Start Voice Entry',
        'voice.stopRecording': '🛑 Stop Recording',
        'voice.clickToRecord': 'Click to record your voice.',
        'voice.recording': '● Recording',
        'voice.speakFreely': 'Speak freely. I am listening.',
        'voice.microphoneRequired': 'Microphone access is required for voice journaling.',
      };
      return translations[key] || key;
    },
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock AuthProvider
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({}),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock BrowserRouter
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          {component}
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('VoiceRecorder', () => {
  it('renders the voice recorder component', () => {
    renderWithProviders(<VoiceRecorder />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('displays recording button with text', () => {
    renderWithProviders(<VoiceRecorder />);
    const button = screen.getByRole('button');
    expect(button.textContent).toMatch(/Start Voice Entry|Stop Recording/);
  });



  it('displays recording hint text', () => {
    renderWithProviders(<VoiceRecorder />);
    expect(screen.getByText(/click to record/i)).toBeInTheDocument();
  });

  it('has proper CSS class for styling', () => {
    const { container } = renderWithProviders(<VoiceRecorder />);
    expect(container.querySelector('.voice-recorder')).toBeInTheDocument();
  });
});
