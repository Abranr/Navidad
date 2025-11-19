let pets = JSON.parse(localStorage.getItem('christmasPets')) || [
    {
        name: "Rex Navideño",
        type: "Dinosaurio",
        age: 65,
        description: "Rex es el dinosaurio más alegre de la temporada. Le encanta decorar árboles navideños y cantar villancicos con su poderoso rugido. ¡Un verdadero amigo festivo!",
        emoji: "🦖🎅",
        votes: 5
    },
    {
        name: "Stella Estrella",
        type: "Dinosaurio",
        age: 150,
        description: "Stella es una dinosaurio de cuello largo que brilla como la estrella de Belén. Es gentil, cariñosa y le encanta iluminar la oscuridad invernal.",
        emoji: "🦕⭐",
        votes: 3
    }
];

let currentImage = null;
let stickers = [];
let canvas, ctx;
let currentFilter = 'none';
let currentBackground = 'none';
let backgroundImages = {};
let originalImageData = null;
let imageWithoutBackground = null;
let brightness = 100;
let contrast = 100;
let saturation = 100;

// URLs de fondos navideños
const backgroundUrls = {
    'christmas-tree': 'https://images.unsplash.com/photo-1605708896111-4ed0b31d6de5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'snow-landscape': 'https://images.unsplash.com/photo-1455459182396-ae46100617cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'fireplace': 'https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'gifts': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'santa-workshop': 'https://images.unsplash.com/photo-1574359411659-619d4d5bcd5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'christmas-livingroom': 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'winter-forest': 'https://images.unsplash.com/photo-1455218873509-8097305ee378?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
};

// Precargar imágenes de fondo
Object.keys(backgroundUrls).forEach(key => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = backgroundUrls[key];
    backgroundImages[key] = img;
});

function savePets() {
    localStorage.setItem('christmasPets', JSON.stringify(pets));
}

