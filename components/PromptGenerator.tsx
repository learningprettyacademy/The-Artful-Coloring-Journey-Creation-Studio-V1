import React, { useState } from 'react';
import { ProjectPlan } from '../types';
import { Sparkles, Plus, Loader2, Book, Image as ImageIcon, Sticker, Download, Trash2, X } from 'lucide-react';
import { generateCreativePrompts } from '../services/geminiService';

interface PromptGeneratorProps {
  plan: ProjectPlan;
  onAddPage: (name: string, prompt: string) => void;
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
    // Note: We don't clear previous ideas immediately so the user can see them while loading, 
    // or we can clear them. Let's clear for fresh start feeling.
    setGeneratedIdeas([]);
    try {
        const ideas = await generateCreativePrompts(plan, mode, stickerStyle, customInstructions, 5);
        setGeneratedIdeas(ideas);
    } catch (e) {
        alert("Failed to generate ideas");
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
      if (confirm("Remove this idea from the list?")) {
          const newIdeas = generatedIdeas.filter((_, i) => i !== index);
          setGeneratedIdeas(newIdeas);
      }
  };

  const handleAddToProject = (title: string, prompt: string) => {
      onAddPage(title, prompt);
  };

  const handleExportPrompts = () => {
      if (generatedIdeas.length === 0) return;
      let content = `GENERATED PROMPT IDEAS\nProject: ${plan.projectTitle}\n\n`;
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
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto animate-fade-in text-white">
        <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-6 mb-8">
            <h2 className="text-4xl font-bold font-serif mb-2 text-white">Prompt Generator</h2>
            <p className="text-purple-200">Create specialized prompts for Covers, Coloring Pages, and Sticker Sheets.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Generator Controls */}
            <div className="space-y-6">
                 <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-6">
                     <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                         <Sparkles size={20} className="text-fuchsia-400"/> Generator Settings
                     </h3>

                     {/* Mode Selection */}
                     <div className="grid grid-cols-3 gap-2 mb-6">
                         <button 
                            onClick={() => setMode('cover')}
                            className={`p-3 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${mode === 'cover' ? 'bg-fuchsia-600 border-fuchsia-300 text-white shadow-lg' : 'bg-purple-900/40 border-purple-700 text-purple-300 hover:border-fuchsia-500'}`}
                         >
                             <Book size={20} />
                             <span className="text-xs font-bold">Cover</span>
                         </button>
                         <button 
                            onClick={() => setMode('page')}
                            className={`p-3 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${mode === 'page' ? 'bg-fuchsia-600 border-fuchsia-300 text-white shadow-lg' : 'bg-purple-900/40 border-purple-700 text-purple-300 hover:border-fuchsia-500'}`}
                         >
                             <ImageIcon size={20} />
                             <span className="text-xs font-bold">Pages</span>
                         </button>
                         <button 
                            onClick={() => setMode('sticker')}
                            className={`p-3 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${mode === 'sticker' ? 'bg-fuchsia-600 border-fuchsia-300 text-white shadow-lg' : 'bg-purple-900/40 border-purple-700 text-purple-300 hover:border-fuchsia-500'}`}
                         >
                             <Sticker size={20} />
                             <span className="text-xs font-bold">Stickers</span>
                         </button>
                     </div>

                     {/* Contextual Options */}
                     <div className="mb-6 bg-purple-900/30 p-4 rounded-xl border border-purple-700">
                         <h4 className="text-sm font-semibold text-fuchsia-300 mb-2 uppercase tracking-wider">Style Rules</h4>
                         {mode === 'cover' && (
                             <p className="text-xs text-purple-200 mb-2">
                                 Generates <span className="text-white font-bold">FULL COLOR</span> cover art prompts. 
                                 <br/>• Full color illustration.
                                 <br/>• No random author names.
                             </p>
                         )}
                         {mode === 'page' && (
                             <p className="text-xs text-purple-200 mb-2">
                                 Generates <span className="text-white font-bold">B&W LINE ART</span> interior prompts.
                                 <br/>• Clean lines, no shading.
                                 <br/>• Optimized for coloring.
                             </p>
                         )}
                         {mode === 'sticker' && (
                             <div className="mb-3">
                                 <p className="text-xs text-purple-200 mb-2">Choose sticker style:</p>
                                 <div className="flex gap-2">
                                     <button 
                                        onClick={() => setStickerStyle('color')}
                                        className={`flex-1 py-2 text-xs rounded-lg border transition-all ${stickerStyle === 'color' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-transparent border-purple-600 text-purple-400'}`}
                                     >
                                         Full Color
                                     </button>
                                     <button 
                                        onClick={() => setStickerStyle('line_art')}
                                        className={`flex-1 py-2 text-xs rounded-lg border transition-all ${stickerStyle === 'line_art' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-transparent border-purple-600 text-purple-400'}`}
                                     >
                                         B&W Line Art
                                     </button>
                                 </div>
                             </div>
                         )}
                         
