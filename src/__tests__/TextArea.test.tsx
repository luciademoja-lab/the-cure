import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { TextArea } from '../components/atoms/TextArea';

describe('TextArea', () => {
  it('renders textarea with placeholder', () => {
    render(<TextArea placeholder="Enter text here" />);
    
    const textarea = screen.getByPlaceholderText('Enter text here');
    expect(textarea).toBeInTheDocument();
  });

  it('updates value when text is entered', async () => {
    let value = '';
    const handleChange = (newValue: string) => { value = newValue; };
    
    const { rerender } = render(<TextArea value={value} onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    
    // Re-render with updated value to simulate controlled component
    rerender(<TextArea value={value} onChange={handleChange} />);
    
    expect(textarea).toHaveValue('Hello');
  });

  it('calls onChange handler when text is changed', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    render(<TextArea value="" onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays initial value', () => {
    const initialValue = 'Initial text here';
    render(<TextArea value={initialValue} onChange={vi.fn()} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(initialValue);
  });

  it('disables textarea when disabled prop is true', () => {
    render(<TextArea disabled />);
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
  });

  it('applies custom className', () => {
    render(<TextArea className="custom-textarea" />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-textarea');
  });

  it('handles multiline text input', async () => {
    let value = '';
    const handleChange = (newValue: string) => { value = newValue; };
    
    const { rerender } = render(<TextArea value={value} onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Line 1\nLine 2' } });
    
    // Re-render with updated value
    rerender(<TextArea value={value} onChange={handleChange} />);
    
    expect(textarea).toHaveValue('Line 1\nLine 2');
  });

  it('respects maxLength prop', () => {
    const { container } = render(<TextArea value="" onChange={vi.fn()} maxLength={100} />);
    
    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('maxLength', '100');
  });

  it('respects rows prop', () => {
    const { container } = render(<TextArea rows={10} />);
    
    const textarea = container.querySelector('textarea');
    expect(textarea).toHaveAttribute('rows', '10');
  });

  it('can be cleared', async () => {
    const user = userEvent.setup();
    let value = 'Some text';
    const handleChange = (newValue: string) => { value = newValue; };
    
    const { rerender } = render(<TextArea value={value} onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    
    // Re-render with updated value
    rerender(<TextArea value={value} onChange={handleChange} />);
    
    expect(textarea).toHaveValue('');
  });

  it('supports autoFocus', () => {
    render(<TextArea autoFocus />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveFocus();
  });
});
