import React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, FolderOpen, Lightbulb, Moon, Sun, Image as ImageIcon, Book } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  hasActiveProject: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setCurrentView, 
  darkMode, 
  setDarkMode,
  hasActiveProject
}) => {

  const NavItem = ({ view, icon, label, disabled = false }: { view: AppView, icon: React.ReactNode, label: string, disabled?: boolean }) => (
    <button
      onClick={() => !disabled && setCurrentView(view)}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 border-2
        ${currentView === view 
          ? 'bg-purple-900 border-fuchsia-500 shadow-[0_0_10px_#d946ef] text-white' 
          : 'bg-transparent border-transparent text-purple-800 dark:text-purple-200 hover:bg-purple-900/20 hover:border-purple-500/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
      `}
    >
      {icon}
      <span className="font-medium tracking-wide">{label}</span>
    </button>
  );

  const GlitterLips = () => (
    <svg viewBox="0 0 100 60" className="w-12 h-12 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]">
      <defs>
        <linearGradient id="lipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
        <filter id="glitter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 5 -2" in="noise" result="stars" />
          <feComposite operator="in" in="stars" in2="SourceGraphic" result="composite" />
          <feBlend mode="screen" in="composite" in2="SourceGraphic" />
        </filter>
      </defs>
      <path d="M10,30 Q30,10 50,25 Q70,10 90,30 Q70,55 50,45 Q30,55 10,30 M15,30 Q30,35 50,30 Q70,35 85,30" 
        fill="url(#lipGradient)" stroke="#f0abfc" strokeWidth="2" filter="url(#glitter)" />
      <path d="M10,30 Q30,10 50,25 Q70,10 90,30" fill="none" stroke="#fce7f3" strokeWidth="1" opacity="0.5" />
    </svg>
  );

  return (
    <div className="w-80 h-screen flex flex-col bg-[#1a0b2e] border-r-2 border-fuchsia-900/50 shadow-[5px_0_30px_rgba(0,0,0,0.5)] relative z-50">
      
      {/* Branding Header */}
      <div className="p-6 border-b border-fuchsia-900/30">
         <div className="flex items-center gap-3 mb-2">
            <GlitterLips />
            <div className="leading-tight">
                <h1 className="font-serif font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-fuchsia-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  Brown Suga Creates...
                </h1>
            </div>
         </div>
         <p className="text-xs text-purple-300 font-medium tracking-wide mt-2 border-t border-purple-800/50 pt-2">
            The Artful Coloring Journey Creation Studio
         </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-bold text-fuchsia-400 uppercase tracking-[0.2em] mb-3 mt-2 shadow-black drop-shadow-md">Workspace</p>
          <NavItem 
            view="dashboard" 
            icon={<LayoutDashboard size={20} className="text-fuchsia-400" />} 
            label="Studio Dashboard" 
            disabled={!hasActiveProject}
          />
           <NavItem 
            view="mockups" 
            icon={<ImageIcon size={20} className="text-fuchsia-400" />} 
            label="Mockup Studio" 
            disabled={!hasActiveProject}
          />
          <NavItem 
            view="prompts" 
            icon={<Lightbulb size={20} className="text-fuchsia-400" />} 
            label="Prompt Generator" 
            disabled={!hasActiveProject}
          />
          <NavItem 
            view="library" 
            icon={<Book size={20} className="text-fuchsia-400" />} 
            label="Prompt Library" 
            disabled={!hasActiveProject}
          />
        </div>

        <div className="space-y-1 mt-8">
           <p className="px-4 text-[10px] font-bold text-fuchsia-400 uppercase tracking-[0.2em] mb-3 shadow-black drop-shadow-md">Collections</p>
           <NavItem 
             view="projects" 
             icon={<FolderOpen size={20} className="text-fuchsia-400" />} 
             label="Project Gallery" 
           />
        </div>
      </div>

      {/* Footer / Controls */}
      <div className="p-4 border-t border-fuchsia-900/30 bg-[#130722]">
         <button 
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-900/40 text-purple-300 hover:bg-purple-800 hover:text-white transition-colors border border-purple-800"
         >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-sm font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
         </button>
         <div className="mt-4 text-center">
            <p className="text-[10px] text-purple-500/60">v1.5.0 • Brown Suga Creates</p>
         </div>
      </div>
    </div>
  );
};