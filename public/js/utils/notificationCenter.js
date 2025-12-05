const PANEL_ID = 'notificationsPanel';
const OPEN_CLASS = 'open';

function findPanel() {
    return document.getElementById(PANEL_ID);
}

function findCloseButton(panel) {
    return panel?.querySelector('#closeNotifications') || panel?.querySelector('.closeNotificationsBtn');
}

function attachToggle(panel, setPanelOpen) {
    const toggleButtons = Array.from(document.querySelectorAll('[data-action="toggle-notifications"], #notificationsToggle'));

    if (!toggleButtons.length) {
        return () => {};
    }

    const handleToggle = (event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const willOpen = !panel.classList.contains(OPEN_CLASS);
        setPanelOpen(willOpen);
    };

    toggleButtons.forEach((btn) => {
        btn.addEventListener('click', handleToggle);
    });

    return () => {
        toggleButtons.forEach((btn) => {
            btn.removeEventListener('click', handleToggle);
        });
    };
}

export function initializeNotificationCenter() {
    if (typeof window === 'undefined') {
        return;
    }

    const panel = findPanel();
    if (!panel) {
        return;
    }

    const mobileQuery = window.matchMedia('(max-width: 960px)');
    const applyPanelMode = () => {
        panel.classList.toggle('notificationsPanel--mobile', mobileQuery.matches);
    };
    applyPanelMode();
    if (typeof mobileQuery.addEventListener === 'function') {
        mobileQuery.addEventListener('change', applyPanelMode);
    } else if (typeof mobileQuery.addListener === 'function') {
        mobileQuery.addListener(applyPanelMode);
    }
    window.addEventListener('orientationchange', () => {
        setTimeout(applyPanelMode, 120);
    });

    const setPanelOpen = (isOpen) => {
        panel.classList.toggle(OPEN_CLASS, isOpen);
        document.body.classList.toggle('notifications-open', isOpen);
        panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        if (isOpen) {
            applyPanelMode();
        }
    };

    const detachToggle = attachToggle(panel, setPanelOpen);
    const panelSheet = panel.querySelector('.notificationsPanel-sheet');

    if (panelSheet) {
        panelSheet.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    panel.addEventListener('click', () => {
        setPanelOpen(false);
    });

    const closeButton = findCloseButton(panel);
    if (closeButton) {
        closeButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            setPanelOpen(false);
        });
    }

    document.addEventListener('click', (event) => {
        if (!panel.contains(event.target) && !event.target.closest('[data-action="toggle-notifications"], #notificationsToggle')) {
            setPanelOpen(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && panel.classList.contains(OPEN_CLASS)) {
            setPanelOpen(false);
        }
    });

    window.addEventListener('beforeunload', () => {
        setPanelOpen(false);
        detachToggle();
    }, { once: true });
}
