
/**
 * Executa uma interação com o modelo de IA do Gemini.
 * @param prompt O prompt a ser enviado para o modelo.
 * @returns A resposta em texto do modelo.
 */
export const runAiInteraction = async (prompt: string): Promise<string> => {
  try {
    // A importação dinâmica garante que o SDK só é carregado quando esta função é chamada,
    // evitando qualquer potencial problema de inicialização durante o arranque da app.
    const { GoogleGenAI } = await import('@google/genai');

    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      throw new Error("A API_KEY do Google Gemini não foi encontrada. Por favor, configure a variável de ambiente.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Erro ao interagir com a API do Gemini:", error);
    if (error instanceof Error) {
        return `Erro: ${error.message}`;
    }
    return "Ocorreu um erro desconhecido ao comunicar com a IA.";
  }
};
