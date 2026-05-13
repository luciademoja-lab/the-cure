import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders the navbar and landing page', () => {
    render(<App />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText(/Non devi sapere cosa scrivere/i)).toBeInTheDocument();
  });

  it('renders navigation links in navbar', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Journal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'The Cure' })).toBeInTheDocument();
  });
});
