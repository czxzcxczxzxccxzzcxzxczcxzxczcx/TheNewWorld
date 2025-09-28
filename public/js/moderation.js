import { apiRequest } from './utils/apiRequest.js';
import { initializeAuth } from './utils/auth.js';
import { getVerifiedUsernameHTML } from './utils/verifiedBadge.js';

const ROLE_LEVEL = { user: 0, moderator: 1, admin: 2, headAdmin: 3 };

let actor = null;
let selectedUser = null;

const elements = {};

function cacheElements() {
    Object.assign(elements, {
        backButton: document.getElementById('modBackButton'),
        userDisplay: document.getElementById('moderationUserDisplay'),
        roleBadge: document.getElementById('moderationRoleBadge'),
        searchInput: document.getElementById('moderationSearchInput'),
        searchButton: document.getElementById('moderationSearchButton'),
        searchResults: document.getElementById('moderationSearchResults'),
        feedback: document.getElementById('moderationFeedback'),
        userSummary: document.getElementById('moderationUserSummary'),
        noUserLabel: document.getElementById('moderationNoUser'),
        warningReason: document.getElementById('warningReason'),
        issueWarningButton: document.getElementById('issueWarningButton'),
        banReason: document.getElementById('banReason'),
        banDurationSelect: document.getElementById('banDurationSelect'),
        banCustomMinutes: document.getElementById('banCustomMinutes'),
        issueBanButton: document.getElementById('issueBanButton'),
        warningHistoryList: document.getElementById('warningHistoryList'),
        banHistoryList: document.getElementById('banHistoryList')
    });
}

function getRoleLevel(role) {
    return ROLE_LEVEL[role] ?? ROLE_LEVEL.user;
}

function formatRole(role) {
    switch (role) {
        case 'headAdmin':
            return 'Head Admin';
        case 'admin':
            return 'Admin';
        case 'moderator':
            return 'Moderator';
        default:
            return 'User';
    }
}

function canModerateTarget(target) {
    if (!actor || !target) return false;
    if (actor.accountNumber === target.accountNumber) return false;
    return getRoleLevel(actor.adminRole) > getRoleLevel(target.adminRole);
}

function showFeedback(type, message) {
    if (!elements.feedback) return;
    elements.feedback.textContent = message;
    elements.feedback.classList.remove('hidden', 'success', 'error');
    if (type) {
        elements.feedback.classList.add(type);
    }
}

function clearFeedback() {
    if (!elements.feedback) return;
    elements.feedback.classList.add('hidden');
    elements.feedback.textContent = '';
    elements.feedback.classList.remove('success', 'error');
}

function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function createResultItem(user) {
    const container = document.createElement('div');
    container.className = 'resultItem';

    const title = document.createElement('div');
    title.className = 'resultTitle';
    title.innerHTML = getVerifiedUsernameHTML(user.username, user.verified, { includeAt: false });

    const meta = document.createElement('div');
    meta.className = 'resultMeta';
    meta.textContent = `#${user.accountNumber} • ${formatRole(user.adminRole)}`;

    container.appendChild(title);
    container.appendChild(meta);

    container.addEventListener('click', () => loadSelectedUser(user.accountNumber));

    return container;
}

function renderSearchResults(users = []) {
    if (!elements.searchResults) return;

    elements.searchResults.innerHTML = '';

    if (!Array.isArray(users) || users.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'moderationEmpty';
        empty.textContent = 'No users match that search.';
        elements.searchResults.appendChild(empty);
        return;
    }

    users.forEach((user) => {
        elements.searchResults.appendChild(createResultItem(user));
    });
}

