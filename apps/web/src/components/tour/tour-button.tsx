'use client';

import { Compass } from 'lucide-react';

export function TourButton() {
  const handleClick = () => {
    localStorage.removeItem('hrplatform-tour-completed');
    document.dispatchEvent(new CustomEvent('start-product-tour'));
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
      title="Take a guided tour"
    >
      <Compass className="h-4 w-4" />
      <span>Take a Tour</span>
    </button>
  );
}
