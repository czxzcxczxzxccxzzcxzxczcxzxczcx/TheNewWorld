import { apiRequest } from './utils/apiRequest.js';
import { renderBar } from './utils/renderBar.js';
import { initializeAuth } from './utils/auth.js';

renderBar();

let currentUser = null;
let currentTicket = null;

function escapeHtml(text = '') {
    const value = String(text ?? '');
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatMultiline(text = '') {
    return escapeHtml(text).replace(/\n/g, '<br>');
}

function formatTicketType(type) {
    switch (type) {
        case 'bug_report':
            return 'Bug Report';
        case 'user_report':
            return 'User Report';
        case 'ban_appeal':
            return 'Ban Appeal';
        default:
            return 'General';
    }
}

document.addEventListener("DOMContentLoaded", function () {
    initializeAuth()
        .then(user => {
            currentUser = user;
            initializeSupportPage();
        })
        .catch(error => {
            console.error("Error initializing auth:", error);
        });
});

function initializeSupportPage() {
    setupTabNavigation();
    setupCreateTicketForm();
    setupTicketModal();
    setupDonationForm();
    
    // Load create tab by default
    showTab('create');
}

function setupTabNavigation() {
    const tabs = document.querySelectorAll('.support-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            showTab(tabName);
        });
    });
}

function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.support-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.support-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load tab-specific content
    if (tabName === 'my-tickets') {
        loadMyTickets();
    }
}

function setupCreateTicketForm() {
    const form = document.getElementById('createTicketForm');
    const typeSelect = document.getElementById('ticketType');
    const userReportSection = document.getElementById('userReportSection');

    // Show/hide user report fields based on ticket type
    typeSelect.addEventListener('change', () => {
        if (typeSelect.value === 'user_report') {
            userReportSection.style.display = 'block';
            document.getElementById('reportedUser').required = true;
        } else {
            userReportSection.style.display = 'none';
            document.getElementById('reportedUser').required = false;
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createTicket();
    });
}

async function createTicket() {
    const type = document.getElementById('ticketType').value;
    const title = document.getElementById('ticketTitle').value;
    const description = document.getElementById('ticketDescription').value;
    const reportedUser = document.getElementById('reportedUser').value;

    try {
        const data = await apiRequest('/api/support/create-ticket', 'POST', {
            type,
            title,
            description,
            reportedUser: type === 'user_report' ? reportedUser : null
        });

        if (data.success) {
            showNotification('Ticket created successfully!', 'success');
            document.getElementById('createTicketForm').reset();
            document.getElementById('userReportSection').style.display = 'none';
            
            // Switch to my tickets tab
            showTab('my-tickets');
        } else {
            showNotification(data.message || 'Failed to create ticket', 'error');
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        showNotification('Failed to create ticket', 'error');
    }
}

async function loadMyTickets() {
    try {
        const data = await apiRequest('/api/support/my-tickets', 'GET');
        
        if (data.success) {
            renderTickets(data.tickets);
        } else {
            showNotification(data.message || 'Failed to load tickets', 'error');
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        showNotification('Failed to load tickets', 'error');
    }
}

function renderTickets(tickets) {
    const ticketsList = document.getElementById('ticketsList');
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = '<div class="no-tickets">No tickets found</div>';
        return;
    }

    ticketsList.innerHTML = tickets.map(ticket => {
    const statusClass = ticket.status.replace('_', '-');
    const typeLabel = formatTicketType(ticket.type);
        const lastUpdate = new Date(ticket.updatedAt).toLocaleDateString();
        
        return `
            <div class="ticket-item" data-ticket-id="${ticket.ticketId}">
                <div class="ticket-header">
                    <div class="ticket-info">
                        <h3 class="ticket-title">${ticket.title}</h3>
                        <div class="ticket-meta">
                            <span class="ticket-id">#${ticket.ticketId}</span>
                            <span class="ticket-type">${typeLabel}</span>
                            <span class="ticket-status status-${statusClass}">${ticket.status.replace('_', ' ').toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="ticket-date">
                        Last updated: ${lastUpdate}
                    </div>
                </div>
                <div class="ticket-preview">
                    ${ticket.description.substring(0, 150)}${ticket.description.length > 150 ? '...' : ''}
                </div>
            </div>
        `;
    }).join('');

    // Add click listeners to tickets
    ticketsList.querySelectorAll('.ticket-item').forEach(item => {
        item.addEventListener('click', () => {
            const ticketId = item.dataset.ticketId;
            openTicket(ticketId);
        });
    });
}

async function openTicket(ticketId) {
    try {
        const data = await apiRequest(`/api/support/ticket/${ticketId}`, 'GET');
        
        if (data.success) {
            currentTicket = data.ticket;
            showTicketModal(data.ticket);
        } else {
            showNotification(data.message || 'Failed to load ticket', 'error');
        }
    } catch (error) {
        console.error('Error loading ticket:', error);
        showNotification('Failed to load ticket', 'error');
    }
}

function showTicketModal(ticket) {
    document.getElementById('modalTicketTitle').textContent = `#${escapeHtml(ticket.ticketId)} - ${escapeHtml(ticket.title || '')}`;
    
    // Render ticket details
    const details = document.getElementById('ticketDetails');
    const typeLabel = formatTicketType(ticket.type);
    const statusClass = ticket.status.replace('_', '-');
    
    details.innerHTML = `
        <div class="ticket-detail-row">
            <strong>Type:</strong> ${escapeHtml(typeLabel)}
        </div>
        <div class="ticket-detail-row">
            <strong>Status:</strong> <span class="status-${statusClass}">${ticket.status.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div class="ticket-detail-row">
            <strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString()}
        </div>
        ${ticket.reportedUsername ? `
        <div class="ticket-detail-row">
            <strong>Reported User:</strong> ${escapeHtml(ticket.reportedUsername)}
        </div>
        ` : ''}
        <div class="ticket-detail-row">
            <strong>Description:</strong>
            <div class="ticket-description">${formatMultiline(ticket.description || '')}</div>
        </div>
    `;
    
    // Render messages
    renderTicketMessages(ticket.messages);
    
    // Show modal
    document.getElementById('ticketModal').style.display = 'flex';
}

function renderTicketMessages(messages) {
    const messagesContainer = document.getElementById('ticketMessages');
    
    messagesContainer.innerHTML = messages.map(message => {
        const isUser = message.senderRole === 'user';
        const roleClass = isUser ? 'user' : 'staff';
        const roleLabel = message.senderRole === 'user' ? 'You' : 
                         message.senderRole === 'moderator' ? 'Moderator' :
                         message.senderRole === 'admin' ? 'Admin' : 'Head Admin';
        
        return `
            <div class="message ${roleClass}">
                <div class="message-header">
                    <span class="sender">${escapeHtml(roleLabel)}</span>
                    <span class="timestamp">${new Date(message.timestamp).toLocaleString()}</span>
                </div>
                <div class="message-content">${formatMultiline(message.content || '')}</div>
            </div>
        `;
    }).join('');
}

function setupTicketModal() {
    const modal = document.getElementById('ticketModal');
    const closeBtn = document.getElementById('closeTicketModal');
    const sendReplyBtn = document.getElementById('sendReply');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        currentTicket = null;
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            currentTicket = null;
        }
    });
    
    sendReplyBtn.addEventListener('click', sendReply);
}

