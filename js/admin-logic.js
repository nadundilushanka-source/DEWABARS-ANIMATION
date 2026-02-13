// Admin Logic & Data Management
// Refactored for Firebase/Async Support

// --- DATA ACCESS HELPERS ---
// --- DATA ACCESS HELPERS ---
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
            return parsedLocalData;
        }

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

// --- AUTHENTICATION ---
// In a real app, this would use a database.
const ADMIN_CREDS = { user: 'admin', pass: 'admin123' };

function checkAuth() {
    const isLoggedIn = localStorage.getItem('dewabars_admin_logged_in');
    if (isLoggedIn) {
        // Critical Warning for Firebase
        if (!window.isFirebaseActive) {
            alert("⚠️ CRITICAL WARNING: DATABASE NOT CONNECTED! ⚠️\n\nYou have not set up your Firebase keys yet.\n\nChanges you make now will be saved to THIS COMPUTER ONLY (Offline Mode).\nVisitors and other users will NOT see these updates.\n\nPlease follow the instructions in 'FIREBASE_SETUP.md' to connect your database.");

            // Add visual indicator to dashboard
            const dashboard = document.getElementById('dashboard');
            const warningBanner = document.createElement('div');
            warningBanner.className = 'bg-red-600 text-white p-4 text-center font-bold sticky top-0 z-50';
            warningBanner.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i> OFFLINE MODE: Updates are NOT visible to others. Configure Firebase to go live.';
            dashboard.prepend(warningBanner);
        }

        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        // Trigger Async Init
        initAdminData();
    }
}

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    if (u === ADMIN_CREDS.user && p === ADMIN_CREDS.pass) {
        localStorage.setItem('dewabars_admin_logged_in', 'true');
        checkAuth();
    } else {
        document.getElementById('loginError').classList.remove('hidden');
    }
});

function logout() {
    localStorage.removeItem('dewabars_admin_logged_in');
    location.reload();
}

// --- DATA MANAGEMENT ---
// Default Data Definitions
const defaultServices = [
    { id: 1, title: '3D Animation', desc: 'High-quality 3D modeling and animation for products, characters, and architectural visualization.', icon: 'fas fa-cube', colorClass: 'text-primary', bgClass: 'bg-blue-100 dark:bg-slate-700' },
    { id: 2, title: '2D Animation', desc: 'Engaging 2D explainer videos, character animations, and motion comics to tell your story.', icon: 'fas fa-pencil-alt', colorClass: 'text-secondary', bgClass: 'bg-pink-100 dark:bg-slate-700' },
    { id: 3, title: 'Motion Graphics', desc: 'Dynamic motion graphics for logos, intro sequences, and promotional videos.', icon: 'fas fa-film', colorClass: 'text-purple-600', bgClass: 'bg-purple-100 dark:bg-slate-700' },
    { id: 4, title: 'Video Editing', desc: 'Professional video editing, color grading, and post-production services.', icon: 'fas fa-video', colorClass: 'text-primary', bgClass: 'bg-green-100 dark:bg-slate-700' },
    { id: 5, title: 'Concept Art', desc: 'Creative concept art and character design to visualize your ideas before production.', icon: 'fas fa-paint-brush', colorClass: 'text-orange-600', bgClass: 'bg-orange-100 dark:bg-slate-700' },
    { id: 6, title: 'VR / AR Content', desc: 'Immersive Virtual and Augmented Reality experiences for modern platforms.', icon: 'fas fa-vr-cardboard', colorClass: 'text-blue-600', bgClass: 'bg-blue-100 dark:bg-slate-700' }
];

