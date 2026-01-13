import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { Image as ImageIcon, Sparkles, Loader2, Download, Check, FileArchive, AlertCircle } from 'lucide-react';
import { generateMockup } from '../services/geminiService';
import JSZip from 'jszip';

interface MockupGeneratorProps {
  images: GeneratedImage[];
  setImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
}

const ALL_MOCKUP_SCENES = [
  "A photorealistic flat lay on a rustic wooden desk with colored pencils scattered around",
  "A cozy scene with the page resting on a soft knit blanket next to a warm cup of tea",
  "Professional clean white background product shot with soft natural window lighting",
  "A bright, sunny nursery room shelf display with toys in the background",
  "An artistic view with watercolor paints, brushes, and a water glass nearby",
  "Pinned to a corkboard in a creative home office setting",
  "Held in hands against a blurred nature background (park or garden)",
  "Lying on a marble countertop with fresh flowers and a gold pen",
  "A moody, dark academia styled desk with old books and a candle",
  "A bright and colorful kids craft table with crayons and markers",
  "A minimalist scandinavian desk setup with a succulent plant",
  "Displayed on a wooden easel in an art studio context",
  "Laying on a beach towel with sunglasses and a summer drink",
  "Nestled among autumn leaves and pumpkins",
  "On a glass coffee table in a modern living room",
  "Clipped onto a clipboard hanging on a wire grid wall",
  "Surrounded by washi tapes and stickers on a craft mat",
  "Peeking out of a tote bag on a park bench",
  "Next to a laptop and a steaming latte in a busy coffee shop",
  "A close up macro shot showing the paper texture and line details"
];

