/**
 * Extrai o ID do vídeo de várias formas de URL do YouTube.
 * @param url O URL do YouTube.
 * @returns O ID do vídeo ou null se não for encontrado.
 */
export const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

/**
 * Gera o URL da miniatura de um vídeo do YouTube.
 * @param url O URL do YouTube.
 * @returns O URL da imagem da miniatura ou null se não for um URL do YouTube válido.
 */
export const getYoutubeThumbnail = (url: string): string | null => {
  const videoId = getYoutubeVideoId(url);
  if (videoId) {
    // mqdefault.jpg é uma imagem de boa qualidade (320x180)
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return null;
};

/**
 * Verifica se um URL é um link do Google Drive.
 * @param url O URL a ser verificado.
 * @returns true se for um link do Google Drive.
 */
export const isGoogleDrive = (url: string): boolean => {
    if (!url) return false;
    return url.includes('drive.google.com');
};

/**
 * Converte um URL de partilha do YouTube ou Google Drive num URL de incorporação (embed).
 * @param url O URL original.
 * @returns O URL de incorporação pronto para ser usado num iframe.
 */
export const getEmbedUrl = (url: string): string | null => {
    const youtubeId = getYoutubeVideoId(url);
    if (youtubeId) {
        return `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
    }

    if (isGoogleDrive(url)) {
        // Converte o link de partilha do Google Drive para o formato de incorporação
        // Ex: https://drive.google.com/file/d/FILE_ID/view?usp=sharing -> https://drive.google.com/file/d/FILE_ID/preview
        return url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
    }
    
    // Se não for um link suportado, retorna o próprio URL ou null
    return url;
};
