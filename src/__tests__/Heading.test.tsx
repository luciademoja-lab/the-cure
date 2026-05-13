import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Heading } from '../components/atoms/Heading';

describe('Heading', () => {
  it('renders h1 by default', () => {
    render(<Heading>Page Title</Heading>);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Page Title');
  });

  it('renders h2 when level is 2', () => {
    render(<Heading level={2}>Section Title</Heading>);
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Section Title');
  });

  it('renders h3 when level is 3', () => {
    render(<Heading level={3}>Subsection Title</Heading>);
    
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Subsection Title');
  });

  it('renders h4 when level is 4', () => {
    render(<Heading level={4}>Small Title</Heading>);
    
    const heading = screen.getByRole('heading', { level: 4 });
    expect(heading).toHaveTextContent('Small Title');
  });

  it('renders h5 when level is 5', () => {
    render(<Heading level={5}>Tiny Title</Heading>);
    
    const heading = screen.getByRole('heading', { level: 5 });
    expect(heading).toHaveTextContent('Tiny Title');
  });

  it('renders h6 when level is 6', () => {
    render(<Heading level={6}>Smallest Title</Heading>);
    
    const heading = screen.getByRole('heading', { level: 6 });
    expect(heading).toHaveTextContent('Smallest Title');
  });

  it('applies custom className', () => {
    render(<Heading className="custom-heading">Styled Title</Heading>);
    
    const heading = screen.getByText('Styled Title');
    expect(heading).toHaveClass('custom-heading');
  });

  it('renders with multiple classes', () => {
    render(<Heading className="primary large">Multi-class Title</Heading>);
    
    const heading = screen.getByText('Multi-class Title');
    expect(heading).toHaveClass('primary');
    expect(heading).toHaveClass('large');
  });

  it('renders children content correctly', () => {
    render(
      <Heading>
        Heading with <em>emphasis</em>
      </Heading>
    );
    
    expect(screen.getByText(/Heading with/)).toBeInTheDocument();
    expect(screen.getByText(/emphasis/)).toBeInTheDocument();
  });
});
