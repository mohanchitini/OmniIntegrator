const API_BASE = 'http://localhost:3000/api';
let currentBoardId = null;
let refreshInterval = null;

const initDashboard = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const boardId = urlParams.get('boardId');

    if (boardId) {
        currentBoardId = boardId;
        await loadDashboardData();
        startAutoRefresh();
    } else {
        await loadBoards(userId);
    }
};

const loadBoards = async (userId) => {
    try {
        const response = await fetch(`${API_BASE}/cliq/widget?userId=${userId}`);
        const data = await response.json();
        
        if (data.boards && data.boards.length > 0) {
            currentBoardId = data.boards[0].id;
            await loadDashboardData();
            startAutoRefresh();
        } else {
            showMessage('No boards found. Please connect your Trello account.');
        }
    } catch (error) {
        console.error('Error loading boards:', error);
        showMessage('Failed to load boards. Please try again.');
    }
};

const loadDashboardData = async () => {
    if (!currentBoardId) return;

    try {
        updateSyncStatus('syncing');
        
        const token = localStorage.getItem('authToken') || 'demo-token';
        const response = await fetch(`${API_BASE}/trello/dashboard/${currentBoardId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        
        renderKanbanBoard(data.lists);
        updateAnalytics(data.analytics);
        updateAIInsights(data.lists);
        
        updateSyncStatus('synced');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        updateSyncStatus('error');
        showMessage('Failed to load dashboard data');
    }
};

const renderKanbanBoard = (lists) => {
    const kanbanBoard = document.getElementById('kanban-board');
    
    if (!lists || lists.length === 0) {
        kanbanBoard.innerHTML = '<div class="loading">No lists found</div>';
        return;
    }

    const boardContainer = document.createElement('div');
    boardContainer.className = 'board-container';

    lists.forEach(list => {
        const column = createColumn(list);
        boardContainer.appendChild(column);
    });

    kanbanBoard.innerHTML = '';
    kanbanBoard.appendChild(boardContainer);
};

const createColumn = (list) => {
    const column = document.createElement('div');
    column.className = 'column';

    const header = document.createElement('div');
    header.className = 'column-header';
    header.textContent = `${list.name} (${list.cards.length})`;
    column.appendChild(header);

    list.cards.forEach(card => {
        const cardElement = createCard(card);
        column.appendChild(cardElement);
    });

    return column;
};

const createCard = (card) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    
    const priority = card.aiInsights && card.aiInsights.priority 
        ? card.aiInsights.priority 
        : 'medium';
    cardElement.classList.add(`priority-${priority}`);

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = card.name;
    cardElement.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'card-meta';

    if (priority) {
        const priorityTag = document.createElement('span');
        priorityTag.className = 'card-tag';
        priorityTag.textContent = priority.toUpperCase();
        meta.appendChild(priorityTag);
    }

    if (card.dueDate) {
        const dueTag = document.createElement('span');
        dueTag.className = 'card-tag';
        const dueDate = new Date(card.dueDate);
        dueTag.textContent = `Due: ${dueDate.toLocaleDateString()}`;
        meta.appendChild(dueTag);
    }

    cardElement.appendChild(meta);

    cardElement.addEventListener('click', () => {
        if (card.url) {
            window.open(card.url, '_blank');
        }
    });

    return cardElement;
};

const updateAnalytics = (analytics) => {
    document.getElementById('total-cards').textContent = analytics.totalCards || 0;
    document.getElementById('completed-cards').textContent = analytics.completedCards || 0;
    document.getElementById('urgent-cards').textContent = analytics.urgentCards || 0;
    document.getElementById('overdue-cards').textContent = analytics.overdueTasks || 0;
};

const updateAIInsights = (lists) => {
    const priorities = { high: 0, medium: 0, low: 0 };
    let totalCards = 0;

    lists.forEach(list => {
        list.cards.forEach(card => {
            totalCards++;
            if (card.aiInsights && card.aiInsights.priority) {
                priorities[card.aiInsights.priority]++;
            } else {
                priorities.medium++;
            }
        });
    });

    updatePriorityHeatmap(priorities, totalCards);
    updateProductivityScore(lists);
};

const updatePriorityHeatmap = (priorities, total) => {
    if (total === 0) return;

    ['high', 'medium', 'low'].forEach(priority => {
        const percentage = (priorities[priority] / total) * 100;
        const bar = document.getElementById(`${priority}-priority-bar`);
        if (bar) {
            bar.style.setProperty('--width', `${percentage}%`);
            bar.style.width = `${percentage}%`;
        }
    });
};

const updateProductivityScore = (lists) => {
    let completed = 0;
    let total = 0;

    lists.forEach(list => {
        const isDoneList = list.name.toLowerCase().includes('done');
        list.cards.forEach(card => {
            total++;
            if (isDoneList) completed++;
        });
    });

    const score = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('productivity-score').textContent = score;
};

const updateSyncStatus = (status) => {
    const indicator = document.getElementById('sync-indicator');
    const text = document.getElementById('sync-text');

    switch (status) {
        case 'syncing':
            indicator.style.color = '#f39c12';
            text.textContent = 'Syncing...';
            break;
        case 'synced':
            indicator.style.color = '#27ae60';
            text.textContent = 'Synced';
            break;
        case 'error':
            indicator.style.color = '#e74c3c';
            text.textContent = 'Error';
            break;
    }
};

const startAutoRefresh = () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(() => {
        loadDashboardData();
    }, 20000);
};

const showMessage = (message) => {
    const kanbanBoard = document.getElementById('kanban-board');
    kanbanBoard.innerHTML = `<div class="loading">${message}</div>`;
};

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();

    document.getElementById('refresh-btn').addEventListener('click', () => {
        loadDashboardData();
    });
});

window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