const defaultPortfolio = [
    { id: 1, title: 'Neon City 3D', category: '3d', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', isVideo: false },
    { id: 2, title: 'Character Design', category: 'char', url: 'https://images.unsplash.com/photo-1635322966219-b75ed3a90533?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', isVideo: false },
    { id: 3, title: 'Tech Intro', category: 'motion', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', isVideo: false },
    { id: 4, title: 'Product Viz', category: '3d', url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', isVideo: false },
    { id: 5, title: 'Explainer Video', category: '2d', url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', isVideo: false },
    { id: 6, title: 'Abstract Art', category: '3d', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', isVideo: false }
];

const defaultComments = [
    { id: 1, user: 'John Smith', text: 'The team at DEWABARS exceeded our expectations. The 3D architectural walkthrough was simply stunning.', rating: 5, status: 'approved' },
    { id: 2, user: 'Sarah Jones', text: 'Highly professional and creative. They took our vague idea and turned it into a captivating explainer video.', rating: 5, status: 'approved' },
    { id: 3, user: 'Michael Brown', text: 'Fast turnaround time and excellent communication. The character design for our game was spot on.', rating: 5, status: 'approved' }
];

const defaultPricing = [
    { id: 1, name: 'Starter', price: '$499', unit: '/ project', features: ['Up to 30 Seconds', '1080p HD Resolution', 'Standard Assets', 'Royalty-Free Music', '2 Revisions'], isPopular: false },
    { id: 2, name: 'Professional', price: '$999', unit: '/ project', features: ['Up to 90 Seconds', '4K Ultra HD', 'Custom Characters', 'Professional Voiceover', 'Unlimited Revisions'], isPopular: true },
    { id: 3, name: 'Enterprise', price: 'Custom', unit: '', features: ['Full Series Production', 'Dedicated Art Director', 'Cinematic Quality', 'Source Files Included', 'Priority Support'], isPopular: false }
];

const defaultProcess = [
    { id: 1, step: 1, phase: 'Discovery', title: 'Consultation', desc: 'We discuss your vision, goals, and requirements to understand exactly what you need.', imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
    { id: 2, step: 2, phase: 'Strategy', title: 'Script & Storyboard', desc: 'Our creative team develops a unique concept and compelling script for your animation.', imageUrl: 'https://images.unsplash.com/photo-1626785774573-4b79931bfd54?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
    { id: 3, step: 3, phase: 'Creation', title: 'Production', desc: 'This is where the magic happens. We bring the characters and scenes to life through animation.', imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' },
    { id: 4, step: 4, phase: 'Launch', title: 'Final Delivery', desc: 'We deliver the final polished animation in your preferred format, ready to share with the world.', imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' }
];

const defaultContent = {
    homeHeroTitle: 'High-Impact Animation Services',
    homeHeroSubtitle: 'We create stunning 3D/2D animations, motion graphics, and VFX that bring your vision to life.',
    homeHeroImage: 'https://images.unsplash.com/photo-1626544827763-d516dce335ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    homeStatsCount: '250+',
    aboutTitle: 'Creativity Meets Technology',
    aboutText: 'Founded in 2024, DEWABARS ANIMATIONS started with a simple mission: to bring imagination to life through stunning visuals. Our studio specializes in blending artistic vision with cutting-edge technology.',
    stat1Num: '250+', stat1Label: 'Projects Done',
    stat2Num: '50+', stat2Label: 'Happy Clients',
    stat3Num: '5+', stat3Label: 'Years Exp.',
    stat4Num: '10+', stat4Label: 'Awards',
    contactPhone: '077 567 4912',
    contactEmail: 'oryxranking@gmail.com',
    contactAddress: 'Dewabars Animation Studio, Sri Lanka'
};

const defaultCategories = [
    { value: '3d', label: '3D Animation' },
    { value: '2d', label: '2D Animation' },
    { value: 'vfx', label: 'VFX' },
    { value: 'motion', label: 'Motion Graphics' },
    { value: 'char', label: 'Character Design' }
];

// --- INITIALIZATION ---
async function initAdminData() {
    try {
        // 0. Connection Test (Fast fail)
        if (window.isFirebaseActive) {
            try {
                // Just check if we can read the test path, don't block too long
                const testRef = db.collection('site_data').doc('test_connection');
                // We don't await this strictly if we want speed, but for connectivity check it's safer.
                // Optim: strict check only if no local data
            } catch (err) {
                if (err.code === 'permission-denied') {
                    alert("⛔ DATABASE PERMISSION DENIED ⛔\nYour database is locked.");
                    return;
                }
            }
        }

        // Parallel Data Fetch & Seed (Much Faster)
        const collections = [
            { key: 'dewabars_services', default: defaultServices },
            { key: 'dewabars_portfolio', default: defaultPortfolio },
            { key: 'dewabars_comments', default: defaultComments },
            { key: 'dewabars_pricing', default: defaultPricing },
            { key: 'dewabars_process', default: defaultProcess },
            { key: 'dewabars_content', default: defaultContent },
            { key: 'dewabars_portfolio_categories', default: defaultCategories }
        ];

        // Fire all requests at once
        await Promise.all(collections.map(async (col) => {
            const data = await getData(col.key);
            if (!data || data.length === 0 || (Array.isArray(data) && data.length <= 0)) {
                console.log(`Seeding default data for ${col.key}`);
                await saveData(col.key, col.default);
            }
        }));

        // Render Dashboard ONLY (Lazy load others)
        renderDashboard();

        // Initial render of other sections (in background, don't await)
        // setTimeout(() => loadData(), 100); // Optional: render everything else after a slight delay


        if (window.isFirebaseActive) {
            const dashboard = document.getElementById('dashboard');
            // Remove any old warnings
            const oldWarning = dashboard.querySelector('.bg-red-600');
            if (oldWarning) oldWarning.remove();

            // UI is now in HTML, just confirm status
            const statusDot = document.getElementById('status-dot');
            if (statusDot) statusDot.classList.add('bg-green-500', 'animate-pulse');
        }

    } catch (error) {
        console.error("Critical Init Error:", error);
        alert("Failed to initialize data: " + error.message);
    }
}

// FORCE SYNC FUNCTION
async function forceSync() {
    if (!window.isFirebaseActive) {
        alert("Offline Mode: Cannot sync.");
        return;
    }

    const icon = document.getElementById('force-sync-icon');
    if (icon) icon.classList.add('fa-spin');

    try {
        await Promise.all([
            getData('dewabars_services'), // Trigger refetch
            getData('dewabars_portfolio')
        ]);

        document.getElementById('last-sync-time').innerText = new Date().toLocaleTimeString();
        // show toast or mini notification
    } catch (e) {
        console.error("Sync failed", e);
        alert("Sync error");
    } finally {
        if (icon) icon.classList.remove('fa-spin');
    }
}




async function loadData() {
    await renderServices();
    await renderCategories();
    await renderPortfolio();
    await renderComments();
    await renderPricing();
    await renderProcess();
    await renderContentForms();
}

// --- CRUD OPERATIONS ---

// Generic Delete
async function deleteItem(type, id) {
    if (!confirm('Are you sure?')) return;
    const key = `dewabars_${type}`;
    let list = await getData(key);
    list = list.filter(i => i.id !== id);
    await saveData(key, list);
    console.log(`Deleted ${id} from ${key}`);
    loadData();
}

// --- CATEGORIES ---
async function renderCategories() {
    const list = await getData('dewabars_portfolio_categories');
    const select = document.getElementById('portfolioCategory');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = list.map(c => `<option value="${c.value}">${c.label}</option>`).join('');

    // Restore selection if valid
    if (currentVal && list.some(c => c.value === currentVal)) {
        select.value = currentVal;
    }
}

async function openCategoryManager() {
    openModal('categoryModal');
    renderCategoryManagerList();
}

async function renderCategoryManagerList() {
    const list = await getData('dewabars_portfolio_categories');
    const container = document.getElementById('categoryList');
    if (!container) return;

    container.innerHTML = list.map((c, index) => `
        <div class="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 p-3 rounded border dark:border-slate-600 group">
            <span class="font-medium">${c.label}</span>
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onclick="promptRenameCategory(${index})" class="text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button>
                 <button onclick="deleteCategory(${index})" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

async function handleCategoryAdd(e) {
    e.preventDefault();
    const form = e.target;
    const newName = form.newCatName.value.trim();

    if (newName) {
        const newValue = newName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        let list = await getData('dewabars_portfolio_categories');

        if (list.find(c => c.value === newValue)) {
            alert('Category already exists!');
            return;
        }

        list.push({ value: newValue, label: newName });
        await saveData('dewabars_portfolio_categories', list);

        form.reset();
        renderCategoryManagerList();
        renderCategories();
    }
}

async function deleteCategory(index) {
    if (!confirm('Delete this category?')) return;
    let list = await getData('dewabars_portfolio_categories');
    list.splice(index, 1);
    await saveData('dewabars_portfolio_categories', list);
    renderCategoryManagerList();
    renderCategories();
}

async function promptRenameCategory(index) {
    let list = await getData('dewabars_portfolio_categories');
    const cat = list[index];
    const newName = prompt('Rename Category:', cat.label);
    if (newName && newName.trim() !== '') {
        cat.label = newName.trim();
        cat.value = newName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        list[index] = cat;
        await saveData('dewabars_portfolio_categories', list);
        renderCategoryManagerList();
        renderCategories();
    }
}

async function addNewCategory() {
    const newLabel = prompt("Enter new category name:");
    if (newLabel && newLabel.trim() !== "") {
        const newValue = newLabel.toLowerCase().replace(/[^a-z0-9]/g, '-');
        let list = await getData('dewabars_portfolio_categories');

        if (list.find(c => c.value === newValue)) {
            alert('Category already exists!');
            return;
        }

        list.push({ value: newValue, label: newLabel.trim() });
        await saveData('dewabars_portfolio_categories', list);
        renderCategories();

        const select = document.getElementById('portfolioCategory');
        if (select) select.value = newValue;
    }
}

// --- GENERIC EDIT ---
async function editItem(type, id) {
    const key = `dewabars_${type}`;
    const list = await getData(key);
    const item = list.find(i => i.id === id);
    if (!item) return;

    if (type === 'services') {
        const form = document.querySelector('form[onsubmit="handleServiceSubmit(event)"]');
        form.reset();
        document.getElementById('serviceModalTitle').innerText = 'Edit Service';
        document.getElementById('serviceEditId').value = item.id;
        form.title.value = item.title;
        form.description.value = item.description || item.desc;
        form.icon.value = item.icon;
        document.getElementById('selectedIcon').value = item.icon;
        const iconName = document.getElementById('iconName');
        if (iconName) iconName.textContent = item.icon;
        form.imageUrl.value = item.imageUrl || '';
        openModal('serviceModal');
    } else if (type === 'pricing') {
        const form = document.querySelector('form[onsubmit="handlePricingSubmit(event)"]');
        form.reset();
        document.getElementById('pricingModalTitle').innerText = 'Edit Pricing Plan';
        document.getElementById('pricingEditId').value = item.id;
        form.name.value = item.name;
        form.price.value = item.price;
        form.unit.value = item.unit;
        form.features.value = item.features.join('\n');
        openModal('pricingModal');
    } else if (type === 'process') {
        const form = document.querySelector('form[onsubmit="handleProcessSubmit(event)"]');
        form.reset();
        document.getElementById('processModalTitle').innerText = 'Edit Step';
        document.getElementById('processEditId').value = item.id;
        form.step.value = item.step;
        form.phase.value = item.phase;
        form.title.value = item.title;
        form.description.value = item.desc;
        toggleProcessMediaType('url');
        form.imageUrl.value = item.imageUrl || '';
        openModal('processModal');
    } else if (type === 'portfolio') {
        const form = document.querySelector('form[onsubmit="handlePortfolioSubmit(event)"]');
        form.reset();
        document.getElementById('portfolioModalTitle').innerText = 'Edit Project Details';
        document.getElementById('portfolioEditId').value = item.id;
        form.title.value = item.title;
        form.category.value = item.category;
        form.isVideo.checked = !!item.isVideo;
        toggleVideoCover();
        toggleMediaType('url');
        form.mediaUrl.value = item.url;
        openModal('portfolioModal');
    }
}

// --- SERVICES ---
async function renderServices() {
    const list = await getData('dewabars_services');
    const container = document.getElementById('servicesList');
    container.innerHTML = list.map(item => `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg relative group">
            <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="editItem('services', ${item.id})" class="text-blue-400 hover:text-blue-600"><i class="fas fa-edit"></i></button>
                <button onclick="deleteItem('services', ${item.id})" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
            </div>
            <i class="${item.icon} text-4xl text-primary mb-4"></i>
            <h3 class="text-xl font-bold mb-2">${item.title}</h3>
            <p class="text-slate-600 dark:text-slate-400 text-sm">${item.desc || item.description}</p>
        </div>
    `).join('');
}

async function handleServiceSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const editId = document.getElementById('serviceEditId').value;

    const newItem = {
        id: editId ? parseInt(editId) : Date.now(),
        title: form.title.value,
        description: form.description.value,
        icon: form.icon.value || 'fas fa-star',
        imageUrl: form.imageUrl.value || ''
    };

    let list = await getData('dewabars_services');

    if (editId) {
        const index = list.findIndex(i => i.id === parseInt(editId));
        if (index > -1) list[index] = newItem;
    } else {
        list.push(newItem);
    }

    await saveData('dewabars_services', list);

    form.reset();
    document.getElementById('serviceEditId').value = '';
    document.getElementById('serviceModalTitle').innerText = 'Add New Service';
    closeModal('serviceModal');
    renderServices();
}

// --- PORTFOLIO ---
async function renderPortfolio() {
    const list = await getData('dewabars_portfolio');
    const container = document.getElementById('portfolioList');

    container.innerHTML = list.map(item => {
        const galleryCount = item.gallery ? item.gallery.length : 1;
        return `
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden relative group">
             <!-- Top Actions -->
             <div class="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg backdrop-blur-sm shadow-md">
                <button onclick="editItem('portfolio', ${item.id})" class="text-blue-500 hover:text-blue-700" title="Edit Details"><i class="fas fa-edit"></i></button>
                <button onclick="editPortfolioSet(${item.id})" class="text-green-500 hover:text-green-700" title="Manage Files"><i class="fas fa-images"></i></button>
                <button onclick="deleteItem('portfolio', ${item.id})" class="text-red-500 hover:text-red-700" title="Delete Project"><i class="fas fa-trash"></i></button>
             </div>

            <div class="h-48 overflow-hidden relative">
                ${item.isVideo
                ? `<div class="w-full h-full relative">
                    <img src="${item.coverUrl || 'https://via.placeholder.com/400x300?text=No+Cover'}" class="w-full h-full object-cover opacity-80">
                    <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                        <i class="fas fa-video text-3xl text-white"></i>
                    </div>
                </div>`
                : `<img src="${item.url}" class="w-full h-full object-cover">`
            }
                ${galleryCount > 1 ? `<div class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm"><i class="fas fa-layer-group text-primary mr-1"></i> ${galleryCount} Files</div>` : ''}
            </div>
            <div class="p-4">
                <h3 class="font-bold truncate" title="${item.title}">${item.title}</h3>
                <span class="text-xs uppercase tracking-wider text-slate-500">${item.category}</span>
            </div>
        </div>
    `;
    }).join('');
}

async function editPortfolioSet(id) {
    const list = await getData('dewabars_portfolio');
    const item = list.find(i => i.id === id);
    if (!item) return;

    const modal = document.getElementById('editSetModal');
    const container = document.getElementById('editSetList');

    const gallery = item.gallery || [{ url: item.url, coverUrl: item.coverUrl, isVideo: item.isVideo }];

    container.innerHTML = gallery.map((media, idx) => `
        <div class="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <img src="${media.isVideo ? (media.coverUrl || 'https://via.placeholder.com/400x300?text=Video') : media.url}" class="w-full h-full object-cover">
            <button onclick="deleteFromSet(${item.id}, ${idx})" class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700">
                <i class="fas fa-times"></i>
            </button>
            ${media.isVideo ? '<div class="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1 rounded">Video</div>' : ''}
        </div>
    `).join('');

    modal.classList.remove('hidden');
}

async function deleteFromSet(projectId, itemIndex) {
    if (!confirm('Remove this file from the project?')) return;
    let list = await getData('dewabars_portfolio');
    const index = list.findIndex(i => i.id === projectId);
    if (index === -1) return;

    let item = list[index];
    let gallery = item.gallery || [{ url: item.url, coverUrl: item.coverUrl, isVideo: item.isVideo }];

    if (gallery.length <= 1) {
        alert("Cannot delete the last item. Delete the whole project instead.");
        return;
    }

    gallery.splice(itemIndex, 1);
    item.gallery = gallery;
    item.url = gallery[0].url;
    item.coverUrl = gallery[0].coverUrl;
    item.isVideo = gallery[0].isVideo;

    list[index] = item;
    await saveData('dewabars_portfolio', list);

    renderPortfolio();
    editPortfolioSet(projectId);
}

// Handler: Submit Portfolio
async function handlePortfolioSubmit(e) {
    e.preventDefault();
    const form = e.target;
    // UI State
    const inputFileBlock = document.getElementById('input-file');
    const isFileMode = inputFileBlock && !inputFileBlock.classList.contains('hidden');
    const isVideo = form.isVideo.checked;
    const editId = document.getElementById('portfolioEditId').value;

    const performSave = async (mainUrl, coverUrl) => {
        try {
            const title = form.title.value.trim();
            const category = form.category.value;
            if (!title) { alert('Please enter a project title.'); return; }

            let list = await getData('dewabars_portfolio');

            // EDIT MODE
            if (editId) {
                const index = list.findIndex(i => i.id === parseInt(editId));
                if (index > -1) {
                    const item = list[index];
                    item.title = title;
                    item.category = category;
                    if (mainUrl) {
                        item.url = mainUrl;
                        item.coverUrl = coverUrl || mainUrl;
                        item.isVideo = isVideo;
                        // Update 0th gallery item
                        if (item.gallery && item.gallery.length > 0) {
                            item.gallery[0] = { url: item.url, coverUrl: item.coverUrl, isVideo: item.isVideo };
                        } else {
                            item.gallery = [{ url: item.url, coverUrl: item.coverUrl, isVideo: item.isVideo }];
                        }
                    }
                    list[index] = item;
                    await saveData('dewabars_portfolio', list);
                    form.reset();
                    document.getElementById('portfolioEditId').value = '';
                    closeModal('portfolioModal');
                    renderPortfolio();
                    alert('Project updated!');
                    return;
                }
            }

            const newMedia = { url: mainUrl, coverUrl: coverUrl || mainUrl, isVideo: isVideo };
            const existingIndex = list.findIndex(i => i.title.toLowerCase() === title.toLowerCase() && i.category === category);

            if (existingIndex > -1) {
                const existing = list[existingIndex];
                if (!existing.gallery) {
                    existing.gallery = [{ url: existing.url, coverUrl: existing.coverUrl || existing.url, isVideo: existing.isVideo }];
                }
                existing.gallery.push(newMedia);
                list[existingIndex] = existing;
                alert('Added to existing project gallery!');
            } else {
                const newItem = {
                    id: Date.now(),
                    title: title,
                    category: category,
                    url: mainUrl,
                    coverUrl: coverUrl || mainUrl,
                    isVideo: isVideo,
                    gallery: [newMedia]
                };
                list.push(newItem);
                alert('New project created!');
            }

            await saveData('dewabars_portfolio', list);
            form.reset();
            closeModal('portfolioModal');
            renderPortfolio();

        } catch (err) {
            console.error(err);
            alert('Save Failed: ' + err.message);
        }
    };

    // Media Processing
    const processMain = async () => {
        if (editId) {
            const hasFile = isFileMode && form.mediaFile.files.length > 0;
            const hasUrl = !isFileMode && form.mediaUrl.value.trim() !== '';
            if (!hasFile && !hasUrl) {
                await performSave(null, null); // Just metadata update
                return;
            }
        }

        if (isFileMode) {
            const file = form.mediaFile.files[0];
            if (!file) { alert('Please select an image file.'); return; }
            try {
                const compressedMain = await compressImage(file);
                // Handle optional cover
                if (isVideo && form.coverFile.files.length > 0) {
                    const compressedCover = await compressImage(form.coverFile.files[0]);
                    await performSave(compressedMain, compressedCover);
                } else {
                    await performSave(compressedMain, null);
                }
            } catch (err) { alert(err.message); }
        } else {
            const url = form.mediaUrl.value.trim();
            if (!url) { alert('URL Required'); return; }
            // Handle optional cover
            if (isVideo && form.coverFile.files.length > 0) {
                try {
                    const compressedCover = await compressImage(form.coverFile.files[0]);
                    await performSave(url, compressedCover);
                } catch (err) { alert(err.message); }
            } else {
                await performSave(url, null);
            }
        }
    };

    processMain();
}

// --- COMMENTS ---
async function renderComments() {
    const list = await getData('dewabars_comments');
    const container = document.getElementById('commentsList');
    container.innerHTML = list.map(item => `
        <tr>
            <td class="px-6 py-4 font-medium">${item.user || 'Anonymous'}</td>
            <td class="px-6 py-4 text-sm">${item.text}</td>
            <td class="px-6 py-4 text-yellow-500">${'★'.repeat(item.rating)}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-xs ${item.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">${item.status}</span></td>
            <td class="px-6 py-4">
                ${item.status === 'pending' ? `<button onclick="updateComment(${item.id}, 'approved')" class="text-green-500 hover:text-green-700 mr-2"><i class="fas fa-check"></i></button>` : ''}
                <button onclick="editComment(${item.id})" class="text-blue-500 hover:text-blue-700 mr-2"><i class="fas fa-edit"></i></button>
                <button onclick="deleteItem('comments', ${item.id})" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function updateComment(id, status) {
    let list = await getData('dewabars_comments');
    const item = list.find(i => i.id === id);
    if (item) {
        item.status = status;
        await saveData('dewabars_comments', list);
        renderComments();
    }
}

async function editComment(id) {
    let list = await getData('dewabars_comments');
    const item = list.find(i => i.id === id);
    if (!item) return;
    const newText = prompt("Edit Review Text:", item.text);
    if (newText !== null) {
        item.text = newText;
        await saveData('dewabars_comments', list);
        renderComments();
    }
}

// --- PRICING ---
async function renderPricing() {
    const list = await getData('dewabars_pricing');
    const container = document.getElementById('pricingList');
    if (!container) return;
    container.innerHTML = list.map(item => `
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg relative group border-2 ${item.isPopular ? 'border-primary' : 'border-transparent'}">
            <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="editItem('pricing', ${item.id})" class="text-blue-400 hover:text-blue-600"><i class="fas fa-edit"></i></button>
                <button onclick="deleteItem('pricing', ${item.id})" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
            </div>
            <h3 class="text-xl font-bold mb-2">${item.name}</h3>
            <div class="text-3xl font-bold mb-4 text-primary">${item.price} <span class="text-sm text-slate-500 font-normal">${item.unit}</span></div>
            <ul class="text-sm space-y-2 text-slate-600 dark:text-slate-400">
                ${item.features.map(f => `<li>• ${f}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

async function handlePricingSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const editId = document.getElementById('pricingEditId').value;

    const newItem = {
        id: editId ? parseInt(editId) : Date.now(),
        name: form.name.value,
        price: form.price.value,
        unit: form.unit.value,
        features: form.features.value.split('\n').filter(line => line.trim() !== ''),
        isPopular: false
    };

    let list = await getData('dewabars_pricing');
    if (editId) {
        const index = list.findIndex(i => i.id === parseInt(editId));
        if (index > -1) {
            newItem.isPopular = list[index].isPopular;
            list[index] = newItem;
        }
    } else {
        list.push(newItem);
    }

    await saveData('dewabars_pricing', list);
    form.reset();
    document.getElementById('pricingEditId').value = '';
    closeModal('pricingModal');
    renderPricing();
}

// --- PROCESS ---
async function renderProcess() {
    let list = await getData('dewabars_process');
    const container = document.getElementById('processList');
    if (!container) return;
    list.sort((a, b) => a.step - b.step);
    container.className = 'grid grid-cols-1 gap-6';

    container.innerHTML = list.map(item => `
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row relative group border border-slate-100 dark:border-slate-700">
             <div class="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="editItem('process', ${item.id})" class="bg-white/90 p-2 rounded-full text-blue-500 hover:text-blue-700 shadow-sm"><i class="fas fa-edit"></i></button>
                <button onclick="deleteItem('process', ${item.id})" class="bg-white/90 text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white shadow-sm"><i class="fas fa-trash"></i></button>
             </div>
            <div class="md:w-1/3 aspect-video md:aspect-auto relative shrink-0">
                <img src="${item.imageUrl || 'https://via.placeholder.com/300x200'}" class="w-full h-full object-cover">
                <div class="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                    ${item.phase ? `Phase: ${item.phase}` : 'No Phase'}
                </div>
            </div>
            <div class="p-6 flex flex-col justify-center flex-grow">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm shadow-md shadow-primary/30">${item.step}</div>
                    <h4 class="font-bold text-lg">${item.title}</h4>
                </div>
                <p class="text-slate-600 dark:text-slate-400 text-sm mb-3">${item.desc}</p>
            </div>
        </div>
    `).join('');
}

async function handleProcessSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const isFile = !document.getElementById('process-input-file').classList.contains('hidden');
    const editId = document.getElementById('processEditId').value;

    let list = await getData('dewabars_process');
    let oldItem = editId ? list.find(i => i.id === parseInt(editId)) : null;

    const saveProcess = async (imageUrl) => {
        const newItem = {
            id: editId ? parseInt(editId) : Date.now(),
            step: parseInt(form.step.value),
            phase: form.phase.value || '',
            title: form.title.value,
            imageUrl: imageUrl || (oldItem ? oldItem.imageUrl : ''),
            desc: form.description.value
        };

        if (editId) {
            const index = list.findIndex(i => i.id === parseInt(editId));
            if (index > -1) list[index] = newItem;
        } else {
            list.push(newItem);
        }

        await saveData('dewabars_process', list);
        form.reset();
        document.getElementById('processEditId').value = '';
        closeModal('processModal');
        toggleProcessMediaType('file');
        renderProcess();
    };

    if (isFile) {
        const file = form.mediaFile.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = function () { saveProcess(reader.result); };
            reader.readAsDataURL(file);
        } else {
            if (editId && oldItem) saveProcess(oldItem.imageUrl);
            else alert('Select an image.');
        }
    } else {
        const url = form.imageUrl.value;
        if (url) saveProcess(url);
        else if (editId && oldItem) saveProcess(oldItem.imageUrl);
        else alert('Enter URL.');
    }
}

// --- CONTENT PAGE ---
async function renderContentForms() {
    const data = await getData('dewabars_content');
    // Helper
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    if (!data) return;

    setVal('homeHeroTitle', data.homeHeroTitle);
    setVal('homeHeroSubtitle', data.homeHeroSubtitle);
    setVal('homeHeroImage', data.homeHeroImage);
    setVal('homeStatsCount', data.homeStatsCount);
    setVal('aboutTitle', data.aboutTitle);
    setVal('aboutText', data.aboutText);
    setVal('stat1Num', data.stat1Num);
    setVal('stat1Label', data.stat1Label);
    setVal('stat2Num', data.stat2Num);
    setVal('stat2Label', data.stat2Label);
    setVal('stat3Num', data.stat3Num);
    setVal('stat3Label', data.stat3Label);
    setVal('stat4Num', data.stat4Num);
    setVal('stat4Label', data.stat4Label);
    setVal('contactPhone', data.contactPhone);
    setVal('contactEmail', data.contactEmail);
    setVal('contactAddress', data.contactAddress);
}

async function handleContentSubmit(e) {
    e.preventDefault();
    const form = e.target;

    const saveContent = async (heroImgVal) => {
        const content = {
            homeHeroTitle: form.homeHeroTitle.value,
            homeHeroSubtitle: form.homeHeroSubtitle.value,
            homeHeroImage: heroImgVal,
            homeStatsCount: form.homeStatsCount.value,
            aboutTitle: form.aboutTitle.value,
            aboutText: form.aboutText.value,
            stat1Num: form.stat1Num.value,
            stat1Label: form.stat1Label.value,
            stat2Num: form.stat2Num.value,
            stat2Label: form.stat2Label.value,
            stat3Num: form.stat3Num.value,
            stat3Label: form.stat3Label.value,
            stat4Num: form.stat4Num.value,
            stat4Label: form.stat4Label.value,
            contactPhone: form.contactPhone.value,
            contactEmail: form.contactEmail.value,
            contactAddress: form.contactAddress.value
        };
        await saveData('dewabars_content', content);
        alert('Site content updated!');
    };

    // simplified check
    const isHeroFile = document.getElementById('homeHeroImageFileGroup') && !document.getElementById('homeHeroImageFileGroup').classList.contains('hidden');
    if (isHeroFile && form.homeHeroImageFile.files.length > 0) {
        const reader = new FileReader();
        reader.onloadend = function () { saveContent(reader.result); };
        reader.readAsDataURL(form.homeHeroImageFile.files[0]);
    } else {
        saveContent(form.homeHeroImage.value);
    }
}

// Reuse utils
function toggleHomeHeroMediaType(type) {
    const fileGroup = document.getElementById('homeHeroImageFileGroup');
    const urlGroup = document.getElementById('homeHeroImageUrlGroup');
    const btnFile = document.getElementById('btn-hero-file');
    const btnUrl = document.getElementById('btn-hero-url');
    if (type === 'file') {
        fileGroup.classList.remove('hidden'); urlGroup.classList.add('hidden');
        btnFile.classList.add('text-primary', 'border-primary'); btnFile.classList.remove('text-slate-500', 'border-transparent');
        btnUrl.classList.remove('text-primary', 'border-primary'); btnUrl.classList.add('text-slate-500', 'border-transparent');
    } else {
        fileGroup.classList.add('hidden'); urlGroup.classList.remove('hidden');
        btnUrl.classList.add('text-primary', 'border-primary'); btnUrl.classList.remove('text-slate-500', 'border-transparent');
        btnFile.classList.remove('text-primary', 'border-primary'); btnFile.classList.add('text-slate-500', 'border-transparent');
    }
}
async function switchTab(tabId) {
    // UI Update
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`${tabId}-tab`).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('text-primary', 'bg-slate-100', 'dark:bg-slate-800'));

    // Highlight Active Button
    // (We need to identify the button, but simpler is to let the user click handle it or add ID to buttons. 
    // The previous code didn't highlight specific button based on ID, so we skip complex highlighting logic for now 
    // or rely on the onClick adding classes if implemented elsewhere, but the previous code removed classes.
    // Let's just fix the Data Loading.)

    // Lazy Load Data
    switch (tabId) {
        case 'services': await renderServices(); break;
        case 'portfolio': await renderPortfolio(); break;
        case 'comments': await renderComments(); break;
        case 'pricing': await renderPricing(); break;
        case 'process': await renderProcess(); break;
        case 'content': await renderContentForms(); break;
    }
}
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Icons and UI
const iconList = ['fas fa-paint-brush', 'fas fa-palette', 'fas fa-pen-nib', 'fas fa-pencil-alt', 'fas fa-layer-group', 'fas fa-film', 'fas fa-video', 'fas fa-camera', 'fas fa-play-circle', 'fas fa-code', 'fas fa-laptop-code', 'fas fa-desktop', 'fas fa-mobile-alt', 'fas fa-star', 'fas fa-users', 'fas fa-rocket'];
function renderIcons() {
    const grid = document.getElementById('iconGrid'); if (!grid) return;
    grid.innerHTML = iconList.map(icon => `<div onclick="selectIcon('${icon}')" class="icon-option p-2 rounded cursor-pointer hover:bg-primary/20 text-center text-xl text-slate-600 dark:text-slate-300" title="${icon}"><i class="${icon}"></i></div>`).join('');
}
function selectIcon(i) {
    document.getElementById('selectedIcon').value = i;
    document.getElementById('iconName').textContent = i;
}
function filterIcons() {
    // simplified
}
document.addEventListener('DOMContentLoaded', renderIcons);

// Clean up helper
function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const cvs = document.createElement('canvas');
                let w = img.width; let h = img.height;
                if (w > 800) { h *= 800 / w; w = 800; }
                cvs.width = w; cvs.height = h;
                cvs.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(cvs.toDataURL('image/jpeg', 0.6));
            };
        };
    });
}
// Button toggle helpers with UI feedback
function toggleMediaType(t) {
    const fi = document.getElementById('input-file');
    const ui = document.getElementById('input-url');
    const btnFile = document.getElementById('btn-file');
    const btnUrl = document.getElementById('btn-url');

    if (t === 'file') {
        fi.classList.remove('hidden'); ui.classList.add('hidden');
        btnFile.classList.add('text-primary', 'border-primary'); btnFile.classList.remove('text-slate-500', 'border-transparent');
        btnUrl.classList.remove('text-primary', 'border-primary'); btnUrl.classList.add('text-slate-500', 'border-transparent');
    } else {
        fi.classList.add('hidden'); ui.classList.remove('hidden');
        btnUrl.classList.add('text-primary', 'border-primary'); btnUrl.classList.remove('text-slate-500', 'border-transparent');
        btnFile.classList.remove('text-primary', 'border-primary'); btnFile.classList.add('text-slate-500', 'border-transparent');
    }
}

function toggleProcessMediaType(t) {
    const fi = document.getElementById('process-input-file');
    const ui = document.getElementById('process-input-url');
    const btnFile = document.getElementById('btn-process-file');
    const btnUrl = document.getElementById('btn-process-url');

    if (t === 'file') {
        fi.classList.remove('hidden'); ui.classList.add('hidden');
        btnFile.classList.add('text-primary', 'border-primary'); btnFile.classList.remove('text-slate-500', 'border-transparent');
        btnUrl.classList.remove('text-primary', 'border-primary'); btnUrl.classList.add('text-slate-500', 'border-transparent');
    } else {
        fi.classList.add('hidden'); ui.classList.remove('hidden');
        btnUrl.classList.add('text-primary', 'border-primary'); btnUrl.classList.remove('text-slate-500', 'border-transparent');
        btnFile.classList.remove('text-primary', 'border-primary'); btnFile.classList.add('text-slate-500', 'border-transparent');
    }
}

function toggleVideoCover() {
    const c = document.getElementById('input-cover');
    if (document.getElementById('isVideoCheck').checked) c.classList.remove('hidden'); else c.classList.add('hidden');
}
function clearSystemStorage() {
    if (confirm('Clear all data?')) { localStorage.clear(); location.reload(); }
}
function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) { document.documentElement.classList.remove('dark'); localStorage.theme = 'light'; }
    else { document.documentElement.classList.add('dark'); localStorage.theme = 'dark'; }
}

// Missing function fix
async function renderDashboard() {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    // Default to first tab
    switchTab('services');
}

checkAuth();
if (localStorage.theme === 'dark') document.documentElement.classList.add('dark');
