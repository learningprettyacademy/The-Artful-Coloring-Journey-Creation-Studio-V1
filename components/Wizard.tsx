import React, { useState } from 'react';
import { AppStep, WizardState, PublicationSize } from '../types';
import { ArrowRight, BookOpen, Users, Maximize, Lightbulb, Sparkles, Wand2, Loader2, Zap } from 'lucide-react';

interface WizardProps {
  step: AppStep;
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  onNext: () => void;
  onBack: () => void;
  onQuickStart: () => void;
  isGenerating: boolean;
}

interface StepCardProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc?: string;
}

const StepCard: React.FC<StepCardProps> = ({ 
  active, 
  onClick, 
  icon, 
  title, 
  desc 
}) => (
  <button
    onClick={onClick}
    className={`p-6 rounded-2xl text-left transition-all duration-300 backdrop-blur-md border-2
      ${active 
        ? 'bg-purple-900/80 border-fuchsia-500 shadow-[0_0_20px_#d946ef] text-white' 
        : 'bg-[#2d1b4e]/80 border-purple-800 text-purple-200 hover:bg-purple-800 hover:border-purple-500'
      }
    `}
  >
    <div className="mb-3 text-3xl">{icon}</div>
    <div className={`font-semibold text-lg ${active ? 'text-white' : 'text-purple-100'}`}>
      {title}
    </div>
    {desc && <div className={`text-sm mt-1 ${active ? 'text-purple-200' : 'text-purple-400'}`}>
      {desc}
    </div>}
  </button>
);

const THEME_IDEAS = [
  'A whimsical forest with hidden fairies, giant mushrooms, and cute woodland creatures.',
  'Cyberpunk Cityscapes: Neon lights, futuristic buildings, and flying cars in high contrast.',
  'Underwater Kingdom: Mermaids, coral reefs, and sunken treasures.',
  'Steampunk Animals: Mechanical owls, gear-filled cats, and brass elephants.',
  'Cozy Cottagecore: Tea parties, knitting, flower gardens, and rustic kitchens.',
  'Space Odyssey: Astronaut cats, alien planets, and rocket ships.',
  'Mindful Mandalas: Intricate geometric patterns inspired by nature.',
  'Roaring 20s Fashion: Flapper dresses, jazz bands, and art deco architecture.',
  'Mythical Beasts: Dragons, griffins, and phoenixes in epic landscapes.',
  'Foodie Heaven: Kawaii desserts, sushi platters, and towering burgers.',
  'Victorian Greenhouse: Glass domes, exotic ferns, and butterflies.',
  'Retro Arcade: Pixel art, joysticks, and 80s nostalgia patterns.',
  'Celestial Magic: Moons, stars, constellations, and zodiac signs.',
  'Haunted Mansion: Friendly ghosts, cobwebs, and gothic candelabras.',
  'Tropical Paradise: Toucans, hibiscus flowers, and tiki huts.'
];

