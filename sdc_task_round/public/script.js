const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');

const API_URL = '/tasks';

function createTaskElement(task) {
    const li = document.createElement('li');
    li.textContent = task.text;

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'delete-btn';
    delBtn.onclick = async function() {
        await deleteTask(task.id);
    };

    li.appendChild(delBtn);
    return li;
}

async function fetchTasks() {
    try {
        const res = await fetch(API_URL);
        const tasks = await res.json();
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskEl = createTaskElement(task);
            taskList.appendChild(taskEl);
        });
    } catch (err) {
        console.error('Failed to fetch tasks:', err);
    }
}

async function addTask(text) {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (res.ok) {
            await fetchTasks();
        }
    } catch (err) {
        console.error('Failed to add task:', err);
    }
}

async function deleteTask(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            await fetchTasks();
        }
    } catch (err) {
        console.error('Failed to delete task:', err);
    }
}

addBtn.addEventListener('click', function() {
    const taskText = taskInput.value.trim();
    if (taskText) {
        addTask(taskText);
        taskInput.value = '';
        taskInput.focus();
    }
});

taskInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        addBtn.click();
    }
});

// Initial fetch
fetchTasks();
