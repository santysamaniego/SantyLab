import React, { useState, useEffect, useRef } from 'react';
import { HashRouter } from 'react-router-dom';
import StarField from './components/StarField';
import AdminPanel from './components/AdminPanel';
import Modal from './components/Modal';
import { Project, User, ChatMessage, ChatSession } from './types';
import { getProjects, signIn, signOut, getChatSessions, saveChatSession, sendMessage, getCategories, registerUser, getActiveSessionUser } from './services/dataService';
import { generateAIResponse } from './services/geminiService';

// --- COMPONENTS ---

const Navbar = ({ user, onLoginClick, onAdminClick, onLogout }: { user: User | null, onLoginClick: () => void, onAdminClick: () => void, onLogout: () => void }) => (
  <nav className="fixed w-full z-40 top-0 border-b border-white/5 bg-black/50 backdrop-blur-md">
    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-neon-indigo rounded-full animate-pulse"></div>
        <h1 className="font-display font-bold text-2xl tracking-tighter text-white select-none">
          SANTY<span className="text-neon-indigo">.LAB</span>
        </h1>
      </div>
      <div className="flex gap-4 md:gap-6 items-center">
        {user ? (
          <div className="flex items-center gap-4">
             {user.isAdmin && (
                 <button onClick={onAdminClick} className="hidden md:block text-xs bg-neon-indigo/20 text-neon-indigo border border-neon-indigo px-3 py-1 rounded hover:bg-neon-indigo hover:text-white transition-all font-display tracking-wider">
                     PANEL
                 </button>
             )}
            <span className="text-sm text-gray-300 font-display hidden md:block">
              {user.name}
            </span>
            <button onClick={onLogout} className="text-xs text-red-400 border border-red-500/30 px-3 py-1 rounded hover:bg-red-900/20 transition-all">
                SALIR
            </button>
          </div>
        ) : (
          <button onClick={onLoginClick} className="text-sm font-bold text-neon-indigo hover:text-white transition-colors tracking-widest">
            ACCESO
          </button>
        )}
      </div>
    </div>
  </nav>
);

const Footer = () => (
    <footer className="w-full border-t border-white/10 bg-black/90 backdrop-blur-md py-12 z-20 relative mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="text-center md:text-left space-y-2">
                <h2 className="font-display font-bold text-xl tracking-tighter text-white">
                    SANTY<span className="text-neon-indigo">.LAB</span>
                </h2>
                <p className="text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} Santy.Lab. Todos los derechos reservados.
                </p>
                <div className="flex gap-2 text-[10px] text-gray-600 font-mono mt-2 justify-center md:justify-start">
                    <span>SYS_VER: 2.4.0</span>
                    <span>|</span>
                    <span>REGION: SOUTH_AMERICA</span>
                </div>
            </div>
            <div className="hidden md:flex flex-col items-center justify-center opacity-50">
                <div className="flex gap-1 mb-1">
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-green-500 font-mono">SYSTEM OPERATIONAL</span>
                </div>
                <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>
            <div className="flex flex-col gap-4 items-center md:items-end">
                <div className="flex gap-6">
                     <a href="https://wa.me/5491169595853" target="_blank" rel="noreferrer" className="group flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        <span className="text-xs font-mono group-hover:underline decoration-green-400/50 underline-offset-4">Connect</span>
                     </a>
                     <a href="https://instagram.com/santy.samaniego" target="_blank" rel="noreferrer" className="group flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        <span className="text-xs font-mono group-hover:underline decoration-pink-500/50 underline-offset-4">Follow</span>
                     </a>
                </div>
            </div>
        </div>
    </footer>
);