function renderUserSummary(user) {
    if (!elements.userSummary || !elements.noUserLabel) return;

    selectedUser = user;
    elements.noUserLabel.classList.add('hidden');
    elements.userSummary.classList.remove('hidden');

    const canAct = canModerateTarget(user);
    const activeWarningId = user.moderationState?.activeWarningId;
    const activeBanId = user.moderationState?.activeBanId;

    const activeWarning = (user.warnings || []).find((warning) => warning.warningId === activeWarningId);
    const activeBan = (user.bans || []).find((ban) => ban.banId === activeBanId && ban.status === 'active');

    elements.userSummary.innerHTML = `
        <div class="moderation-user-header">
            <div class="moderation-user-main">
                <span class="moderation-username">${getVerifiedUsernameHTML(user.username, user.verified, { includeAt: false })}</span>
                <span class="roleBadge ${user.adminRole}">${formatRole(user.adminRole)}</span>
            </div>
            <p class="moderation-user-meta">Account #${user.accountNumber}</p>
        </div>
        <div class="moderation-user-status">
            <div><strong>Active Warning:</strong> ${activeWarning ? formatDateTime(activeWarning.issuedAt) : 'None'}</div>
            <div><strong>Active Ban:</strong> ${activeBan ? formatDateTime(activeBan.expiresAt) || 'Permanent' : 'None'}</div>
        </div>
        <div class="moderation-user-notes">
            ${canAct ? '' : '<p class="moderationHint">You cannot moderate this user because their role is equal to or higher than yours.</p>'}
        </div>
    `;

    elements.issueWarningButton.disabled = !canAct;
    elements.issueBanButton.disabled = !canAct;
    elements.issueWarningButton.classList.toggle('disabled', !canAct);
    elements.issueBanButton.classList.toggle('disabled', !canAct);
}

function renderWarningHistory(warnings = []) {
    if (!elements.warningHistoryList) return;

    elements.warningHistoryList.innerHTML = '';

    if (!warnings.length) {
        const empty = document.createElement('p');
        empty.className = 'moderationEmpty';
        empty.textContent = 'No warnings recorded.';
        elements.warningHistoryList.appendChild(empty);
        return;
    }

    const sorted = [...warnings].sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));

    sorted.forEach((warning) => {
        const item = document.createElement('div');
        item.className = 'historyItem';

        const header = document.createElement('div');
        header.className = 'historyHeader';
        header.innerHTML = `
            <strong>Issued ${formatDateTime(warning.issuedAt)}</strong>
            <span class="badge ${warning.acknowledged ? 'badge-warning' : ''}">
                ${warning.acknowledged ? 'Acknowledged' : 'Active'}
            </span>
        `;

        const reason = document.createElement('p');
        reason.className = 'historyReason';
        reason.textContent = warning.reason || 'No reason provided.';

        const meta = document.createElement('div');
        meta.className = 'historyMeta';
        meta.textContent = `By ${warning.issuedByUsername || warning.issuedBy} (${warning.issuedByRole || 'moderator'})`;

        item.appendChild(header);
        item.appendChild(reason);
        item.appendChild(meta);

        if (warning.acknowledged && warning.acknowledgedAt) {
            const ack = document.createElement('div');
            ack.className = 'historyMeta';
            ack.textContent = `Acknowledged at ${formatDateTime(warning.acknowledgedAt)}`;
            item.appendChild(ack);
        }

        elements.warningHistoryList.appendChild(item);
    });
}