                         <label className="text-xs font-bold text-fuchsia-300 mb-1 block mt-4 border-t border-purple-700 pt-3">Custom Instructions (Optional)</label>
                         <textarea 
                             value={customInstructions}
                             onChange={(e) => setCustomInstructions(e.target.value)}
                             className="w-full text-xs p-3 border border-purple-600 rounded-lg bg-[#1a0b2e] text-white focus:outline-none focus:ring-1 focus:ring-fuchsia-500 placeholder-purple-500/70"
                             placeholder="e.g. Include cute animals, use thick lines, add a vintage texture, exclude text..."
                             rows={3}
                         />
                     </div>
                     
                     <button 
                        onClick={handleGenerateIdeas}
                        disabled={isGenerating}
                        className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] hover:scale-[1.02]"
                     >
                         {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                         Generate {mode === 'sticker' ? 'Sticker' : mode === 'cover' ? 'Cover' : 'Page'} Prompts
                     </button>
                 </div>
            </div>

            {/* Right Column: Results */}
            <div className="space-y-6">
                <div className="bg-[#2d1b4e]/50 border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-6 min-h-[400px] flex flex-col">
                     <div className="flex justify-between items-center border-b border-purple-800 pb-2 mb-3">
                        <div>
                            <h4 className="font-semibold text-fuchsia-300">Generated Results</h4>
                            {generatedIdeas.length > 0 && <span className="text-xs text-purple-400">Autosaved to session</span>}
                        </div>
                        {generatedIdeas.length > 0 && (
                            <button 
                                onClick={handleExportPrompts}
                                className="text-xs bg-purple-900 border border-purple-600 hover:bg-purple-800 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                            >
                                <Download size={12} /> Export Prompts
                            </button>
                        )}
                     </div>

                     {generatedIdeas.length > 0 ? (
                         <div className="animate-fade-in space-y-3 overflow-y-auto custom-scrollbar pr-1 flex-1 max-h-[600px]">
                             <p className="text-[10px] text-purple-400 italic mb-2">Tip: You can edit the text below before adding to your project.</p>
                             {generatedIdeas.map((idea, i) => (
                                    <div key={i} className="bg-[#1a0b2e] border border-purple-700 hover:border-fuchsia-500 rounded-xl p-4 transition-all group shadow-sm relative">
                                        <button 
                                            onClick={() => handleDeleteIdea(i)}
                                            className="absolute top-2 right-2 text-purple-500 hover:text-red-400 p-1 opacity-50 hover:opacity-100 transition-opacity"
                                            title="Remove Idea"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <div className="mb-2 mr-6">
                                            <input 
                                                value={idea.title}
                                                onChange={(e) => handleEditIdea(i, 'title', e.target.value)}
                                                className="font-bold text-sm text-white bg-transparent border-b border-transparent focus:border-fuchsia-500 w-full outline-none transition-colors hover:border-purple-700"
                                                placeholder="Title"
                                            />
                                        </div>
                                        <textarea
                                            value={idea.prompt}
                                            onChange={(e) => handleEditIdea(i, 'prompt', e.target.value)}
                                            className="text-xs text-purple-200 mb-3 font-mono bg-[#130722] p-2 rounded border border-purple-800/50 w-full h-24 focus:ring-1 focus:ring-fuchsia-500 outline-none resize-none custom-scrollbar transition-colors hover:border-purple-600"
                                            placeholder="Prompt description..."
                                        />
                                        <button 
                                            onClick={() => handleAddToProject(idea.title, idea.prompt)}
                                            className="w-full text-xs bg-purple-800 hover:bg-fuchsia-600 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 shadow-sm border border-purple-700/50"
                                        >
                                            <Plus size={14} /> Add to Project Plan
                                        </button>
                                    </div>
                                ))}
                         </div>
                     ) : (
                         <div className="flex flex-col items-center justify-center flex-1 text-purple-400">
                             <Sparkles size={40} className="mb-4 opacity-50"/>
                             <p>Select settings on the left and click Generate.</p>
                         </div>
                     )}
                </div>
            </div>
        </div>
    </div>
  );
}