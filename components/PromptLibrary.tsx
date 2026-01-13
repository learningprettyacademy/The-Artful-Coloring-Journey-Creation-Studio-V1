import React, { useState } from 'react';
import { ProjectPlan, GeneratedPage } from '../types';
import { Copy, Check, Download, Book, Plus, Edit2, Save, X, Trash2 } from 'lucide-react';

interface PromptLibraryProps {
  plan: ProjectPlan;
  pages: GeneratedPage[];
  setPages: React.Dispatch<React.SetStateAction<GeneratedPage[]>>;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ plan, pages, setPages }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", prompt: "" });

  // Add State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptText, setNewPromptText] = useState("");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEditing = (page: GeneratedPage) => {
      setEditingId(page.id);
      setEditForm({ name: page.name, prompt: page.imagePrompt });
  };

  const saveEdit = (id: string) => {
      setPages(prev => prev.map(p => p.id === id ? { ...p, name: editForm.name, imagePrompt: editForm.prompt } : p));
      setEditingId(null);
  };

  const cancelEdit = () => {
      setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm("Delete this prompt from library?")) {
          setPages(prev => prev.filter(p => p.id !== id));
      }
  };

  const handleAddManual = () => {
      if (!newPromptName || !newPromptText) return;
      
      const newPage: GeneratedPage = {
          id: `manual_${Date.now()}`,
          name: newPromptName,
          description: "Custom Manual Entry",
          imagePrompt: newPromptText,
          isCover: false
      };
      
      setPages(prev => [newPage, ...prev]);
      setNewPromptName("");
      setNewPromptText("");
      setShowAddForm(false);
  };

  const exportPrompts = () => {
      let content = `PROJECT: ${plan.projectTitle}\nTHEME: ${plan.concept}\n\n`;
      content += `--- PROMPT LIBRARY ---\n`;
      pages.forEach((p, i) => {
          content += `\n${i+1}. ${p.name}\n${p.imagePrompt}\n`;
      });
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${plan.projectTitle.replace(/\s+/g, '_')}_Prompts.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto animate-fade-in text-white">
        <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h2 className="text-4xl font-bold font-serif mb-2 text-white">Prompt Library</h2>
                <p className="text-purple-200">View, edit, and manage all prompts in your project plan.</p>
            </div>
            <div className="flex gap-2">
                 <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`px-4 py-2 border-2 rounded-xl font-bold transition-all flex items-center gap-2 ${showAddForm ? 'bg-purple-900 border-purple-600 text-purple-300' : 'bg-fuchsia-700 border-fuchsia-500 text-white hover:bg-fuchsia-600'}`}
                >
                    {showAddForm ? <X size={18}/> : <Plus size={18}/>} {showAddForm ? "Cancel Add" : "Add Custom Prompt"}
                </button>
                <button 
                    onClick={exportPrompts}
                    className="px-4 py-2 bg-purple-900 border-2 border-purple-600 rounded-xl text-white font-bold hover:bg-purple-800 transition-all flex items-center gap-2"
                >
                    <Download size={18} /> Export List
                </button>
            </div>
        </div>

        {/* Add Manual Form */}
        {showAddForm && (
            <div className="mb-8 bg-[#2d1b4e] border border-fuchsia-500 rounded-2xl p-6 shadow-lg animate-fade-in">
                <h3 className="font-bold text-lg mb-4 text-white">Add New Custom Prompt</h3>
                <div className="space-y-4">
                    <input 
                        className="w-full p-3 bg-[#1a0b2e] border border-purple-600 rounded-xl text-white focus:outline-none focus:border-fuchsia-500"
                        placeholder="Prompt Title / Name"
                        value={newPromptName}
                        onChange={(e) => setNewPromptName(e.target.value)}
                    />
                    <textarea 
                        className="w-full p-3 bg-[#1a0b2e] border border-purple-600 rounded-xl text-white focus:outline-none focus:border-fuchsia-500 h-32 resize-none"
                        placeholder="Detailed Image Prompt..."
                        value={newPromptText}
                        onChange={(e) => setNewPromptText(e.target.value)}
                    />
                    <button 
                        onClick={handleAddManual}
                        disabled={!newPromptName || !newPromptText}
                        className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold"
                    >
                        Save to Library
                    </button>
                </div>
            </div>
        )}

        <div className="bg-[#1a0b2e]/50 border border-purple-800/50 rounded-3xl p-6">
            <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-xl p-4 mb-6 inline-block">
                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                    Active Project Prompts <span className="text-sm font-normal text-purple-300">({pages.length})</span>
                </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pages.length === 0 ? (
                    <div className="text-center py-10 text-purple-400 italic col-span-2">
                        No pages in project yet. Use the generator to create some!
                    </div>
                ) : (
                    pages.map((page) => {
                        const isEditing = editingId === page.id;

                        return (
                            <div key={page.id} className="bg-[#2d1b4e] border border-purple-600/30 rounded-xl p-4 hover:border-purple-500 transition-colors flex flex-col gap-2 shadow-lg group relative">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <input 
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                            className="w-full p-2 bg-[#130722] border border-fuchsia-500 rounded text-sm text-white focus:outline-none"
                                            placeholder="Title"
                                        />
                                        <textarea 
                                            value={editForm.prompt}
                                            onChange={(e) => setEditForm({...editForm, prompt: e.target.value})}
                                            className="w-full p-2 bg-[#130722] border border-fuchsia-500 rounded text-xs text-purple-200 focus:outline-none h-24 resize-none"
                                            placeholder="Prompt"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={cancelEdit} className="px-3 py-1 text-xs text-purple-400 hover:text-white">Cancel</button>
                                            <button onClick={() => saveEdit(page.id)} className="px-3 py-1 text-xs bg-fuchsia-600 text-white rounded flex items-center gap-1">
                                                <Save size={12}/> Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-purple-900 p-2 rounded-lg">
                                                    <Book size={16} className="text-fuchsia-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-sm">{page.name}</h4>
                                                    {page.isCover && <span className="text-[10px] bg-fuchsia-900 text-fuchsia-200 px-2 py-0.5 rounded-full border border-fuchsia-700">COVER</span>}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => startEditing(page)}
                                                    className="p-1.5 text-purple-400 hover:text-white hover:bg-purple-800 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14}/>
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(e, page.id)}
                                                    className="p-1.5 text-purple-400 hover:text-red-400 hover:bg-purple-800 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14}/>
                                                </button>
                                                <button 
                                                    onClick={() => handleCopy(page.imagePrompt, page.id)}
                                                    className="p-1.5 text-purple-400 hover:text-white hover:bg-purple-800 rounded transition-colors flex items-center gap-1"
                                                    title="Copy Prompt"
                                                >
                                                    {copiedId === page.id ? <Check size={14} className="text-green-400"/> : <Copy size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono bg-[#130722] p-3 rounded border border-purple-800/50 break-words leading-relaxed mt-2 line-clamp-4 hover:line-clamp-none cursor-pointer" onClick={() => startEditing(page)} title="Click to edit">
                                            {page.imagePrompt}
                                        </p>
                                    </>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    </div>
  );
}