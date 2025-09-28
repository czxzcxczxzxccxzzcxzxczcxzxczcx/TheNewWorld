const express = require('express');
const router = express.Router();
const { User } = require('../utils/database/database');
const sessionStore = require('../utils/database/sessionStore');

const ROLE_LEVEL = { user: 0, moderator: 1, admin: 2, headAdmin: 3 };

function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function sanitizeWarning(warning) {
    if (!warning) return null;
    return {
        warningId: warning.warningId,
        reason: warning.reason,
        issuedBy: warning.issuedBy,
        issuedByUsername: warning.issuedByUsername,
        issuedByRole: warning.issuedByRole,
        issuedAt: warning.issuedAt,
        acknowledged: warning.acknowledged,
        acknowledgedAt: warning.acknowledgedAt
    };
}

function sanitizeBan(ban) {
    if (!ban) return null;
    return {
        banId: ban.banId,
        reason: ban.reason,
        issuedBy: ban.issuedBy,
        issuedByUsername: ban.issuedByUsername,
        issuedByRole: ban.issuedByRole,
        issuedAt: ban.issuedAt,
        expiresAt: ban.expiresAt,
        status: ban.status,
        liftedAt: ban.liftedAt,
        liftedBy: ban.liftedBy,
        liftedByUsername: ban.liftedByUsername
    };
}

function sanitizeUser(user) {
    if (!user) return null;
    return {
        username: user.username,
        accountNumber: user.accountNumber,
        adminRole: user.adminRole || 'user',
        pfp: user.pfp,
        verified: !!user.verified,
        moderationState: {
            activeWarningId: user.moderationState?.activeWarningId || null,
            activeBanId: user.moderationState?.activeBanId || null
        },
        warnings: (user.warnings || []).map(sanitizeWarning),
        bans: (user.bans || []).map(sanitizeBan)
    };
}

function getRoleLevel(role) {
    return ROLE_LEVEL[role] ?? ROLE_LEVEL.user;
}

async function resolveCurrentUser(req) {
    if (req.currentUser) {
        return req.currentUser;
    }

    const sessionId = req.cookies?.TNWID;
    if (!sessionId) return null;

    const sessionData = await sessionStore.get(sessionId);
    if (!sessionData) return null;

    return await User.findOne({ accountNumber: sessionData.accountNumber });
}

function canModerate(actor, target) {
    if (!actor || !target) return false;
    if (actor.accountNumber === target.accountNumber) return false;
    return getRoleLevel(actor.adminRole || 'user') > getRoleLevel(target.adminRole || 'user');
}

function requireModerator(actor) {
    return actor && getRoleLevel(actor.adminRole || 'user') >= ROLE_LEVEL.moderator;
}

