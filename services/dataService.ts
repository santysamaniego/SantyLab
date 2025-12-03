import { supabase } from './supabaseClient';
import { Project, User, ChatSession, ChatMessage } from '../types';

// --- UTILS ---
// Mapear snake_case de DB a camelCase de TypeScript
const mapProjectFromDB = (p: any): Project => ({
    id: p.id,
    title: p.title,
    category: p.category,
    description: p.description,
    imageUrls: p.image_urls || [],
    imageCaptions: p.image_captions || [],
    techStack: p.tech_stack || [],
    demoUrl: p.demo_url,
    createdAt: p.created_at,
    showInCarousel: p.show_in_carousel,
    showInGrid: p.show_in_grid
});

// --- CATEGORIES SERVICE ---
export const getCategories = async (): Promise<string[]> => {
  const { data, error } = await supabase.from('categories').select('name');
  if (error) {
      console.error('Error fetching categories:', error);
      return [];
  }
  return data.map((c: any) => c.name);
};

export const addCategory = async (category: string): Promise<string[]> => {
  const { error } = await supabase.from('categories').insert([{ name: category }]);
  if (error) console.error('Error adding category:', error);
  return getCategories();
};

export const removeCategory = async (category: string): Promise<string[]> => {
  const { error } = await supabase.from('categories').delete().eq('name', category);
  if (error) console.error('Error removing category:', error);
  return getCategories();
};

// --- PROJECTS SERVICE ---
export const getProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
      console.error('Error fetching projects:', error);
      return [];
  }
  return data.map(mapProjectFromDB);
};

export const createProject = async (project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
  const dbProject = {
      title: project.title,
      category: project.category,
      description: project.description,
      image_urls: project.imageUrls,
      image_captions: project.imageCaptions,
      tech_stack: project.techStack,
      demo_url: project.demoUrl,
      show_in_carousel: project.showInCarousel,
      show_in_grid: project.showInGrid
  };

  const { data, error } = await supabase.from('projects').insert([dbProject]).select().single();
  
  if (error) throw error;
  return mapProjectFromDB(data);
};

export const toggleProjectZone = async (id: string, zone: 'carousel' | 'grid'): Promise<void> => {
    // Primero obtener estado actual para invertirlo (o hacerlo directo en SQL si fuera funcion)
    // Por simplicidad, obtenemos el proyecto actual
    const { data: current } = await supabase.from('projects').select('*').eq('id', id).single();
    if (!current) return;

    const update = zone === 'carousel' 
        ? { show_in_carousel: !current.show_in_carousel }
        : { show_in_grid: !current.show_in_grid };

    await supabase.from('projects').update(update).eq('id', id);
};

export const deleteProject = async (id: string): Promise<void> => {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
};

// --- AUTH SERVICE ---
export const signIn = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("No user found");

  // Fetch additional profile data (isAdmin)
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();

  return {
      id: data.user.id,
      email: data.user.email!,
      name: profile?.name || data.user.user_metadata.name,
      isAdmin: profile?.is_admin || false
  };
};

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name } // Se guardará en user_metadata y el trigger lo moverá a profiles
        }
    });

    if (error) throw error;
    if (!data.user) throw new Error("Registration failed");

    return {
        id: data.user.id,
        email: data.user.email!,
        name: name,
        isAdmin: false // Por defecto nadie es admin al registrarse
    };
};

export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
};

export const getCurrentUser = (): User | null => {
  // Check active session
  // Nota: Esto es síncrono en tu app actual, pero Supabase es asíncrono para validar sesión real
  // Para mantener compatibilidad simple, devolveremos null inicial y dejaremos que App.tsx use init()
  return null; 
};

// Helper para obtener usuario real asíncrono en App.init()
export const getActiveSessionUser = async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    
    return {
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name || session.user.user_metadata.name,
        isAdmin: profile?.is_admin || false
    };
};


// --- CHAT SERVICE ---
export const getChatSessions = async (): Promise<ChatSession[]> => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select(`
        *,
        chat_messages (*)
    `)
    .order('last_updated', { ascending: false });

  if (error) {
      console.error(error);
      return [];
  }

  // Mapear estructura de Supabase a tu tipo
  return data.map((session: any) => ({
      id: session.id,
      userId: session.user_id,
      guestName: session.guest_name,
      lastUpdated: session.last_updated,
      isReadByAdmin: session.is_read_by_admin,
      messages: session.chat_messages.map((m: any) => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp,
          userName: m.user_name
      })).sort((a: any, b: any) => a.timestamp - b.timestamp)
  }));
};

export const saveChatSession = async (session: ChatSession): Promise<void> => {
  // Upsert session
  const { error } = await supabase.from('chat_sessions').upsert({
      id: session.id,
      user_id: session.userId || null,
      guest_name: session.guestName,
      last_updated: session.lastUpdated,
      is_read_by_admin: session.isReadByAdmin
  });
  
  if (error) console.error("Error saving session", error);

  // Insertar solo mensajes nuevos es complejo aquí sin lógica extra.
  // Para esta migración, asumiremos que los mensajes se guardan via sendMessage uno a uno.
  // Solo guardamos la sesión inicial si no existe.
};

export const sendMessage = async (sessionId: string, message: ChatMessage): Promise<ChatSession> => {
    // 1. Insert message
    const { error: msgError } = await supabase.from('chat_messages').insert({
        id: message.id,
        session_id: sessionId,
        sender: message.sender,
        text: message.text,
        timestamp: message.timestamp,
        user_name: message.userName
    });

    if (msgError) console.error(msgError);

    // 2. Update session timestamp
    await supabase.from('chat_sessions').update({
        last_updated: message.timestamp,
        is_read_by_admin: message.sender === 'admin' // Si admin responde, se marca leído (lógica simplificada)
    }).eq('id', sessionId);

    // 3. Return full updated session
    const sessions = await getChatSessions();
    const s = sessions.find(s => s.id === sessionId);
    if (!s) throw new Error("Session lost");
    return s;
};