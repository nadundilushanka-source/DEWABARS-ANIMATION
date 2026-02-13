// public-site-logic.js
// Handles dynamic content loading for the public facing website with Firebase/Async support

const DATA_KEYS = {
    services: 'dewabars_services',
    portfolio: 'dewabars_portfolio',
    comments: 'dewabars_comments',
    pricing: 'dewabars_pricing',
    process: 'dewabars_process',
    content: 'dewabars_content'
};

// --- DATA ACCESS ---
// Modified to be Asynchronous to support Firebase
// --- DATA ACCESS ---
// Modified to be Asynchronous to support Firebase
// --- DATA ACCESS ---
// Modified to use "Cache-First" strategy for speed
// 1. Try to get data from LocalStorage (Instant)
// 2. Return that immediately
// 3. Fetch from Firebase in background to update cache for next visit
async function getData(key) {
    // 1. FAST: Try LocalStorage first
    const localData = localStorage.getItem(key);
    let parsedLocalData = null;

    if (localData) {
        try {
            parsedLocalData = JSON.parse(localData);
        } catch (e) {
            console.error("Local data parse error", e);
        }
    }

    // 2. SLOW: Fetch from Firebase (Network)
    // We only await this if we have NO local data.
    // Otherwise, we trigger it in the background to update the cache.
    if (typeof DB_ADAPTER !== 'undefined') {
        const networkPromise = DB_ADAPTER.getAny(key).then(data => {
            if (data) {
                // Update Cache for next time
                localStorage.setItem(key, JSON.stringify(data));
                return data;
            }
            return [];
        });

        // If we have local data, return it INSTANTLY and let network update cache in background
        if (parsedLocalData) {
            console.log(`[FastLoad] Returning cached ${key}`);
            // Optional: You could trigger a UI refresh here if you implement listeners, 
            // but for now, we prioritize speed. The user will see updates on next refresh.
            // OR: We can rely on Firebase's own offline persistence if enabled.

            // To be safe and ensure updates: We will return network data IF it resolves fast (e.g. < 500ms),
            // otherwise return local. But complex race conditions arise.

            // DECISION: Return Local Data immediately.
            // Fire network request purely to update cache.
            return parsedLocalData;
        }

        // No local data? Must wait for network.
        console.log(`[FastLoad] No cache for ${key}, awaiting network...`);
        return await networkPromise;
    }

    return parsedLocalData || [];
}

async function saveData(key, data) {
    if (typeof DB_ADAPTER !== 'undefined') {
        await DB_ADAPTER.saveAny(key, data);
        return;
    }
    localStorage.setItem(key, JSON.stringify(data));
}

// --- RENDER FUNCTIONS ---

// Render Services on services.html
async function loadServices() {
    const container = document.getElementById('services-container');
    if (!container) return; // Not on services page

    // SKELETON LOADING (3 placeholders)
    if (container.children.length === 0) {
        container.innerHTML = Array(3).fill(0).map(() => `
            <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div class="skeleton w-16 h-16 rounded-full mb-6"></div>
                <div class="skeleton w-3/4 h-8 mb-4"></div>
                <div class="skeleton w-full h-4 mb-2"></div>
                <div class="skeleton w-2/3 h-4"></div>
            </div>
        `).join('');
    }

    // Fetch Real Data
    const services = await getData(DATA_KEYS.services);

    // Check if we have data
    if (services && services.length > 0) {
        container.innerHTML = services.map((service, index) => {
            // Default styles if not present in data
            const bgClass = service.bgClass || 'bg-blue-100 dark:bg-slate-700';
            const iconColorClass = service.colorClass || 'text-primary';

            return `
            <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-2 group"
                data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="w-16 h-16 ${bgClass} rounded-full flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                    <i class="${service.icon || 'fas fa-star'} text-2xl ${iconColorClass} group-hover:text-white transition-colors"></i>
                </div>
                <h3 class="text-2xl font-bold mb-4">${service.title}</h3>
                <p class="text-slate-600 dark:text-slate-300 mb-6">${service.description || service.desc}</p>
            </div>
            `;
        }).join('');
    }
}

// Render Portfolio on portfolio.html
// Global to track current gallery state
let currentGallery = [];
let currentGalleryIndex = 0;

