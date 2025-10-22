import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { getHtmlView, updateHtmlView } from '../services/api';
import Spinner from './Spinner';
import type { Item } from '../types';

interface HtmlRendererProps {
  item: Item;
  isEditing: boolean;
  onSaveComplete: () => void;
}

export interface HtmlRendererRef {
    handleSave: () => Promise<void>;
}

const HtmlRenderer = forwardRef<HtmlRendererRef, HtmlRendererProps>(({ item, isEditing, onSaveComplete }, ref) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const fetchContent = useCallback(async () => {
    if (!item.contentId) {
      setError("This view has no content associated with it.");
      setIsLoading(false);
      setHtmlContent("<!-- No content yet. Click Edit HTML to start. -->");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const view = await getHtmlView(item.contentId);
      setHtmlContent(view.htmlContent);
    } catch (err: any) {
      console.error(`Failed to load HTML content for "${item.name}"`, err);
      setError(err.message || "Failed to load HTML view.");
      setHtmlContent("");
    } finally {
      setIsLoading(false);
    }
  }, [item.contentId, item.name]);

  useEffect(() => {
    fetchContent();
  }, [item, fetchContent]);

  const handleSave = async () => {
    if (!item.contentId) {
        alert("Cannot save: No content ID.");
        return;
    }
    setIsSaving(true);
    try {
        await updateHtmlView(item.contentId, htmlContent);
        onSaveComplete(); // Notify parent that save is done
    } catch (err) {
        console.error(err);
        alert('Failed to save HTML.');
    } finally {
        setIsSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    handleSave,
  }));

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full"><Spinner /></div>;
    }
    if (error) {
      return <div className="p-8 text-red-500">{error}</div>;
    }
    return (
        <iframe
          srcDoc={htmlContent}
          title={item.name}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-none bg-white"
        />
    );
  };
  
  const renderEditor = () => (
      <textarea
        ref={textAreaRef}
        value={htmlContent}
        onChange={(e) => setHtmlContent(e.target.value)}
        className="w-full h-full bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-green-400 font-mono p-4 resize-none focus:outline-none"
        placeholder="<html>...</html>"
      />
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="flex-grow h-0">
        {isEditing ? renderEditor() : renderContent()}
      </div>
    </div>
  );
});

export default HtmlRenderer;