router.get('/moderation/search', async (req, res) => {
    try {
        const actor = await resolveCurrentUser(req);
        if (!requireModerator(actor)) {
            return res.status(403).json({ success: false, message: 'Moderator access required' });
        }

        const query = (req.query.q || req.query.query || '').trim();
        if (!query) {
            return res.json({ success: true, users: [] });
        }

        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const users = await User.find({
            $or: [
                { username: regex },
                { accountNumber: regex }
            ]
        }).limit(15);

        return res.json({
            success: true,
            users: users.map(user => ({
                username: user.username,
                accountNumber: user.accountNumber,
                adminRole: user.adminRole || 'user',
                pfp: user.pfp,
                verified: !!user.verified,
                moderationState: {
                    activeWarningId: user.moderationState?.activeWarningId || null,
                    activeBanId: user.moderationState?.activeBanId || null
                }
            }))
        });
    } catch (error) {
        console.error('Error searching users for moderation:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/moderation/user/:identifier', async (req, res) => {
    try {
        const actor = await resolveCurrentUser(req);
        if (!requireModerator(actor)) {
            return res.status(403).json({ success: false, message: 'Moderator access required' });
        }

        const identifier = req.params.identifier;
        const query = isNaN(identifier)
            ? { username: { $regex: new RegExp(`^${identifier}$`, 'i') } }
            : { accountNumber: identifier };

        const target = await User.findOne(query);
        if (!target) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!canModerate(actor, target) && actor.accountNumber !== target.accountNumber) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions to moderate this user' });
        }

        return res.json({ success: true, user: sanitizeUser(target) });
    } catch (error) {
        console.error('Error fetching user for moderation:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/moderation/warn', async (req, res) => {
    try {
        const actor = await resolveCurrentUser(req);
        if (!requireModerator(actor)) {
            return res.status(403).json({ success: false, message: 'Moderator access required' });
        }

        const { targetAccountNumber, reason } = req.body;
        if (!targetAccountNumber) {
            return res.status(400).json({ success: false, message: 'Target account number is required' });
        }

        const target = await User.findOne({ accountNumber: targetAccountNumber });
        if (!target) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!canModerate(actor, target)) {
            return res.status(403).json({ success: false, message: 'Cannot warn users with equal or higher role' });
        }

        const warning = {
            warningId: generateId('warning'),
            reason: reason || 'No reason provided',
            issuedBy: actor.accountNumber,
            issuedByUsername: actor.username,
            issuedByRole: actor.adminRole || 'moderator',
            issuedAt: new Date(),
            acknowledged: false,
            acknowledgedAt: null
        };

        target.warnings = target.warnings || [];
        target.warnings.push(warning);
        target.moderationState = target.moderationState || {};
        target.moderationState.activeWarningId = warning.warningId;
        target.markModified('warnings');
        target.markModified('moderationState');
        await target.save();

    return res.json({ success: true, warning: sanitizeWarning(warning), user: sanitizeUser(target) });
    } catch (error) {
        console.error('Error issuing warning:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/moderation/ban', async (req, res) => {
    try {
        const actor = await resolveCurrentUser(req);
        if (!requireModerator(actor)) {
            return res.status(403).json({ success: false, message: 'Moderator access required' });
        }

        const { targetAccountNumber, reason, durationMinutes, permanent } = req.body;
        if (!targetAccountNumber) {
            return res.status(400).json({ success: false, message: 'Target account number is required' });
        }

        const target = await User.findOne({ accountNumber: targetAccountNumber });
        if (!target) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!canModerate(actor, target)) {
            return res.status(403).json({ success: false, message: 'Cannot ban users with equal or higher role' });
        }

        target.bans = target.bans || [];
        const existingActive = target.bans.find(ban => ban.status === 'active');
        if (existingActive) {
            return res.status(400).json({ success: false, message: 'User already has an active ban' });
        }

        let expiresAt = null;
        if (!permanent) {
            const minutes = Number(durationMinutes);
            if (!minutes || Number.isNaN(minutes) || minutes <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid ban duration' });
            }
            expiresAt = new Date(Date.now() + minutes * 60 * 1000);
        }

        const ban = {
            banId: generateId('ban'),
            reason: reason || 'No reason provided',
            issuedBy: actor.accountNumber,
            issuedByUsername: actor.username,
            issuedByRole: actor.adminRole || 'moderator',
            issuedAt: new Date(),
            expiresAt,
            status: 'active',
            liftedAt: null,
            liftedBy: null,
            liftedByUsername: null
        };

        target.bans.push(ban);
        target.moderationState = target.moderationState || {};
        target.moderationState.activeBanId = ban.banId;
        target.markModified('bans');
        target.markModified('moderationState');
        await target.save();

    return res.json({ success: true, ban: sanitizeBan(ban), user: sanitizeUser(target) });
    } catch (error) {
        console.error('Error issuing ban:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/moderation/lift-ban', async (req, res) => {
    try {
        const actor = await resolveCurrentUser(req);
        if (!requireModerator(actor)) {
            return res.status(403).json({ success: false, message: 'Moderator access required' });
        }

    const { targetAccountNumber, banId } = req.body;
        if (!targetAccountNumber || !banId) {
            return res.status(400).json({ success: false, message: 'Target account number and ban ID are required' });
        }

        const target = await User.findOne({ accountNumber: targetAccountNumber });
        if (!target) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!canModerate(actor, target)) {
            return res.status(403).json({ success: false, message: 'Cannot modify bans for users with equal or higher role' });
        }

        const ban = (target.bans || []).find(item => item.banId === banId);
        if (!ban) {
            return res.status(404).json({ success: false, message: 'Ban not found' });
        }

        if (ban.status !== 'active') {
            return res.status(400).json({ success: false, message: 'Ban is not active' });
        }

        const now = new Date();
        const isPermanent = !ban.expiresAt;
        const actorLevel = getRoleLevel(actor.adminRole || 'user');

        if (isPermanent && actorLevel < ROLE_LEVEL.headAdmin) {
            return res.status(403).json({ success: false, message: 'Only head admins can lift permanent bans' });
        }

        if (!isPermanent && ban.expiresAt > now && actorLevel < ROLE_LEVEL.headAdmin) {
            return res.status(403).json({ success: false, message: 'Only head admins can lift bans before they expire' });
        }

        ban.status = 'lifted';
        ban.liftedAt = now;
        ban.liftedBy = actor.accountNumber;
        ban.liftedByUsername = actor.username;
        target.markModified('bans');

        if (target.moderationState?.activeBanId === ban.banId) {
            target.moderationState.activeBanId = null;
            target.markModified('moderationState');
        }

        await target.save();

    return res.json({ success: true, ban: sanitizeBan(ban), user: sanitizeUser(target) });
    } catch (error) {
        console.error('Error lifting ban:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/moderation/acknowledge-warning', async (req, res) => {
    try {
        const user = await resolveCurrentUser(req);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const { warningId } = req.body;
        if (!warningId) {
            return res.status(400).json({ success: false, message: 'Warning ID is required' });
        }

        const warning = (user.warnings || []).find(item => item.warningId === warningId);
        if (!warning) {
            return res.status(404).json({ success: false, message: 'Warning not found' });
        }

        if (!warning.acknowledged) {
            warning.acknowledged = true;
            warning.acknowledgedAt = new Date();
            user.markModified('warnings');

            if (user.moderationState?.activeWarningId === warning.warningId) {
                user.moderationState.activeWarningId = null;
                user.markModified('moderationState');
            }

            await user.save();
        }

        return res.json({ success: true, warning: sanitizeWarning(warning), user: sanitizeUser(user) });
    } catch (error) {
        console.error('Error acknowledging warning:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