async function loadPortfolio() {
    const container = document.getElementById('portfolio-container');
    if (!container) return;

    // SKELETON LOADING (6 placeholders)
    if (container.children.length === 0) {
        container.innerHTML = Array(6).fill(0).map(() => `
            <div class="rounded-2xl aspect-video overflow-hidden relative">
                <div class="skeleton w-full h-full absolute inset-0"></div>
            </div>
        `).join('');
    }

    const items = await getData(DATA_KEYS.portfolio);
    if (items && items.length > 0) {
        container.innerHTML = items.map((item, index) => {
            const imgSrc = item.isVideo ? (item.coverUrl || 'https://via.placeholder.com/800x600?text=Video') : item.url;
            const galleryCount = item.gallery ? item.gallery.length : 1;
            const badgeHtml = galleryCount > 1
                ? `<div class="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full z-20 flex items-center gap-1 border border-white/20">
                     <i class="fas fa-layer-group text-primary"></i> +${galleryCount - 1}
                   </div>`
                : '';

            // Unified click action: Always open lightbox
            const clickAction = `openLightboxFromIndex(${index})`;

            return `
            <div class="portfolio-item group relative overflow-hidden rounded-2xl aspect-video cursor-pointer" 
                 data-aos="zoom-in" data-category="${item.category}" onclick="${clickAction}">
                 ${badgeHtml}
                <img src="${imgSrc}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                
                ${item.isVideo ? `
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                        <i class="fas fa-play text-2xl text-white ml-1"></i>
                    </div>
                </div>
                ` : `
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div class="w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                        <i class="fas fa-expand-alt"></i>
                    </div>
                </div>
                `}

                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 z-20">
                    <span class="text-primary text-sm font-bold uppercase tracking-wider mb-2">${item.category || 'Project'}</span>
                    <h3 class="text-white text-xl font-bold">${item.title}</h3>
                </div>
            </div>
            `;
        }).join('');
    }
}

// Lightbox Functions
async function openLightboxFromIndex(index) {
    const items = await getData(DATA_KEYS.portfolio);
    const item = items[index];
    if (!item) return;

    // Build Gallery Array
    if (item.gallery && item.gallery.length > 0) {
        currentGallery = item.gallery;
    } else {
        // Fallback for items without gallery structure
        currentGallery = [{
            url: item.url,
            coverUrl: item.coverUrl,
            isVideo: item.isVideo
        }];
    }
    currentGalleryIndex = 0;

    // Initialize Lightbox
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    // Ensure Video Container Exists
    let videoContainer = document.getElementById('lightbox-video-container');
    if (!videoContainer) {
        videoContainer = document.createElement('div');
        videoContainer.id = 'lightbox-video-container';
        videoContainer.className = 'w-full max-w-4xl aspect-video hidden rounded-lg shadow-2xl overflow-hidden bg-black';
        videoContainer.onclick = (e) => e.stopPropagation();
        // Insert before image or append
        const img = document.getElementById('lightbox-img');
        if (img) {
            lightbox.insertBefore(videoContainer, img);
        } else {
            lightbox.appendChild(videoContainer);
        }
    }

    // Ensure Nav buttons exist (Lazy create if missing)
    let navControls = document.getElementById('lightbox-nav');
    if (!navControls) {
        navControls = document.createElement('div');
        navControls.id = 'lightbox-nav';
        navControls.className = 'absolute inset-0 flex items-center justify-between pointer-events-none px-4 z-50';
        navControls.innerHTML = `
            <button onclick="prevImage(event)" class="pointer-events-auto bg-black/50 text-white p-4 rounded-full hover:bg-primary hover:text-black transition-colors transform hover:scale-110 focus:outline-none backdrop-blur-sm">
                <i class="fas fa-chevron-left text-2xl"></i>
            </button>
            <button onclick="nextImage(event)" class="pointer-events-auto bg-black/50 text-white p-4 rounded-full hover:bg-primary hover:text-black transition-colors transform hover:scale-110 focus:outline-none backdrop-blur-sm">
                <i class="fas fa-chevron-right text-2xl"></i>
            </button>
        `;
        lightbox.appendChild(navControls);
    }

    // Counter / Info (New: "Choose One" indicator)
    let infoBar = document.getElementById('lightbox-info');
    if (!infoBar) {
        infoBar = document.createElement('div');
        infoBar.id = 'lightbox-info';
        infoBar.className = 'absolute bottom-6 left-0 right-0 text-center text-white pointer-events-none z-50';
        lightbox.appendChild(infoBar);
    }

    updateLightboxImage();

    lightbox.classList.remove('hidden');
    setTimeout(() => {
        lightbox.classList.remove('opacity-0');
        const img = document.getElementById('lightbox-img');
        if (img) img.classList.remove('scale-95');
    }, 10);
}

