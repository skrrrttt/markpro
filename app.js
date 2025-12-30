// ==========================================
// MARKPRO - Pavement Marking Job Management
// ==========================================

// Configuration
const CONFIG = {
    STORAGE_KEY: 'markpro_data',
    PASSWORD: 'markpro2025', // Change this to your team password
    VERSION: '1.0.0'
};

// Default checklist template
const DEFAULT_CHECKLIST = [
    { id: 1, text: 'Contact customer', checked: false },
    { id: 2, text: 'Load paint', checked: false },
    { id: 3, text: 'Do job', checked: false },
    { id: 4, text: 'Contact customer to confirm job', checked: false }
];

// App State
let state = {
    isLoggedIn: false,
    currentView: 'jobs',
    currentMonth: new Date(),
    jobs: [],
    checklistTemplate: [...DEFAULT_CHECKLIST],
    selectedJobId: null,
    archives: {}
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    loadData();
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
        if (sessionStorage.getItem('markpro_session')) {
            state.isLoggedIn = true;
            showApp();
        }
    }, 800);
    setupEventListeners();
}

function loadData() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (saved) {
        const data = JSON.parse(saved);
        state.jobs = data.jobs || [];
        state.checklistTemplate = data.checklistTemplate || [...DEFAULT_CHECKLIST];
        state.archives = data.archives || {};
    }
}

function saveData() {
    const data = {
        jobs: state.jobs,
        checklistTemplate: state.checklistTemplate,
        archives: state.archives,
        lastSaved: new Date().toISOString()
    };
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
}

function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    
    document.getElementById('addJobBtn').addEventListener('click', () => openJobForm());
    document.getElementById('saveJobBtn').addEventListener('click', handleSaveJob);
    document.getElementById('jobSearch').addEventListener('input', (e) => renderJobs(e.target.value));
    
    document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(1));
    document.getElementById('todayBtn').addEventListener('click', goToToday);
    
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => switchAdminTab(tab.dataset.tab));
    });
    
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', () => switchModalTab(tab.dataset.modalTab));
    });
    
    document.getElementById('uploadZone').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    
    document.getElementById('saveNotesBtn').addEventListener('click', saveJobNotes);
    document.getElementById('markCompleteBtn').addEventListener('click', markJobComplete);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteJob);
    
    document.getElementById('addTemplateItem').addEventListener('click', addTemplateItem);
    document.getElementById('saveTemplate').addEventListener('click', saveTemplate);
    
    document.getElementById('loadYearBtn').addEventListener('click', loadArchiveYear);
    document.getElementById('exportBtn').addEventListener('click', exportCurrentYear);
    
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('loginPassword').value;
    if (password === CONFIG.PASSWORD) {
        state.isLoggedIn = true;
        sessionStorage.setItem('markpro_session', 'true');
        showApp();
        showToast('Welcome to MarkPro!', 'success');
    } else {
        showToast('Incorrect password', 'error');
        document.getElementById('loginPassword').value = '';
    }
}

function handleLogout() {
    state.isLoggedIn = false;
    sessionStorage.removeItem('markpro_session');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('app').classList.remove('active');
    document.getElementById('loginPassword').value = '';
}

function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.add('active');
    renderAll();
}

// Navigation
function switchView(view) {
    state.currentView = view;
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.querySelectorAll('.view').forEach(v => {
        v.classList.toggle('active', v.id === view + 'View');
    });
    if (view === 'calendar') renderCalendar();
    else if (view === 'admin') { renderAdminTable(); renderTemplateEditor(); }
}

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.admin-content').forEach(c => {
        c.classList.toggle('active', c.id === tab + 'Tab');
    });
    if (tab === 'templates') renderTemplateEditor();
}

function switchModalTab(tab) {
    document.querySelectorAll('.modal-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.modalTab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.toggle('active', c.id === tab + 'TabContent');
    });
}

// Rendering
function renderAll() {
    renderStats();
    renderJobs();
    renderCalendar();
    renderAdminTable();
    renderTemplateEditor();
}

