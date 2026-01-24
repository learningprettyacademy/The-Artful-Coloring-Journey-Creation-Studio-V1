import React, { useState, useEffect } from 'react';
import { Wizard } from './components/Wizard';
import { Dashboard } from './components/Dashboard';
import { Sidebar } from './components/Sidebar';
import { ProjectGallery } from './components/ProjectGallery';
import { PromptLibrary } from './components/PromptLibrary';
import { PromptGenerator } from './components/PromptGenerator';
import { MockupGenerator } from './components/MockupGenerator';
import { AuthScreen } from './components/AuthScreen';
import { AppStep, WizardState, ProjectPlan, GeneratedImage, GeneratedPage, SavedProject, AppView } from './types';
import { generateProjectPlan, generateAssetImage } from './services/geminiService';
import { getAllProjectsFromDB, saveProjectToDB, deleteProjectFromDB } from './services/storageService';
import { Menu } from 'lucide-react';

export default function App() {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- Global State ---
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // --- Project State ---
  const [projectId, setProjectId] = useState<string | null>(null);
  const [step, setStep] = useState<AppStep>(AppStep.WELCOME);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [wizardState, setWizardState] = useState<WizardState>({
    productType: '',
    theme: '',
    targetAudience: '',
    artStyle: '',
    publicationSize: 'Portrait (8.5x11)',
    generateImagesNow: false
  });
  
  const [projectPlan, setProjectPlan] = useState<ProjectPlan | null>(null);
  const [pages, setPages] = useState<GeneratedPage[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  // --- Persistent Generator State ---
  const [generatorResults, setGeneratorResults] = useState<{title: string, prompt: string}[]>([]);

  // --- Saved Data State ---
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);

  // Load from IndexedDB on mount
  useEffect(() => {
    const loadProjects = async () => {
        try {
            const saved = await getAllProjectsFromDB();
            setSavedProjects(saved);
        } catch (e) {
            console.error("Failed to load saved projects from DB", e);
        }
    };
    if (isAuthenticated) {
        loadProjects();
    }
  }, [isAuthenticated]);

  // Save to IndexedDB whenever project data changes (if active project)
  useEffect(() => {
     if (projectId && projectPlan) {
         const updatedProject: SavedProject = {
             id: projectId,
             timestamp: Date.now(),
             wizardState,
             plan: projectPlan,
             images: generatedImages,
             pages: pages
         };

         // Optimistic UI update
         setSavedProjects(prev => {
             const others = prev.filter(p => p.id !== projectId);
             return [updatedProject, ...others];
         });
         
         // Async Save to DB
         saveProjectToDB(updatedProject).catch(err => {
             console.error("Failed to save project to DB", err);
         });
     }
  }, [projectPlan, pages, generatedImages, wizardState, projectId]); 

  // Dark Mode Toggle
  useEffect(() => {
      if (darkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [darkMode]);

  // --- Actions ---

  const handleNext = async () => {
    if (step === AppStep.SIZE) {
      // Directly finalize after Size step
      await finalizeWizard();
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > AppStep.WELCOME) setStep(prev => prev - 1);
  };

  const handleQuickStart = () => {
      // Create a dummy/blank project structure to allow access to tools immediately
      const blankPlan: ProjectPlan = {
          projectTitle: "Untitled Creative Project",
          concept: "Quick Start Session",
          colorPaletteSuggestions: ["Customize as needed"],
          pages: [],
          monetizationStrategies: []
      };
      
      const newProjectId = `proj_${Date.now()}`;
      setProjectId(newProjectId);
      setProjectPlan(blankPlan);
      setPages([]);
      setGeneratedImages([]);
      setGeneratorResults([]); // Clear previous generator results on new start
      
      // Move to Dashboard state but switch view to Generator
      setStep(AppStep.DASHBOARD);
      setCurrentView('prompts');
  };

  const finalizeWizard = async () => {
    setIsGenerating(true);
    try {
      const sizeString = wizardState.publicationSize === 'Custom' 
        ? `Custom Size: ${wizardState.customDimensions || 'Unspecified'}` 
        : wizardState.publicationSize;

      const plan = await generateProjectPlan(
        wizardState.productType,
        wizardState.theme || "General Creative",
        wizardState.targetAudience,
        wizardState.artStyle,
        sizeString
      );
      
      const newProjectId = `proj_${Date.now()}`;
      setProjectId(newProjectId);
      setProjectPlan(plan);
      setPages(plan.pages);
      setGeneratorResults([]);

      // Default to FALSE for initial generation to prevent timeouts/crashes
      // Users can generate specific images in dashboard
      setGeneratedImages([]);
      setStep(AppStep.DASHBOARD);
      setCurrentView('dashboard');

    } catch (error) {
      console.error("Critical error in generation:", error);
      alert("Something went wrong generating your plan. Please try again. If the issue persists, try a simpler theme.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRestart = () => {
    setProjectId(null);
    setStep(AppStep.WELCOME);
    setWizardState({
      productType: '',
      theme: '',
      targetAudience: '',
      artStyle: '',
      publicationSize: 'Portrait (8.5x11)',
      generateImagesNow: false
    });
    setProjectPlan(null);
    setPages([]);
    setGeneratedImages([]);
    setGeneratorResults([]);
    setCurrentView('dashboard');
  };

  const loadProject = (proj: SavedProject) => {
      setProjectId(proj.id);
      setWizardState(proj.wizardState);
      setProjectPlan(proj.plan);
      setPages(proj.pages);
      setGeneratedImages(proj.images);
      setGeneratorResults([]); // Clear generator when loading new project
      setStep(AppStep.DASHBOARD);
      setCurrentView('dashboard');
  };

  const deleteProject = async (id: string) => {
      if(confirm("Are you sure you want to delete this project? This cannot be undone.")) {
          try {
              await deleteProjectFromDB(id);
              setSavedProjects(prev => prev.filter(p => p.id !== id));
              
              if (projectId === id) {
                  handleRestart();
                  setCurrentView('projects');
              }
          } catch (e) {
              console.error("Failed to delete project", e);
              alert("Failed to delete project");
          }
      }
  };
  
  const handleAddPageFromLibrary = (name: string, prompt: string, renderMode: 'color' | 'line_art') => {
      const newPage: GeneratedPage = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name,
          description: "Added from Prompt Generator",
          imagePrompt: prompt,
          isCover: false,
          renderMode: renderMode // Pass the render mode
      };
      setPages(prev => [...prev, newPage]);
      alert("Success: Page added to Prompt Library/Project Plan!");
  };

  // --- Render Views ---

  const renderMainContent = () => {
      if (currentView === 'projects') {
          return (
              <ProjectGallery 
                 savedProjects={savedProjects} 
                 loadProject={loadProject} 
                 deleteProject={deleteProject}
                 createNew={() => { handleRestart(); setCurrentView('dashboard'); }}
              />
          );
      }

      if (!projectPlan || step !== AppStep.DASHBOARD) {
          return (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <Wizard 
                    step={step}
                    wizardState={wizardState}
                    setWizardState={setWizardState}
                    onNext={handleNext}
                    onBack={handleBack}
                    onQuickStart={handleQuickStart}
                    isGenerating={isGenerating}
                />
            </div>
          );
      }

      // Active Project Views
      switch (currentView) {
          case 'dashboard':
              return (
                 <Dashboard 
                    plan={projectPlan} 
                    setPlan={setProjectPlan}
                    images={generatedImages} 
                    setImages={setGeneratedImages}
                    pages={pages}
                    setPages={setPages}
                    publicationSize={wizardState.publicationSize}
                    onRestart={handleRestart}
                 />
              );
          case 'mockups':
              return (
                  <MockupGenerator 
                      images={generatedImages}
                      setImages={setGeneratedImages}
                  />
              );
          case 'prompts':
              return (
                  <PromptGenerator 
                      plan={projectPlan}
                      onAddPage={handleAddPageFromLibrary}
                      generatedIdeas={generatorResults}
                      setGeneratedIdeas={setGeneratorResults}
                  />
              );
          case 'library':
              return (
                  <PromptLibrary 
                      plan={projectPlan}
                      pages={pages}
                      setPages={setPages}
                  />
              );
          default: 
             return null;
      }
  };

  return (
    <div className={`flex flex-col md:flex-row h-[100dvh] overflow-hidden transition-colors duration-500 font-sans ${darkMode ? 'bg-[#0f0720]' : 'bg-purple-50'}`}>
       
       {/* Background Elements */}
       <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 mix-blend-multiply transition-colors duration-1000 ${darkMode ? 'bg-purple-900' : 'bg-purple-300'}`}></div>
          <div className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-40 mix-blend-multiply transition-colors duration-1000 ${darkMode ? 'bg-indigo-900' : 'bg-fuchsia-300'}`}></div>
       </div>

       {!isAuthenticated ? (
         <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />
       ) : (
         <>
           {/* Sidebar */}
           <Sidebar 
              currentView={currentView}
              setCurrentView={setCurrentView}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              hasActiveProject={!!projectPlan && step === AppStep.DASHBOARD}
              isMobileOpen={isMobileOpen}
              setIsMobileOpen={setIsMobileOpen}
           />

           {/* Main Content */}
           <main className="flex-1 relative z-10 overflow-hidden flex flex-col w-full">
              {/* Mobile Header Trigger */}
              <div className="md:hidden p-4 flex items-center justify-between bg-[#1a0b2e] border-b border-purple-800 shadow-md z-30">
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-white text-lg">Brown Suga Studio</span>
                  </div>
                  <button 
                    onClick={() => setIsMobileOpen(true)} 
                    className="text-white p-2 rounded-lg bg-purple-900/50 border border-purple-700 hover:bg-purple-800"
                  >
                      <Menu size={24} />
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 {renderMainContent()}
              </div>
           </main>
         </>
       )}

    </div>
  );
}