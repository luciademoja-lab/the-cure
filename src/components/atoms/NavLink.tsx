import React from 'react';

type NavLinkProps = {
  to: string;
  children: React.ReactNode;
  isActive?: boolean;
};

export function NavLink({ to, children, isActive }: NavLinkProps) {
  return (
    <a href={to} className={`nav-link ${isActive ? 'active' : ''}`}>
      {children}
    </a>
  );
}
