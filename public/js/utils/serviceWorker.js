export function registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    const swUrl = '/service-worker.js';

    window.addEventListener('load', async () => {
        try {
            const probe = await fetch(swUrl, { method: 'HEAD' });
            if (!probe.ok) {
                console.debug('Service worker not found, skipping registration.');
                return;
            }

            await navigator.serviceWorker.register(swUrl);
        } catch (error) {
            console.debug('Service worker registration skipped:', error);
        }
    });
}
