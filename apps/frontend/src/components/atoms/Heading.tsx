type HeadingProps = {
  level?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
};

export function Heading({ level = 1, children, className = '' }: HeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag className={className}>{children}</Tag>;
}
