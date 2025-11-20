// API Configuration
const API_URL = 'http://localhost:3000';

// State
let currentFilter = 'all';
let allTodos = [];

// DOM Elements
const addTodoForm = document.getElementById('addTodoForm');
const todoTitle = document.getElementById('todoTitle');
const todoDescription = document.getElementById('todoDescription');
const todosContainer = document.getElementById('todosContainer');
const filterButtons = document.querySelectorAll('.filter-btn');
const editModal = document.getElementById('editModal');
const editTodoForm = document.getElementById('editTodoForm');
const editTodoId = document.getElementById('editTodoId');
const editTodoTitle = document.getElementById('editTodoTitle');
const editTodoDescription = document.getElementById('editTodoDescription');
const editTodoCompleted = document.getElementById('editTodoCompleted');
const apiStatus = document.getElementById('apiStatus');
const apiStatusText = document.getElementById('apiStatusText');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAPIStatus();
    loadTodos();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Add todo form
    addTodoForm.addEventListener('submit', handleAddTodo);

    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentFilter = e.target.dataset.filter;
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderTodos();
        });
    });

    // Edit modal
    const closeModal = document.querySelector('.close');
    const cancelEdit = document.getElementById('cancelEdit');
    
    closeModal.addEventListener('click', () => hideModal());
    cancelEdit.addEventListener('click', () => hideModal());
    
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            hideModal();
        }
    });

    editTodoForm.addEventListener('submit', handleEditTodo);
}

// Check API status
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_URL}/`);
        if (response.ok) {
            apiStatus.classList.add('online');
            apiStatus.classList.remove('offline');
            apiStatusText.textContent = 'API Connected';
        } else {
            throw new Error('API not responding');
        }
    } catch (error) {
        apiStatus.classList.add('offline');
        apiStatus.classList.remove('online');
        apiStatusText.textContent = 'API Disconnected - Check if backend is running';
        console.error('API Status Error:', error);
    }
}

// Load todos from API
async function loadTodos() {
    try {
        const response = await fetch(`${API_URL}/todos`);
        if (!response.ok) throw new Error('Failed to fetch todos');
        
        allTodos = await response.json();
        renderTodos();
    } catch (error) {
        console.error('Error loading todos:', error);
        todosContainer.innerHTML = `
            <div class="empty-state">
                <p>❌ Failed to load todos. Make sure the backend server is running.</p>
                <p style="margin-top: 8px; font-size: 0.875rem;">Run: <code>cd backend && npm start</code></p>
            </div>
        `;
    }
}

// Render todos based on current filter
function renderTodos() {
    const filteredTodos = allTodos.filter(todo => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'completed') return todo.completed;
        if (currentFilter === 'active') return !todo.completed;
        return true;
    });

    if (filteredTodos.length === 0) {
        todosContainer.innerHTML = `
            <div class="empty-state">
                <p>📭 No todos found</p>
                <p style="margin-top: 8px; font-size: 0.875rem;">
                    ${currentFilter !== 'all' ? 'Try changing the filter' : 'Add your first todo above!'}
                </p>
            </div>
        `;
        return;
    }

    todosContainer.innerHTML = filteredTodos.map(todo => createTodoHTML(todo)).join('');
    
    // Add event listeners to checkboxes and buttons
    filteredTodos.forEach(todo => {
        const checkbox = document.getElementById(`checkbox-${todo.id}`);
        const editBtn = document.getElementById(`edit-${todo.id}`);
        const deleteBtn = document.getElementById(`delete-${todo.id}`);

        checkbox.addEventListener('change', () => toggleTodoStatus(todo.id, checkbox.checked));
        editBtn.addEventListener('click', () => showEditModal(todo));
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
    });
}

// Create HTML for a single todo
function createTodoHTML(todo) {
    const createdDate = new Date(todo.createdAt).toLocaleDateString();
    const createdTime = new Date(todo.createdAt).toLocaleTimeString();
    
    return `
        <div class="todo-item ${todo.completed ? 'completed' : ''}">
            <div class="todo-header">
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    id="checkbox-${todo.id}"
                    ${todo.completed ? 'checked' : ''}
                >
                <div class="todo-content">
                    <div class="todo-title">${escapeHtml(todo.title)}</div>
                    ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
                    <div class="todo-meta">
                        <span class="todo-badge ${todo.completed ? 'completed' : 'active'}">
                            ${todo.completed ? '✓ Completed' : '○ Active'}
                        </span>
                        <span>Created: ${createdDate} ${createdTime}</span>
                    </div>
                </div>
            </div>
            <div class="todo-actions">
                <button class="btn btn-small btn-secondary" id="edit-${todo.id}">
                    ✏️ Edit
                </button>
                <button class="btn btn-small btn-danger" id="delete-${todo.id}">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `;
}

// Handle add todo
async function handleAddTodo(e) {
    e.preventDefault();
    
    const title = todoTitle.value.trim();
    const description = todoDescription.value.trim();
    
    if (!title) return;

    try {
        const response = await fetch(`${API_URL}/todos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, completed: false })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create todo');
        }

        const newTodo = await response.json();
        allTodos.push(newTodo);
        
        // Reset form
        todoTitle.value = '';
        todoDescription.value = '';
        
        renderTodos();
        showNotification('Todo added successfully!', 'success');
    } catch (error) {
        console.error('Error adding todo:', error);
        showNotification(error.message, 'error');
    }
}

// Toggle todo status
async function toggleTodoStatus(id, completed) {
    const todo = allTodos.find(t => t.id === id);
    if (!todo) return;

    try {
        const response = await fetch(`${API_URL}/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title: todo.title, 
                description: todo.description,
                completed 
            })
        });

        if (!response.ok) throw new Error('Failed to update todo');

        const updatedTodo = await response.json();
        const index = allTodos.findIndex(t => t.id === id);
        allTodos[index] = updatedTodo;
        
        renderTodos();
        showNotification(`Todo marked as ${completed ? 'completed' : 'active'}`, 'success');
    } catch (error) {
        console.error('Error updating todo:', error);
        showNotification('Failed to update todo', 'error');
        // Revert checkbox
        const checkbox = document.getElementById(`checkbox-${id}`);
        if (checkbox) checkbox.checked = !completed;
    }
}

// Show edit modal
function showEditModal(todo) {
    editTodoId.value = todo.id;
    editTodoTitle.value = todo.title;
    editTodoDescription.value = todo.description || '';
    editTodoCompleted.checked = todo.completed;
    editModal.classList.add('show');
}

// Hide modal
function hideModal() {
    editModal.classList.remove('show');
}

// Handle edit todo
async function handleEditTodo(e) {
    e.preventDefault();
    
    const id = parseInt(editTodoId.value);
    const title = editTodoTitle.value.trim();
    const description = editTodoDescription.value.trim();
    const completed = editTodoCompleted.checked;
    
    if (!title) return;

    try {
        const response = await fetch(`${API_URL}/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, completed })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update todo');
        }

        const updatedTodo = await response.json();
        const index = allTodos.findIndex(t => t.id === id);
        allTodos[index] = updatedTodo;
        
        hideModal();
        renderTodos();
        showNotification('Todo updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating todo:', error);
        showNotification(error.message, 'error');
    }
}

// Delete todo
async function deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
        const response = await fetch(`${API_URL}/todos/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete todo');

        allTodos = allTodos.filter(t => t.id !== id);
        renderTodos();
        showNotification('Todo deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting todo:', error);
        showNotification('Failed to delete todo', 'error');
    }
}

// Show notification (simple implementation)
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        animation: slideIn 0.3s;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add animations to stylesheet dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
