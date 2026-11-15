import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CheckInForm } from '../components/molecules/CheckInForm';
import { CheckInData, Mood } from '../types/journal';

describe('CheckInForm', () => {
  const mockData: CheckInData = {
    mood: 7 as Mood,
    energy: 'moderate',
    bodySensation: '',
  };

  it('renders all check-in elements', () => {
    const onChange = vi.fn();
    render(<CheckInForm checkIn={mockData} onChange={onChange} onComplete={vi.fn()} />);
    expect(screen.getByText('Come ti senti adesso?')).toBeInTheDocument();
    expect(screen.getByText('Dove lo senti di più?')).toBeInTheDocument();
    expect(screen.getByText('Continua')).toBeInTheDocument();
  });

  it('displays energy buttons', () => {
    const onChange = vi.fn();
    render(<CheckInForm checkIn={mockData} onChange={onChange} onComplete={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Low' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Moderate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'High' })).toBeInTheDocument();
  });

  it('calls onChange when energy is selected', () => {
    const onChange = vi.fn();
    render(<CheckInForm checkIn={mockData} onChange={onChange} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'High' }));
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0].energy).toBe('high');
  });
});
