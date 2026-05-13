import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MorningRitual } from '../components/molecules/MorningRitual';

describe('MorningRitual', () => {
  const mockOnComplete = vi.fn();

  it('renders morning ritual form', () => {
    render(<MorningRitual onComplete={mockOnComplete} />);
    expect(screen.getByText(/morning/i)).toBeInTheDocument();
  });

  it('renders text input area', () => {
    render(<MorningRitual onComplete={mockOnComplete} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<MorningRitual onComplete={mockOnComplete} />);
    const button = screen.getByRole('button', { name: /activate/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onComplete when form is submitted', async () => {
    const user = userEvent.setup();
    render(<MorningRitual onComplete={mockOnComplete} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'My intention');
    
    const button = screen.getByRole('button', { name: /activate/i });
    fireEvent.click(button);
    
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('has necessary CSS classes', () => {
    const { container } = render(<MorningRitual onComplete={mockOnComplete} />);
    expect(container.querySelector('.ritual-card')).toBeInTheDocument();
    expect(container.querySelector('.ritual-form')).toBeInTheDocument();
  });

  it('displays hint text', () => {
    render(<MorningRitual onComplete={mockOnComplete} />);
    expect(screen.getByText(/share your voice/i)).toBeInTheDocument();
  });
});
