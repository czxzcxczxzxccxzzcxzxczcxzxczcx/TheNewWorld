function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function setVerifiedUsername(element, username, verified = false, options = {}) {
    if (!element) return null;

    const {
        includeAt = true,
        prefix = '@',
        badgeLabel = 'Verified account',
        badgeClass = 'verified-badge'
    } = options;

    const rawName = username || 'Anonymous';
    const displayName = `${includeAt ? prefix : ''}${rawName}`;

    // Reset content before rebuilding
    element.textContent = '';
    element.appendChild(document.createTextNode(displayName));

    if (verified) {
        element.appendChild(document.createTextNode(' '));
        const badge = document.createElement('span');
        badge.className = badgeClass;
        badge.textContent = '✓';
        badge.setAttribute('aria-label', badgeLabel);
        badge.title = badgeLabel;
        element.appendChild(badge);
    }

    return element;
}

export function getVerifiedUsernameHTML(username, verified = false, options = {}) {
    const {
        includeAt = true,
        prefix = '@',
        badgeLabel = 'Verified account',
        badgeClass = 'verified-badge'
    } = options;

    const rawName = username || 'Anonymous';
    const safeUsername = escapeHTML(rawName);
    const displayName = `${includeAt ? prefix : ''}${safeUsername}`;

    if (!verified) {
        return displayName;
    }

    const safeBadgeLabel = escapeHTML(badgeLabel);
    return `${displayName} <span class="${badgeClass}" title="${safeBadgeLabel}" aria-label="${safeBadgeLabel}">✓</span>`;
}
