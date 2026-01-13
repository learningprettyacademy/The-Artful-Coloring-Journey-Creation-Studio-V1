import React, { useState, useEffect } from 'react';
import { Lock, Settings, Plus, Trash2, X, KeyRound, LogIn, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

const DEFAULT_PASSWORDS = ['create', 'design'];
const ADMIN_PASSWORD = 'JuneBug-n-DC'; // Master Key for Creator Access

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Admin State
  const [adminInput, setAdminInput] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [storedPasswords, setStoredPasswords] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    // Load passwords from local storage or set defaults
    const saved = localStorage.getItem('app_access_codes');
    if (saved) {
        try {
            setStoredPasswords(JSON.parse(saved));
        } catch (e) {
            setStoredPasswords(DEFAULT_PASSWORDS);
        }
    } else {
        localStorage.setItem('app_access_codes', JSON.stringify(DEFAULT_PASSWORDS));
        setStoredPasswords(DEFAULT_PASSWORDS);
    }
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
      e?.preventDefault();
      // Check against stored passwords
      if (storedPasswords.includes(inputCode.trim())) {
          onAuthenticated();
      } else {
          setError('Invalid Access Code');
          setInputCode('');
          setTimeout(() => setError(''), 2000);
      }
  };

  const handleAdminLogin = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (adminInput === ADMIN_PASSWORD) {
          setIsAdminLoggedIn(true);
          setAdminInput('');
      } else {
          setError('Invalid Master Key');
          setTimeout(() => setError(''), 2000);
      }
  };

  const addPassword = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!newPassword.trim()) return;
      
      const updated = [...storedPasswords, newPassword.trim()];
      setStoredPasswords(updated);
      localStorage.setItem('app_access_codes', JSON.stringify(updated));
      setNewPassword('');
  };

  const removePassword = (pwd: string) => {
      if (confirm(`Remove access code "${pwd}"?`)) {
        const updated = storedPasswords.filter(p => p !== pwd);
        setStoredPasswords(updated);
        localStorage.setItem('app_access_codes', JSON.stringify(updated));
      }
  };

  return (
     <div className="w-full h-full flex items-center justify-center p-4 z-50 relative">
        {/* Main Login Card */}
        <div className="bg-[#2d1b4e]/90 backdrop-blur-xl border-2 border-fuchsia-500 shadow-[0_0_50px_rgba(217,70,239,0.5)] rounded-3xl p-8 md:p-12 w-full max-w-md text-center animate-fade-in relative overflow-hidden">
            
            {/* Decorative Glow */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500"></div>

            <div className="mx-auto w-24 h-24 bg-purple-900/50 rounded-full flex items-center justify-center mb-6 border-2 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.4)]">
                 <Lock size={40} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            </div>

            <h1 className="text-4xl font-bold font-serif text-white mb-2 drop-shadow-md">Restricted Access</h1>
            <p className="text-purple-200 mb-8 font-medium">Please enter a valid access code to enter the studio.</p>

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-fuchsia-400 group-focus-within:text-white transition-colors" size={24} />
                    <input 
                        type="password" 
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        className="w-full pl-14 pr-4 py-4 bg-[#1a0b2e] border-2 border-purple-600 rounded-2xl text-white focus:outline-none focus:border-fuchsia-500 focus:shadow-[0_0_15px_rgba(217,70,239,0.3)] placeholder-purple-700/50 text-xl tracking-widest transition-all"
                        placeholder="ACCESS CODE"
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="bg-red-900/40 border border-red-500 text-red-200 text-sm font-bold p-3 rounded-xl animate-pulse">
                        {error}
                    </div>
                )}

                <button 
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-fuchsia-700 to-purple-700 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:shadow-[0_0_40px_rgba(217,70,239,0.6)] hover:from-fuchsia-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 text-lg transform hover:-translate-y-1 border border-fuchsia-500/30"
                >
                    <LogIn size={24} /> Enter Studio
                </button>
            </form>

            <div className="mt-10 pt-6 border-t border-purple-800/50">
                <button 
                    onClick={() => setShowAdmin(true)}
                    className="text-xs text-purple-500 hover:text-fuchsia-400 flex items-center justify-center gap-1.5 mx-auto transition-colors group"
                >
                    <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" /> Creator Database
                </button>
            </div>
        </div>

        {/* Admin Modal */}
        {showAdmin && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
                <div className="bg-[#1a0b2e] border-2 border-fuchsia-500 rounded-3xl w-full max-w-lg p-8 shadow-[0_0_60px_rgba(168,85,247,0.3)] animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-8 border-b border-purple-800 pb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <ShieldCheck className="text-fuchsia-500" size={28}/> 
                            Creator Password Database
                        </h2>
                        <button 
                            onClick={() => { setShowAdmin(false); setIsAdminLoggedIn(false); setAdminInput(''); setError(''); }} 
                            className="bg-purple-900/50 p-2 rounded-full text-purple-400 hover:text-white hover:bg-red-900 transition-colors"
                        >
                            <X size={20}/>
                        </button>
                    </div>

                    {!isAdminLoggedIn ? (
                        <form onSubmit={handleAdminLogin} className="space-y-6">
                             <div className="text-center mb-6">
                                <p className="text-purple-200 font-medium">Restricted Area</p>
                                <p className="text-sm text-purple-400">Enter Master Key to view or edit user access codes.</p>
                             </div>
                             
                             <input 
                                type="password" 
                                value={adminInput}
                                onChange={(e) => setAdminInput(e.target.value)}
                                className="w-full p-4 bg-[#0f0720] border border-purple-600 rounded-xl text-white focus:outline-none focus:border-fuchsia-500 text-center text-lg tracking-widest"
                                placeholder="MASTER KEY"
                                autoFocus
                            />
                            {error && <div className="text-red-400 text-center text-sm font-bold">{error}</div>}
                            <button type="submit" className="w-full py-3 bg-purple-700 hover:bg-fuchsia-600 text-white font-bold rounded-xl transition-colors shadow-lg">
                                Unlock Database
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                             {/* Add New */}
                             <form onSubmit={addPassword} className="flex gap-3">
                                 <input 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="flex-1 p-3 bg-[#0f0720] border border-purple-600 rounded-xl text-white focus:outline-none focus:border-fuchsia-500"
                                    placeholder="Add New Access Code..."
                                    autoFocus
                                 />
                                 <button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 rounded-xl shadow-lg transition-colors flex items-center justify-center">
                                     <Plus size={24}/>
                                 </button>
                             </form>

                             {/* List */}
                             <div className="bg-[#0f0720] rounded-xl border border-purple-800 p-2 max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                                 {storedPasswords.length === 0 && <p className="text-purple-500 text-center p-6 italic">No access codes active. The app is locked.</p>}
                                 {storedPasswords.map((pwd, idx) => (
                                     <div key={idx} className="flex justify-between items-center p-4 hover:bg-purple-900/30 rounded-xl group border-b border-purple-900/30 last:border-0 transition-colors">
                                         <div className="flex items-center gap-3">
                                             <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_lime]"></div>
                                             <span className="text-white font-mono text-lg">{pwd}</span>
                                         </div>
                                         <button 
                                            onClick={() => removePassword(pwd)} 
                                            className="p-2 text-purple-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg opacity-50 group-hover:opacity-100 transition-all"
                                            title="Delete Code"
                                         >
                                             <Trash2 size={18} />
                                         </button>
                                     </div>
                                 ))}
                             </div>
                             
                             <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-800/50">
                                 <p className="text-xs text-purple-300 text-center flex items-center justify-center gap-2">
                                     <ShieldCheck size={12} className="text-green-400"/>
                                     Changes are auto-saved to your browser's Local Storage.
                                 </p>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        )}
     </div>
  );
};