// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskCategory = document.getElementById('taskCategory');
const taskDueDate = document.getElementById('taskDueDate');
const taskPriority = document.getElementById('taskPriority');
const taskList = document.getElementById('taskList');
const filterButtons = document.querySelectorAll('.filter-btn');

// Current filter
let currentFilter = 'all';

// Add new task
taskForm.addEventListener('submit', e => {
    e.preventDefault();
    
    const taskText = taskInput.value.trim();
    if (!taskText) return;
    
    const newTask = {
        text: taskText,
        category: taskCategory.value,
        dueDate: taskDueDate.value ? new Date(taskDueDate.value) : null,
        priority: taskPriority.value,
        completed: false,
        createdAt: new Date(),
        userId: auth.currentUser.uid
    };
    
    // Add to Firestore
    db.collection('tasks').add(newTask)
        .then(() => {
            taskInput.value = '';
            taskDueDate.value = '';
        })
        .catch(error => {
            console.error('Error adding task:', error);
            alert('Failed to add task');
        });
});

// Filter tasks
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Update active filter
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        
        // Refresh task list
        getTasks();
    });
});

// Get tasks from Firestore
function getTasks() {
    let query = db.collection('tasks')
        .where('userId', '==', auth.currentUser.uid)
        .orderBy('createdAt', 'desc');
    
    // Apply filter if not 'all'
    if (currentFilter !== 'all') {
        query = query.where('category', '==', currentFilter);
    }
    
    query.onSnapshot(snapshot => {
        taskList.innerHTML = '';
        
        snapshot.forEach(doc => {
            const task = doc.data();
            task.id = doc.id;
            
            // Format due date
            let dueDateFormatted = '';
            if (task.dueDate) {
                dueDateFormatted = new Date(task.dueDate.seconds * 1000).toLocaleDateString();
            }
            
            // Create task item
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.innerHTML = `
                <div class="task-info">
                    <div class="task-title">${task.text}</div>
                    <div class="task-meta">
                        <span class="task-category ${task.category}">${task.category}</span>
                        ${dueDateFormatted ? `<span>Due: ${dueDateFormatted}</span>` : ''}
                        <span>Priority: ${task.priority}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn complete" data-id="${task.id}">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="task-btn edit" data-id="${task.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-btn delete" data-id="${task.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            taskList.appendChild(taskItem);
        });
        
        // Add event listeners to task buttons
        document.querySelectorAll('.task-btn.complete').forEach(btn => {
            btn.addEventListener('click', completeTask);
        });
        
        document.querySelectorAll('.task-btn.edit').forEach(btn => {
            btn.addEventListener('click', editTask);
        });
        
        document.querySelectorAll('.task-btn.delete').forEach(btn => {
            btn.addEventListener('click', deleteTask);
        });
    });
}

// Complete task
function completeTask(e) {
    const taskId = e.currentTarget.dataset.id;
    
    // Update task in Firestore
    db.collection('tasks').doc(taskId).update({
        completed: true,
        completedAt: new Date()
    })
    .then(() => {
        // Add XP points
        addXp(10);
    })
    .catch(error => {
        console.error('Error completing task:', error);
        alert('Failed to complete task');
    });
}

// Edit task
function editTask(e) {
    const taskId = e.currentTarget.dataset.id;
    // Implement edit functionality
    console.log('Edit task:', taskId);
}

// Delete task
function deleteTask(e) {
    const taskId = e.currentTarget.dataset.id;
    
    if (confirm('Are you sure you want to delete this task?')) {
        db.collection('tasks').doc(taskId).delete()
            .catch(error => {
                console.error('Error deleting task:', error);
                alert('Failed to delete task');
            });
    }
}

// Initialize tasks when user is logged in
auth.onAuthStateChanged(user => {
    if (user) {
        getTasks();
    }
});