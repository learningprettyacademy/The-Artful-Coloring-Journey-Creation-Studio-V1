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

export default function App() {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- Global State ---
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  
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

  // Load from local storage on mount
  useEffect(() => {
    try {
        const saved = localStorage.getItem('brown_suga_projects');
        if (saved) {
            setSavedProjects(JSON.parse(saved));
        }
    } catch (e) {
        console.error("Failed to load saved projects", e);
    }
  }, []);

  // Save to local storage whenever project data changes (if active project)
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

         const otherProjects = savedProjects.filter(p => p.id !== projectId);
         const newSavedList = [updatedProject, ...otherProjects];
         
         setSavedProjects(newSavedList);
         
         try {
             localStorage.setItem('brown_suga_projects', JSON.stringify(newSavedList));
         } catch (e) {
             console.error("LocalStorage Save Failed - likely quota exceeded", e);
         }
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

  const deleteProject = (id: string) => {
      if(confirm("Are you sure you want to delete this project? This cannot be undone.")) {
          const updated = savedProjects.filter(p => p.id !== id);
          setSavedProjects(updated);
          localStorage.setItem('brown_suga_projects', JSON.stringify(updated));
          if (projectId === id) {
              handleRestart();
              setCurrentView('projects');
          }
      }
  };
  
  const handleAddPageFromLibrary = (name: string, prompt: string) => {
      const newPage: GeneratedPage = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name,
          description: "Added from Prompt Generator",
          imagePrompt: prompt,
          isCover: false 
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
    <div className={`flex h-screen overflow-hidden transition-colors duration-500 font-sans ${darkMode ? 'bg-[#0f0720]' : 'bg-purple-50'}`}>
       
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
           />

           {/* Main Content */}
           <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 {renderMainContent()}
              </div>
           </main>
         </>
       )}

    </div>
  );
}