function updateLightboxImage() {
    const item = currentGallery[currentGalleryIndex];
    const img = document.getElementById('lightbox-img');
    const videoContainer = document.getElementById('lightbox-video-container');
    const navControls = document.getElementById('lightbox-nav');
    const infoBar = document.getElementById('lightbox-info');

    if (!item) return;

    // Update Navigation Visibility
    if (navControls) {
        navControls.style.display = currentGallery.length > 1 ? 'flex' : 'none';
    }

    // Update Counter
    if (infoBar) {
        infoBar.innerHTML = currentGallery.length > 1
            ? `<span class="bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">${currentGalleryIndex + 1} / ${currentGallery.length}</span>`
            : '';
    }

    // Handle Content Type
    if (item.isVideo) {
        if (img) img.classList.add('hidden');
        if (videoContainer) {
            videoContainer.classList.remove('hidden');

            // Show Cover with Play Button
            const cover = item.coverUrl || 'https://via.placeholder.com/800x600?text=Video+Cover';
            videoContainer.innerHTML = `
                <div class="relative w-full h-full flex items-center justify-center cursor-pointer group" onclick="playCurrentVideo()">
                    <img src="${cover}" class="w-full h-full object-cover pointer-events-none rounded-lg">
                    <div class="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors rounded-lg">
                        <div class="w-20 h-20 bg-white/20 backdrop-blur-md border border-white/50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                             <i class="fas fa-play text-white text-3xl ml-1"></i>
                        </div>
                    </div>
                </div>
            `;
        }
    } else {
        // Image Mode
        if (videoContainer) {
            videoContainer.classList.add('hidden');
            videoContainer.innerHTML = ''; // Stop video playback
        }
        if (img) {
            img.classList.remove('hidden');
            img.src = item.url;
        }
    }
}

function playCurrentVideo() {
    const item = currentGallery[currentGalleryIndex];
    if (!item || !item.isVideo) return;

    // Open video in a new tab/window directly
    window.open(item.url, '_blank');
}

function nextImage(e) {
    if (e) e.stopPropagation();
    if (currentGallery.length <= 1) return;
    currentGalleryIndex = (currentGalleryIndex + 1) % currentGallery.length;
    updateLightboxImage();
}

function prevImage(e) {
    if (e) e.stopPropagation();
    if (currentGallery.length <= 1) return;
    currentGalleryIndex = (currentGalleryIndex - 1 + currentGallery.length) % currentGallery.length;
    updateLightboxImage();
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const videoContainer = document.getElementById('lightbox-video-container');

    if (lightbox) {
        lightbox.classList.add('opacity-0');
        if (img) {
            img.classList.add('scale-95');
        }
        setTimeout(() => {
            lightbox.classList.add('hidden');
            if (img) img.src = '';
            if (videoContainer) {
                videoContainer.innerHTML = ''; // Stop playback
                videoContainer.classList.add('hidden');
            }
        }, 300);
    }
}

// Render Testimonials/Comments
async function loadTestimonials() {
    const container = document.getElementById('testimonials-container');
    if (!container) return;

    // SKELETON LOADING (3 placeholders)
    if (container.children.length === 0) {
        container.innerHTML = Array(3).fill(0).map(() => `
            <div class="bg-slate-50 dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                <div class="flex items-center gap-4 mb-6">
                    <div class="skeleton w-12 h-12 rounded-full"></div>
                    <div>
                        <div class="skeleton w-32 h-4 mb-2"></div>
                        <div class="skeleton w-20 h-3"></div>
                    </div>
                </div>
                <div class="skeleton w-full h-4 mb-2"></div>
                <div class="skeleton w-full h-4 mb-2"></div>
                <div class="skeleton w-2/3 h-4"></div>
            </div>
        `).join('');
    }

    const allComments = await getData(DATA_KEYS.comments);
    const comments = allComments.filter(c => c.status === 'approved');

    if (comments.length > 0) {
        container.innerHTML = comments.map(comment => {
            const stars = Array(5).fill(0).map((_, i) =>
                `<i class="fas fa-star ${i < comment.rating ? 'text-yellow-400' : 'text-slate-300'}"></i>`
            ).join('');

            return `
            <div class="bg-slate-50 dark:bg-slate-800 p-8 rounded-2xl shadow-lg" data-aos="fade-up">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                        ${comment.user.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 class="font-bold">${comment.user}</h4>
                        <div class="text-sm">${stars}</div>
                    </div>
                </div>
                <p class="text-slate-600 dark:text-slate-300 italic">"${comment.text}"</p>
            </div>
            `;
        }).join('');
    }
}