function renderStats() {
    const total = state.jobs.length;
    const pending = state.jobs.filter(j => j.status === 'pending').length;
    const inProgress = state.jobs.filter(j => j.status === 'in-progress').length;
    const completed = state.jobs.filter(j => j.status === 'completed').length;
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statProgress').textContent = inProgress;
    document.getElementById('statCompleted').textContent = completed;
}

function renderJobs(searchTerm = '') {
    const grid = document.getElementById('jobsGrid');
    const empty = document.getElementById('emptyJobs');
    
    let filteredJobs = state.jobs;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredJobs = state.jobs.filter(job => 
            job.name.toLowerCase().includes(term) ||
            job.address.toLowerCase().includes(term) ||
            (job.contactName && job.contactName.toLowerCase().includes(term))
        );
    }
    
    if (filteredJobs.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    
    empty.style.display = 'none';
    
    const statusOrder = { 'in-progress': 0, 'pending': 1, 'completed': 2 };
    filteredJobs.sort((a, b) => {
        if (a.scheduledDate && b.scheduledDate) {
            const dateCompare = new Date(a.scheduledDate) - new Date(b.scheduledDate);
            if (dateCompare !== 0) return dateCompare;
        }
        return statusOrder[a.status] - statusOrder[b.status];
    });
    
    grid.innerHTML = filteredJobs.map(job => {
        const checklistProgress = getChecklistProgress(job);
        return `
            <div class="job-card" onclick="openJobDetail('${job.id}')">
                <div class="job-card-header">
                    <div>
                        <div class="job-name">${escapeHtml(job.name)}</div>
                        <div class="job-address">${escapeHtml(job.address)}</div>
                    </div>
                    <span class="job-status status-${job.status}">${formatStatus(job.status)}</span>
                </div>
                <div class="job-card-body">
                    <div class="job-meta">
                        ${job.scheduledDate ? `<div class="job-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>${formatDate(job.scheduledDate)}</div>` : ''}
                        ${job.contactName ? `<div class="job-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>${escapeHtml(job.contactName)}</div>` : ''}
                        ${job.files && job.files.length > 0 ? `<div class="job-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>${job.files.length} file${job.files.length > 1 ? 's' : ''}</div>` : ''}
                    </div>
                    <div class="job-progress">
                        <div class="progress-label"><span>Checklist</span><span>${checklistProgress.completed}/${checklistProgress.total}</span></div>
                        <div class="progress-bar"><div class="progress-fill" style="width: ${checklistProgress.percent}%"></div></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarTitle');
    
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    
    title.textContent = state.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = days.map(d => `<div class="calendar-day-header">${d}</div>`).join('');
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month"><div class="day-number">${daysInPrevMonth - i}</div></div>`;
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = date.getTime() === today.getTime();
        const dayJobs = state.jobs.filter(job => job.scheduledDate === dateStr);
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}" onclick="showDayJobs('${dateStr}')">
                <div class="day-number">${day}</div>
                ${dayJobs.slice(0, 3).map(job => `<div class="calendar-event ${job.status}" onclick="event.stopPropagation(); openJobDetail('${job.id}')">${escapeHtml(job.name)}</div>`).join('')}
                ${dayJobs.length > 3 ? `<div class="calendar-event" style="background: var(--bg-card-hover); color: var(--text-muted);">+${dayJobs.length - 3} more</div>` : ''}
            </div>
        `;
    }
    
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    for (let day = 1; day <= totalCells - (firstDay + daysInMonth); day++) {
        html += `<div class="calendar-day other-month"><div class="day-number">${day}</div></div>`;
    }
    
    grid.innerHTML = html;
}

function renderAdminTable() {
    const tbody = document.getElementById('jobsTableBody');
    if (state.jobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px;">No jobs yet</td></tr>';
        return;
    }
    tbody.innerHTML = state.jobs.map(job => `
        <tr>
            <td><strong>${escapeHtml(job.name)}</strong></td>
            <td>${escapeHtml(job.address)}</td>
            <td><span class="job-status status-${job.status}">${formatStatus(job.status)}</span></td>
            <td>${job.scheduledDate ? formatDate(job.scheduledDate) : '—'}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-icon btn-small" onclick="openJobForm('${job.id}')" title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    <button class="btn btn-icon btn-small" onclick="openDeleteModal('${job.id}')" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderTemplateEditor() {
    const editor = document.getElementById('templateEditor');
    editor.innerHTML = state.checklistTemplate.map((item, index) => `
        <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
            <input type="text" class="form-input" value="${escapeHtml(item.text)}" onchange="updateTemplateItem(${index}, this.value)" style="flex: 1;">
            <button class="btn btn-icon btn-small" onclick="removeTemplateItem(${index})" title="Remove"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
    `).join('');
}

function renderJobChecklist(job) {
    const container = document.getElementById('jobChecklist');
    container.innerHTML = job.checklist.map((item, index) => `
        <div class="checklist-item ${item.checked ? 'checked' : ''}" onclick="toggleChecklistItem('${job.id}', ${index})">
            <div class="checklist-checkbox"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
            <span class="checklist-text">${escapeHtml(item.text)}</span>
        </div>
    `).join('');
}

function renderJobFiles(job) {
    const container = document.getElementById('filesGrid');
    if (!job.files || job.files.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No files uploaded yet</p>';
        return;
    }
    container.innerHTML = job.files.map((file, index) => `
        <div class="file-card" onclick="viewFile('${job.id}', ${index})">
            <div class="file-icon ${getFileType(file.name)}">${getFileIcon(file.name)}</div>
            <div class="file-name">${escapeHtml(file.name)}</div>
        </div>
    `).join('');
}

// Job Operations
function openJobForm(jobId = null) {
    const modal = document.getElementById('jobFormModal');
    const title = document.getElementById('jobFormTitle');
    const form = document.getElementById('jobForm');
    
    form.reset();
    document.getElementById('editJobId').value = '';
    
    if (jobId) {
        const job = state.jobs.find(j => j.id === jobId);
        if (job) {
            title.textContent = 'Edit Job';
            document.getElementById('jobName').value = job.name;
            document.getElementById('jobAddress').value = job.address;
            document.getElementById('contactName').value = job.contactName || '';
            document.getElementById('contactPhone').value = job.contactPhone || '';
            document.getElementById('contactEmail').value = job.contactEmail || '';
            document.getElementById('scheduledDate').value = job.scheduledDate || '';
            document.getElementById('jobStatus').value = job.status;
            document.getElementById('editJobId').value = jobId;
        }
    } else {
        title.textContent = 'Add New Job';
    }
    modal.classList.add('active');
}

function handleSaveJob() {
    const name = document.getElementById('jobName').value.trim();
    const address = document.getElementById('jobAddress').value.trim();
    
    if (!name || !address) {
        showToast('Please fill in required fields', 'error');
        return;
    }
    
    const jobData = {
        name,
        address,
        contactName: document.getElementById('contactName').value.trim(),
        contactPhone: document.getElementById('contactPhone').value.trim(),
        contactEmail: document.getElementById('contactEmail').value.trim(),
        scheduledDate: document.getElementById('scheduledDate').value,
        status: document.getElementById('jobStatus').value
    };
    
    const editId = document.getElementById('editJobId').value;
    
    if (editId) {
        const index = state.jobs.findIndex(j => j.id === editId);
        if (index !== -1) {
            state.jobs[index] = { ...state.jobs[index], ...jobData };
            showToast('Job updated successfully', 'success');
        }
    } else {
        const newJob = {
            id: generateId(),
            ...jobData,
            checklist: state.checklistTemplate.map(item => ({ ...item, id: generateId() })),
            files: [],
            notes: '',
            createdAt: new Date().toISOString()
        };
        state.jobs.push(newJob);
        showToast('Job created successfully', 'success');
    }
    
    saveData();
    renderAll();
    closeModal('jobFormModal');
}

function openJobDetail(jobId) {
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;
    
    state.selectedJobId = jobId;
    
    document.getElementById('modalJobTitle').textContent = job.name;
    document.getElementById('detailJobName').textContent = job.name;
    document.getElementById('detailJobAddress').querySelector('span').textContent = job.address;
    document.getElementById('detailJobStatus').textContent = formatStatus(job.status);
    document.getElementById('detailJobStatus').className = `job-status status-${job.status}`;
    document.getElementById('detailContactName').textContent = job.contactName || 'Not provided';
    
    const phoneEl = document.getElementById('detailContactPhone');
    const emailEl = document.getElementById('detailContactEmail');
    
    if (job.contactPhone) {
        phoneEl.textContent = job.contactPhone;
        phoneEl.href = `tel:${job.contactPhone}`;
    } else {
        phoneEl.textContent = 'Not provided';
        phoneEl.removeAttribute('href');
    }
    
    if (job.contactEmail) {
        emailEl.textContent = job.contactEmail;
        emailEl.href = `mailto:${job.contactEmail}`;
    } else {
        emailEl.textContent = 'Not provided';
        emailEl.removeAttribute('href');
    }
    
    document.getElementById('detailScheduledDate').textContent = job.scheduledDate ? formatDate(job.scheduledDate) : 'Not scheduled';
    document.getElementById('jobNotes').value = job.notes || '';
    
    const completeBtn = document.getElementById('markCompleteBtn');
    completeBtn.textContent = job.status === 'completed' ? 'Reopen Job' : 'Mark Complete';
    
    renderJobChecklist(job);
    renderJobFiles(job);
    switchModalTab('details');
    
    document.getElementById('jobDetailModal').classList.add('active');
}

function toggleChecklistItem(jobId, index) {
    const job = state.jobs.find(j => j.id === jobId);
    if (job && job.checklist[index]) {
        job.checklist[index].checked = !job.checklist[index].checked;
        saveData();
        renderJobChecklist(job);
        renderJobs();
        
        if (job.checklist.every(item => item.checked) && job.status !== 'completed') {
            showToast('All checklist items complete! Mark job as done?', 'success');
        }
    }
}

function saveJobNotes() {
    const job = state.jobs.find(j => j.id === state.selectedJobId);
    if (job) {
        job.notes = document.getElementById('jobNotes').value;
        saveData();
        showToast('Notes saved', 'success');
    }
}

function markJobComplete() {
    const job = state.jobs.find(j => j.id === state.selectedJobId);
    if (job) {
        if (job.status === 'completed') {
            job.status = 'in-progress';
            showToast('Job reopened', 'success');
        } else {
            job.status = 'completed';
            job.checklist.forEach(item => item.checked = true);
            showToast('Job marked complete!', 'success');
        }
        saveData();
        renderAll();
        openJobDetail(job.id);
    }
}

function openDeleteModal(jobId) {
    document.getElementById('deleteJobId').value = jobId;
    document.getElementById('deleteModal').classList.add('active');
}

function confirmDeleteJob() {
    const jobId = document.getElementById('deleteJobId').value;
    state.jobs = state.jobs.filter(j => j.id !== jobId);
    saveData();
    renderAll();
    closeModal('deleteModal');
    showToast('Job deleted', 'success');
}

// File Operations
function handleFileUpload(e) {
    const files = e.target.files;
    const job = state.jobs.find(j => j.id === state.selectedJobId);
    if (!job || !files.length) return;
    if (!job.files) job.files = [];
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            job.files.push({
                id: generateId(),
                name: file.name,
                type: file.type,
                data: event.target.result,
                uploadedAt: new Date().toISOString()
            });
            saveData();
            renderJobFiles(job);
            showToast(`${file.name} uploaded`, 'success');
        };
        reader.readAsDataURL(file);
    });
    e.target.value = '';
}

