import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  FileUp, 
  Download, 
  Trash2, 
  Image as ImageIcon, 
  Loader2, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Maximize2, 
  Plus, 
  Files, 
  Clock, 
  Menu, 
  X, 
  Settings2, 
  CheckSquare, 
  Square, 
  Filter, 
  ArrowRight, 
  Monitor, 
  Globe,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  Heart
} from 'lucide-react';
import { ConversionStatus, ConvertedPage, PDFMetadata, ExportFormat, AIAnalysis, PDFProject } from './types';
import { loadPDF, convertPageToImage } from './services/pdfService';
import { analyzePDFContent } from './services/geminiService';

type Language = 'en' | 'km';
type Theme = 'light' | 'dark';

const translations = {
  en: {
    welcome: "Welcome to Y.C PDF",
    uploadTitle: "Upload your PDFs",
    uploadDesc: "Fast PDF to high-res images. No size limits.",
    browseFiles: "Browse Files",
    filesQueue: "Files Queue",
    addMore: "Add More PDFs",
    convertQueue: "Convert Queue",
    winEdition: "Win Edition",
    winOptimized: "Windows Optimized",
    explorerFriendly: "Explorer-Friendly Naming",
    convertAll: "Convert All",
    convertSelected: "Convert Selected",
    zipAll: "Zip All",
    zipSelected: "Zip Selection",
    resolution: "Resolution",
    gallery: "Gallery",
    analysis: "Analysis",
    pageRange: "Page range (e.g. 1-5, 10, 15-20)",
    select: "Select",
    selectAll: "Select All",
    clear: "Clear",
    notRendered: "Not Rendered",
    ready: "Ready",
    pending: "Pending",
    error: "Error",
    selected: "SELECTED",
    abstract: "Abstract",
    keyTakeaways: "Key Takeaways",
    pages: "PAGES",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    resetZoom: "Reset",
    credit: "Built by @Sakada_Noeurn",
    themeLight: "Light Mode",
    themeDark: "Dark Mode"
  },
  km: {
    welcome: "សូមស្វាគមន៏មកកាន Y.C PDF",
    uploadTitle: "ដាក់ឯកសារ PDF របស់អ្នក",
    uploadDesc: "បំប្លែង PDF ទៅជារូបភាពច្បាស់ៗ។ មិនកំណត់ទំហំ។",
    browseFiles: "ជ្រើសរើសឯកសារ",
    filesQueue: "បញ្ជីឯកសារ",
    addMore: "បន្ថែម PDF ទៀត",
    convertQueue: "បំប្លែងទាំងអស់",
    winEdition: "កំណែសម្រាប់ Windows",
    winOptimized: "Windows Optimized",
    explorerFriendly: "ដាក់ឈ្មោះសម្រាប់ Windows",
    convertAll: "បំប្លែងទាំងអស់",
    convertSelected: "បំប្លែងដែលបានរើស",
    zipAll: "ទាញយក ZIP ទាំងអស់",
    zipSelected: "ទាញយក ZIP ដែលរើស",
    resolution: "កម្រិតរូបភាព",
    gallery: "រូបភាព",
    analysis: "ការវិភាគ AI",
    pageRange: "ចន្លោះទំព័រ (ឧទាហរណ៍ 1-5, 10)",
    select: "ជ្រើសរើស",
    selectAll: "រើសទាំងអស់",
    clear: "សម្អាត",
    notRendered: "មិនទាន់បំប្លែង",
    ready: "រួចរាល់",
    pending: "កំពុងរង់ចាំ",
    error: "មានបញ្ហា",
    selected: "បានជ្រើសរើស",
    abstract: "សេចក្តីសង្ខេប",
    keyTakeaways: "ចំណុចសំខាន់ៗ",
    pages: "ទំព័រ",
    zoomIn: "ពង្រីក",
    zoomOut: "បង្រួម",
    resetZoom: "ដើមវិញ",
    credit: "រៀបចំដោយ @Sakada_Noeurn",
    themeLight: "ពន្លឺ",
    themeDark: "ងងឹត"
  }
};

