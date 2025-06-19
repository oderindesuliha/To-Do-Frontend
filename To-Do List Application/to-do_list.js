const URL = 'http://localhost:8080/api';

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('currentUser')) || {};
};

const showLogin = () => {
    document.getElementById('authPage').style.display = 'block';
    document.getElementById('loginMenu').style.display = 'block';
    document.getElementById('registerMenu').style.display = 'none';
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('todoPage').style.display = 'none';
    document.getElementById('authButton').textContent = 'Login';
    document.getElementById('search-input').style.display = 'none';
};

const showRegister = () => {
    document.getElementById('authPage').style.display = 'block';
    document.getElementById('registerMenu').style.display = 'block';
    document.getElementById('loginMenu').style.display = 'none';
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('todoPage').style.display = 'none';
    document.getElementById('authButton').textContent = 'Login';
    document.getElementById('search-input').style.display = 'none';
};

const showTodoPage = () => {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('todoPage').style.display = 'block';
    document.getElementById('authButton').textContent = 'Logout';
    document.getElementById('search-input').style.display = 'inline-block';
};

const toggleAuth = () => {
    const user = getCurrentUser();
    if (user.userName) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        showLogin();
    } else {
        showLogin();
    }
};

const register = async () => {
    const firstName = document.getElementById('registerFirstName').value.trim();
    const lastName = document.getElementById('registerLastName').value.trim();
    const userName = document.getElementById('registerUserName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    if (firstName && lastName && userName && email && password) {
        try {
            const response = await fetch(`${URL}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ firstName, lastName, userName, email, password }),
            });

            const data = await response.json();
            if (response.ok && data.success) {
                alert('Registration successful! Please login.');
                showLogin();
            } else {
                alert(data.message || 'Registration failed. UserName may already exist.');
            }
        } catch (error) {
            alert('Error connecting to the server. Please try again later.');
            console.error('Registration error:', error);
        }
    } else {
        alert('Please fill in all fields.');
    }
};

const login = async () => {
    const userName = document.getElementById('loginUserName').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (userName && password) {
        try {
            const response = await fetch(`${URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userName, password }),
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify({ userName, firstName: data.firstName, email: data.email, userId: data.userId }));
                showTodoPage();
                document.getElementById('welcomeMessage').textContent = `Welcome to COPLANR, ${userName}!`;
                viewAllTasks();
            } else {
                alert(data.message || 'Invalid userName or password.');
            }
        } catch (error) {
            alert('Error connecting to the server. Please try again later.');
            console.error('Login error:', error);
        }
    } else {
        alert('Please fill in all fields.');
    }
};

const addTask = async () => {
    const taskTitle = document.getElementById('addTaskTitle').value.trim();
    const taskDescription = document.getElementById('addTaskDescription').value.trim();
    const taskStatus = document.getElementById('addTaskStatus').value;

    if (!taskTitle || !taskDescription) {
        alert('Please enter both task title and description.');
        return;
    }

    if (!['Pending', 'Not Done', 'In Progress', 'Completed'].includes(taskStatus)) {
        alert('Invalid task status selected.');
        return;
    }

    const user = getCurrentUser();
    if (!user.userId) {
        alert('User not authenticated. Please login again.');
        showLogin();
        return;
    }

    const taskData = {
        title: taskTitle,
        description: taskDescription,
        status: taskStatus,
        userId: user.userId
    };

    try {
        const response = await fetch(`${URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData),
        });

        const data = await response.json();
        if (response.ok && data.success) {
            document.getElementById('addTaskTitle').value = '';
            document.getElementById('addTaskDescription').value = '';
            document.getElementById('addTaskStatus').value = 'Pending';
            viewAllTasks();
        } else {
            console.error('Add task response:', data);
            alert(data.message || 'Failed to add task. Please check the console for details.');
        }
    } catch (error) {
        console.error('Add task error:', error.message, error.stack);
        alert('Error connecting to the server. Please ensure the backend is running and try again.');
    }
};

const editTask = async (taskId, currentTitle, currentDescription) => {
    const inputTitle = document.createElement('input');
    inputTitle.type = 'text';
    inputTitle.className = 'input';
    inputTitle.value = currentTitle;
    inputTitle.maxLength = 100;

    const inputDescription = document.createElement('textarea');
    inputDescription.className = 'input';
    inputDescription.value = currentDescription;
    inputDescription.maxLength = 250;
    inputDescription.style.resize = 'none';
    inputDescription.style.height = '80px';

    const saveButton = document.createElement('button');
    saveButton.className = 'button_add';
    saveButton.textContent = 'Save';
    saveButton.onclick = async () => {
        const newTitle = inputTitle.value.trim();
        const newDescription = inputDescription.value.trim();
        if (newTitle && newDescription) {
            try {
                const response = await fetch(`${URL}/tasks/update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: taskId, title: newTitle, description: newDescription }),
                });

                const data = await response.json();
                if (response.ok && data.success) {
                    viewAllTasks();
                } else {
                    alert(data.message || 'Failed to update task.');
                }
            } catch (error) {
                alert('Error connecting to the server. Please try again later.');
                console.error('Edit task error:', error);
            }
        } else {
            alert('Please enter both task title and description.');
        }
    };

    const taskCell = document.querySelector(`[data-task-id="${taskId}"] .task-name`);
    taskCell.innerHTML = '';
    taskCell.appendChild(inputTitle);
    taskCell.appendChild(inputDescription);
    taskCell.appendChild(saveButton);
    inputTitle.focus();
};

