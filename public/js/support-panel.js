import { apiRequest } from './utils/apiRequest.js';
import { renderBar } from './utils/renderBar.js';
import { initializeAuth } from './utils/auth.js';

renderBar();

let currentUser = null;
let currentTicket = null;
let allTickets = [];

document.addEventListener("DOMContentLoaded", function () {
    initializeAuth()
        .then(user => {
            currentUser = user;
            initializeSupportPanel();
        })
        .catch(error => {
            console.error("Error initializing auth:", error);
            window.location.href = '/home';
        });
});

async function initializeSupportPanel() {
    // Check if user has support access
    try {
        const accessCheck = await apiRequest('/api/support/support-panel/tickets', 'GET');
        if (!accessCheck.success) {
            showNotification('Access denied. Redirecting...', 'error');
            setTimeout(() => window.location.href = '/home', 2000);
            return;
        }
    } catch (error) {
        showNotification('Access denied. Redirecting...', 'error');
        setTimeout(() => window.location.href = '/home', 2000);
        return;
    }

    setupEventListeners();
    loadTickets();
    loadStaffMembers();
}

function setupEventListeners() {
    // Filter controls
    document.getElementById('statusFilter').addEventListener('change', filterTickets);
    document.getElementById('typeFilter').addEventListener('change', filterTickets);
    document.getElementById('refreshTickets').addEventListener('click', loadTickets);

    // Modal controls
    document.getElementById('closeManagementModal').addEventListener('click', closeManagementModal);
    document.getElementById('updateTicketBtn').addEventListener('click', updateTicket);
    document.getElementById('sendStaffReply').addEventListener('click', sendStaffReply);

    // Close modal when clicking outside
    document.getElementById('ticketManagementModal').addEventListener('click', (e) => {
        if (e.target.id === 'ticketManagementModal') {
            closeManagementModal();
        }
    });
}

async function loadTickets() {
    try {
        showLoading();
        const data = await apiRequest('/api/support/support-panel/tickets', 'GET');
        
        if (data.success) {
            allTickets = data.tickets;
            renderTickets(allTickets);
            updateStats(allTickets);
        } else {
            showNotification(data.message || 'Failed to load tickets', 'error');
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        showNotification('Failed to load tickets', 'error');
    }
}

function filterTickets() {
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    
    let filteredTickets = allTickets;
    
    if (statusFilter !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.type === typeFilter);
    }
    
    renderTickets(filteredTickets);
    updateStats(allTickets); // Keep full stats
}

