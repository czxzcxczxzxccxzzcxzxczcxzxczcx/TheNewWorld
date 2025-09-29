import { apiRequest } from './apiRequest.js';

const PICKER_ID = 'tnw-gif-picker';

function createPickerShell() {
    const existing = document.getElementById(PICKER_ID);
    if (existing) {
        existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = PICKER_ID;
    overlay.className = 'gif-picker-overlay';
    overlay.innerHTML = `
        <div class="gif-picker-modal" role="dialog" aria-modal="true" aria-label="Choose a GIF">
            <div class="gif-picker-header">
                <h3 class="gif-picker-title">Select a GIF</h3>
                <button type="button" class="gif-picker-close" aria-label="Close">×</button>
            </div>
            <form class="gif-picker-search" autocomplete="off">
                <input type="text" name="query" placeholder="Search GIFs" aria-label="Search GIFs" required />
                <button type="submit" class="gif-picker-search-btn">Search</button>
                <button type="button" class="gif-picker-trending-btn">Trending</button>
            </form>
            <div class="gif-picker-status" role="status"></div>
            <div class="gif-picker-grid" aria-live="polite"></div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add('gif-picker-open');
    return overlay;
}

function renderStatus(container, message, tone = 'info') {
    if (!container) return;
    container.textContent = message;
    container.dataset.tone = tone;
}

async function fetchGifs(endpoint, query) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    const url = endpoint + (params.toString() ? `?${params.toString()}` : '');
    const data = await apiRequest(url, 'GET');
    if (!data?.success) {
        throw new Error(data?.message || 'Failed to fetch GIFs');
    }
    return data.gifs || [];
}

function renderGifs(grid, gifs = [], onSelect) {
    grid.innerHTML = '';
    if (!gifs.length) {
        const empty = document.createElement('div');
        empty.className = 'gif-picker-empty';
        empty.textContent = 'No GIFs found. Try a different search!';
        grid.appendChild(empty);
        return;
    }

    gifs.forEach(gif => {
        if (!gif || !gif.url) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'gif-picker-item';
        button.title = gif.title || 'GIF';
        button.innerHTML = `
            <img src="${gif.preview || gif.url}" data-full="${gif.url}" alt="${gif.title || 'GIF'}" loading="lazy" />
        `;
        button.addEventListener('click', () => onSelect(gif));
        grid.appendChild(button);
    });
}

export function openGiphyPicker({ onSelect } = {}) {
    if (typeof onSelect !== 'function') {
        throw new Error('openGiphyPicker requires an onSelect callback');
    }

    const overlay = createPickerShell();
    const modal = overlay.querySelector('.gif-picker-modal');
    const closeBtn = overlay.querySelector('.gif-picker-close');
    const form = overlay.querySelector('.gif-picker-search');
    const searchInput = form.querySelector('input[name="query"]');
    const searchBtn = form.querySelector('.gif-picker-search-btn');
    const trendingBtn = form.querySelector('.gif-picker-trending-btn');
    const status = overlay.querySelector('.gif-picker-status');
    const grid = overlay.querySelector('.gif-picker-grid');

    let activeRequest = null;

    function cleanup() {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        document.body.classList.remove('gif-picker-open');
        activeRequest = null;
    }

    function handleSelect(gif) {
        cleanup();
        onSelect(gif);
    }

    async function runSearch(endpoint, query = '') {
        if (activeRequest) {
            activeRequest.abort?.();
        }
        renderStatus(status, 'Loading GIFs…', 'info');
        grid.innerHTML = '';

        try {
            const gifs = await fetchGifs(endpoint, query);
            renderStatus(status, `${gifs.length} GIFs loaded`, 'success');
            renderGifs(grid, gifs, handleSelect);
        } catch (error) {
            console.error(error);
            renderStatus(status, error.message || 'Failed to load GIFs', 'error');
            grid.innerHTML = '';
        }
    }

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            cleanup();
        }
    });
    closeBtn.addEventListener('click', cleanup);
    document.addEventListener('keydown', function escHandler(event) {
        if (event.key === 'Escape') {
            cleanup();
            document.removeEventListener('keydown', escHandler);
        }
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const query = searchInput.value.trim();
        if (!query) {
            renderStatus(status, 'Please enter a search term', 'warning');
            return;
        }
        runSearch('/api/gifs/search', query);
    });

    trendingBtn.addEventListener('click', () => {
        searchInput.value = '';
        runSearch('/api/gifs/trending');
    });

    // Load trending on open for instant content
    runSearch('/api/gifs/trending');

    // Focus on input for quick typing
    setTimeout(() => searchInput.focus(), 50);

    return {
        close: cleanup
    };
}