function renderBanHistory(bans = []) {
    if (!elements.banHistoryList) return;

    elements.banHistoryList.innerHTML = '';

    if (!bans.length) {
        const empty = document.createElement('p');
        empty.className = 'moderationEmpty';
        empty.textContent = 'No bans recorded.';
        elements.banHistoryList.appendChild(empty);
        return;
    }

    const sorted = [...bans].sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));

    sorted.forEach((ban) => {
        const item = document.createElement('div');
        item.className = 'historyItem';

        const statusLabel = ban.status === 'active' ? 'Active' : ban.status === 'lifted' ? 'Lifted' : 'Expired';
        const header = document.createElement('div');
        header.className = 'historyHeader';
        header.innerHTML = `
            <strong>Issued ${formatDateTime(ban.issuedAt)}</strong>
            <span class="badge badge-ban">${statusLabel}</span>
        `;

        const reason = document.createElement('p');
        reason.className = 'historyReason';
        reason.textContent = ban.reason || 'No reason provided.';

        const meta = document.createElement('div');
        meta.className = 'historyMeta';
        meta.textContent = `By ${ban.issuedByUsername || ban.issuedBy} (${ban.issuedByRole || 'moderator'})`;

        const expiry = document.createElement('div');
        expiry.className = 'historyMeta';
        expiry.textContent = ban.expiresAt ? `Expires: ${formatDateTime(ban.expiresAt)}` : 'Permanent ban';

        item.appendChild(header);
        item.appendChild(reason);
        item.appendChild(meta);
        item.appendChild(expiry);

        if (ban.status === 'lifted' && ban.liftedAt) {
            const lifted = document.createElement('div');
            lifted.className = 'historyMeta';
            lifted.textContent = `Lifted at ${formatDateTime(ban.liftedAt)} by ${ban.liftedByUsername || ban.liftedBy || 'Unknown'}`;
            item.appendChild(lifted);
        }

        if (ban.status === 'active' && canModerateTarget(selectedUser)) {
            const actions = document.createElement('div');
            actions.className = 'historyActions';
            const liftBtn = document.createElement('button');
            liftBtn.className = 'historyLiftBtn';
            liftBtn.textContent = 'Lift Ban';
            liftBtn.addEventListener('click', () => liftBan(ban.banId));
            actions.appendChild(liftBtn);
            item.appendChild(actions);
        }

        elements.banHistoryList.appendChild(item);
    });
}

function updateSelectedUser(data) {
    selectedUser = data;
    renderUserSummary(data);
    renderWarningHistory(data.warnings);
    renderBanHistory(data.bans);
}

async function loadSelectedUser(identifier) {
    clearFeedback();
    try {
        const response = await apiRequest(`/api/moderation/user/${encodeURIComponent(identifier)}`, 'GET');
        if (!response.success) {
            showFeedback('error', response.message || 'Failed to load user');
            return;
        }
        updateSelectedUser(response.user);
    } catch (error) {
        console.error('Failed to load user for moderation:', error);
        showFeedback('error', 'Unable to load user. Please try again.');
    }
}

async function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) {
        renderSearchResults([]);
        return;
    }

    clearFeedback();
    try {
        const response = await apiRequest(`/api/moderation/search?query=${encodeURIComponent(query)}`, 'GET');
        if (!response.success) {
            showFeedback('error', response.message || 'Search failed.');
            return;
        }
        renderSearchResults(response.users || []);
    } catch (error) {
        console.error('Moderation search failed:', error);
        showFeedback('error', 'Unable to perform search at this time.');
    }
}

async function issueWarning() {
    if (!selectedUser) {
        showFeedback('error', 'Select a user before issuing a warning.');
        return;
    }

    if (!canModerateTarget(selectedUser)) {
        showFeedback('error', 'You do not have permission to warn this user.');
        return;
    }

    const reason = elements.warningReason.value.trim();
    try {
        const response = await apiRequest('/api/moderation/warn', 'POST', {
            targetAccountNumber: selectedUser.accountNumber,
            reason
        });

        if (!response.success) {
            showFeedback('error', response.message || 'Failed to issue warning.');
            return;
        }

        elements.warningReason.value = '';
        showFeedback('success', 'Warning issued successfully.');
        if (response.user) {
            updateSelectedUser(response.user);
        } else {
            await loadSelectedUser(selectedUser.accountNumber);
        }
    } catch (error) {
        console.error('Failed to issue warning:', error);
        showFeedback('error', 'Unable to issue warning. Please try again.');
    }
}

