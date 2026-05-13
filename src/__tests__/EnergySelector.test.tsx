import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { EnergySelector } from '../components/atoms/EnergySelector';
import { Energy } from '../types/journal';

describe('EnergySelector', () => {
  it('renders all energy level buttons', () => {
    const levels: Energy[] = ['low', 'moderate', 'high'];
    render(<EnergySelector value="moderate" onChange={vi.fn()} />);
    
    expect(screen.getByText(/Low/i)).toBeInTheDocument();
    expect(screen.getByText(/Moderate/i)).toBeInTheDocument();
    expect(screen.getByText(/High/i)).toBeInTheDocument();
  });

  it('shows selected energy level as active', () => {
    render(<EnergySelector value="high" onChange={vi.fn()} />);
    
    const highButton = screen.getByRole('button', { name: /High/i });
    expect(highButton).toHaveClass('active');
  });

  it('calls onChange when energy level is selected', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    render(<EnergySelector value="moderate" onChange={handleChange} />);
    
    const lowButton = screen.getByRole('button', { name: /Low/i });
    await user.click(lowButton);
    
    expect(handleChange).toHaveBeenCalledWith('low');
  });

  it('allows switching between energy levels', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    const { rerender } = render(<EnergySelector value="low" onChange={handleChange} />);
    
    let highButton = screen.getByRole('button', { name: /High/i });
    await user.click(highButton);
    
    expect(handleChange).toHaveBeenCalledWith('high');
    
    rerender(<EnergySelector value="high" onChange={handleChange} />);
    
    highButton = screen.getByRole('button', { name: /High/i });
    expect(highButton).toHaveClass('active');
  });

  it('marks only one energy level as active', () => {
    render(<EnergySelector value="moderate" onChange={vi.fn()} />);
    
    const buttons = screen.getAllByRole('button');
    const activeButtons = buttons.filter(btn => btn.className.includes('active'));
    
    expect(activeButtons.length).toBe(1);
    expect(activeButtons[0]).toHaveTextContent(/Moderate/i);
  });

  it('handles all valid energy values', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const energyLevels: Energy[] = ['low', 'moderate', 'high'];
    
    for (const level of energyLevels) {
      handleChange.mockClear();
      
      const { rerender } = render(
        <EnergySelector value="moderate" onChange={handleChange} />
      );
      
      const button = screen.getByRole('button', { name: new RegExp(level, 'i') });
      await user.click(button);
      
      expect(handleChange).toHaveBeenCalledWith(level);
      
      rerender(<EnergySelector value={level} onChange={handleChange} />);
    }
  });

  it('applies custom className', () => {
    const { container } = render(
      <EnergySelector value="moderate" onChange={vi.fn()} className="custom-selector" />
    );
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-selector');
  });
});
