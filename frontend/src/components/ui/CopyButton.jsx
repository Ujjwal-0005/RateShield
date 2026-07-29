import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from './Button';

export function CopyButton({ text, label = 'Copy', copiedLabel = 'Copied!', size = 'sm', variant = 'secondary' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      icon={copied ? Check : Copy}
      onClick={handleCopy}
      style={{ minWidth: '76px' }}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
