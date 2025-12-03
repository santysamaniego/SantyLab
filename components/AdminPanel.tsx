import React, { useState, useEffect } from 'react';
import { Project, ChatSession } from '../types';
import { createProject, deleteProject, getChatSessions, sendMessage, getCategories, addCategory, removeCategory, toggleProjectZone } from '../services/dataService';
import Modal from './Modal';

interface AdminPanelProps {
  projects: Project[];
  refreshProjects: () => void;
  onClose: () => void;
}

interface ImageUploadConfig {
    file: File;
    preview: string;
    caption: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ projects, refreshProjects, onClose }) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'chats' | 'categories'>('projects');
  
  // Create Project State
  const [newProject, setNewProject] = useState({ 
      title: '', 
      category: '', 
      description: '', 
      techStack: '', 
      showInCarousel: true,
      showInGrid: true
  });
  
  const [imageConfigs, setImageConfigs] = useState<ImageUploadConfig[]>([]);
  
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [adminReply, setAdminReply] = useState('');
  
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    if (activeTab === 'chats') {
      loadChats();
      const interval = setInterval(loadChats, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const loadCategories = async () => {
    const cats = await getCategories();
    setCategories(cats);
    if (!newProject.category && cats.length > 0) {
        setNewProject(prev => ({...prev, category: cats[0]}));
    }
  };

  const loadChats = async () => {
    const sessions = await getChatSessions();
    setChats(sessions);
    if (selectedChat) {
        const updated = sessions.find(s => s.id === selectedChat.id);
        if (updated) setSelectedChat(updated);
    }
  };

  const showNotification = (title: string, message: string) => {
    setModalContent({ title, message });
    setIsModalOpen(true);
  };

  // --- IMAGE HANDLING ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files = Array.from(e.target.files);
        const newConfigs: ImageUploadConfig[] = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            caption: '' // Default empty caption
        }));
        setImageConfigs(prev => [...prev, ...newConfigs]);
    }
  };

  const removeImage = (index: number) => {
    setImageConfigs(prev => prev.filter((_, i) => i !== index));
  };

  const updateImageCaption = (index: number, caption: string) => {
      setImageConfigs(prev => prev.map((cfg, i) => i === index ? { ...cfg, caption } : cfg));
  };

  // --- PROJECT HANDLING ---
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert images to base64
    const base64Images: string[] = await Promise.all<string>(imageConfigs.map(cfg => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(cfg.file);
        });
    }));

    const captions = imageConfigs.map(cfg => cfg.caption);

    try {
      await createProject({
        title: newProject.title,
        category: newProject.category || categories[0],
        description: newProject.description,
        techStack: newProject.techStack.split(',').map(s => s.trim()),
        imageUrls: base64Images.length > 0 ? base64Images : ['https://picsum.photos/800/600'],
        imageCaptions: captions,
        showInCarousel: newProject.showInCarousel,
        showInGrid: newProject.showInGrid
      });
      refreshProjects();
      setNewProject({ 
          title: '', 
          category: categories[0], 
          description: '', 
          techStack: '', 
          showInCarousel: true,
          showInGrid: true
      });
      setImageConfigs([]);
      showNotification('Éxito', 'Proyecto desplegado en la red.');
    } catch (err) {
      showNotification('Error', 'Fallo en la inicialización del proyecto.');
    }
  };

  const confirmDelete = (id: string) => {
      setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
      if (deleteConfirmId) {
          await deleteProject(deleteConfirmId);
          refreshProjects();
          setDeleteConfirmId(null);
      }
  };
  
  const handleToggleZone = async (id: string, zone: 'carousel' | 'grid') => {
      await toggleProjectZone(id, zone);
      refreshProjects();
  };

  // --- CATEGORY HANDLING ---
  const handleAddCategory = async () => {
      if (!newCategory.trim()) return;
      const updated = await addCategory(newCategory.trim());
      setCategories(updated);
      setNewCategory('');
  };

  const handleRemoveCategory = async (cat: string) => {
      const updated = await removeCategory(cat);
      setCategories(updated);
  };

  // --- CHAT HANDLING ---
  const handleSendAdminReply = async () => {
    if (!selectedChat || !adminReply.trim()) return;
    
    await sendMessage(selectedChat.id, {
      id: Date.now().toString(),
      sender: 'admin',
      text: adminReply,
      timestamp: Date.now()
    });
    
    setAdminReply('');
    loadChats();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto animate-in fade-in duration-300">
        <div className="max-w-7xl mx-auto p-6 space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-6 pt-4 sticky top-0 bg-[#050505] z-10">
                <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-indigo to-neon-purple">
                    PANEL DE COMANDO
                </h2>
                <button onClick={onClose} className="text-red-400 border border-red-500/30 px-4 py-2 rounded hover:bg-red-900/20">
                    CERRAR SESIÓN ADMIN
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4">
                <button onClick={() => setActiveTab('projects')} className={`px-6 py-2 rounded-full font-display tracking-widest transition-all ${activeTab === 'projects' ? 'bg-neon-indigo text-white' : 'text-gray-400 hover:text-white'}`}>PROYECTOS</button>
                <button onClick={() => setActiveTab('categories')} className={`px-6 py-2 rounded-full font-display tracking-widest transition-all ${activeTab === 'categories' ? 'bg-neon-indigo text-white' : 'text-gray-400 hover:text-white'}`}>CATEGORÍAS</button>
                <button onClick={() => setActiveTab('chats')} className={`px-6 py-2 rounded-full font-display tracking-widest transition-all ${activeTab === 'chats' ? 'bg-neon-indigo text-white' : 'text-gray-400 hover:text-white'}`}>COMUNICACIONES</button>
            </div>

            {/* Projects Tab */}
            {activeTab === 'projects' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass p-6 rounded-xl h-fit">
                    <h3 className="text-xl font-display mb-4 text-neon-cyan">Nuevo Proyecto</h3>
                    <form onSubmit={handleCreateProject} className="space-y-4">
                    <input 
                        placeholder="Título del Proyecto" 
                        value={newProject.title}
                        onChange={e => setNewProject({...newProject, title: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-indigo focus:outline-none"
                        required
                    />
                    <select 
                        value={newProject.category}
                        onChange={e => setNewProject({...newProject, category: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-indigo focus:outline-none"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <textarea 
                        placeholder="Descripción General (Principal)" 
                        value={newProject.description}
                        onChange={e => setNewProject({...newProject, description: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-indigo focus:outline-none h-24"
                        required
                    />
                    <input 
                        placeholder="Tecnologías (separadas por coma)" 
                        value={newProject.techStack}
                        onChange={e => setNewProject({...newProject, techStack: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-indigo focus:outline-none"
                    />
                    
                    {/* Zones Checkboxes */}
                    <div className="flex gap-6 p-3 bg-white/5 rounded border border-white/10">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={newProject.showInCarousel}
                                onChange={e => setNewProject({...newProject, showInCarousel: e.target.checked})}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-neon-indigo focus:ring-neon-indigo"
                            />
                            <span className="text-sm text-gray-300">Mostrar en Carrusel 3D</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={newProject.showInGrid}
                                onChange={e => setNewProject({...newProject, showInGrid: e.target.checked})}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-neon-indigo focus:ring-neon-indigo"
                            />
                            <span className="text-sm text-gray-300">Mostrar en Archivo (Grid)</span>
                        </label>
                    </div>

                    {/* Image Upload with Captions */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <label className="block text-sm text-neon-cyan font-bold">Galería de Imágenes & Descripciones</label>
                        <input 
                            type="file" 
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-neon-indigo/20 file:text-neon-indigo hover:file:bg-neon-indigo/30"
                        />
                        <div className="space-y-3 mt-2">
                            {imageConfigs.map((cfg, idx) => (
                                <div key={idx} className="flex gap-3 p-3 bg-white/5 rounded border border-white/10">
                                    <div className="relative w-24 h-24 shrink-0 group">
                                        <img src={cfg.preview} alt="preview" className="w-full h-full object-cover rounded" />
                                        <button 
                                            type="button" 
                                            onClick={() => removeImage(idx)}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center text-red-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ELIMINAR
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <textarea 
                                            placeholder={`Descripción para la imagen ${idx + 1}...`}
                                            value={cfg.caption}
                                            onChange={(e) => updateImageCaption(idx, e.target.value)}
                                            className="w-full h-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white focus:border-neon-indigo focus:outline-none resize-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-neon-indigo hover:bg-indigo-600 text-white font-bold py-3 rounded shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all">
                        PUBLICAR
                    </button>
                    </form>
                </div>

                <div className="space-y-4 max-h-[800px] overflow-y-auto no-scrollbar">
                    {projects.map(p => (
                    <div key={p.id} className="glass p-4 rounded-xl flex flex-col gap-3 group hover:border-neon-purple/50 transition-all">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                {p.imageUrls[0] && <img src={p.imageUrls[0]} alt="" className="w-16 h-16 rounded object-cover" />}
                                <div>
                                    <h4 className="font-bold text-lg">{p.title}</h4>
                                    <span className="text-xs text-neon-cyan px-2 py-1 rounded bg-cyan-900/30 border border-cyan-500/30">{p.category}</span>
                                    <span className="text-xs text-gray-500 ml-2">({p.imageUrls.length} imgs)</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => confirmDelete(p.id)}
                                className="text-red-500 hover:text-red-400 p-2 hover:bg-red-900/20 rounded transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                        
                        <div className="flex gap-2 text-xs border-t border-white/5 pt-2 mt-1">
                             <button 
                                onClick={() => handleToggleZone(p.id, 'carousel')}
                                className={`px-2 py-1 rounded border transition-colors ${p.showInCarousel !== false ? 'bg-neon-indigo/20 border-neon-indigo text-neon-indigo' : 'bg-transparent border-gray-600 text-gray-500'}`}
                             >
                                 Carrusel: {p.showInCarousel !== false ? 'ON' : 'OFF'}
                             </button>
                             <button 
                                onClick={() => handleToggleZone(p.id, 'grid')}
                                className={`px-2 py-1 rounded border transition-colors ${p.showInGrid !== false ? 'bg-neon-indigo/20 border-neon-indigo text-neon-indigo' : 'bg-transparent border-gray-600 text-gray-500'}`}
                             >
                                 Grid: {p.showInGrid !== false ? 'ON' : 'OFF'}
                             </button>
                        </div>
                        
                        <p className="text-gray-400 text-sm mt-1">{p.description.substring(0, 60)}...</p>
                    </div>
                    ))}
                </div>
                </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
                <div className="glass max-w-2xl p-6 rounded-xl">
                    <h3 className="text-xl font-display mb-6 text-neon-cyan">Gestión de Categorías</h3>
                    <div className="flex gap-2 mb-8">
                        <input 
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            placeholder="Nueva Categoría..."
                            className="flex-1 bg-black/40 border border-white/10 rounded p-3 text-white focus:border-neon-indigo focus:outline-none"
                        />
                        <button onClick={handleAddCategory} className="bg-neon-indigo px-6 rounded font-bold hover:bg-indigo-500">AGREGAR</button>
                    </div>
                    <div className="space-y-2">
                        {categories.map(cat => (
                            <div key={cat} className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/5">
                                <span>{cat}</span>
                                <button onClick={() => handleRemoveCategory(cat)} className="text-red-400 hover:text-red-300">Eliminar</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chats Tab */}
            {activeTab === 'chats' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                <div className="glass rounded-xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-white/10 bg-white/5">
                    <h3 className="font-display">Canales Activos</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                    {chats.map(chat => (
                        <div 
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${selectedChat?.id === chat.id ? 'bg-white/10 border-l-2 border-l-neon-indigo' : ''}`}
                        >
                        <div className="flex justify-between">
                            <span className="font-bold text-neon-blue">{chat.guestName || 'Entidad Desconocida'}</span>
                            <span className="text-xs text-gray-500">{new Date(chat.lastUpdated).toLocaleTimeString()}</span>
                        </div>
                        <p className={`text-sm mt-1 truncate ${!chat.isReadByAdmin ? 'text-white font-bold' : 'text-gray-400'}`}>
                            {chat.messages[chat.messages.length - 1]?.text}
                        </p>
                        </div>
                    ))}
                    </div>
                </div>
                <div className="lg:col-span-2 glass rounded-xl flex flex-col">
                    {selectedChat ? (
                    <>
                        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <span className="font-display font-bold">Comms: {selectedChat.guestName}</span>
                        <span className="text-xs bg-neon-indigo/20 text-neon-indigo px-2 py-1 rounded">SECURE</span>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
                        {selectedChat.messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-lg text-sm ${msg.sender === 'admin' ? 'bg-neon-indigo/80 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                                {msg.text}
                            </div>
                            </div>
                        ))}
                        </div>
                        <div className="p-4 border-t border-white/10 flex gap-2">
                        <input 
                            value={adminReply}
                            onChange={e => setAdminReply(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendAdminReply()}
                            className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white focus:border-neon-indigo focus:outline-none"
                            placeholder="Transmitir respuesta..."
                        />
                        <button onClick={handleSendAdminReply} className="bg-neon-indigo p-2 rounded hover:bg-indigo-500 transition-colors">ENVIAR</button>
                        </div>
                    </>
                    ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 font-display">Selecciona una frecuencia.</div>
                    )}
                </div>
                </div>
            )}
        </div>

        {/* Notifications Modal */}
        <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title={modalContent.title}
        >
            <p>{modalContent.message}</p>
            <div className="mt-6 flex justify-end">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded transition-colors">Entendido</button>
            </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
            isOpen={!!deleteConfirmId}
            onClose={() => setDeleteConfirmId(null)}
            title="Confirmar Eliminación"
        >
            <p className="mb-6">¿Estás seguro de que deseas eliminar este proyecto de la base de datos? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded">Cancelar</button>
                <button onClick={executeDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white">Eliminar Definitivamente</button>
            </div>
        </Modal>
    </div>
  );
};

export default AdminPanel;