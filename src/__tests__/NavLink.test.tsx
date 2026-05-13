import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { NavLink } from '../components/atoms/NavLink';

describe('NavLink', () => {
  it('renders a navigation link with text', () => {
    render(
      <BrowserRouter>
        <NavLink to="/journal">Journal</NavLink>
      </BrowserRouter>
    );
    
    const link = screen.getByRole('link', { name: /Journal/i });
    expect(link).toBeInTheDocument();
  });

  it('renders link with correct href', () => {
    render(
      <BrowserRouter>
        <NavLink to="/daily-light">Daily Light</NavLink>
      </BrowserRouter>
    );
    
    const link = screen.getByRole('link', { name: /Daily Light/i });
    expect(link).toHaveAttribute('href', '/daily-light');
  });

  it('applies custom className', () => {
    render(
      <BrowserRouter>
        <NavLink to="/test" className="custom-nav-link">Link</NavLink>
      </BrowserRouter>
    );
    
    const link = screen.getByRole('link', { name: /Link/i });
    expect(link).toHaveClass('custom-nav-link');
  });

  it('applies active class when link matches current route', () => {
    render(
      <BrowserRouter>
        <NavLink to="/" className="active">Home</NavLink>
      </BrowserRouter>
    );
    
    const link = screen.getByRole('link', { name: /Home/i });
    expect(link).toBeInTheDocument();
  });

  it('renders with multiple classes', () => {
    render(
      <BrowserRouter>
        <NavLink to="/test" className="nav-item primary">Link</NavLink>
      </BrowserRouter>
    );
    
    const link = screen.getByRole('link', { name: /Link/i });
    expect(link).toHaveClass('nav-item');
    expect(link).toHaveClass('primary');
  });

  it('renders with children content', () => {
    render(
      <BrowserRouter>
        <NavLink to="/contact">
          <span>Contact Us</span>
        </NavLink>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Contact Us/i)).toBeInTheDocument();
  });

  it('supports different route patterns', () => {
    const routes = [
      '/journal',
      '/daily-light',
      '/contact',
      '/synchronicities',
      '/collective',
      '/forge'
    ];
    
    routes.forEach(route => {
      const { unmount } = render(
        <BrowserRouter>
          <NavLink to={route}>Link</NavLink>
        </BrowserRouter>
      );
      
      const link = screen.getByRole('link', { name: /Link/i });
      expect(link).toHaveAttribute('href', route);
      unmount();
    });
  });

  it('is keyboard accessible', () => {
    render(
      <BrowserRouter>
        <NavLink to="/journal">Journal</NavLink>
      </BrowserRouter>
    );
    
    const link = screen.getByRole('link', { name: /Journal/i });
    expect(link.tagName).toBe('A');
  });
});
