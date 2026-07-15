'use client';

import { useState, useRef } from 'react';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  originalWidth: number;
  originalHeight: number;
}

export default function Page() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [resizing, setResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dragRef.current?.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragRef.current?.classList.remove('drag-over');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragRef.current?.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      handleFiles(Array.from(files));
    }
    e.currentTarget.value = '';
  };

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const newImage: UploadedImage = {
            id: Date.now().toString() + Math.random(),
            file,
            preview: e.target?.result as string,
            originalWidth: img.width,
            originalHeight: img.height,
          };
          setImages(prev => [...prev, newImage]);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const resizeImage = (
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number
  ): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        canvas.toBlob(blob => {
          resolve(blob as Blob);
        }, 'image/jpeg', 0.95);
      }
    });
  };

  const handleResize = async () => {
    if (!width || !height || images.length === 0) {
      alert('Пожалуйста, введите размер и загрузите фотографии');
      return;
    }

    const targetWidth = parseInt(width);
    const targetHeight = parseInt(height);

    if (targetWidth <= 0 || targetHeight <= 0) {
      alert('Размеры должны быть положительными числами');
      return;
    }

    setResizing(true);
    const canvas = document.createElement('canvas');

    try {
      for (const image of images) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve) => {
          img.onload = async () => {
            const blob = await resizeImage(canvas, img, targetWidth, targetHeight);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `resized_${Date.now()}_${image.file.name}`;
            link.click();
            URL.revokeObjectURL(url);
            resolve(null);
          };
          img.src = image.preview;
        });
      }
      
      alert(`✅ Готово! ${images.length} фотографий отресайзено и загружено`);
    } catch (error) {
      console.error('Ошибка при изменении размера:', error);
      alert('Ошибка при изменении размера фотографий');
    } finally {
      setResizing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <style>{`
        .drag-over {
          border-color: #3b82f6 !important;
          background-color: #eff6ff !important;
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📷 Изменение размера фотографий
          </h1>
          <p className="text-gray-600 text-lg">
            Загрузите несколько фотографий и измените их размер одновременно
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Левая колонна - загрузка */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Параметры
              </h2>

              {/* Параметры размера */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ширина (пиксели)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="800"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Высота (пиксели)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="600"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Кнопка загрузки */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition mb-3"
              >
                ⬆️ Добавить фото
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Кнопка изменения размера */}
              <button
                onClick={handleResize}
                disabled={resizing || images.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                {resizing ? (
                  <>
                    ⏳ Обработка...
                  </>
                ) : (
                  <>
                    ⬇️ Изменить размер ({images.length})
                  </>
                )}
              </button>

              {/* Информация */}
              {images.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                  <p>
                    <strong>Загружено:</strong> {images.length} фотографий
                  </p>
                  {width && height && (
                    <p className="mt-2">
                      <strong>Новый размер:</strong> {width} × {height} px
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Правая колонна - предпросмотр */}
          <div className="md:col-span-2">
            {images.length === 0 ? (
              <div
                ref={dragRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="bg-white rounded-lg shadow-lg p-12 text-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500 transition"
              >
                <div className="text-5xl mb-4">📁</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Перетащите фотографии сюда
                </h3>
                <p className="text-gray-600 mb-4">
                  или кликните, чтобы выбрать файлы
                </p>
                <p className="text-sm text-gray-500">
                  Поддерживаются форматы: JPG, PNG, GIF, WebP и другие
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Загруженные фотографии ({images.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                    >
                      <div className="relative aspect-square bg-gray-100">
                        <img
                          src={image.preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="text-sm text-gray-700 truncate mb-1">
                          <strong>Файл:</strong> {image.file.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Размер:</strong> {image.originalWidth} × {image.originalHeight} px
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Кнопка добавить ещё */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-6 w-full py-2 px-4 border-2 border-blue-500 text-blue-500 font-semibold rounded-lg hover:bg-blue-50 transition"
                >
                  + Добавить ещё фотографии
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Инструкция */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            📝 Как использовать:
          </h3>
          <ol className="space-y-2 text-gray-700">
            <li>
              <strong>1.</strong> Загрузите фотографии - перетащите их в область выше или кликните на неё
            </li>
            <li>
              <strong>2.</strong> Установите желаемые размеры (ширину и высоту в пикселях)
            </li>
            <li>
              <strong>3.</strong> Нажмите кнопку «Изменить размер» - все фотографии будут отресайзены одновременно
            </li>
            <li>
              <strong>4.</strong> Фотографии автоматически загрузятся на ваш компьютер
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}
