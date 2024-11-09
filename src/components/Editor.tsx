import React, { useState, useRef, useEffect } from 'react';
import { Toolbar } from './Toolbar';

interface EditorProps {
  initialContent: string;
  filename: string;
}

export function Editor({ initialContent, filename }: EditorProps) {
  const [content, setContent] = useState(initialContent);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const makeImagesResizable = () => {
      const images = editorRef.current?.getElementsByTagName('img');
      if (images) {
        Array.from(images).forEach(img => {
          if (!img.getAttribute('data-resizable')) {
            img.setAttribute('data-resizable', 'true');
            img.style.cursor = 'move';
            img.style.maxWidth = '100%';
            img.addEventListener('mousedown', initResize);
          }
        });
      }
    };

    const initResize = (e: MouseEvent) => {
      const img = e.target as HTMLImageElement;
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = img.clientWidth;
      const startHeight = img.clientHeight;

      const onMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const aspectRatio = startWidth / startHeight;

        if (Math.abs(dx) > Math.abs(dy)) {
          img.style.width = `${startWidth + dx}px`;
          img.style.height = `${(startWidth + dx) / aspectRatio}px`;
        } else {
          img.style.height = `${startHeight + dy}px`;
          img.style.width = `${(startHeight + dy) * aspectRatio}px`;
        }
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    makeImagesResizable();
  }, [content]);

  const execCommand = (command: string, value: string | boolean = false) => {
    document.execCommand(command, false, value.toString());
  };

  const handleSave = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      console.log('Saving content for:', filename);
      console.log(editorRef.current.innerHTML);
    }
  };

  const handleExport = () => {
    if (editorRef.current) {
      const blob = new Blob([editorRef.current.innerHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImageInsert = (dataUrl: string) => {
    execCommand('insertImage', dataUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          handleImageInsert(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <Toolbar
        filename={filename}
        onSave={handleSave}
        onExport={handleExport}
        onCommand={execCommand}
        onImageInsert={handleImageInsert}
      />
      <div 
        ref={editorRef}
        className="flex-grow p-4 overflow-auto focus:outline-none"
        contentEditable
        dangerouslySetInnerHTML={{ __html: initialContent }}
        onBlur={() => setContent(editorRef.current?.innerHTML || '')}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      />
    </div>
  );
}