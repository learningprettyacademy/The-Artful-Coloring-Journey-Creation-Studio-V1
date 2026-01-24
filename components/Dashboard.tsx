import React, { useState, useEffect } from 'react';
import { ProjectPlan, GeneratedImage, GeneratedPage, PublicationSize } from '../types';
import { Download, Sparkles, Printer, DollarSign, Image as ImageIcon, Loader2, Palette, RefreshCw, Plus, Trash2, Edit2, RotateCw, FileArchive, FileText, ArrowLeft, Save, X } from 'lucide-react';
import { generateAssetImage, generateAdditionalPages, regeneratePageConcept } from '../services/geminiService';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

interface DashboardProps {
  plan: ProjectPlan;
  setPlan: React.Dispatch<React.SetStateAction<ProjectPlan | null>>;
  images: GeneratedImage[];
  setImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  pages: GeneratedPage[];
  setPages: React.Dispatch<React.SetStateAction<GeneratedPage[]>>;
  publicationSize: PublicationSize;
  onRestart: () => void;
}

const RANDOM_PAGE_IDEAS = [
    { name: "Gratitude Log", prompt: "A decorative jar filled with stars and flowers, intricate coloring style, space to write notes" },
    { name: "Mood Tracker", prompt: "A mandala style circular tracker with sections for each day, botanical border" },
    { name: "Dream Catcher", prompt: "A detailed dream catcher with feathers and beads, mystical vibe, coloring page style" },
    { name: "Book Bookshelf", prompt: "A library shelf filled with various books, plants and knick-knacks, cozy atmosphere" },
    { name: "Floral Monthly Cover", prompt: "Large typography for a month name surrounded by lush detailed peonies and roses" },
    { name: "Habit Honeycomb", prompt: "Geometric honeycomb pattern with cute bees, clean line art for tracking habits" },
    { name: "Self Care Bingo", prompt: "A grid of squares each containing a small self-care icon like a bath tub, tea cup, book, heart" },
    { name: "Savings Jar", prompt: "A large mason jar outline filled with coins and bills, doodle style" }
];

