let overlayElement = null;
let contentElement = null;
let errorElement = null;
let countdownElement = null;
let actionsElement = null;
let countdownTimer = null;
let activeState = null;
let listenerRegistered = false;

async function requestJSON(url, method = 'GET', payload = null) {
    const options = {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    };

    if (payload) {
        options.body = JSON.stringify(payload);
    }

    try {
        const response = await fetch(url, options);
        const text = await response.text();
        if (!text) {
            return null;
        }
        try {
            const json = JSON.parse(text);
            json.__status = response.status;
            return json;
        } catch (error) {
            console.error('Failed to parse moderation overlay response JSON:', error, text);
            return null;
        }
    } catch (error) {
        console.error('Network error during moderation overlay request:', error);
        throw error;
    }
}

function ensureOverlay() {
    if (overlayElement) return;

    overlayElement = document.createElement('div');
    overlayElement.id = 'moderationOverlay';
    overlayElement.className = 'moderation-overlay hidden';

    overlayElement.innerHTML = `
        <div class="moderation-overlay__backdrop"></div>
        <div class="moderation-overlay__panel" role="dialog" aria-modal="true" aria-live="assertive">
            <div class="moderation-overlay__icon" id="moderationOverlayIcon">⚠️</div>
            <h2 class="moderation-overlay__title" id="moderationOverlayTitle"></h2>
            <p class="moderation-overlay__description" id="moderationOverlayDescription"></p>
            <div class="moderation-overlay__meta" id="moderationOverlayMeta"></div>
            <div class="moderation-overlay__countdown" id="moderationOverlayCountdown"></div>
            <div class="moderation-overlay__actions" id="moderationOverlayActions"></div>
            <p class="moderation-overlay__error" id="moderationOverlayError" hidden></p>
        </div>
    `;

    document.body.appendChild(overlayElement);

    contentElement = overlayElement.querySelector('.moderation-overlay__panel');
    errorElement = overlayElement.querySelector('#moderationOverlayError');
    countdownElement = overlayElement.querySelector('#moderationOverlayCountdown');
    actionsElement = overlayElement.querySelector('#moderationOverlayActions');
}

function showOverlay() {
    ensureOverlay();
    overlayElement.classList.remove('hidden');
    document.body.classList.add('moderation-locked');
}

function hideOverlay() {
    if (!overlayElement) return;
    overlayElement.classList.add('hidden');
    document.body.classList.remove('moderation-locked');
    errorElement.textContent = '';
    errorElement.hidden = true;
    stopCountdown();
    activeState = null;
}

function stopCountdown() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    if (countdownElement) {
        countdownElement.textContent = '';
        countdownElement.classList.remove('active');
    }
}

function renderMetaList(items = []) {
    if (!items.length) return '';
    return `
        <ul class="moderation-overlay__meta-list">
            ${items.map(item => `
                <li>
                    <span class="label">${item.label}</span>
                    <span class="value">${item.value}</span>
                </li>
            `).join('')}
        </ul>
    `;
}

function formatDate(date) {
    if (!date) return 'Unknown';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleString();
}

function formatDuration(ms) {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
        .map(num => String(num).padStart(2, '0'))
        .join(':');
}

function displayError(message) {
    ensureOverlay();
    if (!errorElement) return;
    errorElement.textContent = message;
    errorElement.hidden = !message;
}

function setIcon(icon) {
    const iconElement = overlayElement?.querySelector('#moderationOverlayIcon');
    if (iconElement) {
        iconElement.textContent = icon;
    }
}

function setTitle(text) {
    const titleElement = overlayElement?.querySelector('#moderationOverlayTitle');
    if (titleElement) {
        titleElement.textContent = text;
    }
}

function setDescription(text) {
    const descriptionElement = overlayElement?.querySelector('#moderationOverlayDescription');
    if (descriptionElement) {
        descriptionElement.textContent = text;
    }
}

function setMeta(html) {
    const metaElement = overlayElement?.querySelector('#moderationOverlayMeta');
    if (metaElement) {
        metaElement.innerHTML = html;
    }
}

function clearActions() {
    if (actionsElement) {
        actionsElement.innerHTML = '';
    }
}

function addActionButton({ label, variant = 'primary', onClick, id }) {
    if (!actionsElement) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `moderation-overlay__button ${variant}`;
    button.textContent = label;
    if (id) button.id = id;
    button.addEventListener('click', onClick, { once: true });
    actionsElement.appendChild(button);
    return button;
}

async function acknowledgeWarning(warningId) {
    displayError('');
    try {
        const response = await requestJSON('/api/moderation/acknowledge-warning', 'POST', { warningId });
        if (!response.success) {
            displayError(response.message || 'Failed to acknowledge warning. Please try again.');
            return;
        }
        hideOverlay();
        window.dispatchEvent(new CustomEvent('tnw:moderation-update', { detail: response.user || null }));
    } catch (error) {
        console.error('Failed to acknowledge warning:', error);
        displayError('An unexpected error occurred. Please try again.');
    }
}

