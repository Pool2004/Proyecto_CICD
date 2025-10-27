// Configuración de la API
const API_BASE_URL = 'https://testapiproject.onrender.com';

// Utilidades para mostrar mensajes
function showMessage(elementId, message, type = 'success') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `result-message ${type}`;
    element.style.display = 'block';
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Función para formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'No asignada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Función para obtener el emoji del estado
function getStatusEmoji(status) {
    const emojis = {
        'pendiente': '⏳',
        'en_progreso': '🔄',
        'completada': '✅'
    };
    return emojis[status] || '❓';
}

// Función para obtener el emoji de la prioridad
function getPriorityEmoji(priority) {
    const emojis = {
        'baja': '🔵',
        'media': '🟡',
        'alta': '🔴'
    };
    return emojis[priority] || '⚪';
}

// Función para crear una tarjeta de tarea
function createTaskCard(task) {
    return `
        <div class="task-card" data-task-id="${task.id}">
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
                <span class="task-id">ID: ${task.id}</span>
            </div>
            <div class="task-description">${task.description || 'Sin descripción'}</div>
            <div class="task-meta">
                <span class="task-status status-${task.status}">
                    ${getStatusEmoji(task.status)} ${task.status.replace('_', ' ').toUpperCase()}
                </span>
                <span class="task-priority priority-${task.priority}">
                    ${getPriorityEmoji(task.priority)} ${task.priority.toUpperCase()}
                </span>
                <span class="task-due-date">📅 ${formatDate(task.due_date)}</span>
            </div>
        </div>
    `;
}

// ===== OPERACIONES CRUD =====

// Crear tarea
async function createTask(taskData) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('create-result', `✅ Tarea creada exitosamente con ID: ${result.id}`, 'success');
            document.getElementById('create-form').reset();
            return result;
        } else {
            const error = await response.json();
            showMessage('create-result', `❌ Error al crear la tarea: ${error.message}`, 'error');
            throw new Error(error.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('create-result', `❌ Error de conexión: ${error.message}`, 'error');
        throw error;
    }
}

