// util.js - Lógica de autenticación simple y CRUD de tareas usando localStorage/sessionStorage

(() => {
	// --- Helpers ---
	const $ = sel => document.querySelector(sel);
	const qs = (el, sel) => el.querySelector(sel);

	const STORAGE_PREFIX = 'pc_tasks_';

	function getUserKey(username){
		return STORAGE_PREFIX + username;
	}

	function getCurrentUser(){
		return sessionStorage.getItem('pc_user');
	}

	function setCurrentUser(username){
		sessionStorage.setItem('pc_user', username);
	}

	function clearCurrentUser(){
		sessionStorage.removeItem('pc_user');
	}

	// --- Tasks persistence ---
	function loadTasks(username){
		try{
			const raw = localStorage.getItem(getUserKey(username));
			return raw ? JSON.parse(raw) : [];
		}catch(e){
			console.error('Error leyendo tareas:', e);
			return [];
		}
	}

	function saveTasks(username, tasks){
		localStorage.setItem(getUserKey(username), JSON.stringify(tasks));
	}

	// --- Rendering ---
	function renderTasks(tasks){
		const list = $('#tasks-list');
		list.innerHTML = '';
		if(!tasks.length){
			list.innerHTML = '<li class="empty">No hay tareas.</li>';
			return;
		}

		tasks.forEach(t => {
			const li = document.createElement('li');
			li.className = 'task-item' + (t.completed ? ' done' : '');
			li.dataset.id = t.id;

			li.innerHTML = `
				<div class="left">
					<input type="checkbox" class="toggle" ${t.completed ? 'checked' : ''}>
				</div>
				<div class="main">
					<div class="title">${escapeHtml(t.title)}</div>
					<div class="desc">${escapeHtml(t.description || '')}</div>
					<div class="meta">Creada: ${formatDate(t.createdAt)}</div>
				</div>
				<div class="actions">
					<button class="btn small edit">Editar</button>
					<button class="btn small danger delete">Borrar</button>
				</div>
			`;

			// events
			qs(li, '.toggle').addEventListener('change', () => handleToggle(t.id));
			qs(li, '.edit').addEventListener('click', () => openEditModal(t.id));
			qs(li, '.delete').addEventListener('click', () => handleDelete(t.id));

			list.appendChild(li);
		});
	}

	function escapeHtml(s){
		return String(s)
			.replace(/&/g,'&amp;')
			.replace(/</g,'&lt;')
			.replace(/>/g,'&gt;')
			.replace(/"/g,'&quot;')
			.replace(/'/g,'&#39;');
	}

	function formatDate(ts){
		try{
			const d = new Date(ts);
			return d.toLocaleString();
		}catch(e){ return '' }
	}

	// --- App state ---
	let state = {
		username: null,
		tasks: [],
		filter: 'all',
		search: ''
	};

	// --- Actions ---
	function refreshUI(){
		const user = getCurrentUser();
		if(user){
			state.username = user;
			$('#login-section').classList.add('hidden');
			$('#dashboard').classList.remove('hidden');
			$('#welcome').textContent = `Bienvenido, ${user}`;
			state.tasks = loadTasks(user);
			applyFiltersAndRender();
		}else{
			$('#login-section').classList.remove('hidden');
			$('#dashboard').classList.add('hidden');
		}
	}

	function applyFiltersAndRender(){
		let out = state.tasks.slice();
		if(state.filter === 'active') out = out.filter(t => !t.completed);
		if(state.filter === 'done') out = out.filter(t => t.completed);
		if(state.search) out = out.filter(t => t.title.toLowerCase().includes(state.search.toLowerCase()));
		renderTasks(out.sort((a,b) => b.createdAt - a.createdAt));
	}

	function handleLogin(ev){
		ev.preventDefault();
		const username = $('#username').value.trim() || 'usuario';
		// demo: accept any password
		setCurrentUser(username);
		refreshUI();
	}

	function handleLogout(){
		clearCurrentUser();
		state = {username:null,tasks:[],filter:'all',search:''};
		$('#login-form').reset();
		refreshUI();
	}

	function handleAddTask(ev){
		ev.preventDefault();
		const title = $('#task-title').value.trim();
		const desc = $('#task-desc').value.trim();
		if(!title) return;
		const t = { id: 't'+Date.now(), title, description: desc, completed:false, createdAt: Date.now() };
		state.tasks.push(t);
		saveTasks(state.username, state.tasks);
		$('#task-form').reset();
		applyFiltersAndRender();
	}

	function handleDelete(id){
		if(!confirm('¿Borrar esta tarea?')) return;
		state.tasks = state.tasks.filter(t => t.id !== id);
		saveTasks(state.username, state.tasks);
		applyFiltersAndRender();
	}

	function handleToggle(id){
		const t = state.tasks.find(x=>x.id===id);
		if(!t) return;
		t.completed = !t.completed;
		saveTasks(state.username, state.tasks);
		applyFiltersAndRender();
	}

	// Edit modal
	let editingId = null;
	function openEditModal(id){
		const t = state.tasks.find(x=>x.id===id);
		if(!t) return;
		editingId = id;
		$('#edit-title').value = t.title;
		$('#edit-desc').value = t.description || '';
		$('#editModal').classList.remove('hidden');
	}

	function closeEditModal(){
		editingId = null;
		$('#edit-form').reset();
		$('#editModal').classList.add('hidden');
	}

	function handleEditSave(ev){
		ev.preventDefault();
		if(!editingId) return closeEditModal();
		const t = state.tasks.find(x=>x.id===editingId);
		if(!t) return closeEditModal();
		t.title = $('#edit-title').value.trim();
		t.description = $('#edit-desc').value.trim();
		saveTasks(state.username, state.tasks);
		closeEditModal();
		applyFiltersAndRender();
	}

	function handleClearAll(){
		if(!confirm('Borrar todas las tareas?')) return;
		state.tasks = [];
		saveTasks(state.username, state.tasks);
		applyFiltersAndRender();
	}

	// search & filter
	function handleSearch(ev){
		state.search = ev.target.value || '';
		applyFiltersAndRender();
	}

	function handleFilter(ev){
		state.filter = ev.target.value;
		applyFiltersAndRender();
	}

	// --- Init ---
	function init(){
		// bind login
		$('#login-form').addEventListener('submit', handleLogin);
		$('#logoutBtn').addEventListener('click', handleLogout);

		// tasks
		$('#task-form').addEventListener('submit', handleAddTask);
		$('#clearTasks').addEventListener('click', handleClearAll);

		// modal
		$('#edit-form').addEventListener('submit', handleEditSave);
		$('#cancelEdit').addEventListener('click', closeEditModal);
		// backdrop click to close
		$('#editModal').addEventListener('click', e => { if(e.target === $('#editModal')) closeEditModal(); });

		// search & filter
		$('#search').addEventListener('input', handleSearch);
		$('#filter').addEventListener('change', handleFilter);

		// initial state from session
		refreshUI();
	}

	document.addEventListener('DOMContentLoaded', init);

})();