const TypewriterText: React.FC<{ lang: Language }> = ({ lang }) => {
  const fullText = translations[lang].welcome;
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);
  const typingSpeed = 150;
  const deletingSpeed = 75;
  const pauseTime = 2000;

  useEffect(() => {
    setDisplayedText("");
    setIndex(0);
    setIsDeleting(false);
  }, [lang]);

  useEffect(() => {
    let timer: number;
    if (!isDeleting && index < fullText.length) {
      timer = window.setTimeout(() => {
        setDisplayedText(prev => prev + fullText[index]);
        setIndex(prev => prev + 1);
      }, typingSpeed);
    } else if (isDeleting && index > 0) {
      timer = window.setTimeout(() => {
        setDisplayedText(prev => prev.slice(0, -1));
        setIndex(prev => prev - 1);
      }, deletingSpeed);
    } else if (!isDeleting && index === fullText.length) {
      timer = window.setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && index === 0) {
      setIsDeleting(false);
    }
    return () => clearTimeout(timer);
  }, [index, isDeleting, fullText]);

  return (
    <div className="h-12 sm:h-24 flex items-center justify-center overflow-hidden px-4">
      <span className={`${lang === 'km' ? 'font-bayon' : 'font-black'} text-2xl sm:text-5xl lg:text-6xl text-slate-800 dark:text-slate-100 tracking-wide typewriter-cursor pr-1 text-center`}>
        {displayedText}
      </span>
    </div>
  );
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('km');
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('yc-pdf-theme') as Theme) || 'light';
  });
  const [projects, setProjects] = useState<PDFProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [dpi, setDpi] = useState<number>(300); 
  const [activeTab, setActiveTab] = useState<'gallery' | 'ai'>('gallery');
  const [selectedPreview, setSelectedPreview] = useState<ConvertedPage | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [rangeInput, setRangeInput] = useState<string>('');
  const [isWindows, setIsWindows] = useState(false);
  const [useWindowsNaming, setUseWindowsNaming] = useState(true);

  const t = translations[language];
  const pdfRefs = useRef<Map<string, any>>(new Map());

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId), 
    [projects, activeProjectId]
  );

  useEffect(() => {
    const platform = window.navigator.userAgent.toLowerCase();
    if (platform.includes('win')) {
      setIsWindows(true);
    }
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('yc-pdf-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const parseRange = (input: string, max: number): number[] => {
    const result = new Set<number>();
    const parts = input.split(',').map(p => p.trim());
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(max, end); i++) {
            result.add(i);
          }
        }
      } else {
        const num = Number(part);
        if (!isNaN(num) && num >= 1 && num <= max) result.add(num);
      }
    });
    return Array.from(result).sort((a, b) => a - b);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length === 0) return;
    for (const file of selectedFiles) {
      if (file.type !== 'application/pdf') continue;
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const placeholder: PDFProject = {
        id, file, metadata: { name: file.name, size: file.size, totalPages: 0 },
        status: ConversionStatus.LOADING, pages: [], selectedPages: [], progress: 0, aiAnalysis: null, error: null
      };
      setProjects(prev => [...prev, placeholder]);
      try {
        const { pdf, metadata } = await loadPDF(file);
        pdfRefs.current.set(id, pdf);
        setProjects(prev => prev.map(p => p.id === id ? { ...p, metadata, status: ConversionStatus.IDLE } : p));
        if (!activeProjectId) setActiveProjectId(id);
      } catch (err) {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, status: ConversionStatus.ERROR, error: "Failed to load PDF." } : p));
      }
    }
  };

  const removeProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    pdfRefs.current.delete(id);
    if (activeProjectId === id) {
      const remaining = projects.filter(p => p.id !== id);
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleOpenPreview = (page: ConvertedPage) => {
    setSelectedPreview(page);
    setPreviewZoom(1);
  };

  const convertProject = async (projectId: string, targetPages?: number[]) => {
    const project = projects.find(p => p.id === projectId);
    const pdf = pdfRefs.current.get(projectId);
    if (!project || !pdf) return;
    const total = project.metadata.totalPages;
    const pagesToConvert = targetPages || Array.from({ length: total }, (_, i) => i + 1);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: ConversionStatus.CONVERTING, progress: 0 } : p));
    const scale = dpi / 72;
    let completedCount = 0;
    try {
      for (const pageNum of pagesToConvert) {
        if (project.pages.find(pg => pg.pageNumber === pageNum)) {
          completedCount++;
          continue;
        }
        const page = await convertPageToImage(pdf, pageNum, scale, exportFormat);
        setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            const newPages = [...p.pages, page].sort((a, b) => a.pageNumber - b.pageNumber);
            return { ...p, pages: newPages, progress: Math.round(((++completedCount) / pagesToConvert.length) * 100) };
          }
          return p;
        }));
        if (pageNum === 1 && !project.aiAnalysis) {
          analyzePDFContent(page.dataUrl).then(analysis => {
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, aiAnalysis: analysis } : p));
          }).catch(console.error);
        }
      }
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: ConversionStatus.COMPLETED } : p));
    } catch (err) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: ConversionStatus.ERROR, error: "Conversion failed." } : p));
    }
  };

  const convertAll = async () => {
    setIsProcessingAll(true);
    for (const p of projects.filter(p => p.status === ConversionStatus.IDLE || p.status === ConversionStatus.COMPLETED)) {
      await convertProject(p.id);
    }
    setIsProcessingAll(false);
  };

  const togglePageSelection = (projectId: string, pageNumber: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const isSelected = p.selectedPages.includes(pageNumber);
        return { ...p, selectedPages: isSelected ? p.selectedPages.filter(num => num !== pageNumber) : [...p.selectedPages, pageNumber].sort((a, b) => a - b) };
      }
      return p;
    }));
  };

  const applyRangeSelection = () => {
    if (!activeProject || !rangeInput) return;
    const selected = parseRange(rangeInput, activeProject.metadata.totalPages);
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, selectedPages: selected } : p));
  };

  const downloadProjectZip = async (project: PDFProject, onlySelected: boolean = false) => {
    // @ts-ignore
    const zip = new JSZip();
    const folder = zip.folder(project.metadata.name.replace('.pdf', '') + "_images");
    const pagesToZip = onlySelected ? project.pages.filter(pg => project.selectedPages.includes(pg.pageNumber)) : project.pages;
    if (pagesToZip.length === 0) return;
    pagesToZip.forEach((page) => {
      const paddingCount = project.metadata.totalPages.toString().length;
      const pageName = useWindowsNaming ? `Page_${page.pageNumber.toString().padStart(paddingCount, '0')}.${exportFormat}` : `page_${page.pageNumber}.${exportFormat}`;
      folder.file(pageName, page.dataUrl.split(',')[1], { base64: true });
    });
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${project.metadata.name.replace('.pdf', '')}_${onlySelected ? 'selection_' : ''}${dpi}dpi.zip`;
    link.click();
  };

  const downloadImage = (page: ConvertedPage) => {
    const link = document.createElement('a');
    link.href = page.dataUrl;
    const padding = activeProject?.metadata.totalPages.toString().length || 3;
    link.download = useWindowsNaming ? `Page_${page.pageNumber.toString().padStart(padding, '0')}_${dpi}dpi.${exportFormat}` : `page_${page.pageNumber}_${dpi}dpi.${exportFormat}`;
    link.click();
  };

  const selectAllPages = () => {
    if (!activeProject) return;
    const all = Array.from({ length: activeProject.metadata.totalPages }, (_, i) => i + 1);
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, selectedPages: all } : p));
  };

  const fontBodyClass = language === 'km' ? 'font-battambang' : 'font-sans';

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden ${fontBodyClass} font-transition relative`}>
      {isSidebarOpen && projects.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl lg:shadow-sm z-40 transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${projects.length === 0 ? 'hidden' : ''}`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Files className="w-5 h-5 text-indigo-600" />
            <h2 className={`font-bold text-slate-800 dark:text-slate-100 ${language === 'km' ? 'font-bayon text-lg' : ''}`}>{t.filesQueue}</h2>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {projects.map((p) => (
            <button key={p.id} onClick={() => setActiveProjectId(p.id)} className={`w-full text-left p-4 rounded-2xl border transition-all relative group ${activeProjectId === p.id ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className={`p-2 rounded-xl shrink-0 ${activeProjectId === p.id ? 'bg-white' : 'bg-slate-50 dark:bg-slate-900/50'}`}><FileText className={`w-4 h-4 ${activeProjectId === p.id ? 'text-indigo-600' : 'text-slate-400'}`} /></div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${activeProjectId === p.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-200'}`}>{p.metadata.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{p.metadata.totalPages || '?'} {t.pages} • {(p.metadata.size / (1024 * 1024)).toFixed(1)}MB</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeProject(p.id); }} className="lg:opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
              {p.status === ConversionStatus.CONVERTING && (
                <div className="w-full h-1 bg-indigo-100 dark:bg-indigo-950 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${p.progress}%` }}></div>
                </div>
              )}
            </button>
          ))}
          <label className="block w-full cursor-pointer group">
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all">
              <Plus className="w-6 h-6 text-slate-300 dark:text-slate-700 group-hover:text-indigo-400" />
              <span className={`text-xs font-bold text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 ${language === 'km' ? 'font-battambang' : ''}`}>{t.addMore}</span>
            </div>
            <input type="file" multiple className="hidden" accept="application/pdf" onChange={handleFileChange} />
          </label>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
           <button onClick={convertAll} disabled={isProcessingAll || projects.length === 0} className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
             {isProcessingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
             <span className={language === 'km' ? 'font-battambang' : ''}>{t.convertQueue}</span>
           </button>
           <div className="pt-2 text-[10px] font-black text-indigo-600/50 dark:text-indigo-400/30 uppercase tracking-[0.4em] flex items-center justify-center gap-1">
             <Heart className="w-2.5 h-2.5 text-red-500" /> {t.credit}
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-2 sm:px-4 lg:px-8 shrink-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
             {projects.length > 0 && <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Menu className="w-5 h-5" /></button>}
             <button onClick={() => setActiveProjectId(null)} className="flex items-center gap-2 sm:gap-3 shrink-0 hover:opacity-70 group transition-all active:scale-95">
               <div className="bg-indigo-600 p-1 rounded-lg shadow-lg hidden xs:block group-hover:bg-indigo-500"><Layers className="text-white w-4 h-4 sm:w-5 sm:h-5" /></div>
               <div className="flex flex-col min-w-0 text-left">
                 <h1 className="text-sm sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Y.C PDF</h1>
                 {isWindows && <span className="text-[7px] sm:text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{t.winEdition}</span>}
               </div>
             </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <button onClick={toggleTheme} className={`p-2 sm:p-2.5 rounded-full transition-all duration-500 flex items-center gap-2 shrink-0 ${theme === 'dark' ? 'bg-slate-800 text-orange-400' : 'bg-slate-100 text-indigo-600 hover:bg-slate-200'}`} title={theme === 'dark' ? t.themeLight : t.themeDark}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="hidden md:inline text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{theme === 'dark' ? t.themeLight : t.themeDark}</span>
            </button>
            <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-full p-0.5 sm:p-1 border border-slate-200 dark:border-slate-700 shadow-inner shrink-0 scale-90 sm:scale-100">
               <button onClick={() => setLanguage('km')} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black transition-all ${language === 'km' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>KM</button>
               <button onClick={() => setLanguage('en')} className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black transition-all ${language === 'en' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>EN</button>
            </div>
            {activeProject && (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                 {activeProject.status !== ConversionStatus.CONVERTING && (
                   <button onClick={() => convertProject(activeProject.id, activeProject.selectedPages.length > 0 ? activeProject.selectedPages : undefined)} className="bg-indigo-600 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-sm shadow-md hover:bg-indigo-700 active:scale-95 transition-all">
                     {activeProject.selectedPages.length > 0 ? <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 hidden xs:block" /> {activeProject.selectedPages.length}</span> : <span className={language === 'km' ? 'font-battambang' : ''}>{language === 'km' ? 'បំប្លែង' : 'Convert'}</span>}
                   </button>
                 )}
                 {activeProject.pages.length > 0 && (
                   <button onClick={() => downloadProjectZip(activeProject, activeProject.selectedPages.length > 0)} className="bg-emerald-600 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-sm shadow-md hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1">
                     <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">ZIP</span>
                   </button>
                 )}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!activeProject ? (
            <div className="h-full flex flex-col items-center justify-center p-4 lg:p-8">
               <div className="max-w-4xl w-full text-center mb-8"><TypewriterText lang={language} /></div>
               <div className="max-w-xl w-full">
                  <label className="block w-full group cursor-pointer">
                    <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-20 flex flex-col items-center justify-center text-center hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-all duration-500 shadow-xl dark:shadow-none shadow-slate-200/50 relative overflow-hidden">
                       <div className="w-12 h-12 sm:w-24 h-24 bg-indigo-50 dark:bg-indigo-950 rounded-full flex items-center justify-center mb-4 sm:mb-8 group-hover:scale-110 transition-transform duration-500 ring-8 ring-indigo-50/50 dark:ring-indigo-900/10 relative z-10">
                          <FileUp className="w-6 h-6 sm:w-10 text-indigo-600 dark:text-indigo-400" />
                       </div>
                       <h2 className={`text-lg sm:text-3xl font-black text-slate-800 dark:text-white mb-2 sm:mb-3 relative z-10 ${language === 'km' ? 'font-bayon' : ''}`}>{t.uploadTitle}</h2>
                       <p className={`text-slate-400 dark:text-slate-500 text-xs sm:text-base font-medium mb-4 sm:mb-8 max-w-xs mx-auto relative z-10 ${language === 'km' ? 'font-battambang' : ''}`}>{t.uploadDesc}</p>
                       <div className="bg-indigo-600 text-white px-6 sm:px-10 py-2.5 sm:py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 dark:shadow-none group-hover:shadow-indigo-200 transition-all text-xs sm:text-base relative z-10">{t.browseFiles}</div>
                    </div>
                    <input type="file" multiple className="hidden" accept="application/pdf" onChange={handleFileChange} />
                  </label>
               </div>
               <div className="mt-8 flex flex-col items-center gap-4 px-4">
                 <div className="text-[10px] font-black text-indigo-600/50 dark:text-indigo-400/30 uppercase tracking-[0.4em] flex items-center gap-2">{t.credit}</div>
               </div>
            </div>
          ) : (
            <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-4 sm:mb-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2rem] shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-800 p-4 sm:p-8 flex items-center gap-4 sm:gap-5">
                   <div className="bg-indigo-50 dark:bg-indigo-950 p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0"><FileText className="text-indigo-600 dark:text-indigo-400 w-6 h-6 sm:w-8 sm:h-8" /></div>
                   <div className="min-w-0">
                      <h2 className="text-sm sm:text-2xl font-black text-slate-800 dark:text-white leading-tight truncate pr-2">{activeProject.metadata.name}</h2>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 font-bold mt-1 uppercase">
                         <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{activeProject.metadata.totalPages} {t.pages}</span>
                         <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full hidden sm:block"></span>
                         <span>{(activeProject.metadata.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                   </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2rem] shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-800 p-5 sm:p-8 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2 text-indigo-600"><Settings2 className="w-4 h-4" /><span className={`text-[10px] font-black uppercase tracking-widest ${language === 'km' ? 'font-bayon' : ''}`}>{t.resolution}</span></div>
                     <span className="text-indigo-600 font-black text-sm">{dpi} DPI</span>
                  </div>
                  <input type="range" min="72" max="300" step="1" value={dpi} onChange={(e) => setDpi(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2.5rem] shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px]">
                 <div className="px-4 sm:px-8 py-3 sm:py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/10">
                    <button onClick={() => setActiveTab('gallery')} className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'gallery' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><ImageIcon className="w-3.5 h-3.5" /> {t.gallery}</button>
                    {activeProject.aiAnalysis && <button onClick={() => setActiveTab('ai')} className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'ai' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Sparkles className="w-3.5 h-3.5" /> {t.analysis}</button>}
                 </div>
                 <div className="p-4 sm:p-8 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                    {Array.from({ length: activeProject.metadata.totalPages }, (_, i) => i + 1).map((pageNum) => {
                       const page = activeProject.pages.find(pg => pg.pageNumber === pageNum);
                       return (
                          <div key={pageNum} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative shadow-sm">
                             <div className="aspect-[3/4] relative bg-slate-50 dark:bg-slate-900">
                                {page ? (
                                   <img src={page.dataUrl} className="w-full h-full object-contain p-2" />
                                ) : (
                                   <div className="absolute inset-0 flex items-center justify-center opacity-20"><ImageIcon className="w-8 h-8" /></div>
                                )}
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                   {page && <button onClick={() => handleOpenPreview(page)} className="p-2 bg-white rounded-lg text-slate-800 shadow-xl"><Maximize2 className="w-4 h-4" /></button>}
                                   {page && <button onClick={() => downloadImage(page)} className="p-2 bg-indigo-600 rounded-lg text-white shadow-xl"><Download className="w-4 h-4" /></button>}
                                </div>
                             </div>
                             <div className="p-2 text-center text-[10px] font-black text-slate-400 uppercase">Page {pageNum}</div>
                          </div>
                       );
                    })}
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedPreview && (
        <div className="fixed inset-0 z-[100] bg-slate-900/98 dark:bg-slate-950/98 backdrop-blur-2xl flex flex-col animate-in fade-in duration-500">
           <div className="flex items-center justify-between p-4 sm:p-8 text-white">
              <span className="bg-indigo-600 px-4 py-1.5 rounded-full text-xs font-black">Page {selectedPreview.pageNumber}</span>
              <button onClick={() => setSelectedPreview(null)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-8 h-8" /></button>
           </div>
           <div className="flex-1 overflow-auto flex items-center justify-center p-4 cursor-move">
              <img src={selectedPreview.dataUrl} className="max-h-[80vh] max-w-full object-contain shadow-2xl rounded bg-white" style={{ transform: `scale(${previewZoom})` }} />
           </div>
           <div className="p-8 flex justify-center gap-4">
              <button onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.2))} className="p-3 bg-white/10 rounded-xl"><ZoomOut className="w-5 h-5 text-white" /></button>
              <button onClick={() => setPreviewZoom(1)} className="p-3 bg-white/10 rounded-xl font-bold text-white text-xs">RESET</button>
              <button onClick={() => setPreviewZoom(z => Math.min(3, z + 0.2))} className="p-3 bg-white/10 rounded-xl"><ZoomIn className="w-5 h-5 text-white" /></button>
              <button onClick={() => downloadImage(selectedPreview)} className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all"><Download className="w-5 h-5" /></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;