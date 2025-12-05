const STORAGE_KEY = 'tnw:onboarding-dismissed';

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'tnw-onboarding-overlay';

    const card = document.createElement('div');
    card.className = 'tnw-onboarding-card';

    card.innerHTML = `
        <h2>Welcome to The New World</h2>
        <p>Use the sidebar to navigate your feed, messages, profile, and more. Create your first post to start sharing!</p>
        <button type="button" class="tnw-onboarding-dismiss">Got it</button>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    return overlay;
}

export function initializeOnboarding() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    if (localStorage.getItem(STORAGE_KEY) === '1') {
        return;
    }

    const overlay = createOverlay();
    const dismissButton = overlay.querySelector('.tnw-onboarding-dismiss');

    const dismiss = () => {
        overlay.classList.add('dismissed');
        localStorage.setItem(STORAGE_KEY, '1');
        window.setTimeout(() => {
            overlay.remove();
        }, 250);
    };

    dismissButton?.addEventListener('click', dismiss);

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            dismiss();
        }
    });
}