const deleteTask = async (taskId) => {
    try {
        const response = await fetch(`${URL}/tasks/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: taskId }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
            viewAllTasks();
        } else {
            alert(data.message || 'Failed to delete task.');
        }
    } catch (error) {
        alert('Error connecting to the server. Please try again later.');
        console.error('Delete task error:', error);
    }
};

const updateTaskStatus = async (taskId, newStatus) => {
    try {
        const response = await fetch(`${URL}/tasks/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: taskId, status: newStatus }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
            viewAllTasks();
        } else {
            alert(data.message || 'Failed to update task status.');
        }
    } catch (error) {
        alert('Error connecting to the server. Please try again later.');
        console.error('Update task status error:', error);
    }
};

const displayTasks = (tasks, searchTerm = '') => {
    const taskRows = document.getElementById('taskRows');
    taskRows.innerHTML = '';
    let filteredTasks = tasks;
    if (searchTerm) {
        filteredTasks = tasks.filter(task =>
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    filteredTasks.forEach(task => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'task-row';
        rowDiv.dataset.taskId = task.id;

        const titleCell = document.createElement('div');
        titleCell.className = 'task-cell task-name';

        const editButton = document.createElement('button');
        editButton.className = 'edit';
        editButton.textContent = 'Edit';
        editButton.onclick = () => editTask(task.id, task.title, task.description);
        titleCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete';
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteTask(task.id);
        titleCell.appendChild(deleteButton);

        const titleSpan = document.createElement('span');
        titleSpan.textContent = task.title;
        titleCell.appendChild(titleSpan);
        rowDiv.appendChild(titleCell);

        const statusCell = document.createElement('div');
        statusCell.className = 'task-cell status-cell';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.status === 'Completed';
        checkbox.onclick = () => updateTaskStatus(task.id, checkbox.checked ? 'Completed' : task.status === 'Completed' ? 'Not Done' : task.status);
        statusCell.appendChild(checkbox);
        const statusTag = document.createElement('span');
        statusTag.className = `status-tag ${task.status.toLowerCase().replace(' ', '-')}`;
        statusTag.textContent = task.status;
        statusCell.appendChild(statusTag);
        rowDiv.appendChild(statusCell);

        const descriptionCell = document.createElement('div');
        descriptionCell.className = 'task-cell';
        descriptionCell.textContent = task.description;
        rowDiv.appendChild(descriptionCell);

        taskRows.appendChild(rowDiv);
    });
};

const viewAllTasks = async () => {
    try {
        const user = getCurrentUser();
        const response = await fetch(`${URL}/tasks?userId=${user.userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        if (response.ok && data.success) {
            displayTasks(data.data, document.getElementById('search-input').value);
        } else {
            alert(data.message || 'Failed to fetch tasks.');
        }
    } catch (error) {
        alert('Error connecting to the server. Please try again later.');
        console.error('View tasks error:', error);
    }
};

document.getElementById('search-input').addEventListener('input', (e) => {
    const user = getCurrentUser();
    if (user.userName) {
        viewAllTasks();
    }
});

const user = getCurrentUser();
if (user.userName) {
    showTodoPage();
    document.getElementById('welcomeMessage').textContent = `Welcome to COPLANR, ${user.userName}!`;
    viewAllTasks();
} else {
    showLogin();
}
