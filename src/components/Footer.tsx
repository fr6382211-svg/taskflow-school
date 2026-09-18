import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-4 left-0 right-0 text-center text-xs sm:text-sm z-50 pointer-events-auto">
      <p>Fathur TimeBox • Muhammad Fathur Rahman • SMAN 2 Tuban</p>
      <p>Powered by <a href="https://github.com/fr6382211-svg/taskflow-school" target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">Fathur School Hub</a> | Licensed under CPAL-1.0</p>
    </footer>
  );
};