async function refreshModerationStatus() {
    displayError('');
    try {
        const response = await requestJSON('/api/getUserInfo', 'GET');
        if (response && response.success && response.user) {
            window.dispatchEvent(new CustomEvent('tnw:moderation-update', { detail: response.user }));
            applyModerationState(response.user);
        } else if (response && response.code === 'BANNED' && response.ban) {
            showBanOverlay(response.ban);
        } else {
            displayError(response?.message || 'Unable to refresh status at this time.');
        }
    } catch (error) {
        console.error('Failed to refresh moderation status:', error);
        displayError('Unable to reach the server. Please try again.');
    }
}

async function performLogout() {
    displayError('');
    try {
        const response = await requestJSON('/api/logout', 'POST');
        if (response && response.success) {
            window.location.href = '/';
            return;
        }
        displayError(response?.message || 'Failed to log out. Please try again.');
    } catch (error) {
        console.error('Failed to log out:', error);
        displayError('Unable to log out right now. Please try again.');
    }
}

function showWarningOverlay(warning) {
    ensureOverlay();
    activeState = { type: 'warning', warning };
    stopCountdown();
    setIcon('⚠️');
    setTitle('Account Warning');
    setDescription('Your account has received a moderation warning. You must acknowledge this warning to continue.');
    setMeta(renderMetaList([
        { label: 'Reason', value: warning.reason || 'No reason provided' },
        { label: 'Issued by', value: `${warning.issuedByUsername || 'Unknown'} (${warning.issuedByRole || 'moderator'})` },
        { label: 'Issued at', value: formatDate(warning.issuedAt) }
    ]));

    clearActions();
    addActionButton({
        label: 'I Understand',
        variant: 'primary',
        onClick: () => acknowledgeWarning(warning.warningId)
    });

    showOverlay();
}

function handleCountdown(expiresAt) {
    stopCountdown();
    if (!expiresAt) {
        countdownElement.textContent = 'This ban does not expire automatically.';
        countdownElement.classList.add('active');
        return;
    }

    countdownElement.classList.add('active');
    const expiresDate = new Date(expiresAt);
    const update = () => {
        const diff = expiresDate.getTime() - Date.now();
        if (diff <= 0) {
            countdownElement.textContent = 'Ban period complete. You may attempt to re-enter.';
            stopCountdown();
            clearActions();
            addActionButton({
                label: 'Check Access',
                variant: 'primary',
                onClick: refreshModerationStatus,
                id: 'moderationCheckAccess'
            });
            return;
        }
        countdownElement.textContent = `Time remaining: ${formatDuration(diff)}`;
    };

    update();
    countdownTimer = setInterval(update, 1000);
}

function showBanOverlay(ban) {
    ensureOverlay();
    activeState = { type: 'ban', ban };
    setIcon('⛔');
    setTitle('Account Suspended');

    if (ban.status && ban.status !== 'active') {
        hideOverlay();
        return;
    }

    setDescription('Your account has been suspended. Access to the platform is restricted until the ban is lifted.');
    setMeta(renderMetaList([
        { label: 'Reason', value: ban.reason || 'No reason provided' },
        { label: 'Issued by', value: `${ban.issuedByUsername || 'Unknown'} (${ban.issuedByRole || 'moderator'})` },
        { label: 'Issued at', value: formatDate(ban.issuedAt) },
        { label: 'Expires at', value: ban.expiresAt ? formatDate(ban.expiresAt) : 'Permanent until reviewed' }
    ]));

    clearActions();
    addActionButton({
        label: 'Log Out',
        variant: 'primary',
        onClick: performLogout
    });
    addActionButton({
        label: 'Refresh Status',
        variant: 'secondary',
        onClick: refreshModerationStatus
    });

    handleCountdown(ban.expiresAt);
    showOverlay();
}

export function applyModerationState(user) {
    if (!listenerRegistered) {
        window.addEventListener('tnw:moderation-update', (event) => {
            if (event.detail) {
                applyModerationState(event.detail);
            } else {
                hideOverlay();
            }
        });
        listenerRegistered = true;
    }

    const moderation = user?.moderation || {};
    let { activeBan, activeWarning } = moderation;

    if (!activeBan && Array.isArray(moderation.bans)) {
        activeBan = [...moderation.bans]
            .filter((ban) => ban && ban.status === 'active')
            .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))[0] || null;
    }

    if (activeBan) {
        showBanOverlay(activeBan);
        return;
    }

    if (!activeWarning && Array.isArray(moderation.warnings)) {
        activeWarning = [...moderation.warnings]
            .filter((warning) => warning && !warning.acknowledged)
            .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))[0] || null;
    }

    if (activeWarning) {
        showWarningOverlay(activeWarning);
        return;
    }

    hideOverlay();
}

export function handleModerationApiResponse(response) {
    if (!response) return response;
    if (response.code === 'BANNED' && response.ban) {
        showBanOverlay(response.ban);
    }
    return response;
}

export function forceModerationRefresh() {
    refreshModerationStatus();
}