// --- 3D CAROUSEL (Updated for Mobile & Explosion) ---
const ThreeDCarousel = ({ projects, validCategories, onSelectProject }: { projects: Project[], validCategories: string[], onSelectProject: (p: Project) => void }) => {
    const orbitProjects = projects.filter(p => p.showInCarousel !== false).slice(0, 7);
    const [rotation, setRotation] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const lastRotation = useRef(0);
    const [isExploding, setIsExploding] = useState(false);
    
    // Dynamic Width for Mobile
    const [cardWidth, setCardWidth] = useState(200);
    
    useEffect(() => {
        const handleResize = () => {
            setCardWidth(window.innerWidth < 768 ? 130 : 250);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const count = Math.max(orbitProjects.length, 3);
    // Increased spacing (+80) to make them look less crowded/smaller in perspective while keeping 310 width
    const radius = Math.round((cardWidth + 40) / (2 * Math.tan(Math.PI / count))) + (window.innerWidth < 768 ? 20 : 50);

    useEffect(() => {
        let animationFrame: number;
        const animate = () => {
            if (!isDragging.current && !isExploding) {
                setRotation(prev => prev + 0.05);
            }
            animationFrame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationFrame);
    }, [isExploding]);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (isExploding) return;
        isDragging.current = true;
        startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
        lastRotation.current = rotation;
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging.current || isExploding) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const delta = clientX - startX.current;
        setRotation(lastRotation.current + delta * 0.2); 
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleProjectClick = (proj: Project) => {
        if (isDragging.current) return;
        setIsExploding(true);
        setTimeout(() => {
            onSelectProject(proj);
            // Reset explosion after modal opens roughly
            setTimeout(() => setIsExploding(false), 1000);
        }, 800);
    };

    if (orbitProjects.length === 0) return null;

    return (
        <section 
            className="carousel-scene relative h-[600px] md:h-[800px] w-full flex flex-col items-center justify-center bg-transparent pt-10 md:pt-20 overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
        >
             {/* Header Title */}
             <div className={`absolute top-[10%] md:top-[15%] z-20 text-center pointer-events-none transition-opacity duration-500 ${isExploding ? 'opacity-0' : 'opacity-100'}`}>
                <h2 className="text-3xl md:text-5xl font-display font-light text-white tracking-widest opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    PROYECTOS PRINCIPALES
                </h2>
                <div className="w-24 h-1 bg-neon-indigo mx-auto mt-4 rounded-full shadow-[0_0_10px_#6366f1]"></div>
             </div>

             <div 
                className="carousel-container relative w-full h-full flex items-center justify-center mt-10 md:mt-20"
                style={{ 
                    transform: `rotateX(-10deg) rotateY(${rotation}deg)`,
                    transition: isDragging.current ? 'none' : 'transform 0.1s linear' 
                }}
             >
                {/* MILKY WAY CENTER (Explodes/Scales Up/Fades on click) */}
                <div 
                    className="absolute w-[200px] h-[200px] md:w-[300px] md:h-[300px] rounded-full galaxy-disk opacity-80"
                    style={{
                        transform: isExploding ? 'rotateX(90deg) scale(5)' : 'rotateX(90deg) scale(1)',
                        opacity: isExploding ? 0 : 0.8,
                        transition: 'all 0.8s ease-in' 
                    }}
                >
                    <div className="absolute inset-0 rounded-full animate-spin-slow opacity-50" 
                         style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgba(99,102,241,0.5) 20%, transparent 40%, rgba(168,85,247,0.5) 60%, transparent 100%)' }} 
                    />
                </div>

                {/* CARDS */}
                {orbitProjects.map((proj, i) => {
                    const theta = 360 / count;
                    const angle = i * theta;
                    const isValidCategory = validCategories.includes(proj.category);
                    
                    // Explosion offsets
                    const explodeZ = isExploding ? 1000 : 0; // Fly outwards
                    const explodeY = isExploding ? (Math.random() - 0.5) * 500 : 0;
                    
                    return (
                        <div 
                            key={proj.id}
                            className="absolute"
                            style={{
                                width: `${cardWidth}px`,
                                height: `${cardWidth * 1.2}px`, // Slightly reduced height ratio (1.2 instead of 1.25)
                                top: '50%',
                                left: '50%',
                                marginTop: `-${(cardWidth * 1.2) / 2}px`,
                                marginLeft: `-${cardWidth / 2}px`,
                                transform: `rotateY(${angle}deg) translateZ(${radius + explodeZ}px) translateY(${explodeY}px)`,
                                transition: 'transform 0.8s ease-in',
                                opacity: isExploding ? 0 : 1
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleProjectClick(proj);
                            }}
                        >
                            <div className="w-full h-full glass rounded-xl border border-white/10 p-2 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] group hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:border-neon-indigo/50 transition-all duration-300">
                                <div className="w-full h-3/5 overflow-hidden rounded-lg mb-2 relative pointer-events-none">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"/>
                                    <img src={proj.imageUrls[0]} alt={proj.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="text-center pointer-events-none">
                                    <h3 className="text-white font-display text-sm truncate">{proj.title}</h3>
                                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-tight hidden md:block">{proj.description}</p>
                                    {isValidCategory && (
                                        <span className="inline-block mt-2 text-[9px] text-neon-cyan border border-neon-cyan/30 px-2 py-0.5 rounded uppercase tracking-wider">
                                            {proj.category}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
             </div>
             
             {!isExploding && (
                 <div className="absolute bottom-20 md:bottom-10 text-center w-full pointer-events-none">
                     <p className="text-xs text-gray-500 tracking-[0.5em] animate-pulse">ARRASTRAR PARA EXPLORAR</p>
                 </div>
             )}
        </section>
    );
};

const TechTerminal = ({ isDanger }: { isDanger: boolean }) => {
    const [lines, setLines] = useState<string[]>([]);
    useEffect(() => {
        const commands = ['SYS_ALLOCATE', 'BUFFER_OVR', 'NET_Handshake', 'PING 127.0.0.1', 'DECRYPTING...', 'ACCESS_GRANTED', 'RENDER_FRAME', 'OPTIMIZING_DB'];
        const dangerCommands = ['CRITICAL_FAILURE', 'CORE_OVERHEAT', 'BREACH_DETECTED', 'SYSTEM_ABORT', 'MEMORY_DUMP', 'ERROR_0x992', 'FATAL_EXCEPTION'];
        const intervalMs = isDanger ? 100 : 800;
        const interval: any = setInterval(() => {
             setLines(prev => {
                 const pool = isDanger ? dangerCommands : commands;
                 const newLine = `> ${pool[Math.floor(Math.random() * pool.length)]}_${Math.floor(Math.random()*999)}`;
                 const newLines = [...prev, newLine];
                 if (newLines.length > 6) newLines.shift();
                 return newLines;
             });
        }, intervalMs);
        return () => clearInterval(interval);
    }, [isDanger]);
    return (
        <div className={`font-mono text-[10px] space-y-1 h-32 overflow-hidden transition-colors duration-300 ${isDanger ? 'text-red-500 font-bold' : 'text-green-500/80'}`}>
            {lines.map((l, i) => <div key={i} className="animate-in fade-in duration-300">{l}</div>)}
        </div>
    );
};

const SystemStats = ({ isDanger }: { isDanger: boolean }) => {
    const [latency, setLatency] = useState(12);
    const [status, setStatus] = useState("ONLINE");
    useEffect(() => {
        if (!isDanger) {
            setLatency(12);
            setStatus("ONLINE");
            return;
        }
        const interval = setInterval(() => {
            setLatency(Math.floor(Math.random() * 9000) + 100);
            setStatus(Math.random() > 0.5 ? "CRITICAL" : "FAILING");
        }, 50);
        return () => clearInterval(interval);
    }, [isDanger]);
    return (
        <div className={`flex gap-4 text-xs font-mono transition-colors duration-300 ${isDanger ? 'text-red-500 animate-pulse font-bold' : 'text-gray-500'}`}>
            <span className="hidden md:inline">SYS_STATUS: {status}</span>
            <span>DB: {isDanger ? 'UNSTABLE' : 'OK'}</span>
            <span>LAT: {latency}ms</span>
        </div>
    );
};

const ProjectGrid = ({ projects, validCategories, onSelectProject, isDanger }: { projects: Project[], validCategories: string[], onSelectProject: (p: Project) => void, isDanger: boolean }) => {
    const gridProjects = projects.filter(p => p.showInGrid !== false);
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        if (gridProjects.length > 0 && !activeId) {
            setActiveId(gridProjects[0].id);
        }
    }, [gridProjects]);

    if (gridProjects.length === 0) return null;

    return (
        <section className="relative w-full py-24 border-t border-white/5 bg-space-dark/30">
            <div className="absolute inset-0 tech-grid-bg pointer-events-none z-0"></div>
            <div className="relative z-10 w-full px-4 md:px-8 lg:px-12">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/5 pb-4 gap-4">
                    <h2 className="text-3xl font-display font-bold flex items-center gap-4">
                        <span className="text-neon-indigo">///</span> ARCHIVO DE PROYECTOS
                    </h2>
                    <SystemStats isDanger={isDanger} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr_200px] gap-8 min-h-[600px] w-full">
                    {/* Left Deco - RESTORED SYSTEM TEXT AND LINES */}
                    <div className="hidden xl:flex flex-col justify-between py-10 border-r border-white/5 pr-8">
                        <div className="space-y-6">
                            <h2 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-gray-500 to-gray-900/10 select-none">
                                SYSTEM
                            </h2>
                            <div className="space-y-4">
                                <div className={`h-1 w-full rounded transition-colors duration-300 ${isDanger ? 'bg-red-900' : 'bg-neon-indigo/20'}`}>
                                    <div className={`h-full w-2/3 animate-pulse transition-colors duration-300 ${isDanger ? 'bg-red-600' : 'bg-neon-indigo'}`}></div>
                                </div>
                                <div className={`text-xs font-mono transition-colors duration-300 ${isDanger ? 'text-red-500' : 'text-gray-500'}`}>
                                    <p>SECTOR_01</p>
                                    <p>GRID_{isDanger ? 'UNSTABLE' : 'ALIGNED'}</p>
                                </div>
                                {/* Restored 2 lines */}
                                <div className="flex flex-col gap-1 opacity-30">
                                    <div className="w-full h-px bg-white"></div>
                                    <div className="w-2/3 h-px bg-white"></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 text-right opacity-80 border-t border-b border-white/5 py-2 my-4">
                             <TechTerminal isDanger={isDanger} />
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col md:flex-row h-[600px] w-full gap-2 overflow-hidden">
                        {gridProjects.map((proj) => {
                            const isActive = activeId === proj.id;
                            const isValidCategory = validCategories.includes(proj.category);
                            return (
                                <div
                                    key={proj.id}
                                    onMouseEnter={() => setActiveId(proj.id)}
                                    onClick={() => onSelectProject(proj)}
                                    className={`
                                        relative overflow-hidden rounded-2xl border cursor-pointer elastic-card
                                        ${isActive 
                                            ? isDanger 
                                                ? 'flex-[3] border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
                                                : 'flex-[3] border-neon-indigo/50 shadow-[0_0_30px_rgba(99,102,241,0.2)]' 
                                            : 'flex-1 border-white/5 bg-space-card'}
                                    `}
                                >
                                    <div className="absolute inset-0 w-full h-full">
                                        <div className={`absolute inset-0 bg-black/60 transition-colors duration-500 z-10 ${isActive ? 'bg-black/20' : 'bg-black/70'}`}></div>
                                        <img 
                                            src={proj.imageUrls[0]} 
                                            alt={proj.title} 
                                            className={`w-full h-full object-cover project-card-image ${isActive ? 'grayscale-0 scale-105' : 'grayscale scale-100'}`}
                                        />
                                    </div>
                                    <div className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-300 ${isActive ? 'opacity-0' : 'opacity-100 delay-100'}`}>
                                        <h3 className="vertical-text font-display font-bold text-xl md:text-2xl tracking-widest text-gray-400 uppercase">
                                            {proj.title}
                                        </h3>
                                    </div>
                                    <div 
                                        className={`
                                            absolute bottom-0 left-0 w-full p-4 md:p-8 z-20 bg-gradient-to-t from-black via-black/80 to-transparent
                                            content-slide-up
                                            ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            {isValidCategory && (
                                                <span className="text-neon-cyan text-xs font-bold px-2 py-1 bg-cyan-900/30 border border-cyan-500/30 rounded">
                                                    {proj.category}
                                                </span>
                                            )}
                                            <span className={`text-[10px] md:text-xs animate-pulse ${isDanger ? 'text-red-500' : 'text-neon-indigo'}`}>
                                                {isDanger ? 'INITIATING...' : 'CLICK TO LAUNCH'}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">{proj.title}</h3>
                                        <p className="text-gray-300 mb-4 line-clamp-2 text-xs md:text-sm max-w-lg">{proj.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Deco - Categories & ADDED GRAPH */}
                    <div className="hidden xl:flex flex-col justify-start py-10 border-l border-white/5 pl-8 space-y-8 h-full">
                        <div>
                             <h4 className="text-neon-cyan text-xs font-bold mb-4 tracking-widest">CATEGORIAS</h4>
                             <div className="flex flex-col gap-2">
                                 {validCategories.map(cat => (
                                     <div key={cat} className="flex items-center gap-2 group cursor-default">
                                         <div className="w-1.5 h-1.5 bg-gray-600 group-hover:bg-neon-cyan rounded-full transition-colors"></div>
                                         <span className="text-gray-500 group-hover:text-white text-xs font-mono transition-colors">{cat}</span>
                                     </div>
                                 ))}
                             </div>
                        </div>
                        
                        {/* New Tech Graph at the bottom */}
                        <div className="mt-auto">
                            <div className="flex items-end gap-1 h-12 opacity-40 mb-2">
                                <div className="w-1 bg-neon-cyan h-[40%]"></div>
                                <div className="w-1 bg-neon-cyan h-[70%]"></div>
                                <div className="w-1 bg-neon-cyan h-[50%]"></div>
                                <div className="w-1 bg-neon-cyan h-[100%]"></div>
                                <div className="w-1 bg-neon-cyan h-[60%]"></div>
                                <div className="w-1 bg-neon-cyan h-[30%]"></div>
                                <div className="w-1 bg-neon-cyan h-[80%]"></div>
                            </div>
                            <div className="text-[9px] font-mono text-gray-600">
                                METRICS_VISUALIZATION<br/>
                                V.2.4.1
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- UPDATED MODAL (Carousel & Fullscreen & Dynamic Descriptions & Consult) ---
const ProjectDetailModal = ({ project, onClose, onConsult }: { project: Project, onClose: () => void, onConsult: (msg: string) => void }) => {
    const [mounted, setMounted] = useState(false);
    const [activeImgIndex, setActiveImgIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showConsultOptions, setShowConsultOptions] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setActiveImgIndex(prev => (prev + 1) % project.imageUrls.length);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setActiveImgIndex(prev => (prev - 1 + project.imageUrls.length) % project.imageUrls.length);
    };

    const handleWhatsApp = () => {
        const message = `Hola, quería hacerte una consulta sobre el proyecto ${project.title} (ID: ${project.id})`;
        const url = `https://wa.me/5491169595853?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleWebChat = () => {
        const message = `Hola, quería hacerte una consulta sobre el proyecto ${project.title} (ID: ${project.id})`;
        onConsult(message);
        onClose();
    };

    // Calculate dynamic description
    const currentDescription = (project.imageCaptions && project.imageCaptions[activeImgIndex])
        ? project.imageCaptions[activeImgIndex]
        : project.description;

    // Full Screen View
    if (isFullScreen) {
        return (
            <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-300">
                <button 
                    onClick={() => setIsFullScreen(false)}
                    className="absolute top-4 right-4 z-[101] text-white hover:text-red-500 bg-black/50 p-3 rounded-full border border-white/20"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                
                <div className="relative w-full h-full flex items-center justify-center">
                     <img 
                        src={project.imageUrls[activeImgIndex]} 
                        alt={project.title} 
                        className="max-w-full max-h-full object-contain"
                     />
                     
                     {project.imageUrls.length > 1 && (
                        <>
                            <button onClick={prevImage} className="absolute left-4 z-[101] text-white bg-black/50 p-4 rounded-full hover:bg-neon-indigo/50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                            <button onClick={nextImage} className="absolute right-4 z-[101] text-white bg-black/50 p-4 rounded-full hover:bg-neon-indigo/50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                            
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                                {project.imageUrls.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${idx === activeImgIndex ? 'bg-neon-indigo' : 'bg-white/30 hover:bg-white/50'}`}
                                        onClick={(e) => { e.stopPropagation(); setActiveImgIndex(idx); }}
                                    />
                                ))}
                            </div>
                        </>
                     )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 md:p-0">
            <div className={`
                relative w-full max-w-5xl h-[85vh] md:h-[80vh] bg-[#0a0a0f] border border-neon-cyan/30 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.2)]
                flex flex-col md:flex-row overflow-hidden transform transition-all duration-700
                ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
            `}>
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 text-neon-cyan hover:text-white bg-black/50 p-2 rounded-full border border-neon-cyan/30 hover:border-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                {/* Left/Top Side: Visuals (Carousel) */}
                <div className="w-full h-48 md:h-full md:w-1/2 relative bg-black border-b md:border-b-0 md:border-r border-white/10 shrink-0 group">
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10 pointer-events-none"></div>
                     
                     <div className="w-full h-full cursor-zoom-in" onClick={() => setIsFullScreen(true)}>
                         {project.imageUrls[activeImgIndex] && (
                             <img 
                                src={project.imageUrls[activeImgIndex]} 
                                alt={project.title} 
                                className="w-full h-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                             />
                         )}
                     </div>
                     
                     {/* Carousel Controls (Overlay) */}
                     {project.imageUrls.length > 1 && (
                         <>
                            <button 
                                onClick={prevImage}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-indigo/50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                            <button 
                                onClick={nextImage}
                                className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-indigo/50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                            
                            {/* Dots */}
                            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
                                {project.imageUrls.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === activeImgIndex ? 'bg-neon-cyan' : 'bg-gray-500'}`}
                                    />
                                ))}
                            </div>
                         </>
                     )}

                     <div className="absolute inset-0 tech-grid-bg opacity-30 z-10 pointer-events-none"></div>
                     <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-20">
                         <div className="flex items-center gap-2 mb-2">
                             <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                             <span className="text-neon-green font-mono text-[10px] md:text-xs">LIVE PREVIEW MODE</span>
                         </div>
                     </div>
                     
                     <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-gray-300 bg-black/60 px-2 py-1 rounded border border-white/10">
                            IMG {activeImgIndex + 1} / {project.imageUrls.length}
                        </span>
                     </div>
                </div>

                {/* Right/Bottom Side: Data */}
                <div className="w-full md:w-1/2 p-6 md:p-12 overflow-y-auto hud-scrollbar relative flex-1">
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-4 mb-4 md:mb-6">
                                <span className="text-neon-cyan font-mono text-[10px] border border-neon-cyan/30 px-2 py-1">
                                    ID: {project.id.toUpperCase().substring(0, 6)}
                                </span>
                                <span className="text-gray-500 font-mono text-[10px] uppercase">
                                    {project.category}
                                </span>
                            </div>

                            <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-4 md:mb-6 tracking-wide">
                                {project.title.toUpperCase()}
                            </h2>

                            <div className="space-y-4 md:space-y-6 text-gray-300 font-light leading-relaxed text-sm md:text-base min-h-[100px] animate-in fade-in duration-500 key={activeImgIndex}">
                                <p>{currentDescription}</p>
                            </div>

                            <div className="mt-6 md:mt-8">
                                <h4 className="text-neon-indigo font-display text-sm mb-4 tracking-widest border-b border-neon-indigo/30 pb-2 inline-block">
                                    CORE TECHNOLOGIES
                                </h4>
                                <div className="flex flex-wrap gap-2 md:gap-3">
                                    {project.techStack.map(tech => (
                                        <div key={tech} className="flex items-center gap-2 bg-white/5 px-2 py-1 md:px-3 md:py-2 rounded border border-white/10">
                                            <div className="w-1.5 h-1.5 bg-neon-purple rounded-full"></div>
                                            <span className="text-[10px] md:text-xs font-mono text-gray-300">{tech}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10 pb-8 md:pb-0">
                             {!showConsultOptions ? (
                                <button 
                                    onClick={() => setShowConsultOptions(true)}
                                    className="w-full bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan font-display font-bold py-3 md:py-4 rounded tracking-[0.2em] transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] text-sm md:text-base"
                                >
                                    CONSULTAR POR ESTE DISEÑO
                                </button>
                             ) : (
                                <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <button 
                                        onClick={handleWhatsApp}
                                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 font-display font-bold py-3 rounded tracking-wider transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>WHATSAPP</span>
                                    </button>
                                    <button 
                                        onClick={handleWebChat}
                                        className="flex-1 bg-neon-blue/20 hover:bg-neon-blue/30 border border-neon-blue/50 text-neon-blue font-display font-bold py-3 rounded tracking-wider transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>CHAT WEB</span>
                                    </button>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... (AiConsultant remains the same)
// 4. AI CONSULTANT (Exclusive Widget)
const AiConsultant = ({ projects, isOpen, onToggle }: { projects: Project[], isOpen: boolean, onToggle: () => void }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Saludos. Soy Nova, IA consultora de Santy.Lab. Consulta sobre nuestro portafolio o capacidades." }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    const reply = await generateAIResponse(userMsg, projects);
    setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    setLoading(false);
  };

  useEffect(() => {
    if(isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  return (
    <>
      <button 
        onClick={onToggle}
        className={`fixed bottom-6 right-24 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isOpen ? 'bg-white text-neon-purple scale-110' : 'bg-gradient-to-r from-neon-purple to-neon-indigo text-white hover:scale-110 shadow-[0_0_20px_rgba(168,85,247,0.5)]'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 h-[400px] glass-high rounded-2xl flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-neon-purple/20 to-transparent rounded-t-2xl flex justify-between items-center">
            <h3 className="font-display font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              NOVA AI
            </h3>
            <button onClick={onToggle} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-neon-purple/80 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-gray-500 animate-pulse ml-2">Procesando redes neuronales...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-white/10 flex gap-2 bg-black/40 rounded-b-xl">
            <input 
              className="flex-1 bg-transparent border-none text-white text-sm px-3 focus:outline-none placeholder-gray-500"
              placeholder="Pregunta sobre proyectos..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="text-neon-purple hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// 5. LIVE CHAT (Exclusive Widget) - Updated to accept initial draft
const LiveChat = ({ user, isOpen, onToggle, initialDraft }: { user: User | null, isOpen: boolean, onToggle: () => void, initialDraft?: string }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for messages
  useEffect(() => {
    let interval: any; 
    interval = setInterval(async () => {
        if (!hasStarted && !user && !chatSession) return; 

        const sessionId = user ? `user-${user.id}` : (chatSession ? chatSession.id : null);
        if (!sessionId) return;

        const allSessions = await getChatSessions();
        const current = allSessions.find(s => s.id === sessionId);

        if (current) {
            const prevCount = chatSession ? chatSession.messages.length : 0;
            if (current.messages.length > prevCount) {
                setChatSession(current);
                if (!isOpen) {
                    const lastMsg = current.messages[current.messages.length - 1];
                    if (lastMsg.sender !== 'user') {
                        setUnreadCount(prev => prev + 1);
                    }
                }
            }
        }
    }, 2000);
    return () => clearInterval(interval);
  }, [isOpen, hasStarted, chatSession, user]);

  // Set initial draft if opened via modal
  useEffect(() => {
      if (initialDraft) {
          setMsgInput(initialDraft);
      }
  }, [initialDraft]);

  useEffect(() => {
      if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  const startChat = async () => {
    if (!user && !guestName.trim()) return;
    const name = user ? user.name : guestName;
    const sessionId = user ? `user-${user.id}` : `guest-${Date.now()}`;
    const sessions = await getChatSessions();
    let session = sessions.find(s => s.id === sessionId);
    if (!session) {
      session = {
        id: sessionId,
        userId: user?.id,
        guestName: name,
        messages: [{
          id: 'welcome',
          sender: 'system',
          text: `Bienvenido ${name}. Un agente se conectará pronto.`,
          timestamp: Date.now()
        }],
        lastUpdated: Date.now(),
        isReadByAdmin: false
      };
      await saveChatSession(session);
    }
    setChatSession(session);
    setHasStarted(true);
  };

  const send = async () => {
    if (!msgInput.trim() || !chatSession) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: msgInput,
      timestamp: Date.now(),
      userName: chatSession.guestName
    };
    const updatedSession = await sendMessage(chatSession.id, newMsg);
    setChatSession(updatedSession);
    setMsgInput('');
  };

  return (
    <>
      <button 
        onClick={onToggle}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isOpen ? 'bg-white text-neon-blue scale-110' : 'bg-neon-blue text-white hover:scale-110 shadow-[0_0_20px_rgba(59,130,246,0.5)]'}`}
      >
        {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border border-black animate-pulse">
                {unreadCount}
            </span>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 glass-high rounded-2xl flex flex-col z-50 animate-in zoom-in-95 duration-200 overflow-hidden">
          <div className="p-4 bg-neon-blue/20 flex justify-between items-center">
            <h3 className="font-bold text-white">Soporte en Vivo</h3>
            <button onClick={onToggle} className="text-white hover:text-gray-300">✕</button>
          </div>
          {!hasStarted ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
              <p className="text-center text-sm text-gray-300">Identifícate para iniciar conexión segura.</p>
              {!user && (
                <input 
                  className="w-full bg-black/40 border border-white/10 rounded p-2 text-white"
                  placeholder="Tu nombre"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                />
              )}
              <button 
                onClick={startChat}
                className="w-full bg-neon-blue text-white font-bold py-2 rounded hover:bg-blue-600 transition-colors"
              >
                CONECTAR
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar bg-black/20">
                {chatSession?.messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] text-xs p-2 rounded ${m.sender === 'user' ? 'bg-neon-blue text-white' : m.sender === 'system' ? 'bg-gray-800 text-gray-400 italic text-center w-full' : 'bg-white/20 text-white'}`}>
                       {m.text}
                     </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-black/40 flex gap-2">
                 <input 
                    className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder-gray-500"
                    placeholder="Escribe un mensaje..."
                    value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                 />
                 <button onClick={send} className="text-neon-blue font-bold text-sm">ENVIAR</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  
  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [activeWidget, setActiveWidget] = useState<'none' | 'ai' | 'chat'>('none');
  const [chatDraft, setChatDraft] = useState('');
  
  const [isLaunching, setIsLaunching] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const fetchedProjects = await getProjects();
    const fetchedCategories = await getCategories();
    setProjects(fetchedProjects);
    setCategories(fetchedCategories);
    const currentUser = await getActiveSessionUser(); // Now async
    setUser(currentUser);
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const u = await signIn(email, password);
      setUser(u);
      setIsLoginOpen(false);
      resetAuthForms();
    } catch (error) {
      alert("Error: Usuario no encontrado o credenciales inválidas");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (password !== confirmPassword) {
          alert("Las contraseñas no coinciden");
          return;
      }
      try {
          const u = await registerUser(registerName, email, password);
          setUser(u);
          setIsRegisterOpen(false);
          setIsWelcomeOpen(true);
          resetAuthForms();
      } catch (error) {
          alert("Error: El email ya está registrado");
      }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setShowAdminPanel(false);
  };
  
  const resetAuthForms = () => {
      setEmail('');
      setPassword('');
      setRegisterName('');
      setConfirmPassword('');
  };

  const handleSelectProject = (project: Project) => {
      setIsLaunching(true);
      setTimeout(() => {
          setSelectedProject(project);
          setTimeout(() => {
              setIsLaunching(false);
          }, 800);
      }, 500);
  };

  const handleConsultWebChat = (message: string) => {
      setChatDraft(message);
      setActiveWidget('chat');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#050505] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-neon-indigo border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className={`min-h-screen bg-space-black text-white selection:bg-neon-indigo selection:text-white font-sans relative overflow-x-hidden flex flex-col ${isLaunching ? 'animate-shake' : ''}`}>
        <StarField />
        
        {isLaunching && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                 <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_50px_20px_white] animate-warp-expand"></div>
            </div>
        )}

        {showAdminPanel && user?.isAdmin ? (
            <AdminPanel 
                projects={projects} 
                refreshProjects={init} 
                onClose={() => {
                    setShowAdminPanel(false);
                    init(); // Refresh categories when closing admin panel
                }} 
            />
        ) : (
            <>
                <Navbar 
                    user={user} 
                    onLoginClick={() => setIsLoginOpen(true)} 
                    onAdminClick={() => setShowAdminPanel(true)} 
                    onLogout={handleLogout}
                />

                <main className="relative z-10 flex flex-col gap-0 flex-grow">
                    <ThreeDCarousel 
                        projects={projects} 
                        validCategories={categories} 
                        onSelectProject={(p) => {
                            // Carousel has internal delay, just open modal directly via shared handler logic
                            setSelectedProject(p);
                        }}
                    />
                    
                    <ProjectGrid 
                        projects={projects} 
                        validCategories={categories}
                        onSelectProject={handleSelectProject}
                        isDanger={isLaunching}
                    />
                    
                    <AiConsultant 
                        projects={projects} 
                        isOpen={activeWidget === 'ai'}
                        onToggle={() => setActiveWidget(activeWidget === 'ai' ? 'none' : 'ai')}
                    />
                    <LiveChat 
                        user={user} 
                        isOpen={activeWidget === 'chat'}
                        onToggle={() => setActiveWidget(activeWidget === 'chat' ? 'none' : 'chat')}
                        initialDraft={chatDraft}
                    />
                </main>
                <Footer />
            </>
        )}

        {selectedProject && (
            <ProjectDetailModal 
                project={selectedProject} 
                onClose={() => setSelectedProject(null)} 
                onConsult={handleConsultWebChat}
            />
        )}

        {/* LOGIN MODAL */}
        <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} title="AUTENTICACIÓN">
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-indigo focus:outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-indigo focus:outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-neon-indigo hover:bg-indigo-600 text-white font-bold py-3 rounded shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all">
              ACCEDER
            </button>
            <div className="flex justify-between items-center text-xs text-gray-400 mt-4">
               <span>¿No tienes cuenta?</span>
               <button 
                type="button"
                onClick={() => { setIsLoginOpen(false); setIsRegisterOpen(true); }}
                className="text-neon-indigo hover:text-white underline"
               >
                   Registrarse en la red
               </button>
            </div>
            <div className="text-center mt-2 border-t border-white/5 pt-2">
               <span className="text-[10px] text-gray-500">Admin Demo: ssamaniego065@gmail.com (pass: cualquiera)</span>
            </div>
          </form>
        </Modal>

        {/* REGISTER MODAL */}
        <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="NUEVO REGISTRO">
          <form onSubmit={handleRegister} className="space-y-4">
            <input 
              type="text" 
              placeholder="Nombre de Agente" 
              className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-indigo focus:outline-none"
              value={registerName}
              onChange={e => setRegisterName(e.target.value)}
              required
            />
            <input 
              type="email" 
              placeholder="Email Corporativo" 
              className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-indigo focus:outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-indigo focus:outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Confirmar Contraseña" 
              className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-indigo focus:outline-none"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-neon-purple hover:bg-purple-600 text-white font-bold py-3 rounded shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all">
              CREAR IDENTIDAD
            </button>
            <div className="text-center text-xs text-gray-400 mt-4">
               <button 
                type="button"
                onClick={() => { setIsRegisterOpen(false); setIsLoginOpen(true); }}
                className="text-neon-purple hover:text-white underline"
               >
                   Volver al Login
               </button>
            </div>
          </form>
        </Modal>

        {/* WELCOME MODAL */}
        <Modal isOpen={isWelcomeOpen} onClose={() => setIsWelcomeOpen(false)} title="ACCESO CONCEDIDO">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white">¡Bienvenido a la red, {user?.name}!</h3>
                <p className="text-gray-300">Tu identidad ha sido verificada en la blockchain de Santy.Lab. Ahora tienes acceso completo a las funciones de consultoría y comunicación.</p>
                <button 
                    onClick={() => setIsWelcomeOpen(false)}
                    className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded border border-white/10 transition-colors"
                >
                    INICIAR NAVEGACIÓN
                </button>
            </div>
        </Modal>

      </div>
    </HashRouter>
  );
};

export default App;