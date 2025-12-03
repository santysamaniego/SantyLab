import { GoogleGenAI } from "@google/genai";
import { Project } from "../types";

// Vite requires environment variables to start with VITE_ to be exposed to the client
const apiKey = (import.meta as any).env?.VITE_GOOGLE_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateAIResponse = async (
  prompt: string,
  contextProjects: Project[]
): Promise<string> => {
  if (!apiKey) {
      return "Error: API Key de IA no configurada en el sistema.";
  }

  try {
    const projectContext = contextProjects.map(p => 
      `- ${p.title} (${p.category}): ${p.description}. Stack: ${p.techStack.join(', ')}`
    ).join('\n');

    const systemInstruction = `Eres 'Nova', una IA Consultora de Negocios y Tecnología para la agencia Santy.Lab. Tu objetivo es VENDER y CONVENCER.

    TUS DATOS Y CONTACTO (Dala SOLO si la piden o si el cliente parece listo para contratar):
    - WhatsApp Directo: +54 9 11 6959-5853
    - Email: ssamaniego065@gmail.com
    
    TUS SERVICIOS:
    - Desarrollo Web Futuista (React, 3D, Animaciones)
    - Integración de Inteligencia Artificial
    - Soluciones Blockchain
    - Diseño UI/UX de Alto Impacto

    SOBRE EL PORTAFOLIO:
    ${projectContext}

    REGLAS DE COMPORTAMIENTO:
    1. Eres un experto tecnológico, seguro de ti mismo y proactivo.
    2. RESPUESTAS BREVES: Máximo 3 oraciones. Ve al grano.
    3. Si el usuario pregunta por un precio o cotización, invítalo a contactar por WhatsApp para una propuesta personalizada.
    4. Usa un tono "Cyberpunk Profesional".
    5. Intenta siempre cerrar la venta o conseguir el contacto.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Recalibrando sistemas de ventas. Intenta de nuevo.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error de conexión neural. Verifique credenciales.";
  }
};