// Load Pricing (Pricing Page)
async function loadPricing() {
    const container = document.getElementById('pricing-grid');
    if (!container) return;

    // SKELETON LOADING (3 placeholders)
    if (container.children.length === 0) {
        container.innerHTML = Array(3).fill(0).map(() => `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-100 dark:border-slate-700">
                <div class="skeleton w-1/3 h-6 mb-4"></div>
                <div class="skeleton w-1/2 h-10 mb-6"></div>
                <div class="space-y-4 mb-8">
                    <div class="skeleton w-full h-4"></div>
                    <div class="skeleton w-full h-4"></div>
                    <div class="skeleton w-full h-4"></div>
                    <div class="skeleton w-2/3 h-4"></div>
                </div>
                <div class="skeleton w-full h-12 rounded-lg"></div>
            </div>
        `).join('');
    }

    const items = await getData(DATA_KEYS.pricing);
    if (items && items.length > 0) {
        container.innerHTML = items.map((item, index) => `
            <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl flex flex-col hover:scale-105 transition-transform duration-300 ${item.isPopular ? 'border-2 border-primary relative transform md:-translate-y-4' : ''}" 
                 data-aos="fade-up" data-aos-delay="${index * 100}">
                ${item.isPopular ? '<div class="absolute top-0 right-0 bg-primary text-black text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg uppercase">Popular</div>' : ''}
                <h3 class="text-xl font-bold ${item.isPopular ? 'text-primary' : 'text-slate-500'} mb-4">${item.name}</h3>
                <div class="text-4xl font-bold mb-6">${item.price} <span class="text-base text-slate-400 font-normal">${item.unit}</span></div>
                <ul class="space-y-4 mb-8 flex-grow">
                    ${item.features.map(f => `<li class="flex items-center gap-3"><i class="fas fa-check ${item.isPopular ? 'text-primary' : 'text-green-500'}"></i> ${f}</li>`).join('')}
                </ul>
                <a href="contact.html" class="block text-center py-3 ${item.isPopular ? 'bg-gradient-to-r from-primary to-accent text-black shadow-lg hover:shadow-xl' : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'} rounded-lg font-bold transition-all">Choose Plan</a>
            </div>
        `).join('');
    }
}

// Load Process (How It Works Page)
async function loadProcess() {
    const container = document.getElementById('process-container');
    if (!container) return;

    let items = await getData(DATA_KEYS.process);
    if (items && items.length > 0) {
        items.sort((a, b) => a.step - b.step);

        // Vertical Line HTML (Hidden on mobile, absolute center)
        const verticalLine = `<div class="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-slate-700"></div>`;

        const itemsHtml = items.map((item, index) => {
            const isImageLeft = index % 2 !== 0; // Index 0 (Step 1) -> Image Right (isImageLeft=false). Index 1 (Step 2) -> Image Left (isImageLeft=true).

            // Text Component
            const textAlignClass = isImageLeft ? 'md:text-left pl-0 md:pl-16' : 'md:text-right pr-0 md:pr-16';
            const orderClass = isImageLeft ? 'order-2 md:order-3' : 'order-2 md:order-1';

            const textContent = `
                <div class="md:w-5/12 text-center ${textAlignClass} ${orderClass} flex flex-col justify-center">
                    <h3 class="text-3xl font-bold mb-3 text-white">${item.title}</h3>
                    <p class="text-slate-400 leading-relaxed relative z-20 text-lg">${item.desc}</p>
                </div>
            `;

            // Image Component
            const imgOrderClass = isImageLeft ? 'order-3 md:order-1 pr-0 md:pr-16' : 'order-3 md:order-3 pl-0 md:pl-16';
            const rotationClass = isImageLeft ? 'rotate-2 hover:rotate-0' : '-rotate-2 hover:rotate-0';

            const imgContent = `
                <div class="md:w-5/12 ${imgOrderClass} mb-12 md:mb-0">
                     <div class="bg-[#1B2232] p-3 rounded-2xl shadow-2xl transform transition-transform duration-500 hover:scale-[1.02] ${rotationClass}">
                        <div class="relative overflow-hidden rounded-xl aspect-[16/9]">
                             <img src="${item.imageUrl || 'https://via.placeholder.com/600x400'}" 
                                class="w-full h-full object-cover">
                        </div>
                         <div class="pt-4 pb-2 px-2">
                            <span class="text-[#00e676] font-bold text-sm tracking-wide">Phase ${item.step}: ${item.phase || item.title}</span>
                         </div>
                     </div>
                </div>
            `;

            // Circle Component
            const circleContent = `
                <div class="md:w-2/12 flex justify-center order-1 md:order-2 mb-8 md:mb-0 relative z-10">
                    <div class="w-16 h-16 bg-[#111111] border-[3px] border-[#00e676] rounded-full flex items-center justify-center text-2xl font-bold text-[#00e676] shadow-[0_0_20px_rgba(0,230,118,0.2)] z-10 transition-all duration-300 cursor-pointer hover:scale-110 hover:shadow-[0_0_40px_rgba(0,230,118,0.8)] hover:bg-[#00e676] hover:text-[#111111]">
                        ${item.step}
                    </div>
                </div>
            `;

            return `
            <div class="flex flex-col md:flex-row items-center justify-between mb-32 relative w-full">
                ${isImageLeft ? imgContent : textContent}
                ${circleContent}
                ${isImageLeft ? textContent : imgContent}
            </div>
            `;
        }).join('');

        container.innerHTML = verticalLine + itemsHtml;

        // Refresh AOS to detect new elements
        if (typeof AOS !== 'undefined') {
            setTimeout(() => AOS.refresh(), 100);
        }
    }
}