// Leer todas las tareas
async function getAllTasks(filters = {}) {
    try {
        let url = `${API_BASE_URL}/tasks`;
        const params = new URLSearchParams();
        
        if (filters.status) params.append('status', filters.status);
        if (filters.priority) params.append('priority', filters.priority);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        
        if (response.ok) {
            const tasks = await response.json();
            return tasks;
        } else {
            const error = await response.json();
            throw new Error(error.message);
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Leer tarea por ID
async function getTaskById(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
        
        if (response.ok) {
            const task = await response.json();
            return task;
        } else if (response.status === 404) {
            throw new Error('Tarea no encontrada');
        } else {
            const error = await response.json();
            throw new Error(error.message);
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Actualizar tarea
async function updateTask(taskId, taskData) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showMessage('update-result', `✅ Tarea actualizada exitosamente`, 'success');
            return result;
        } else {
            const error = await response.json();
            showMessage('update-result', `❌ Error al actualizar la tarea: ${error.message}`, 'error');
            throw new Error(error.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('update-result', `❌ Error de conexión: ${error.message}`, 'error');
        throw error;
    }
}

// Eliminar tarea
async function deleteTask(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('delete-result', `✅ Tarea eliminada exitosamente`, 'success');
            return true;
        } else {
            const error = await response.json();
            showMessage('delete-result', `❌ Error al eliminar la tarea: ${error.message}`, 'error');
            throw new Error(error.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('delete-result', `❌ Error de conexión: ${error.message}`, 'error');
        throw error;
    }
}

// ===== EVENT HANDLERS =====

// Manejar formulario de crear tarea
document.addEventListener('DOMContentLoaded', function() {
    const createForm = document.getElementById('create-form');
    if (createForm) {
        createForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const taskData = {
                title: formData.get('title'),
                description: formData.get('description'),
                priority: formData.get('priority'),
                status: formData.get('status'),
                due_date: formData.get('due_date') || null
            };
            
            await createTask(taskData);
        });
    }
    
    // Manejar carga de todas las tareas
    window.loadAllTasks = async function() {
        try {
            const container = document.getElementById('tasks-container');
            container.innerHTML = '<p class="muted">Cargando tareas...</p>';
            
            const statusFilter = document.getElementById('filter-status').value;
            const priorityFilter = document.getElementById('filter-priority').value;
            
            const filters = {};
            if (statusFilter) filters.status = statusFilter;
            if (priorityFilter) filters.priority = priorityFilter;
            
            const tasks = await getAllTasks(filters);
            
            if (tasks.length === 0) {
                container.innerHTML = '<p class="muted">No se encontraron tareas.</p>';
                return;
            }
            
            container.innerHTML = tasks.map(task => createTaskCard(task)).join('');
            
        } catch (error) {
            document.getElementById('tasks-container').innerHTML = 
                `<p class="result-message error">❌ Error al cargar las tareas: ${error.message}</p>`;
        }
    };
    
    // Manejar búsqueda por ID
    const readByIdForm = document.getElementById('read-by-id-form');
    if (readByIdForm) {
        readByIdForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const taskId = document.getElementById('search-id').value;
            const container = document.getElementById('task-detail-container');
            
            try {
                container.innerHTML = '<p class="muted">Buscando tarea...</p>';
                const task = await getTaskById(taskId);
                container.innerHTML = createTaskCard(task);
            } catch (error) {
                container.innerHTML = 
                    `<p class="result-message error">❌ ${error.message}</p>`;
            }
        });
    }
    
    // Manejar búsqueda para actualizar
    const searchUpdateForm = document.getElementById('search-update-form');
    if (searchUpdateForm) {
        searchUpdateForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const taskId = document.getElementById('update-search-id').value;
            
            try {
                const task = await getTaskById(taskId);
                
                // Llenar el formulario con los datos de la tarea
                document.getElementById('update-id').value = task.id;
                document.getElementById('update-title').value = task.title;
                document.getElementById('update-description').value = task.description || '';
                document.getElementById('update-priority').value = task.priority;
                document.getElementById('update-status').value = task.status;
                document.getElementById('update-due-date').value = task.due_date || '';
                
                // Mostrar el formulario de actualización
                document.getElementById('update-form-container').style.display = 'block';
                showMessage('update-result', `📝 Tarea cargada. Modifica los campos y guarda los cambios.`, 'success');
                
            } catch (error) {
                showMessage('update-result', `❌ ${error.message}`, 'error');
            }
        });
    }
    
    // Manejar formulario de actualización
    const updateForm = document.getElementById('update-form');
    if (updateForm) {
        updateForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const taskId = formData.get('id');
            const taskData = {
                title: formData.get('title'),
                description: formData.get('description'),
                priority: formData.get('priority'),
                status: formData.get('status'),
                due_date: formData.get('due_date') || null
            };
            
            await updateTask(taskId, taskData);
        });
    }
    
    // Manejar búsqueda para eliminar
    const searchDeleteForm = document.getElementById('search-delete-form');
    if (searchDeleteForm) {
        searchDeleteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const taskId = document.getElementById('delete-search-id').value;
            
            try {
                const task = await getTaskById(taskId);
                
                // Mostrar vista previa de la tarea a eliminar
                document.getElementById('delete-task-preview').innerHTML = createTaskCard(task);
                document.getElementById('delete-preview-container').style.display = 'block';
                
                // Guardar el ID para la eliminación
                window.taskToDelete = taskId;
                
            } catch (error) {
                showMessage('delete-result', `❌ ${error.message}`, 'error');
            }
        });
    }
    
    // Confirmar eliminación
    window.confirmDelete = async function() {
        if (window.taskToDelete) {
            const confirmed = confirm('⚠️ ¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.');
            if (confirmed) {
                await deleteTask(window.taskToDelete);
                document.getElementById('delete-preview-container').style.display = 'none';
                document.getElementById('delete-search-id').value = '';
                window.taskToDelete = null;
            }
        }
    };
    
    // Agregar event listeners para filtros
    const filterStatus = document.getElementById('filter-status');
    const filterPriority = document.getElementById('filter-priority');
    
    if (filterStatus) {
        filterStatus.addEventListener('change', () => {
            if (document.getElementById('tasks-container').children.length > 0) {
                loadAllTasks();
            }
        });
    }
    
    if (filterPriority) {
        filterPriority.addEventListener('change', () => {
            if (document.getElementById('tasks-container').children.length > 0) {
                loadAllTasks();
            }
        });
    }
});
