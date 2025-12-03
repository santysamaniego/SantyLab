import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass w-full max-w-lg p-6 rounded-xl border border-neon-indigo/30 shadow-[0_0_30px_rgba(99,102,241,0.2)] transform transition-all animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
          <h3 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-indigo to-neon-purple">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;