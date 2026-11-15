import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ElayraMessageCard } from '../components/molecules/ElayraMessageCard';

describe('ElayraMessageCard', () => {
  it('renders an Elayra wisdom message', () => {
    const message = {
      text: 'You are loved exactly as you are.',
      type: 'wisdom' as const,
      timestamp: new Date(),
    };
    render(<ElayraMessageCard message={message} />);
    expect(screen.getByText('You are loved exactly as you are.')).toBeInTheDocument();
  });

  it('renders an Elayra encouragement message', () => {
    const message = {
      text: 'Keep going, you are stronger than you know.',
      type: 'encouragement' as const,
      timestamp: new Date(),
    };
    render(<ElayraMessageCard message={message} />);
    expect(screen.getByText('Keep going, you are stronger than you know.')).toBeInTheDocument();
  });

  it('renders an Elayra reflection message', () => {
    const message = {
      text: 'What did today teach you?',
      type: 'reflection' as const,
      timestamp: new Date(),
    };
    render(<ElayraMessageCard message={message} />);
    expect(screen.getByText('What did today teach you?')).toBeInTheDocument();
  });

  it('displays the message card container', () => {
    const message = {
      text: 'Test message',
      type: 'wisdom' as const,
      timestamp: new Date(),
    };
    const { container } = render(<ElayraMessageCard message={message} />);
    expect(container.querySelector('.elayra-message-card')).toBeInTheDocument();
  });


});