export const MockupGenerator: React.FC<MockupGeneratorProps> = ({ images, setImages }) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Filter source images (exclude existing mockups)
  const sourceImages = images.filter(img => !img.loading && img.url && img.type !== 'mockup');
  
  // Filter created mockups
  const existingMockups = images.filter(img => img.type === 'mockup').reverse();

  useEffect(() => {
    refreshSuggestions();
  }, []);

  const refreshSuggestions = () => {
    const shuffled = [...ALL_MOCKUP_SCENES].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 5));
  };

  const handleGenerate = async () => {
    const activePrompt = customPrompt || suggestions[0];
    if (!selectedImageId || !activePrompt) {
        setError("Please select an image and choose a scene.");
        return;
    }
    
    const selectedImage = sourceImages.find(img => img.id === selectedImageId);
    if (!selectedImage) return;

    setIsGenerating(true);
    setError(null);

    // CRITICAL FIX: Generate stable ID first. Do not use temp ID then switch. 
    // Switching IDs during a render cycle with complex images can cause white screens/state loss in React.
    const finalId = `mockup_${Date.now()}`;

    // Add loading placeholder with the FINAL ID
    const placeholder: GeneratedImage = {
        id: finalId,
        url: '',
        prompt: `Mockup: ${activePrompt}`,
        type: 'mockup',
        loading: true,
        aspectRatio: "4:3"
    };
    
    setImages(prev => [placeholder, ...prev]);

    try {
        const resultUrl = await generateMockup(selectedImage.url, activePrompt);
        
        // Update the placeholder with content, preserving the ID
        setImages(prev => prev.map(img => 
            img.id === finalId ? {
                ...img,
                url: resultUrl,
                loading: false
            } : img
        ));
        setCustomPrompt(""); 
        
    } catch (e: any) {
        console.error(e);
        setError("Failed to generate mockup. Please try a different scene or image.");
        // Remove placeholder on error
        setImages(prev => prev.filter(img => img.id !== finalId));
    } finally {
        setIsGenerating(false);
    }
  };

  const handleExportAll = async () => {
      if (existingMockups.length === 0) return;
      setIsExporting(true);
      try {
          const zip = new JSZip();
          const folder = zip.folder("mockups");
          
          existingMockups.forEach((img, i) => {
              if (img.url) {
                const data = img.url.split(',')[1];
                folder?.file(`mockup_${i+1}.png`, data, {base64: true});
              }
          });

          const content = await zip.generateAsync({type: "blob"});
          const url = window.URL.createObjectURL(content);
          const a = document.createElement('a');
          a.href = url;
          a.download = `project_mockups_bundle.zip`;
          a.click();
          window.URL.revokeObjectURL(url);
      } catch (e) {
          alert("Failed to create zip file");
      } finally {
          setIsExporting(false);
      }
  };

  const downloadSingle = (url: string, id: string) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-full overflow-y-auto animate-fade-in text-white">
         <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-6 mb-8">
            <h2 className="text-4xl font-bold font-serif mb-2 text-white">Mockup Studio</h2>
            <p className="text-purple-200">Turn your designs into professional lifestyle product photos.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* LEFT PANEL: CREATOR */}
            <div className="xl:col-span-4 space-y-6">
                
                {/* 1. Select Source Image */}
                <div className="bg-[#2d1b4e] p-6 rounded-2xl border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                        <div className="bg-fuchsia-600 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-[0_0_8px_#d946ef]">1</div> 
                        Select Design
                    </h3>
                    
                    {sourceImages.length === 0 ? (
                        <div className="p-4 bg-purple-900/30 rounded-lg text-sm text-purple-300 italic border border-purple-700">
                            No designs available. Go to Dashboard and generate some pages first!
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 max-h-[250px] overflow-y-auto custom-scrollbar p-1">
                            {sourceImages.map(img => (
                                <button 
                                    key={img.id}
                                    onClick={() => setSelectedImageId(img.id)}
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${selectedImageId === img.id ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/50' : 'border-transparent hover:border-purple-400'}`}
                                >
                                    <img src={img.url} className="w-full h-full object-cover" alt="thumb" />
                                    {selectedImageId === img.id && (
                                        <div className="absolute inset-0 bg-fuchsia-500/20 flex items-center justify-center">
                                            <Check className="text-white drop-shadow-md" size={24} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. Choose Scene */}
                <div className="bg-[#2d1b4e] p-6 rounded-2xl border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                           <div className="bg-fuchsia-600 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-[0_0_8px_#d946ef]">2</div> 
                           Scene Setup
                        </h3>
                        <button 
                            onClick={refreshSuggestions}
                            className="text-xs bg-purple-800 text-fuchsia-200 px-3 py-1.5 rounded-full hover:bg-fuchsia-600 hover:text-white transition-colors flex items-center gap-1 border border-purple-600 shadow-sm"
                        >
                            <Sparkles size={12} /> New Ideas
                        </button>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                        {suggestions.map(scene => (
                            <button 
                                key={scene}
                                onClick={() => setCustomPrompt(scene)}
                                className={`w-full text-left text-xs p-3 rounded-lg border transition-all ${customPrompt === scene ? 'bg-purple-900 border-fuchsia-500 text-white shadow-inner' : 'bg-[#1a0b2e] border-purple-800 text-purple-300 hover:border-purple-500 hover:text-white'}`}
                            >
                                {scene}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <textarea 
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Or describe your own custom scene..."
                            className="w-full p-4 rounded-xl border border-purple-600 bg-[#130722] text-white text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none h-28 resize-none placeholder-purple-600 shadow-inner"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/30 border border-red-500/50 p-3 rounded-xl flex items-start gap-2 text-red-200 text-sm animate-fade-in">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <button 
                    onClick={handleGenerate}
                    disabled={!selectedImageId || !customPrompt || isGenerating}
                    className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-fuchsia-400/30"
                >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                    {isGenerating ? "Rendering Scene..." : "Generate Mockup"}
                </button>
            </div>


            {/* RIGHT PANEL: GALLERY */}
            <div className="xl:col-span-8 flex flex-col h-full">
                <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-6 mb-6 flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        Mockup Gallery
                        <span className="text-sm font-normal text-purple-400 bg-purple-900/50 px-2 py-0.5 rounded-full border border-purple-700">
                            {existingMockups.length}
                        </span>
                    </h3>
                    
                    {existingMockups.length > 0 && (
                        <button 
                            onClick={handleExportAll}
                            disabled={isExporting}
                            className="px-4 py-2 bg-purple-900 border border-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-900 transition-colors flex items-center gap-2 text-sm font-medium shadow-[0_0_10px_rgba(217,70,239,0.3)]"
                        >
                            {isExporting ? <Loader2 className="animate-spin" size={16}/> : <FileArchive size={16}/>}
                            Export All Mockups
                        </button>
                    )}
                </div>

                {existingMockups.length === 0 ? (
                    <div className="flex-1 min-h-[400px] border-2 border-dashed border-purple-700 bg-purple-900/10 rounded-3xl flex flex-col items-center justify-center text-purple-400 p-8">
                        <div className="w-24 h-24 bg-purple-900/40 rounded-full flex items-center justify-center mb-6">
                            <ImageIcon size={48} className="opacity-40 text-fuchsia-500" />
                        </div>
                        <p className="text-xl font-semibold mb-2">No Mockups Created Yet</p>
                        <p className="max-w-md text-center opacity-70">Select a design on the left and choose a scene to generate your first professional product mockup.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                         {existingMockups.map((img) => (
                             <div key={img.id} className="group bg-[#1a0b2e] rounded-2xl overflow-hidden border border-purple-800 shadow-xl hover:border-fuchsia-500 transition-all duration-300">
                                 <div className="aspect-[4/3] bg-[#0f0518] relative flex items-center justify-center overflow-hidden">
                                     {img.loading ? (
                                         <div className="flex flex-col items-center gap-3">
                                             <Loader2 className="animate-spin text-fuchsia-500" size={40}/>
                                             <span className="text-xs text-fuchsia-400 animate-pulse">Rendering...</span>
                                         </div>
                                     ) : (
                                         <>
                                            <img src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Mockup" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                <button 
                                                    onClick={() => downloadSingle(img.url, img.id)}
                                                    className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                                                >
                                                    <Download size={16} /> Download
                                                </button>
                                            </div>
                                         </>
                                     )}
                                 </div>
                                 {!img.loading && (
                                     <div className="p-4 border-t border-purple-800">
                                         <p className="text-xs text-purple-300 line-clamp-2 font-medium" title={img.prompt}>
                                             {img.prompt.replace('Mockup: ', '')}
                                         </p>
                                     </div>
                                 )}
                             </div>
                         ))}
                    </div>
                )}
            </div>

        </div>
    </div>
  );
}