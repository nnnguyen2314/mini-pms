import React from 'react';
import { sanitizeHtml } from '../utils/sanitizeHtml';

type Props = {
  html: string;
  className?: string;
  role?: string;
};

export default function SafeHtml({ html, className, role }: Props) {
  const clean = React.useMemo(() => sanitizeHtml(html || ''), [html]);
  // Using dangerouslySetInnerHTML after sanitization
  return <div className={className} role={role} dangerouslySetInnerHTML={{ __html: clean }} />;
}
