// Переменные состояния
let uploadedImages = [];

// DOM элементы
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const resizeBtn = document.getElementById('resizeBtn');
const addMoreBtn = document.getElementById('addMoreBtn');
const dropZone = document.getElementById('dropZone');
const galleryContainer = document.getElementById('galleryContainer');
const gallery = document.getElementById('gallery');
const imageCount = document.getElementById('imageCount');
const infoBox = document.getElementById('infoBox');
const newSizeInfo = document.getElementById('newSizeInfo');
const newSize = document.getElementById('newSize');
const resizeBtnText = document.getElementById('resizeBtnText');
const galleryCount = document.querySelector('.gallery-count');

// Обработчик клика на кнопку загрузки
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

// Обработчик выбора файлов
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []).filter(file => 
        file.type.startsWith('image/')
    );
    handleFiles(files);
    fileInput.value = '';
});

// Обработчик перетаскивания
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files || []).filter(file => 
        file.type.startsWith('image/')
    );
    handleFiles(files);
});

// Клик на зону перетаскивания
dropZone.addEventListener('click', () => {
    fileInput.click();
});

// Обработчик добавления ещё фотографий
addMoreBtn.addEventListener('click', () => {
    fileInput.click();
});

// Функция обработки выбранных файлов
function handleFiles(files) {
    if (files.length === 0) return;
    
    files.forEach((file) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const imageData = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    file: file,
                    preview: e.target.result,
                    originalWidth: img.width,
                    originalHeight: img.height
                };
                
                uploadedImages.push(imageData);
                updateUI();
                renderGallery();
            };
            
            img.onerror = () => {
                alert(`Не удалось загрузить изображение: ${file.name}`);
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    });
}

// Функция удаления фотографии
function removeImage(id) {
    uploadedImages = uploadedImages.filter(img => img.id !== id);
    updateUI();
    renderGallery();
}

// Функция обновления интерфейса
function updateUI() {
    const hasImages = uploadedImages.length > 0;
    const hasSize = widthInput.value && heightInput.value;
    
    // Показать/скрыть зону загрузки и галерею
    dropZone.style.display = hasImages ? 'none' : 'block';
    galleryContainer.style.display = hasImages ? 'block' : 'none';
    
    // Показать/скрыть информационный блок
    infoBox.style.display = hasImages ? 'block' : 'none';
    imageCount.textContent = uploadedImages.length;
    
    // Обновить счётчик фото в галерее
    if (galleryCount && hasImages) {
        galleryCount.textContent = uploadedImages.length;
    }
    
    // Обновить кнопку изменения размера
    resizeBtn.disabled = !hasImages || !hasSize;
    resizeBtnText.textContent = hasSize 
        ? `Изменить размер (${uploadedImages.length})`
        : 'Введите размер';
    
    // Показать информацию о новом размере
    if (hasSize) {
        newSizeInfo.style.display = 'block';
        newSize.textContent = `${widthInput.value} × ${heightInput.value}`;
    } else {
        newSizeInfo.style.display = 'none';
    }
}

// Функция отрисовки галереи
function renderGallery() {
    gallery.innerHTML = uploadedImages.map(image => `
        <div class="image-card">
            <div class="image-preview">
                <img src="${image.preview}" alt="Preview">
                <button class="image-remove" onclick="removeImage('${image.id}')">✕</button>
            </div>
            <div class="image-info">
                <p><strong>Файл:</strong> ${image.file.name}</p>
                <p><strong>Размер:</strong> ${image.originalWidth} × ${image.originalHeight} px</p>
            </div>
        </div>
    `).join('');
}

// Обработчик изменения размеров
widthInput.addEventListener('change', updateUI);
heightInput.addEventListener('change', updateUI);

// Функция изменения размера изображения
function resizeImage(img, targetWidth, targetHeight) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            canvas.toBlob(blob => {
                resolve(blob);
            }, 'image/jpeg', 0.95);
        }
    });
}

// Обработчик кнопки изменения размера
resizeBtn.addEventListener('click', async () => {
    const width = parseInt(widthInput.value);
    const height = parseInt(heightInput.value);
    
    if (!width || !height || uploadedImages.length === 0) {
        alert('Пожалуйста, введите размер и загрузите фотографии');
        return;
    }
    
    if (width <= 0 || height <= 0) {
        alert('Размеры должны быть положительными числами');
        return;
    }
    
    resizeBtn.disabled = true;
    const originalText = resizeBtnText.textContent;
    resizeBtnText.textContent = 'Обработка...';
    
    try {
        for (let i = 0; i < uploadedImages.length; i++) {
            const image = uploadedImages[i];
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve) => {
                img.onload = async () => {
                    const blob = await resizeImage(img, width, height);
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    
                    // Генерируем название файла
                    const nameParts = image.file.name.split('.');
                    const extension = nameParts[nameParts.length - 1];
                    const baseName = nameParts.slice(0, -1).join('.');
                    link.download = `${baseName}_${width}x${height}.${extension}`;
                    
                    link.click();
                    URL.revokeObjectURL(url);
                    resolve();
                };
                
                img.src = image.preview;
            });
        }
        
        alert(`Готово! ${uploadedImages.length} фотографий готовы`);
    } catch (error) {
        alert('Ошибка при изменении размера фотографий');
    } finally {
        resizeBtn.disabled = !uploadedImages.length || !widthInput.value || !heightInput.value;
        resizeBtnText.textContent = originalText;
    }
});