function renderPets() {
    const gallery = document.getElementById('petsGallery');
    if (pets.length === 0) {
        gallery.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🦕</div>
                <h3>No hay mascotas aún</h3>
                <p>Agrega tu primera mascota navideña usando el formulario arriba</p>
            </div>`;
        return;
    }

    const maxVotes = Math.max(0, ...pets.map(pet => pet.votes || 0));

    gallery.innerHTML = pets.map((pet, index) => {
        const isMostVoted = pet.votes > 0 && pet.votes === maxVotes;
        const displayImage = pet.editedImage || pet.image;
        
        return `
            <div class="pet-card ${isMostVoted ? 'most-voted' : ''}">
                ${isMostVoted ? '<div class="most-voted-badge">👑 Más Votada</div>' : ''}
                <button class="delete-btn" onclick="deletePet(${index})" title="Eliminar">
                    <i class="fas fa-times"></i>
                </button>
                <div class="pet-image-container">
                    ${displayImage ? 
                        `<img src="${displayImage}" alt="${pet.name}">` : 
                        `<div class="pet-emoji">${pet.emoji || '🦕'}</div>`
                    }
                </div>
                <div class="pet-content">
                    <div class="pet-header">
                        <h3 class="pet-name">${pet.name}</h3>
                        <span class="pet-type">${pet.type}</span>
                    </div>
                    <div class="pet-info">
                        <div class="info-row">
                            <span class="info-label">🎂 Edad:</span>
                            <span class="info-value">${pet.age} años</span>
                        </div>
                    </div>
                    <p class="pet-description">${pet.description}</p>
                    <div class="pet-actions">
                        <button class="vote-btn" onclick="votePet(${index})">
                            <i class="fas fa-heart"></i> Votar
                        </button>
                        <div class="vote-count">${pet.votes || 0} votos</div>
                        <button class="select-btn" onclick="selectPet('${pet.name}')">
                            <i class="fas fa-gift"></i> Elegir esta Mascota
                        </button>
                        ${pet.image ? `
                        <button class="edit-btn" onclick="editPhoto(${index})">
                            <i class="fas fa-magic"></i> Añadir Toques Navideños
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function votePet(index) {
    pets[index].votes = (pets[index].votes || 0) + 1;
    savePets();
    renderPets();
}

function selectPet(petName) {
    const message = document.getElementById('selectionMessage'); 
    const messageText = document.getElementById('messageText'); 
    const overlay = document.getElementById('overlay');
    
    messageText.textContent = `Has elegido a ${petName} como tu compañero navideño. ¡Felices fiestas juntos! 🎉`;
    message.classList.add('show'); 
    overlay.classList.add('show');
    
    setTimeout(() => { 
        message.classList.remove('show'); 
        overlay.classList.remove('show'); 
    }, 4000);
}

function deletePet(index) {
    if (confirm('¿Estás seguro de eliminar esta mascota?')) { 
        pets.splice(index, 1); 
        savePets();
        renderPets(); 
    }
}

function editPhoto(index) {
    const pet = pets[index];
    if (!pet.image) return;
    
    const editor = document.getElementById('photoEditor');
    canvas = document.getElementById('photoCanvas');
    ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function() {
        const maxWidth = 600;
        const maxHeight = 400;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
        }
        
        if (height > maxHeight) {
            width = (maxHeight / height) * width;
            height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        editor.classList.add('active');
        currentImage = { index, canvas, ctx, originalImage: img };
        stickers = [];
        currentFilter = 'none';
        currentBackground = 'none';
        imageWithoutBackground = null;
        
        // Resetear controles
        brightness = 100;
        contrast = 100;
        saturation = 100;
        document.getElementById('brightnessSlider').value = 100;
        document.getElementById('contrastSlider').value = 100;
        document.getElementById('saturationSlider').value = 100;
        document.getElementById('brightnessValue').textContent = '100%';
        document.getElementById('contrastValue').textContent = '100%';
        document.getElementById('saturationValue').textContent = '100%';
        
        document.querySelectorAll('.effect-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.effect === 'none') {
                btn.classList.add('active');
            }
        });
        
        document.querySelectorAll('.background-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.background === 'none') {
                btn.classList.add('active');
            }
        });
        
        redrawImage();
    };
    img.src = pet.image;
}

function removeBackground() {
    if (!currentImage) return;
    
    const processingIndicator = document.getElementById('processingIndicator');
    processingIndicator.classList.add('active');
    
    // Simular procesamiento de remoción de fondo
    setTimeout(() => {
        const canvas = currentImage.canvas;
        const ctx = currentImage.ctx;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Algoritmo mejorado para remover fondos
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            const saturation = 1 - (3 * Math.min(r, g, b)) / (r + g + b);
            
            // Si el píxel es muy brillante y poco saturado (probable fondo), hacerlo transparente
            if (brightness > 180 && saturation < 0.3) {
                data[i + 3] = 0; // Alpha channel
            }
        }
        
        imageWithoutBackground = new ImageData(data, canvas.width, canvas.height);
        
        // Aplicar automáticamente un fondo navideño
        currentBackground = 'christmas-tree';
        document.querySelectorAll('.background-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.background === 'christmas-tree') {
                btn.classList.add('active');
            }
        });
        
        redrawImage();
        processingIndicator.classList.remove('active');
        
        // Mostrar mensaje de éxito
        alert('¡Magia navideña aplicada! Se ha removido el fondo y aplicado un fondo festivo.');
    }, 2000);
}

function applyFilter(filterType) {
    if (!currentImage) return;
    
    currentFilter = filterType;
    document.querySelectorAll('.effect-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.effect === filterType) {
            btn.classList.add('active');
        }
    });
    
    redrawImage();
}

function applyBackground(backgroundType) {
    if (!currentImage) return;
    
    currentBackground = backgroundType;
    document.querySelectorAll('.background-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.background === backgroundType) {
            btn.classList.add('active');
        }
    });
    
    redrawImage();
}

function applyImageAdjustments() {
    if (!currentImage) return;
    redrawImage();
}

function redrawImage() {
    if (!currentImage) return;
    
    const canvas = currentImage.canvas;
    const ctx = currentImage.ctx;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Aplicar fondo si está seleccionado
    if (currentBackground !== 'none' && backgroundImages[currentBackground]) {
        const bgImg = backgroundImages[currentBackground];
        // Dibujar fondo escalado para cubrir todo el canvas
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    }
    
    // Aplicar imagen principal
    if (imageWithoutBackground) {
        ctx.putImageData(imageWithoutBackground, 0, 0);
    } else {
        let tempCanvas = document.createElement('canvas');
        let tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        tempCtx.drawImage(currentImage.originalImage, 0, 0, canvas.width, canvas.height);
        
        // Aplicar ajustes de imagen
        if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
            applyImageFilters(tempCtx, tempCanvas.width, tempCanvas.height);
        }
        
        // Aplicar filtros navideños
        applyChristmasFilter(tempCtx, tempCanvas.width, tempCanvas.height);
        
        ctx.drawImage(tempCanvas, 0, 0);
    }
    
    // Aplicar efecto de nieve si está activo
    if (currentFilter === 'snow') {
        drawSnowflakes();
    }
    
    // Dibujar stickers
    stickers.forEach(sticker => {
        ctx.font = '40px Arial';
        ctx.fillText(sticker.emoji, sticker.x, sticker.y);
    });
}

function applyImageFilters(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const brightnessFactor = brightness / 100;
    const contrastFactor = (contrast / 100) * 255;
    const saturationFactor = saturation / 100;
    
    for (let i = 0; i < data.length; i += 4) {
        // Brillo
        data[i] = Math.min(255, data[i] * brightnessFactor);
        data[i + 1] = Math.min(255, data[i + 1] * brightnessFactor);
        data[i + 2] = Math.min(255, data[i + 2] * brightnessFactor);
        
        // Contraste
        data[i] = ((data[i] - 128) * contrastFactor / 255) + 128;
        data[i + 1] = ((data[i + 1] - 128) * contrastFactor / 255) + 128;
        data[i + 2] = ((data[i + 2] - 128) * contrastFactor / 255) + 128;
        
        // Saturación
        if (saturationFactor !== 1) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray + (data[i] - gray) * saturationFactor;
            data[i + 1] = gray + (data[i + 1] - gray) * saturationFactor;
            data[i + 2] = gray + (data[i + 2] - gray) * saturationFactor;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function applyChristmasFilter(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    switch(currentFilter) {
        case 'warm':
            // Filtro cálido navideño (rojos y dorados)
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.15);     // Más rojo
                data[i + 1] = Math.min(255, data[i + 1] * 0.95); // Menos verde
                data[i + 2] = Math.min(255, data[i + 2] * 0.85); // Menos azul
            }
            break;
            
        case 'cool':
            // Filtro frío invernal (azules y blancos)
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 0.9);     // Menos rojo
                data[i + 1] = Math.min(255, data[i + 1] * 0.95); // Menos verde
                data[i + 2] = Math.min(255, data[i + 2] * 1.25); // Más azul
            }
            break;
            
        case 'vintage':
            // Filtro vintage sepia
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
            }
            break;
            
        case 'festive':
            // Filtro festivo (colores vibrantes)
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.25);     // Más rojo
                data[i + 1] = Math.min(255, data[i + 1] * 1.15); // Más verde
                data[i + 2] = Math.min(255, data[i + 2] * 0.9); // Menos azul
            }
            break;
            
        case 'golden':
            // Filtro dorado navideño
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.1);     // Más rojo
                data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Más verde
                data[i + 2] = Math.min(255, data[i + 2] * 0.8); // Menos azul
            }
            break;
            
        case 'candy':
            // Filtro caramelo (colores dulces)
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.2);     // Más rojo
                data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Más verde
                data[i + 2] = Math.min(255, data[i + 2] * 1.3); // Más azul
            }
            break;
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function drawSnowflakes() {
    const snowflakeSymbols = ['❄', '❅', '❆'];
    const canvas = currentImage.canvas;
    const ctx = currentImage.ctx;
    
    for (let i = 0; i < 25; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const symbol = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
        const size = Math.random() * 20 + 10;
        const opacity = Math.random() * 0.6 + 0.4;
        
        ctx.font = `${size}px Arial`;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillText(symbol, x, y);
    }
}

function saveEditedPhoto() {
    if (!currentImage) return;
    
    const dataURL = currentImage.canvas.toDataURL('image/png');
    pets[currentImage.index].editedImage = dataURL;
    
    savePets();
    renderPets();
    
    document.getElementById('photoEditor').classList.remove('active');
    currentImage = null;
    stickers = [];
    currentFilter = 'none';
    currentBackground = 'none';
    imageWithoutBackground = null;
    
    alert('¡Foto editada guardada exitosamente! 🎄');
}

function cancelEdit() {
    document.getElementById('photoEditor').classList.remove('active');
    currentImage = null;
    stickers = [];
    currentFilter = 'none';
    currentBackground = 'none';
    imageWithoutBackground = null;
}

function addSticker(emoji) {
    if (!currentImage) return;
    
    const canvas = currentImage.canvas;
    const x = Math.random() * (canvas.width - 40);
    const y = Math.random() * (canvas.height - 40);
    
    stickers.push({ emoji, x, y });
    redrawImage();
}

// Event Listeners
document.getElementById('petForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (pets.length >= 4) {
        document.getElementById('limitMessage').classList.add('show');
        setTimeout(() => {
            document.getElementById('limitMessage').classList.remove('show');
        }, 5000);
        return;
    }
    
    const imageFile = document.getElementById('petImage').files[0];
    let imageDataURL = null;
    
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageDataURL = e.target.result;
            
            const newPet = {
                name: document.getElementById('petName').value,
                type: document.getElementById('petType').value,
                age: document.getElementById('petAge').value,
                description: document.getElementById('petDescription').value,
                image: imageDataURL,
                votes: 0,
                editedImage: null
            };
            
            pets.push(newPet);
            savePets();
            renderPets();
            document.getElementById('petForm').reset();
            document.querySelector('.file-input-label span').textContent = 'Sube una foto de tu mascota';
        };
        reader.readAsDataURL(imageFile);
    } else {
        const newPet = {
            name: document.getElementById('petName').value,
            type: document.getElementById('petType').value,
            age: document.getElementById('petAge').value,
            description: document.getElementById('petDescription').value,
            votes: 0,
            editedImage: null
        };
        
        pets.push(newPet);
        savePets();
        renderPets();
        document.getElementById('petForm').reset();
    }
});

document.getElementById('petImage').addEventListener('change', function(e) {
    const fileName = e.target.files[0]?.name || 'Sube una foto de tu mascota';
    document.querySelector('.file-input-label span').textContent = fileName.length > 20 ? 
        fileName.substring(0, 20) + '...' : fileName;
});

document.getElementById('saveEditedPhoto').addEventListener('click', saveEditedPhoto);
document.getElementById('cancelEdit').addEventListener('click', cancelEdit);
document.getElementById('removeBackgroundBtn').addEventListener('click', removeBackground);

document.querySelectorAll('.sticker').forEach(sticker => {
    sticker.addEventListener('click', function() {
        addSticker(this.getAttribute('data-emoji'));
    });
});

document.querySelectorAll('.effect-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        applyFilter(this.dataset.effect);
    });
});

document.querySelectorAll('.background-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        applyBackground(this.dataset.background);
    });
});

// Sliders para ajustes de imagen
document.getElementById('brightnessSlider').addEventListener('input', function() {
    brightness = this.value;
    document.getElementById('brightnessValue').textContent = brightness + '%';
    applyImageAdjustments();
});

document.getElementById('contrastSlider').addEventListener('input', function() {
    contrast = this.value;
    document.getElementById('contrastValue').textContent = contrast + '%';
    applyImageAdjustments();
});

document.getElementById('saturationSlider').addEventListener('input', function() {
    saturation = this.value;
    document.getElementById('saturationValue').textContent = saturation + '%';
    applyImageAdjustments();
});

function updateCountdown() {
    const now = new Date();
    const currentYear = now.getFullYear();
    let christmasDate = new Date(currentYear, 11, 25);
    
    if (now > christmasDate) { 
        christmasDate = new Date(currentYear + 1, 11, 25); 
    }
    
    const diff = christmasDate - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('countdown').innerHTML = 
        `🎅 ¡Faltan ${days} días, ${hours} horas, ${minutes} minutos y ${seconds} segundos para Navidad! 🎄`;
}

function createSnowflakes() {
    const snowflakesContainer = document.getElementById('snowflakes'); 
    const snowflakeSymbols = ['❄', '❅', '❆'];
    
    for (let i = 0; i < 50; i++) {
        const snowflake = document.createElement('div'); 
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
        snowflake.style.left = Math.random() * 100 + '%'; 
        snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
        snowflake.style.animationDelay = Math.random() * 5 + 's'; 
        snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        snowflake.style.opacity = Math.random() * 0.6 + 0.4;
        snowflakesContainer.appendChild(snowflake);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    updateCountdown();
    setInterval(updateCountdown, 1000);
    createSnowflakes();
    renderPets();
});