// Load About Stats
async function loadAboutStats() {
    const container = document.getElementById('about-stats');
    if (!container) return;

    const data = await getData(DATA_KEYS.content);
    if (!data || !data.stat1Num) return;

    // Define stats with specific colors matching design
    const stats = [
        { num: data.stat1Num, label: data.stat1Label, color: 'text-primary' },
        { num: data.stat2Num, label: data.stat2Label, color: 'text-accent' },
        { num: data.stat3Num, label: data.stat3Label, color: 'text-green-600' },
        { num: data.stat4Num, label: data.stat4Label, color: 'text-green-400' }
    ];

    container.innerHTML = stats.map(stat => `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg text-center transform hover:scale-105 transition-transform duration-300 border border-transparent hover:border-primary/20">
            <div class="text-4xl font-bold ${stat.color} mb-2">${stat.num}</div>
            <div class="text-sm text-slate-500 font-medium uppercase tracking-wider">${stat.label}</div>
        </div>
    `).join('');
}

// --- PUBLIC ACTIONS ---

// Load Home Page Content
async function loadHomeContent() {
    const data = await getData(DATA_KEYS.content);
    if (!data) return;

    // Hero Image
    if (data.homeHeroImage) {
        const heroImg = document.getElementById('home-hero-image');
        if (heroImg) heroImg.src = data.homeHeroImage;
    }

    // Projects Count
    if (data.homeStatsCount) {
        const countEl = document.getElementById('home-stats-count');
        if (countEl) countEl.innerText = data.homeStatsCount;
    }
}

// Load Contact Info
async function loadContactInfo() {
    const data = await getData(DATA_KEYS.content);
    if (!data) return;

    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el && val) el.innerHTML = val.replace(/\n/g, '<br>');
    };

    // Main Contact Page
    setText('contact-phone-display', data.contactPhone);
    setText('contact-email-display', data.contactEmail);
    setText('contact-address-display', data.contactAddress);

    // Footer (on all pages)
    setText('footer-phone', data.contactPhone);
    setText('footer-email', data.contactEmail);
    setText('footer-address', data.contactAddress);
}


// --- PUBLIC ACTIONS ---

async function submitComment(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('commentForm');
    if (!form) return;

    const newComment = {
        id: Date.now(),
        user: form.name.value,
        text: form.message.value,
        rating: parseInt(form.rating.value) || 5,
        status: 'pending' // pending approval
    };

    const comments = await getData(DATA_KEYS.comments);
    comments.push(newComment);
    await saveData(DATA_KEYS.comments, comments);

    alert('Thank you! Your feedback has been submitted for review.');
    form.reset();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Fire all async loaders
    loadHomeContent();
    loadServices();
    loadPortfolio();
    loadTestimonials();
    loadPricing();
    loadProcess();
    loadAboutStats();
    loadContactInfo();
    // Team Removed

    const commentForm = document.getElementById('commentForm');
    if (commentForm) commentForm.addEventListener('submit', submitComment);

    // Refresh AOS immediately after all async calls are fired to catch skeletons
    if (typeof AOS !== 'undefined') AOS.refresh();

    // Final refresh to ensure layout is stable
    setTimeout(() => {
        if (typeof AOS !== 'undefined') AOS.refresh();
    }, 500);
});
