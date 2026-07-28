import { useState } from 'react';

/**
 * Manages sidebar collapsed state with localStorage persistence.
 */
export function useSidebar() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('rs_sidebar_collapsed') === 'true'
  );

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('rs_sidebar_collapsed', String(next));
      return next;
    });
  };

  return { collapsed, toggle };
}