function viewFile(jobId, fileIndex) {
    const job = state.jobs.find(j => j.id === jobId);
    if (!job || !job.files[fileIndex]) return;
    const file = job.files[fileIndex];
    const win = window.open();
    if (file.type.startsWith('image/')) {
        win.document.write(`<html><head><title>${file.name}</title></head><body style="margin:0; background:#1a1a2e; display:flex; justify-content:center; align-items:center; min-height:100vh;"><img src="${file.data}" style="max-width:100%; max-height:100vh;"></body></html>`);
    } else if (file.type === 'application/pdf') {
        win.document.write(`<html><head><title>${file.name}</title></head><body style="margin:0;"><iframe src="${file.data}" style="width:100%; height:100vh; border:none;"></iframe></body></html>`);
    }
}

function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'doc';
}

function getFileIcon(filename) {
    const type = getFileType(filename);
    if (type === 'image') return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
    if (type === 'pdf') return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>';
}

// Calendar Operations
function navigateMonth(delta) {
    state.currentMonth.setMonth(state.currentMonth.getMonth() + delta);
    renderCalendar();
}

function goToToday() {
    state.currentMonth = new Date();
    renderCalendar();
}

function showDayJobs(dateStr) {
    const dayJobs = state.jobs.filter(job => job.scheduledDate === dateStr);
    if (dayJobs.length === 1) {
        openJobDetail(dayJobs[0].id);
    } else if (dayJobs.length > 1) {
        switchView('jobs');
        document.getElementById('jobSearch').value = formatDate(dateStr);
        renderJobs(formatDate(dateStr));
    }
}