function renderTickets(tickets) {
    const grid = document.getElementById('ticketsGrid');
    
    if (tickets.length === 0) {
        grid.innerHTML = '<div class="no-tickets-panel">No tickets found</div>';
        return;
    }

    grid.innerHTML = tickets.map(ticket => {
        const statusClass = ticket.status.replace('_', '-');
        const typeLabel = ticket.type === 'bug_report' ? 'Bug Report' : 'User Report';
        const priorityClass = ticket.priority || 'medium';
        const lastUpdate = new Date(ticket.updatedAt).toLocaleDateString();
        const messageCount = ticket.messages?.length || 0;
        
        return `
            <div class="ticket-card" data-ticket-id="${ticket.ticketId}">
                <div class="ticket-card-header">
                    <div class="ticket-card-title">
                        <h3>${ticket.title}</h3>
                        <span class="ticket-id">#${ticket.ticketId}</span>
                    </div>
                    <div class="ticket-card-badges">
                        <span class="badge type-${ticket.type}">${typeLabel}</span>
                        <span class="badge status-${statusClass}">${ticket.status.replace('_', ' ').toUpperCase()}</span>
                        <span class="badge priority-${priorityClass}">${ticket.priority?.toUpperCase() || 'MEDIUM'}</span>
                    </div>
                </div>
                
                <div class="ticket-card-info">
                    <div class="ticket-user">
                        <strong>User:</strong> ${ticket.username} (#${ticket.userId})
                    </div>
                    ${ticket.reportedUsername ? `
                    <div class="reported-user">
                        <strong>Reported:</strong> ${ticket.reportedUsername}
                    </div>
                    ` : ''}
                    <div class="ticket-messages">
                        <strong>Messages:</strong> ${messageCount}
                    </div>
                    <div class="ticket-updated">
                        <strong>Updated:</strong> ${lastUpdate}
                    </div>
                    ${ticket.assignedTo ? `
                    <div class="ticket-assigned">
                        <strong>Assigned:</strong> ${ticket.assignedTo}
                    </div>
                    ` : ''}
                </div>
                
                <div class="ticket-card-preview">
                    ${ticket.description.substring(0, 120)}${ticket.description.length > 120 ? '...' : ''}
                </div>
                
                <div class="ticket-card-actions">
                    <button class="btn small primary" onclick="openTicketManagement('${ticket.ticketId}')">
                        Manage
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateStats(tickets) {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    
    document.getElementById('totalTickets').textContent = total;
    document.getElementById('openTickets').textContent = open;
    document.getElementById('inProgressTickets').textContent = inProgress;
}

async function openTicketManagement(ticketId) {
    try {
        const data = await apiRequest(`/api/support/ticket/${ticketId}`, 'GET');
        
        if (data.success) {
            currentTicket = data.ticket;
            showTicketManagementModal(data.ticket);
        } else {
            showNotification(data.message || 'Failed to load ticket', 'error');
        }
    } catch (error) {
        console.error('Error loading ticket:', error);
        showNotification('Failed to load ticket', 'error');
    }
}

function showTicketManagementModal(ticket) {
    document.getElementById('modalTicketTitle').textContent = `#${ticket.ticketId} - ${ticket.title}`;
    
    // Populate ticket details
    const details = document.getElementById('ticketManagementDetails');
    const typeLabel = ticket.type === 'bug_report' ? 'Bug Report' : 'User Report';
    const statusClass = ticket.status.replace('_', '-');
    
    details.innerHTML = `
        <div class="detail-item">
            <strong>Type:</strong> ${typeLabel}
        </div>
        <div class="detail-item">
            <strong>User:</strong> ${ticket.username} (#${ticket.userId})
        </div>
        <div class="detail-item">
            <strong>Status:</strong> <span class="status-${statusClass}">${ticket.status.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div class="detail-item">
            <strong>Priority:</strong> ${ticket.priority?.toUpperCase() || 'MEDIUM'}
        </div>
        <div class="detail-item">
            <strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString()}
        </div>
        <div class="detail-item">
            <strong>Updated:</strong> ${new Date(ticket.updatedAt).toLocaleString()}
        </div>
        ${ticket.reportedUsername ? `
        <div class="detail-item">
            <strong>Reported User:</strong> ${ticket.reportedUsername} (#${ticket.reportedUser})
        </div>
        ` : ''}
        ${ticket.assignedTo ? `
        <div class="detail-item">
            <strong>Assigned To:</strong> ${ticket.assignedTo}
        </div>
        ` : ''}
        
        <div class="detail-item description">
            <strong>Description:</strong>
            <div class="description-content">${ticket.description}</div>
        </div>
    `;
    
    // Set form values
    document.getElementById('ticketStatus').value = ticket.status;
    document.getElementById('assignedToSelect').value = ticket.assignedTo || '';
    
    // Render messages
    renderManagementMessages(ticket.messages);
    
    // Show modal
    document.getElementById('ticketManagementModal').style.display = 'flex';
}

function renderManagementMessages(messages) {
    const container = document.getElementById('ticketManagementMessages');
    
    container.innerHTML = messages.map(message => {
        const isUser = message.senderRole === 'user';
        const isInternal = message.isInternal;
        const roleClass = isUser ? 'user' : 'staff';
        const internalClass = isInternal ? 'internal' : '';
        const roleLabel = message.senderRole === 'user' ? message.senderUsername : 
                         `${message.senderUsername} (${message.senderRole})`;
        
        return `
            <div class="message ${roleClass} ${internalClass}">
                <div class="message-header">
                    <span class="sender">${roleLabel}</span>
                    <span class="timestamp">${new Date(message.timestamp).toLocaleString()}</span>
                    ${isInternal ? '<span class="internal-badge">Internal</span>' : ''}
                </div>
                <div class="message-content">${message.content}</div>
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

async function updateTicket() {
    if (!currentTicket) return;
    
    const status = document.getElementById('ticketStatus').value;
    const assignedTo = document.getElementById('assignedToSelect').value;
    
    try {
        const data = await apiRequest(`/api/support/support-panel/ticket/${currentTicket.ticketId}/status`, 'POST', {
            status,
            assignedTo: assignedTo || null
        });
        
        if (data.success) {
            showNotification('Ticket updated successfully', 'success');
            currentTicket.status = status;
            currentTicket.assignedTo = assignedTo;
            
            // Refresh tickets list
            loadTickets();
        } else {
            showNotification(data.message || 'Failed to update ticket', 'error');
        }
    } catch (error) {
        console.error('Error updating ticket:', error);
        showNotification('Failed to update ticket', 'error');
    }
}

async function sendStaffReply() {
    if (!currentTicket) return;
    
    const content = document.getElementById('staffReplyMessage').value.trim();
    const isInternal = document.getElementById('internalMessage').checked;
    
    if (!content) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    try {
        const data = await apiRequest(`/api/support/ticket/${currentTicket.ticketId}/message`, 'POST', {
            content,
            isInternal
        });
        
        if (data.success) {
            // Add message to current view
            currentTicket.messages.push(data.newMessage);
            renderManagementMessages(currentTicket.messages);
            
            // Clear form
            document.getElementById('staffReplyMessage').value = '';
            document.getElementById('internalMessage').checked = false;
            
            showNotification('Message sent successfully', 'success');
            
            // Refresh tickets list to update message count
            loadTickets();
        } else {
            showNotification(data.message || 'Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Failed to send message', 'error');
    }
}

async function loadStaffMembers() {
    try {
        // This would need an endpoint to get staff members, for now we'll use a placeholder
        const staffSelect = document.getElementById('assignedToSelect');
        // Add current user as an option
        if (currentUser) {
            const option = document.createElement('option');
            option.value = currentUser.accountNumber;
            option.textContent = `${currentUser.username} (You)`;
            staffSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error loading staff members:', error);
    }
}

function closeManagementModal() {
    document.getElementById('ticketManagementModal').style.display = 'none';
    currentTicket = null;
}

function showLoading() {
    const grid = document.getElementById('ticketsGrid');
    grid.innerHTML = '<div class="loading-spinner">Loading tickets...</div>';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Make function globally available for onclick handlers
window.openTicketManagement = openTicketManagement;