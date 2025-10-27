import React, { useRef, useState, useCallback, useEffect } from 'react';
import Icon from './Icon';

interface ImageUploaderProps {
  imageSrc: string | null;
  onImageChange: (base64: string | null) => void;
  className?: string;
  placeholderText?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageSrc,
  onImageChange,
  className = '',
  placeholderText = 'Carregar Imagem'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const processFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        alert("Por favor, cole um ficheiro de imagem válido.");
    }
  }, [onImageChange]);
  
  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    const handlePaste = (event: ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    event.preventDefault();
                    processFile(file);
                    break; 
                }
            }
        }
    };
    
    currentContainer.addEventListener('paste', handlePaste);

    return () => {
        currentContainer.removeEventListener('paste', handlePaste);
    };

  }, [processFile]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
  };

  const containerClasses = `relative w-full overflow-hidden rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center group transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
    imageSrc ? 'border-solid' : 'hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800'
  } ${className}`;

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      tabIndex={0} // Makes the div focusable to receive paste events
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/gif, image/webp"
      />
      {imageSrc ? (
        <>
          <img src={imageSrc} alt="Conteúdo carregado" className="w-full h-full object-contain" />
          {isHovering && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4">
              <button
                onClick={handleUploadClick}
                className="p-2 bg-slate-800/80 text-white rounded-full hover:bg-slate-700"
                title="Mudar imagem"
              >
                <Icon name="Replace" size={20} />
              </button>
              <button
                onClick={handleRemoveClick}
                className="p-2 bg-red-600/80 text-white rounded-full hover:bg-red-500"
                title="Remover imagem"
              >
                <Icon name="Trash2" size={20} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-slate-500 p-4 flex flex-col items-center justify-center h-full">
            <button
              type="button"
              onClick={handleUploadClick}
              className="flex flex-col items-center justify-center cursor-pointer p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
            >
              <Icon name="UploadCloud" size={32} className="mx-auto" />
              <p className="mt-2 text-sm font-semibold">{placeholderText}</p>
            </button>
            <p className="text-xs text-slate-400 mt-2">ou cole a imagem (Ctrl+V)</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;