const { Session } = require('./database');

class SessionStore {
    // Create a new session in the database
    async create(sessionId, sessionData) {
        try {
            const newSession = new Session({
                sessionId,
                userId: sessionData.userId,
                username: sessionData.username,
                accountNumber: sessionData.accountNumber,
                theme: sessionData.theme || 'auto'
            });
            
            await newSession.save();
            return true;
        } catch (error) {
            console.error('Error creating session:', error);
            return false;
        }
    }
    
    // Get session data from the database
    async get(sessionId) {
        try {
            const session = await Session.findOne({ 
                sessionId,
                expiresAt: { $gt: new Date() } // Only return non-expired sessions
            });
            
            if (!session) {
                return null;
            }
            
            // Return session data in the same format as before
            return {
                userId: session.userId,
                username: session.username,
                accountNumber: session.accountNumber,
                theme: session.theme
            };
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }
    
    // Check if a session exists (used like sessionStore[sessionId])
    async exists(sessionId) {
        try {
            const session = await Session.findOne({ 
                sessionId,
                expiresAt: { $gt: new Date() }
            });
            return !!session;
        } catch (error) {
            console.error('Error checking session existence:', error);
            return false;
        }
    }
    
    // Delete a session from the database
    async delete(sessionId) {
        try {
            await Session.deleteOne({ sessionId });
            return true;
        } catch (error) {
            console.error('Error deleting session:', error);
            return false;
        }
    }
    
    // Clean up expired sessions (called periodically)
    async cleanupExpired() {
        try {
            const result = await Session.deleteMany({
                expiresAt: { $lt: new Date() }
            });
            if (result.deletedCount > 0) {
                console.log(`Cleaned up ${result.deletedCount} expired sessions`);
            }
            return result.deletedCount;
        } catch (error) {
            console.error('Error cleaning up expired sessions:', error);
            return 0;
        }
    }
    
    // Update session expiration (extend session)
    async extend(sessionId, additionalHours = 24) {
        try {
            const newExpiresAt = new Date(Date.now() + additionalHours * 60 * 60 * 1000);
            await Session.updateOne(
                { sessionId },
                { expiresAt: newExpiresAt }
            );
            return true;
        } catch (error) {
            console.error('Error extending session:', error);
            return false;
        }
    }

    async update(sessionId, updates = {}) {
        try {
            const allowed = {};
            if (Object.prototype.hasOwnProperty.call(updates, 'username')) {
                allowed.username = updates.username;
            }
            if (Object.prototype.hasOwnProperty.call(updates, 'accountNumber')) {
                allowed.accountNumber = updates.accountNumber;
            }
            if (Object.prototype.hasOwnProperty.call(updates, 'theme')) {
                allowed.theme = updates.theme;
            }

            if (Object.keys(allowed).length === 0) {
                return false;
            }

            await Session.updateOne({ sessionId }, { $set: allowed });
            return true;
        } catch (error) {
            console.error('Error updating session:', error);
            return false;
        }
    }
}

// Create and export a singleton instance
const sessionStore = new SessionStore();

module.exports = sessionStore; 