export const Dashboard: React.FC<DashboardProps> = ({ 
  plan, 
  setPlan,
  images, 
  setImages, 
  pages, 
  setPages,
  publicationSize, 
  onRestart 
}) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingExtra, setGeneratingExtra] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Plan Edit State
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editedPlanTitle, setEditedPlanTitle] = useState(plan.projectTitle);
  const [editedPlanConcept, setEditedPlanConcept] = useState(plan.concept);

  // Edit Page State
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", prompt: "" });

  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [newPagePrompt, setNewPagePrompt] = useState("");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    setEditedPlanTitle(plan.projectTitle);
    setEditedPlanConcept(plan.concept);
  }, [plan]);

  const savePlanDetails = () => {
    setPlan(prev => prev ? ({ ...prev, projectTitle: editedPlanTitle, concept: editedPlanConcept }) : null);
    setIsEditingPlan(false);
  };

  const updatePageRenderMode = (pageId: string, mode: 'color' | 'line_art') => {
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, renderMode: mode } : p));
  };

  const handleGenerateImage = async (page: GeneratedPage, forceRegenerate = false) => {
    const existing = images.find(img => img.id === page.id);
    if (existing && existing.url && !forceRegenerate) return;

    setGeneratingId(page.id);
    
    // Add placeholder
    const newImage: GeneratedImage = {
        id: page.id,
        prompt: page.imagePrompt,
        type: page.isCover ? 'cover' : 'coloring_page',
        url: '',
        loading: true
    };

    setImages(prev => {
        const filtered = prev.filter(p => p.id !== page.id);
        return [...filtered, newImage];
    });

    try {
        const base64Url = await generateAssetImage(
            page.imagePrompt, 
            page.isCover ? 'cover' : 'coloring_page',
            publicationSize,
            page.renderMode // Pass the user selected render mode
        );
        
        setImages(prev => prev.map(img => 
            img.id === page.id ? { ...img, url: base64Url, loading: false, prompt: page.imagePrompt } : img
        ));
    } catch (e) {
        console.error(e);
        if (!existing) {
             setImages(prev => prev.filter(img => img.id !== page.id));
        } else {
             setImages(prev => prev.map(img => img.id === page.id ? { ...img, loading: false } : img));
        }
        alert("Failed to generate image. Please try again.");
    } finally {
        setGeneratingId(null);
    }
  };

  const startEditing = (page: GeneratedPage) => {
      setEditForm({ name: page.name, description: page.description, prompt: page.imagePrompt });
      setEditingPageId(page.id);
  };

  const saveEditing = (pageId: string) => {
      setPages(prev => prev.map(p => 
          p.id === pageId ? { 
              ...p, 
              name: editForm.name, 
              description: editForm.description, 
              imagePrompt: editForm.prompt 
          } : p
      ));
      setEditingPageId(null);
  };

  const handleRegenerateConcept = async (page: GeneratedPage) => {
      if (confirm("This will completely replace the Title, Description and Prompt for this page with a new AI idea. Continue?")) {
          setRegeneratingId(page.id);
          try {
              const newConcept = await regeneratePageConcept(plan, page.name);
              setPages(prev => prev.map(p => 
                  p.id === page.id ? { ...p, name: newConcept.name, description: newConcept.description, imagePrompt: newConcept.imagePrompt } : p
              ));
          } catch (e) {
              alert("Could not regenerate concept.");
          } finally {
              setRegeneratingId(null);
          }
      }
  };

  const handleGenerateMorePages = async () => {
      setGeneratingExtra(true);
      try {
          const newPages = await generateAdditionalPages(plan, pages.map(p => p.name));
          setPages(prev => [...prev, ...newPages]);
      } catch (e) {
          alert("Failed to generate extra pages.");
      } finally {
          setGeneratingExtra(false);
      }
  };

  const fillRandomPageIdea = () => {
      const random = RANDOM_PAGE_IDEAS[Math.floor(Math.random() * RANDOM_PAGE_IDEAS.length)];
      setNewPageName(random.name);
      setNewPagePrompt(random.prompt);
  };

  const addNewPage = () => {
      if (!newPageName || !newPagePrompt) return;
      const newPage: GeneratedPage = {
          id: `custom_${Date.now()}`,
          name: newPageName,
          description: "Custom user page",
          imagePrompt: newPagePrompt,
          isCover: false,
          renderMode: 'line_art' // default to line art
      };
      setPages([...pages, newPage]);
      setNewPageName("");
      setNewPagePrompt("");
      setShowAddPage(false);
  };
  
  const deletePage = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this page?")) {
          setPages(prev => prev.filter(p => p.id !== id));
          setImages(prev => prev.filter(i => i.id !== id));
      }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to create PDF Document (Images Only)
  const createPDFDoc = () => {
    const doc = new jsPDF({
        orientation: publicationSize === 'Landscape (11x8.5)' ? 'l' : 'p',
        unit: 'in',
        format: publicationSize === 'Square (12x12)' ? [12, 12] : 'letter'
    });

    const validImages = pages.map(p => {
        const img = images.find(i => i.id === p.id);
        return (img && img.url) ? img : null;
    }).filter(img => img !== null) as GeneratedImage[];

    if (validImages.length === 0) return null;

    validImages.forEach((img, index) => {
        if (index > 0) doc.addPage();
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 0.5;
        
        doc.addImage(img.url, 'PNG', margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2), undefined, 'FAST');
    });

    return doc;
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    const zip = new JSZip();
    const imgFolder = zip.folder("images");
    
    // Add images
    images.forEach((img, i) => {
        if(img.url) {
            const data = img.url.split(',')[1];
            const page = pages.find(p => p.id === img.id);
            const name = page ? page.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `image_${i}`;
            imgFolder?.file(`${name}.png`, data, {base64: true});
        }
    });
    
    // Add text plan
    const planText = `
      Project: ${plan.projectTitle}
      Concept: ${plan.concept}
      Target Audience: ${plan.concept}
      
      --- Page List & Prompts ---
      ${pages.map((p, i) => `${i+1}. ${p.name}\n   Prompt: ${p.imagePrompt}`).join('\n\n')}
    `;
    zip.file("project_plan.txt", planText);

    // Add PDF
    try {
        const doc = createPDFDoc();
        if (doc) {
            const pdfBlob = doc.output('blob');
            zip.file(`${plan.projectTitle.replace(/\s+/g, '_')}_Printable.pdf`, pdfBlob);
        }
    } catch(e) {
        console.error("Error adding PDF to zip", e);
    }

    try {
        const content = await zip.generateAsync({type: "blob"});
        const url = window.URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${plan.projectTitle.replace(/\s+/g, '_')}_Kit.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Zip export failed", e);
        alert("Failed to create ZIP file");
    } finally {
        setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
        const doc = createPDFDoc();
        if (!doc) {
            alert("No images generated yet to create a PDF.");
            return;
        }
        doc.save(`${plan.projectTitle.replace(/\s+/g, '_')}.pdf`);
    } catch(e) {
        console.error("PDF Export failed", e);
        alert("Failed to generate PDF.");
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto animate-fade-in text-white">
      {/* Header Actions */}
      <div className="flex flex-col gap-6 mb-8 border-b border-purple-800/50 pb-8">
        
        {/* Title/Desc Box with Purple Neon Effect */}
        <div className="w-full bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.3)] rounded-2xl p-4 md:p-6 relative group transition-all hover:shadow-[0_0_25px_rgba(217,70,239,0.5)]">
             <div className="absolute top-4 right-4 z-20">
                 {isEditingPlan ? (
                     <div className="flex gap-2">
                         <button onClick={savePlanDetails} className="bg-green-700 p-2 rounded text-white hover:bg-green-600 shadow-md"><Save size={16}/></button>
                         <button onClick={() => setIsEditingPlan(false)} className="bg-red-900/80 p-2 rounded text-red-200 hover:bg-red-800 shadow-md"><X size={16}/></button>
                     </div>
                 ) : (
                    <button onClick={() => setIsEditingPlan(true)} className="p-2 text-purple-400 hover:text-white rounded hover:bg-purple-800 transition-colors" title="Edit Details">
                        <Edit2 size={16} />
                    </button>
                 )}
             </div>

             <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                     <button onClick={onRestart} className="p-2 hover:bg-purple-800 rounded-full transition-colors flex-shrink-0" title="Back to Wizard">
                         <ArrowLeft size={20} className="text-purple-400"/>
                     </button>
                     <div className="flex items-center gap-2 text-xs text-purple-400 bg-black/30 px-3 py-1.5 rounded-full border border-purple-800">
                         <Printer size={12}/> 
                         <span className="font-medium tracking-wide">{publicationSize}</span>
                     </div>
                 </div>

                 <div className="pr-8 md:pr-12">
                     {isEditingPlan ? (
                         <div className="space-y-3">
                             <input 
                                value={editedPlanTitle}
                                onChange={(e) => setEditedPlanTitle(e.target.value)}
                                className="bg-[#1a0b2e] border border-fuchsia-500 rounded px-3 py-2 text-xl md:text-2xl font-bold font-serif w-full text-white shadow-[0_0_10px_rgba(217,70,239,0.2)]"
                             />
                             <textarea 
                                value={editedPlanConcept}
                                onChange={(e) => setEditedPlanConcept(e.target.value)}
                                className="w-full bg-[#1a0b2e] border border-fuchsia-500 rounded p-3 text-purple-200 shadow-[0_0_10px_rgba(217,70,239,0.2)] h-24"
                             />
                         </div>
                     ) : (
                         <>
                            <h2 className="text-2xl md:text-4xl font-bold font-serif text-white drop-shadow-md mb-3 leading-tight break-words">
                                {plan.projectTitle}
                            </h2>
                            <p className="text-purple-200 max-w-4xl leading-relaxed text-sm md:text-lg border-l-4 border-fuchsia-600 pl-4 bg-purple-900/20 py-2 rounded-r-lg">
                                {plan.concept}
                            </p>
                         </>
                     )}
                 </div>
             </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap gap-2 md:gap-3">
             <button 
                onClick={handleGenerateMorePages}
                disabled={generatingExtra}
                className="flex-1 md:flex-none justify-center px-4 py-3 bg-purple-900 border border-purple-600 text-purple-100 hover:text-white hover:border-fuchsia-500 rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg font-medium text-sm md:text-base"
             >
                {generatingExtra ? <Loader2 className="animate-spin" size={18}/> : <Plus size={18} />} 
                <span className="hidden sm:inline">Auto-Add Pages</span>
                <span className="sm:hidden">Auto Add</span>
             </button>
             <button 
                onClick={() => setShowAddPage(true)}
                className="flex-1 md:flex-none justify-center px-4 py-3 bg-purple-900 border border-purple-600 text-purple-100 hover:text-white hover:border-fuchsia-500 rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg font-medium text-sm md:text-base"
             >
                <Edit2 size={18} /> 
                <span className="hidden sm:inline">Manual Add</span>
                <span className="sm:hidden">Manual</span>
             </button>
             <div className="w-px bg-purple-700 mx-2 hidden md:block"></div>
             <button 
                onClick={handleExportZip}
                disabled={isExporting}
                className="flex-1 md:flex-none justify-center px-4 py-3 bg-indigo-900 border border-indigo-500 text-indigo-100 hover:bg-indigo-800 rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg font-medium text-sm md:text-base"
                title="Download Images + Prompts + PDF"
             >
                <FileArchive size={18} /> ZIP
             </button>
             <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex-1 md:flex-none justify-center px-4 py-3 bg-fuchsia-900 border border-fuchsia-500 text-fuchsia-100 hover:bg-fuchsia-800 rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg font-medium text-sm md:text-base"
                title="Download Printable PDF (Images Only)"
             >
                <FileText size={18} /> PDF
             </button>
        </div>
      </div>

      {/* Manual Add Page Modal */}
      {showAddPage && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#2d1b4e] border border-fuchsia-500 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-bold text-white mb-4">Add Custom Page</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-purple-300 uppercase block mb-1">Page Title</label>
                          <div className="flex gap-2">
                            <input 
                                value={newPageName}
                                onChange={(e) => setNewPageName(e.target.value)}
                                className="flex-1 p-3 bg-[#1a0b2e] border border-purple-600 rounded-xl text-white focus:outline-none focus:border-fuchsia-500"
                                placeholder="e.g. Weekly Reflection"
                            />
                            <button 
                                onClick={fillRandomPageIdea}
                                className="px-3 bg-purple-800 rounded-xl text-fuchsia-300 hover:bg-purple-700"
                                title="Random Idea"
                            >
                                <Sparkles size={16}/>
                            </button>
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-purple-300 uppercase block mb-1">Image Prompt</label>
                          <textarea 
                                value={newPagePrompt}
                                onChange={(e) => setNewPagePrompt(e.target.value)}
                                className="w-full p-3 bg-[#1a0b2e] border border-purple-600 rounded-xl text-white focus:outline-none focus:border-fuchsia-500 h-32 resize-none"
                                placeholder="Describe exactly what should appear on the coloring page..."
                          />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                          <button onClick={() => setShowAddPage(false)} className="px-4 py-2 text-purple-300 hover:text-white">Cancel</button>
                          <button 
                            onClick={addNewPage}
                            disabled={!newPageName || !newPagePrompt}
                            className="px-6 py-2 bg-fuchsia-600 text-white font-bold rounded-xl hover:bg-fuchsia-500 disabled:opacity-50"
                          >
                              Add Page
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Pages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {pages.map((page, index) => {
          const img = images.find(i => i.id === page.id);
          const isGeneratingThis = generatingId === page.id;
          const isRegeneratingThis = regeneratingId === page.id;
          const isEditingThis = editingPageId === page.id;
          
          // Determine active render mode for display toggle
          const currentMode = page.renderMode || (page.isCover ? 'color' : 'line_art');

          return (
            <div key={page.id} className={`group bg-[#1a0b2e] border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] flex flex-col ${isEditingThis ? 'border-fuchsia-500 ring-1 ring-fuchsia-500' : 'border-purple-800 hover:border-purple-500'}`}>
              
              {/* Header */}
              <div className="p-4 bg-[#25103f] border-b border-purple-800 flex justify-between items-start gap-2">
                <div className="flex-1">
                   {isEditingThis ? (
                       <div className="space-y-2">
                           <input 
                                value={editForm.name}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="w-full p-1 bg-[#130722] border border-fuchsia-500 rounded text-sm text-white font-bold"
                           />
                           <textarea 
                                value={editForm.description}
                                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                className="w-full p-1 bg-[#130722] border border-fuchsia-500 rounded text-xs text-purple-200"
                                rows={2}
                           />
                       </div>
                   ) : (
                       <>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-purple-900 text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-700">#{index + 1}</span>
                            {page.isCover && <span className="bg-fuchsia-900 text-fuchsia-200 text-[10px] font-bold px-2 py-0.5 rounded border border-fuchsia-700">COVER</span>}
                            <h3 className="font-bold text-white text-lg leading-tight">{page.name}</h3>
                        </div>
                        <p className="text-xs text-purple-300 line-clamp-2" title={page.description}>{page.description}</p>
                       </>
                   )}
                </div>
                
                <div className="flex flex-col gap-1">
                    {isEditingThis ? (
                        <>
                            <button onClick={() => saveEditing(page.id)} className="p-1.5 bg-green-700 text-white rounded hover:bg-green-600" title="Save"><Save size={14}/></button>
                            <button onClick={() => setEditingPageId(null)} className="p-1.5 bg-red-900 text-red-200 rounded hover:bg-red-800" title="Cancel"><X size={14}/></button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => startEditing(page)} className="p-1.5 text-purple-400 hover:bg-purple-800 hover:text-white rounded transition-colors" title="Edit Text">
                                <Edit2 size={14}/>
                            </button>
                            <button onClick={(e) => deletePage(e, page.id)} className="p-1.5 text-purple-400 hover:bg-red-900/50 hover:text-red-400 rounded transition-colors" title="Delete Page">
                                <Trash2 size={14}/>
                            </button>
                        </>
                    )}
                </div>
              </div>

              {/* Render Mode Toggle Bar */}
              <div className="bg-[#130722] px-4 py-2 flex items-center justify-between border-b border-purple-900/50">
                  <span className="text-[10px] uppercase text-purple-400 font-bold tracking-wider">Style Mode</span>
                  <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-purple-800">
                      <button 
                         onClick={() => updatePageRenderMode(page.id, 'color')}
                         className={`text-[10px] px-2 py-0.5 rounded-md transition-all ${currentMode === 'color' ? 'bg-fuchsia-600 text-white' : 'text-purple-400 hover:text-white'}`}
                      >
                          Color
                      </button>
                      <button 
                         onClick={() => updatePageRenderMode(page.id, 'line_art')}
                         className={`text-[10px] px-2 py-0.5 rounded-md transition-all ${currentMode === 'line_art' ? 'bg-fuchsia-600 text-white' : 'text-purple-400 hover:text-white'}`}
                      >
                          Line Art
                      </button>
                  </div>
              </div>

              {/* Image Area */}
              <div className="aspect-[3/4] bg-[#0f0518] relative flex items-center justify-center p-4">
                {isGeneratingThis ? (
                    <div className="text-center">
                        <Loader2 className="animate-spin text-fuchsia-500 mx-auto mb-2" size={32} />
                        <p className="text-xs text-fuchsia-400 animate-pulse">Generating Art...</p>
                    </div>
                ) : img && img.url ? (
                    <div className="relative w-full h-full group/img">
                        <img src={img.url} alt={page.name} className="w-full h-full object-contain shadow-lg" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <button 
                                onClick={() => downloadImage(img.url, `${page.name.replace(/\s/g,'_')}.png`)}
                                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white p-2 rounded-full transform translate-y-2 group-hover/img:translate-y-0 transition-all"
                                title="Download"
                             >
                                 <Download size={20} />
                             </button>
                             <button 
                                onClick={() => handleGenerateImage(page, true)}
                                className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-full transform translate-y-2 group-hover/img:translate-y-0 transition-all"
                                title="Regenerate Image"
                             >
                                 <RefreshCw size={20} />
                             </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center max-w-[200px]">
                        <ImageIcon size={48} className="text-purple-800 mx-auto mb-3" />
                        <button 
                            onClick={() => handleGenerateImage(page)}
                            className="px-4 py-2 bg-purple-800 hover:bg-fuchsia-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg border border-purple-600"
                        >
                            Generate ({currentMode === 'color' ? 'Color' : 'Line Art'})
                        </button>
                    </div>
                )}
              </div>

              {/* Prompt Footer */}
              <div className="p-4 bg-[#1a0b2e] border-t border-purple-800 flex-1 flex flex-col justify-end">
                  {isEditingThis ? (
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-purple-400 uppercase">Image Prompt</label>
                          <textarea 
                                value={editForm.prompt}
                                onChange={(e) => setEditForm({...editForm, prompt: e.target.value})}
                                className="w-full p-2 bg-[#130722] border border-fuchsia-500 rounded text-xs text-purple-200 h-24"
                          />
                      </div>
                  ) : (
                    <>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Image Prompt</span>
                            <button 
                                onClick={() => handleRegenerateConcept(page)} 
                                disabled={isRegeneratingThis}
                                className="text-[10px] flex items-center gap-1 text-purple-500 hover:text-fuchsia-400"
                            >
                                {isRegeneratingThis ? <Loader2 size={10} className="animate-spin"/> : <RotateCw size={10} />}
                                New Idea
                            </button>
                        </div>
                        <div className="bg-[#130722] p-2 rounded border border-purple-900/50 h-20 overflow-y-auto custom-scrollbar">
                            <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                                {page.imagePrompt}
                            </p>
                        </div>
                    </>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Monetization & Strategy Box (Footer) */}
      <div className="mt-16 border-t border-purple-800 pt-10">
          <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-6 md:p-8">
               <div className="flex flex-col md:flex-row gap-8">
                   {/* Strategy Column */}
                   <div className="flex-1">
                       <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3">
                           <DollarSign className="text-fuchsia-400" size={28} /> 
                           Monetization Strategy
                       </h3>
                       <div className="space-y-4">
                            {plan.monetizationStrategies.map((strat, i) => (
                                <div key={i} className="bg-[#1a0b2e] p-5 rounded-xl border border-purple-700 hover:border-fuchsia-500 transition-colors flex gap-4">
                                    <span className="text-3xl md:text-4xl font-serif font-bold text-purple-800/50">0{i+1}</span>
                                    <div>
                                        <p className="text-purple-100 text-sm leading-relaxed">{strat}</p>
                                    </div>
                                </div>
                            ))}
                       </div>
                   </div>

                   {/* Color Palette Column */}
                   <div className="md:w-1/3 space-y-6">
                        <div>
                             <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Palette className="text-fuchsia-400" size={20}/> Color Palette Ideas
                             </h4>
                             <div className="flex flex-wrap gap-2">
                                 {plan.colorPaletteSuggestions.map((color, i) => (
                                     <div key={i} className="bg-[#1a0b2e] px-4 py-2 rounded-lg border border-purple-700 text-sm text-purple-300 w-full">
                                        <span className="w-2 h-2 inline-block rounded-full bg-fuchsia-500 mr-2"></span>
                                        {color}
                                     </div>
                                 ))}
                             </div>
                        </div>
                        
                        <div className="bg-purple-900/30 p-4 rounded-xl border border-purple-800">
                             <h5 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wider">Project Stats</h5>
                             <div className="space-y-2 text-xs text-purple-400">
                                 <div className="flex justify-between">
                                     <span>Total Pages:</span>
                                     <span className="text-white font-bold">{pages.length}</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span>Generated Assets:</span>
                                     <span className="text-white font-bold">{images.filter(i => i.url).length}</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span>Format:</span>
                                     <span className="text-white font-bold">{publicationSize}</span>
                                 </div>
                             </div>
                        </div>
                   </div>
               </div>
          </div>
      </div>
    </div>
  );
}