async function sendReply() {
    if (!currentTicket) return;
    
    const replyText = document.getElementById('replyMessage').value.trim();
    if (!replyText) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    try {
        const data = await apiRequest(`/api/support/ticket/${currentTicket.ticketId}/message`, 'POST', {
            content: replyText
        });
        
        if (data.success) {
            // Add message to current view
            currentTicket.messages.push(data.newMessage);
            renderTicketMessages(currentTicket.messages);
            
            // Clear reply input
            document.getElementById('replyMessage').value = '';
            
            showNotification('Reply sent successfully', 'success');
        } else {
            showNotification(data.message || 'Failed to send reply', 'error');
        }
    } catch (error) {
        console.error('Error sending reply:', error);
        showNotification('Failed to send reply', 'error');
    }
}

function setupDonationForm() {
    const form = document.getElementById('donationForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const amount = document.getElementById('donationAmount').value;
            if (!amount || amount < 1) {
                showNotification('Please enter a valid donation amount', 'error');
                return;
            }
            
            try {
                // Ensure Stripe.js is loaded
                if (!window.Stripe) {
                    await loadStripe();
                }
                
                // Create payment session
                const data = await apiRequest('/api/payment/create-payment', 'POST', {
                    amount: parseFloat(amount)
                });
                
                if (data.success) {
                    const stripe = Stripe(data.publishableKey);
                    const { error } = await stripe.redirectToCheckout({
                        sessionId: data.sessionId
                    });

                    if (error) {
                        showNotification('Payment failed: ' + error.message, 'error');
                    }
                } else {
                    showNotification(data.message || 'Failed to create payment session', 'error');
                }
            } catch (error) {
                console.error('Error creating payment:', error);
                showNotification('Failed to process payment', 'error');
            }
        });
    }
}

function loadStripe() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
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
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}