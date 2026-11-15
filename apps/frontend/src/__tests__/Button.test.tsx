import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Button } from '../components/atoms/Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('applies default button type', () => {
    render(<Button>Submit</Button>);
    
    const button = screen.getByText('Submit');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('applies custom button type', () => {
    render(<Button type="submit">Submit</Button>);
    
    const button = screen.getByText('Submit');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Button</Button>);
    
    const button = screen.getByText('Button');
    expect(button).toHaveClass('custom-class');
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByText('Disabled') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('enables button when disabled prop is false', () => {
    render(<Button disabled={false}>Enabled</Button>);
    
    const button = screen.getByText('Enabled') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    );
    
    const button = screen.getByText('Disabled Button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with multiple classes', () => {
    render(<Button className="primary large">Multi-class</Button>);
    
    const button = screen.getByText('Multi-class');
    expect(button).toHaveClass('primary');
    expect(button).toHaveClass('large');
  });
});
