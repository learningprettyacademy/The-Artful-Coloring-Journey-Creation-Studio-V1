import React from 'react';
import { SavedProject } from '../types';
import { Trash2, FolderOpen, Calendar, BookOpen, ChevronRight } from 'lucide-react';

interface ProjectGalleryProps {
  savedProjects: SavedProject[];
  loadProject: (project: SavedProject) => void;
  deleteProject: (id: string) => void;
  createNew: () => void;
}

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({ 
  savedProjects, 
  loadProject, 
  deleteProject,
  createNew 
}) => {

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Prevent card click
      deleteProject(id);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto animate-fade-in text-white">
      <div className="bg-[#2d1b4e] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] rounded-2xl p-6 mb-8 flex justify-between items-center">
        <div>
           <h2 className="text-4xl font-bold text-white font-serif mb-2">Project Gallery</h2>
           <p className="text-purple-200">Manage your saved coloring books, planners, and journals.</p>
        </div>
        <button 
           onClick={createNew}
           className="px-6 py-3 bg-fuchsia-700 border border-fuchsia-500 text-white rounded-xl shadow-[0_0_15px_rgba(217,70,239,0.4)] hover:bg-fuchsia-600 transition-all font-medium flex items-center gap-2 transform hover:-translate-y-1"
        >
           <BookOpen size={20} /> Start New Project
        </button>
      </div>

      {savedProjects.length === 0 ? (
        <div className="bg-[#2d1b4e]/50 border-2 border-dashed border-purple-600 rounded-3xl h-[400px] flex flex-col items-center justify-center text-center p-8">
           <div className="w-20 h-20 bg-purple-900/40 rounded-full flex items-center justify-center mb-6 text-fuchsia-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
              <FolderOpen size={40} />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">No Saved Projects Yet</h3>
           <p className="text-purple-400 max-w-md">Start a new project in the Studio Wizard and save it to see it appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {savedProjects.map((proj) => (
             <div key={proj.id} className="bg-[#1a0b2e] border border-purple-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:border-fuchsia-500 transition-all group">
                <div className="h-32 bg-gradient-to-br from-purple-800 to-indigo-900 p-6 relative overflow-hidden border-b border-purple-700">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500 rounded-full blur-[50px] transform translate-x-10 -translate-y-10 opacity-40"></div>
                    <div className="relative z-10">
                        <span className="bg-black/30 text-fuchsia-200 text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
                            {proj.wizardState.productType}
                        </span>
                        <h3 className="text-white text-xl font-bold font-serif mt-2 line-clamp-1 drop-shadow-md">{proj.plan.projectTitle}</h3>
                        <p className="text-purple-200 text-xs mt-1 line-clamp-1 opacity-80">{proj.plan.concept}</p>
                    </div>
                </div>
                
                <div className="p-5">
                   <div className="flex items-center gap-2 text-xs text-purple-400 mb-4">
                      <Calendar size={14} />
                      <span>{new Date(proj.timestamp).toLocaleDateString()}</span>
                      <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                      <span>{proj.pages.length} Pages</span>
                   </div>

                   <div className="flex gap-2">
                      <button 
                        onClick={() => loadProject(proj)}
                        className="flex-1 py-2.5 bg-purple-900/50 text-fuchsia-200 rounded-lg hover:bg-fuchsia-700 hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-purple-700"
                      >
                         Open Studio <ChevronRight size={16} />
                      </button>
                      <button 
                         onClick={(e) => handleDelete(e, proj.id)}
                         className="p-2.5 text-purple-500 hover:text-white hover:bg-red-900/80 rounded-lg transition-colors border border-transparent hover:border-red-500"
                         title="Delete Project"
                      >
                         <Trash2 size={18} />
                      </button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}