export const Wizard: React.FC<WizardProps> = ({ 
  step, 
  wizardState, 
  setWizardState, 
  onNext, 
  onBack, 
  onQuickStart,
  isGenerating
}) => {
  
  const [randomIdeas, setRandomIdeas] = useState<string[]>(THEME_IDEAS.slice(0, 5));

  const handleSelect = (key: keyof WizardState, value: any) => {
    setWizardState(prev => ({ ...prev, [key]: value }));
  };

  const shuffleIdeas = () => {
    const shuffled = [...THEME_IDEAS].sort(() => 0.5 - Math.random());
    setRandomIdeas(shuffled.slice(0, 5));
  };

  const renderStepContent = () => {
    switch (step) {
      case AppStep.WELCOME:
        return (
          <div className="text-center space-y-8">
            <div className="relative mx-auto w-24 h-24">
               <div className="absolute inset-0 bg-fuchsia-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
               <div className="relative bg-[#2d1b4e] border border-purple-600 p-5 rounded-full w-full h-full flex items-center justify-center text-fuchsia-300 shadow-2xl">
                 <BookOpen size={48} />
               </div>
            </div>
            
            <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-6 mb-8 mx-auto max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight font-serif text-white">
                The Artful Coloring Journey<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
                   Creation Studio
                </span>
              </h2>
              <p className="text-purple-200 text-lg leading-relaxed font-medium">
                Design stunning coloring books, journals, planners, and sticker sets with AI. 
                Custom sizes, styles, and monetization plans included.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <button 
                  onClick={onNext}
                  className="px-10 py-4 bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:shadow-[0_0_30px_rgba(217,70,239,0.7)] flex items-center gap-3 transform hover:-translate-y-1 border border-fuchsia-400/50 w-full sm:w-auto justify-center"
                >
                  Start Creating <ArrowRight size={22} />
                </button>

                {/* Quick Link to Prompt Generator for users who want to skip the Plan */}
                <button 
                  onClick={onQuickStart}
                  className="px-8 py-4 bg-[#2d1b4e] border border-purple-600 text-purple-200 hover:text-white hover:border-fuchsia-500 rounded-xl font-bold transition-all flex items-center gap-3 w-full sm:w-auto justify-center group"
                >
                  <Zap size={20} className="text-yellow-400 group-hover:text-yellow-300"/> Quick Prompt Generator
                </button>
            </div>
          </div>
        );

      case AppStep.PRODUCT_TYPE:
        const types = [
          { id: 'Coloring Book', icon: '🖍️', desc: 'Pure creative stress relief & Art therapy' },
          { id: 'Daily Planner', icon: '🗓️', desc: 'Structured day to day organization, habit trackers, journal planning prompts, etc.' },
          { id: 'The Artful Journal Journey', icon: '📒', desc: 'Prompts for reflection, gratitude and planning' },
          { id: 'Hybrid Coloring Planner & Journal', icon: '🎨', desc: 'The combination Planner with Journaling, Planning Activity & Coloring Pages.' },
        ];
        return (
          <div className="space-y-6">
            <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-4 mb-2">
                <h3 className="text-2xl font-semibold text-center text-white">What are we creating today?</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {types.map((t) => (
                <StepCard 
                  key={t.id}
                  active={wizardState.productType === t.id}
                  onClick={() => { handleSelect('productType', t.id); setTimeout(onNext, 200); }}
                  icon={t.icon}
                  title={t.id}
                  desc={t.desc}
                />
              ))}
            </div>
             <div className="mt-6">
               <label className="block text-sm font-bold text-purple-900 dark:text-purple-200 mb-2">Or type your own custom product:</label>
               <div className="relative">
                 <input 
                    type="text" 
                    value={wizardState.productType}
                    onChange={(e) => handleSelect('productType', e.target.value)}
                    className="w-full p-4 bg-[#1a0b2e] border border-purple-600 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none text-white placeholder-purple-500"
                    placeholder="e.g. Wedding Planner"
                 />
                 {wizardState.productType && !types.find(t => t.id === wizardState.productType) && (
                    <button 
                      onClick={onNext} 
                      className="absolute right-2 top-2 bottom-2 px-6 bg-fuchsia-600 text-white rounded-lg shadow-lg hover:bg-fuchsia-500 transition-colors"
                    >
                      Next
                    </button>
                 )}
               </div>
            </div>
          </div>
        );

      case AppStep.THEME:
        return (
          <div className="space-y-8 animate-fade-in">
             <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-6 mb-8 text-center">
                 <div className="mx-auto w-16 h-16 bg-purple-900/50 rounded-full flex items-center justify-center mb-4 text-fuchsia-300 border border-purple-600">
                     <Lightbulb size={32} />
                 </div>
                 <h3 className="text-2xl font-semibold text-white">What is the Theme or Concept?</h3>
                 <p className="text-purple-200 mt-2 font-medium">Describe your vision. This will drive the entire creation process.</p>
             </div>

             <div className="max-w-xl mx-auto relative">
                 <div className="absolute top-2 right-2 z-10">
                    <button 
                      onClick={() => handleSelect('theme', THEME_IDEAS[Math.floor(Math.random() * THEME_IDEAS.length)])}
                      className="text-xs bg-fuchsia-600 text-white px-2 py-1 rounded-md shadow-md hover:bg-fuchsia-500 flex items-center gap-1"
                      title="Insert Random Idea"
                    >
                      <Sparkles size={12}/> Surprise Me
                    </button>
                 </div>
                 <textarea 
                    value={wizardState.theme}
                    onChange={(e) => handleSelect('theme', e.target.value)}
                    className="w-full p-6 h-40 bg-[#1a0b2e] border-2 border-purple-600 rounded-2xl focus:ring-4 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 outline-none text-lg text-white placeholder-purple-500 resize-none shadow-inner"
                    placeholder="Describe your theme here..."
                 />
             </div>
             
             <div className="flex flex-col items-center gap-4">
                 <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 text-sm font-bold">
                    <Sparkles size={14} className="text-fuchsia-600 dark:text-fuchsia-400"/>
                    <span>Inspiration Board</span>
                    <button onClick={shuffleIdeas} className="text-fuchsia-600 dark:text-fuchsia-400 hover:text-purple-900 dark:hover:text-white underline text-xs">Refresh</button>
                 </div>
                 <div className="flex flex-wrap gap-2 justify-center">
                     {randomIdeas.map((suggestion, i) => (
                         <button 
                            key={i}
                            onClick={() => handleSelect('theme', suggestion)}
                            className="px-4 py-2 bg-purple-900/40 text-purple-200 rounded-full text-sm hover:bg-purple-800 transition-colors border border-purple-700 hover:border-fuchsia-500 text-left max-w-[200px] truncate"
                            title={suggestion}
                         >
                             {suggestion}
                         </button>
                     ))}
                 </div>
             </div>

             <div className="flex justify-between mt-8">
                <button onClick={onBack} className="text-purple-900 hover:text-purple-700 dark:text-purple-400 dark:hover:text-white font-medium">Back</button>
                <button 
                    onClick={onNext} 
                    disabled={!wizardState.theme}
                    className="px-8 py-3 bg-fuchsia-600 text-white rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.5)] hover:bg-fuchsia-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    Next <ArrowRight size={18} />
                </button>
            </div>
          </div>
        );

      case AppStep.AUDIENCE:
        const audiences = ['Adults', 'Teens', 'Kids (Ages 4-8)', 'Teachers', 'Entrepreneurs', 'New Moms'];
        return (
          <div className="space-y-6">
            <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-4 mb-2">
                <h3 className="text-2xl font-semibold text-center text-white">Who is this for?</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {audiences.map((a) => (
                 <StepCard 
                  key={a}
                  active={wizardState.targetAudience === a}
                  onClick={() => { handleSelect('targetAudience', a); setTimeout(onNext, 200); }}
                  icon={<Users size={24} className="text-fuchsia-400" />}
                  title={a}
                />
              ))}
            </div>
            {/* Custom Audience Input */}
             <div className="mt-4">
                <input 
                    type="text" 
                    value={wizardState.targetAudience}
                    onChange={(e) => handleSelect('targetAudience', e.target.value)}
                    className="w-full p-4 bg-[#1a0b2e] border border-purple-600 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none text-white placeholder-purple-500"
                    placeholder="Or type custom audience..."
                 />
                 {wizardState.targetAudience && !audiences.includes(wizardState.targetAudience) && (
                     <div className="mt-4 text-center">
                        <button onClick={onNext} className="px-6 py-2 bg-fuchsia-600 text-white rounded-lg">Next</button>
                     </div>
                 )}
             </div>

            <div className="flex justify-between mt-8">
                <button onClick={onBack} className="text-purple-900 hover:text-purple-700 dark:text-purple-400 dark:hover:text-white font-medium">Back</button>
            </div>
          </div>
        );

      case AppStep.STYLE:
        const styles = [
            { id: 'Floral & Botanical', img: '🌿' },
            { id: 'Geometric / Mandala', img: '💠' },
            { id: 'Minimalist Line Art', img: '✒️' },
            { id: 'Cute / Kawaii', img: '🐱' },
            { id: 'Boho Chic', img: '🌙' },
            { id: 'Abstract', img: '🎨' }
        ];
        return (
          <div className="space-y-6">
            <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-4 mb-2">
                <h3 className="text-2xl font-semibold text-center text-white">Choose an Art Style</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {styles.map((s) => (
                <StepCard 
                  key={s.id}
                  active={wizardState.artStyle === s.id}
                  onClick={() => { handleSelect('artStyle', s.id); setTimeout(onNext, 200); }}
                  icon={s.img}
                  title={s.id}
                />
              ))}
            </div>
            
             <div className="mt-4">
                <input 
                    type="text" 
                    value={wizardState.artStyle}
                    onChange={(e) => handleSelect('artStyle', e.target.value)}
                    className="w-full p-4 bg-[#1a0b2e] border border-purple-600 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none text-white placeholder-purple-500"
                    placeholder="Or type custom style..."
                 />
                  {wizardState.artStyle && !styles.find(s => s.id === wizardState.artStyle) && (
                     <div className="mt-4 text-center">
                        <button onClick={onNext} className="px-6 py-2 bg-fuchsia-600 text-white rounded-lg">Next</button>
                     </div>
                 )}
             </div>

            <div className="flex justify-between mt-8">
                <button onClick={onBack} className="text-purple-900 hover:text-purple-700 dark:text-purple-400 dark:hover:text-white font-medium">Back</button>
            </div>
          </div>
        );
      
      case AppStep.SIZE:
        const sizes: {id: PublicationSize, desc: string}[] = [
            { id: 'Square (12x12)', desc: 'Perfect for intricate mandalas and patterns' },
            { id: 'Portrait (8.5x11)', desc: 'Standard letter size, great for planners' },
            { id: 'Landscape (11x8.5)', desc: 'Wide format for expansive layouts' },
            { id: 'Custom', desc: 'Enter your own dimensions' },
        ];
        
        return (
            <div className="space-y-6">
                 <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-4 mb-2">
                     <h3 className="text-2xl font-semibold text-center text-white">Select Publication Size</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {sizes.map((s) => (
                         <StepCard 
                            key={s.id}
                            active={wizardState.publicationSize === s.id}
                            onClick={() => handleSelect('publicationSize', s.id)}
                            icon={<Maximize size={24} className="text-fuchsia-400"/>}
                            title={s.id}
                            desc={s.desc}
                         />
                     ))}
                 </div>

                 {wizardState.publicationSize === 'Custom' && (
                     <div className="mt-4 animate-fade-in">
                         <label className="block text-sm font-bold text-purple-900 dark:text-purple-200 mb-2">Custom Dimensions (e.g., 5x7 inches)</label>
                         <input 
                            type="text"
                            value={wizardState.customDimensions || ''}
                            onChange={(e) => handleSelect('customDimensions', e.target.value)}
                            className="w-full p-4 bg-[#1a0b2e] border border-purple-600 rounded-xl focus:ring-2 focus:ring-fuchsia-500 outline-none text-white placeholder-purple-500"
                            placeholder="Width x Height"
                         />
                     </div>
                 )}

                 <div className="flex justify-between mt-8 items-center">
                    <button onClick={onBack} className="text-purple-900 hover:text-purple-700 dark:text-purple-400 dark:hover:text-white font-medium">Back</button>
                    {(wizardState.publicationSize !== 'Custom' || wizardState.customDimensions) && (
                        <>
                        {isGenerating ? (
                            <div className="flex items-center gap-2 text-fuchsia-300">
                                <Loader2 className="animate-spin" size={20} />
                                <span>Designing Project...</span>
                            </div>
                        ) : (
                            <button 
                                onClick={onNext} 
                                className="px-8 py-3 bg-fuchsia-600 text-white rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.5)] hover:bg-fuchsia-500 transition-all font-bold flex items-center gap-2"
                            >
                                <Wand2 size={20} /> Create Project
                            </button>
                        )}
                        </>
                    )}
                </div>
            </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl w-full bg-white/90 dark:bg-[#130722]/90 backdrop-blur-xl border-2 border-purple-200 dark:border-fuchsia-900 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.4)] p-8 md:p-12 mx-4 transition-all duration-500 ease-in-out">
       {/* Progress Dots */}
       {step > AppStep.WELCOME && step < AppStep.DASHBOARD && (
           <div className="flex justify-center gap-3 mb-10">
               {[1, 2, 3, 4, 5].map((i) => (
                   <div key={i} className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${step >= i ? 'bg-fuchsia-500 scale-125 shadow-[0_0_10px_#d946ef]' : 'bg-purple-200 dark:bg-purple-900'}`} />
               ))}
           </div>
       )}
       {renderStepContent()}
    </div>
  );
};