function resolveBanDuration() {
    const selectValue = elements.banDurationSelect.value;
    if (selectValue === 'permanent') {
        return { permanent: true, minutes: null };
    }

    if (selectValue === '') {
        const customValue = Number(elements.banCustomMinutes.value);
        if (!customValue || Number.isNaN(customValue) || customValue <= 0) {
            return null;
        }
        return { permanent: false, minutes: customValue };
    }

    const minutes = Number(selectValue);
    if (!minutes || Number.isNaN(minutes)) {
        return null;
    }
    return { permanent: false, minutes };
}

async function issueBan() {
    if (!selectedUser) {
        showFeedback('error', 'Select a user before issuing a ban.');
        return;
    }

    if (!canModerateTarget(selectedUser)) {
        showFeedback('error', 'You do not have permission to ban this user.');
        return;
    }

    const duration = resolveBanDuration();
    if (!duration) {
        showFeedback('error', 'Please provide a valid ban duration.');
        return;
    }

    const reason = elements.banReason.value.trim();

    try {
        const response = await apiRequest('/api/moderation/ban', 'POST', {
            targetAccountNumber: selectedUser.accountNumber,
            reason,
            durationMinutes: duration.minutes,
            permanent: duration.permanent
        });

        if (!response.success) {
            showFeedback('error', response.message || 'Failed to issue ban.');
            return;
        }

        showFeedback('success', duration.permanent ? 'Permanent ban applied successfully.' : 'Ban applied successfully.');
        elements.banReason.value = '';
        if (response.user) {
            updateSelectedUser(response.user);
        } else {
            await loadSelectedUser(selectedUser.accountNumber);
        }
    } catch (error) {
        console.error('Failed to issue ban:', error);
        showFeedback('error', 'Unable to issue ban. Please try again.');
    }
}

async function liftBan(banId) {
    if (!selectedUser) return;

    try {
        const response = await apiRequest('/api/moderation/lift-ban', 'POST', {
            targetAccountNumber: selectedUser.accountNumber,
            banId
        });

        if (!response.success) {
            showFeedback('error', response.message || 'Failed to lift ban.');
            return;
        }

        showFeedback('success', 'Ban lifted successfully.');
        if (response.user) {
            updateSelectedUser(response.user);
        } else {
            await loadSelectedUser(selectedUser.accountNumber);
        }
    } catch (error) {
        console.error('Failed to lift ban:', error);
        showFeedback('error', 'Unable to lift ban. Please try again.');
    }
}

function onDurationChange() {
    if (!elements.banDurationSelect || !elements.banCustomMinutes) return;
    if (elements.banDurationSelect.value === '') {
        elements.banCustomMinutes.classList.remove('hidden');
    } else {
        elements.banCustomMinutes.classList.add('hidden');
        elements.banCustomMinutes.value = '';
    }
}

function setupListeners() {
    elements.backButton?.addEventListener('click', () => {
        window.location.href = '/home';
    });

    elements.searchButton?.addEventListener('click', performSearch);
    elements.searchInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    elements.issueWarningButton?.addEventListener('click', issueWarning);
    elements.issueBanButton?.addEventListener('click', issueBan);
    elements.banDurationSelect?.addEventListener('change', onDurationChange);
}

function updateHeader() {
    if (!actor) return;
    if (elements.userDisplay) {
        elements.userDisplay.textContent = `${actor.username} (#${actor.accountNumber})`;
    }
    if (elements.roleBadge) {
        elements.roleBadge.textContent = formatRole(actor.adminRole);
        elements.roleBadge.classList.add(actor.adminRole);
    }
}

async function init() {
    cacheElements();
    try {
        const user = await initializeAuth({ initializeGlobalButtons: false });
        actor = user;
        updateHeader();

        if (getRoleLevel(actor.adminRole) < ROLE_LEVEL.moderator) {
            window.location.href = '/home';
            return;
        }

        setupListeners();
    } catch (error) {
        console.error('Failed to initialize moderation panel:', error);
        window.location.href = '/';
    }
}

document.addEventListener('DOMContentLoaded', init);