// Template Operations
function updateTemplateItem(index, value) {
    if (state.checklistTemplate[index]) state.checklistTemplate[index].text = value;
}

function addTemplateItem() {
    state.checklistTemplate.push({ id: generateId(), text: 'New item', checked: false });
    renderTemplateEditor();
}

function removeTemplateItem(index) {
    state.checklistTemplate.splice(index, 1);
    renderTemplateEditor();
}

function saveTemplate() {
    state.checklistTemplate = state.checklistTemplate.filter(item => item.text.trim());
    saveData();
    renderTemplateEditor();
    showToast('Template saved', 'success');
}

// Archive Operations
function loadArchiveYear() {
    const year = document.getElementById('yearSelect').value;
    const currentYear = new Date().getFullYear().toString();
    
    if (year === currentYear) {
        showToast('Current year jobs are already loaded', 'error');
        return;
    }
    
    const archived = state.archives[year];
    if (archived && archived.length > 0) {
        if (confirm(`Load ${archived.length} jobs from ${year}? This will add them to your current jobs.`)) {
            archived.forEach(job => {
                state.jobs.push({
                    ...job,
                    id: generateId(),
                    checklist: job.checklist.map(item => ({ ...item, id: generateId(), checked: false })),
                    status: 'pending'
                });
            });
            saveData();
            renderAll();
            showToast(`Loaded ${archived.length} jobs from ${year}`, 'success');
        }
    } else {
        showToast(`No archived jobs found for ${year}`, 'error');
    }
}

function exportCurrentYear() {
    const year = new Date().getFullYear().toString();
    const yearJobs = state.jobs.filter(job => {
        const jobYear = job.createdAt ? new Date(job.createdAt).getFullYear().toString() : year;
        return jobYear === year;
    });
    
    if (yearJobs.length === 0) {
        showToast('No jobs to export', 'error');
        return;
    }
    
    state.archives[year] = yearJobs.map(job => ({ ...job, files: [] }));
    saveData();
    
    const blob = new Blob([JSON.stringify(yearJobs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markpro-jobs-${year}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${yearJobs.length} jobs for ${year}`, 'success');
}

// Utility Functions
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatStatus(status) {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getChecklistProgress(job) {
    if (!job.checklist || job.checklist.length === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = job.checklist.filter(item => item.checked).length;
    const total = job.checklist.length;
    return { completed, total, percent: Math.round((completed / total) * 100) };
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${type === 'success' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#30d158" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff453a" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'}<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// PWA Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
    });
}
