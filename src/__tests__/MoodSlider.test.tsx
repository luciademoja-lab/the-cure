import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MoodSlider } from '../components/atoms/MoodSlider';

describe('MoodSlider', () => {
  it('renders the mood slider', () => {
    const onChange = vi.fn();
    render(<MoodSlider value={7} onChange={onChange} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('displays the current mood level', () => {
    const onChange = vi.fn();
    render(<MoodSlider value={5} onChange={onChange} />);
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('shows mood label based on value', () => {
    const onChange = vi.fn();
    const { rerender } = render(<MoodSlider value={2} onChange={onChange} />);
    expect(screen.getByText((content, elem) => elem?.className === 'mood-label' && content === 'Heavy')).toBeInTheDocument();

    rerender(<MoodSlider value={8} onChange={onChange} />);
    expect(screen.getByText((content, elem) => elem?.className === 'mood-label' && content === 'Light')).toBeInTheDocument();
  });
});
