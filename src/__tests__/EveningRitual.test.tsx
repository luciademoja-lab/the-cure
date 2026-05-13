import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EveningRitual } from '../components/molecules/EveningRitual';

describe('EveningRitual', () => {
  const mockOnComplete = vi.fn();

  it('renders evening ritual form', () => {
    render(<EveningRitual onComplete={mockOnComplete} />);
    expect(screen.getByText(/evening/i)).toBeInTheDocument();
  });

  it('renders text input area', () => {
    render(<EveningRitual onComplete={mockOnComplete} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<EveningRitual onComplete={mockOnComplete} />);
    const button = screen.getByRole('button', { name: /rest.*release/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onComplete when form is submitted', async () => {
    const user = userEvent.setup();
    render(<EveningRitual onComplete={mockOnComplete} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'My reflection');
    
    const button = screen.getByRole('button', { name: /rest.*release/i });
    fireEvent.click(button);
    
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('displays soothing message', () => {
    render(<EveningRitual onComplete={mockOnComplete} />);
    expect(screen.getByText(/you have done enough/i)).toBeInTheDocument();
  });

  it('has necessary CSS classes', () => {
    const { container } = render(<EveningRitual onComplete={mockOnComplete} />);
    expect(container.querySelector('.ritual-card')).toBeInTheDocument();
    expect(container.querySelector('.soothing-words')).toBeInTheDocument();
  });

  it('displays subtitle text', () => {
    render(<EveningRitual onComplete={mockOnComplete} />);
    expect(screen.getByText(/close your day/i)).toBeInTheDocument();
  });
});
