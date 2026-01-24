import React, { useState } from 'react';
import { ProjectPlan } from '../types';
import { Sparkles, Plus, Loader2, Book, Image as ImageIcon, Sticker, Download, Trash2, X, Palette, PenTool } from 'lucide-react';
import { generateCreativePrompts } from '../services/geminiService';

interface PromptGeneratorProps {
  plan: ProjectPlan;
  onAddPage: (name: string, prompt: string, renderMode: 'color' | 'line_art') => void;
  generatedIdeas: {title: string, prompt: string}[];
  setGeneratedIdeas: React.Dispatch<React.SetStateAction<{title: string, prompt: string}[]>>;
}

type GeneratorMode = 'cover' | 'page' | 'sticker';
type StickerStyle = 'color' | 'line_art';

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ 
    plan, 
    onAddPage,
    generatedIdeas,
    setGeneratedIdeas
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Generator Settings
  const [mode, setMode] = useState<GeneratorMode>('page');
  const [stickerStyle, setStickerStyle] = useState<StickerStyle>('color');
  const [customInstructions, setCustomInstructions] = useState("");

  const handleGenerateIdeas = async () => {
    setIsGenerating(true);
    // Clear previous for fresh start
    setGeneratedIdeas([]);
    
    // Determine the style mode passed to AI service
    // For Covers: always 'color' (enforced in service, but passed here for consistency)
    // For Pages: always 'line_art'
    // For Stickers: depends on user selection
    let styleModeForAI: 'color' | 'line_art' = 'line_art';
    if (mode === 'cover') styleModeForAI = 'color';
    else if (mode === 'sticker') styleModeForAI = stickerStyle;

    try {
        const ideas = await generateCreativePrompts(plan, mode, styleModeForAI, customInstructions, 5);
        setGeneratedIdeas(ideas);
    } catch (e) {
        alert("Failed to generate ideas. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleEditIdea = (index: number, field: 'title' | 'prompt', value: string) => {
    const newIdeas = [...generatedIdeas];
    newIdeas[index] = { ...newIdeas[index], [field]: value };
    setGeneratedIdeas(newIdeas);
  };

  const handleDeleteIdea = (index: number) => {
      const newIdeas = generatedIdeas.filter((_, i) => i !== index);
      setGeneratedIdeas(newIdeas);
  };

  const handleAddToProject = (title: string, prompt: string) => {
      // Determine Render Mode to save with the page
      let renderMode: 'color' | 'line_art' = 'line_art'; 
      
      if (mode === 'cover') {
          renderMode = 'color';
      } else if (mode === 'sticker') {
          renderMode = stickerStyle;
      } else {
          renderMode = 'line_art'; // Pages default to line art
      }

      onAddPage(title, prompt, renderMode);
  };

  const handleExportPrompts = () => {
      if (generatedIdeas.length === 0) return;
      let content = `GENERATED PROMPT IDEAS\nProject: ${plan.projectTitle}\nMode: ${mode.toUpperCase()}\n\n`;
      generatedIdeas.forEach((idea, i) => {
          content += `${i+1}. ${idea.title}\n${idea.prompt}\n\n`;
      });
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Generated_Prompts_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto animate-fade-in text-white">
        <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-6 mb-8">
            <h2 className="text-4xl font-bold font-serif mb-2 text-white">Prompt Generator</h2>
            <p className="text-purple-200">Create specialized prompts for Covers, Coloring Pages, and Sticker Sheets.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Generator Controls */}
            <div className="lg:col-span-5 space-y-6">
                 <div className="bg-[#1a0b2e] border border-purple-800 rounded-2xl p-6 shadow-xl">
                     <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white border-b border-purple-800 pb-4">
                         <Sparkles className="text-fuchsia-500" /> Generator Settings
                     </h3>

                     {/* 1. Type Selection */}
                     <div className="mb-6">
                         <label className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 block">Asset Type</label>
                         <div className="grid grid-cols-3 gap-2">
                             <button 
                                onClick={() => setMode('page')}
                                className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all border-2 ${mode === 'page' ? 'bg-purple-900 border-fuchsia-500 text-white shadow-lg' : 'bg-[#130722] border-transparent text-purple-400 hover:bg-purple-900/50'}`}
                             >
                                 <Book size={20} />
                                 <span className="text-xs font-bold">Page</span>
                             </button>
                             <button 
                                onClick={() => setMode('cover')}
                                className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all border-2 ${mode === 'cover' ? 'bg-purple-900 border-fuchsia-500 text-white shadow-lg' : 'bg-[#130722] border-transparent text-purple-400 hover:bg-purple-900/50'}`}
                             >
                                 <ImageIcon size={20} />
                                 <span className="text-xs font-bold">Cover</span>
                             </button>
                             <button 
                                onClick={() => setMode('sticker')}
                                className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all border-2 ${mode === 'sticker' ? 'bg-purple-900 border-fuchsia-500 text-white shadow-lg' : 'bg-[#130722] border-transparent text-purple-400 hover:bg-purple-900/50'}`}
                             >
                                 <Sticker size={20} />
                                 <span className="text-xs font-bold">Sticker</span>
                             </button>
                         </div>
                     </div>

                     {/* 2. Style Selection (Conditional) */}
                     {mode === 'sticker' && (
                         <div className="mb-6 animate-fade-in">
                             <label className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 block">Sticker Style</label>
                             <div className="flex bg-[#130722] p-1 rounded-xl border border-purple-800">
                                 <button 
                                    onClick={() => setStickerStyle('color')}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${stickerStyle === 'color' ? 'bg-fuchsia-600 text-white shadow-md' : 'text-purple-400 hover:text-white'}`}
                                 >
                                     <Palette size={16} /> Full Color
                                 </button>
                                 <button 
                                    onClick={() => setStickerStyle('line_art')}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${stickerStyle === 'line_art' ? 'bg-fuchsia-600 text-white shadow-md' : 'text-purple-400 hover:text-white'}`}
                                 >
                                     <PenTool size={16} /> Line Art
                                 </button>
                             </div>
                         </div>
                     )}
                     
                     {/* Info Box for Covers/Pages */}
                     {mode === 'cover' && (
                         <div className="mb-6 bg-fuchsia-900/20 border border-fuchsia-500/30 p-3 rounded-xl flex items-start gap-2 text-xs text-fuchsia-200">
                             <Palette size={14} className="mt-0.5 flex-shrink-0"/>
                             <p>Covers are automatically set to generate in <strong>Full Color</strong>.</p>
                         </div>
                     )}
                     {mode === 'page' && (
                         <div className="mb-6 bg-purple-900/20 border border-purple-500/30 p-3 rounded-xl flex items-start gap-2 text-xs text-purple-200">
                             <PenTool size={14} className="mt-0.5 flex-shrink-0"/>
                             <p>Interior Pages are automatically set to <strong>Black & White Line Art</strong>.</p>
                         </div>
                     )}

                     {/* 3. Custom Instructions */}
                     <div className="mb-6">
                         <label className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 block">Specific Instructions (Optional)</label>
                         <textarea 
                            value={customInstructions}
                            onChange={(e) => setCustomInstructions(e.target.value)}
                            className="w-full p-3 bg-[#130722] border border-purple-600 rounded-xl text-white text-sm focus:outline-none focus:border-fuchsia-500 h-28 resize-none shadow-inner placeholder-purple-700"
                            placeholder="e.g., Include a sleeping cat, make it spooky, add floral borders..."
                         />
                     </div>

                     <button 
                        onClick={handleGenerateIdeas}
                        disabled={isGenerating}
                        className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                     >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        Generate 5 Unique Ideas
                     </button>
                 </div>
            </div>

            {/* Right Column: Results */}
            <div className="lg:col-span-7 h-full flex flex-col">
                <div className="bg-[#1a0b2e] border border-purple-800 rounded-2xl p-6 shadow-xl flex-1 flex flex-col min-h-[500px]">
                    <div className="flex justify-between items-center mb-6 border-b border-purple-800 pb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Generated Ideas <span className="text-purple-500 text-sm">({generatedIdeas.length})</span>
                        </h3>
                        {generatedIdeas.length > 0 && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setGeneratedIdeas([])} 
                                    className="p-2 text-purple-400 hover:text-red-400 hover:bg-purple-900/50 rounded-lg transition-colors"
                                    title="Clear All"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button 
                                    onClick={handleExportPrompts}
                                    className="p-2 text-purple-400 hover:text-white hover:bg-purple-900/50 rounded-lg transition-colors"
                                    title="Download List"
                                >
                                    <Download size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center text-purple-300 opacity-70">
                                <Loader2 className="animate-spin mb-4 text-fuchsia-500" size={48} />
                                <p className="animate-pulse">Dreaming up new concepts...</p>
                            </div>
                        ) : generatedIdeas.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-purple-500 border-2 border-dashed border-purple-800 rounded-2xl p-8 text-center">
                                <Sparkles size={48} className="mb-4 opacity-50" />
                                <p className="font-medium">No ideas generated yet.</p>
                                <p className="text-sm mt-2 opacity-70">Use the controls on the left to create tailored prompts for your project.</p>
                            </div>
                        ) : (
                            generatedIdeas.map((idea, idx) => (
                                <div key={idx} className="bg-[#130722] border border-purple-700/50 rounded-xl p-4 hover:border-fuchsia-500 transition-all group animate-in slide-in-from-bottom-2 duration-300 fill-mode-backwards" style={{animationDelay: `${idx * 100}ms`}}>
                                    <div className="flex justify-between items-start gap-4 mb-3">
                                        <input 
                                            value={idea.title}
                                            onChange={(e) => handleEditIdea(idx, 'title', e.target.value)}
                                            className="bg-transparent font-bold text-white border-none focus:ring-0 p-0 w-full text-lg placeholder-purple-600"
                                            placeholder="Idea Title"
                                        />
                                        <button 
                                            onClick={() => handleDeleteIdea(idx)}
                                            className="text-purple-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    
                                    <textarea 
                                        value={idea.prompt}
                                        onChange={(e) => handleEditIdea(idx, 'prompt', e.target.value)}
                                        className="w-full bg-[#0f0518] border border-purple-900/50 rounded-lg p-3 text-sm text-purple-200 focus:border-fuchsia-500 focus:outline-none resize-none h-24 mb-3"
                                    />
                                    
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => handleAddToProject(idea.title, idea.prompt)}
                                            className="px-4 py-2 bg-purple-800 hover:bg-fuchsia-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-md"
                                        >
                                            <Plus size={16} /> Add to Project
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}