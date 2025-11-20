const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TODOS_FILE = path.join(__dirname, 'todos.json');

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to read todos from file
async function readTodos() {
  try {
    const data = await fs.readFile(TODOS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    return [];
  }
}

// Helper function to write todos to file
async function writeTodos(todos) {
  await fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2));
}

// Validation middleware
function validateTodo(req, res, next) {
  const { title, description } = req.body;
  
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ 
      error: 'Title is required and must be a non-empty string' 
    });
  }
  
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ 
      error: 'Description must be a string' 
    });
  }
  
  if (req.body.completed !== undefined && typeof req.body.completed !== 'boolean') {
    return res.status(400).json({ 
      error: 'Completed must be a boolean value' 
    });
  }
  
  next();
}

// Routes

// GET /todos - Get all todos
app.get('/todos', async (req, res) => {
  try {
    const todos = await readTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve todos' });
  }
});

// GET /todos/:id - Get a single todo
app.get('/todos/:id', async (req, res) => {
  try {
    const todos = await readTodos();
    const todo = todos.find(t => t.id === parseInt(req.params.id));
    
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve todo' });
  }
});

// POST /todos - Create a new todo
app.post('/todos', validateTodo, async (req, res) => {
  try {
    const todos = await readTodos();
    const { title, description, completed } = req.body;
    
    const newTodo = {
      id: todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1,
      title: title.trim(),
      description: description ? description.trim() : '',
      completed: completed || false,
      createdAt: new Date().toISOString()
    };
    
    todos.push(newTodo);
    await writeTodos(todos);
    
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PUT /todos/:id - Update a todo
app.put('/todos/:id', validateTodo, async (req, res) => {
  try {
    const todos = await readTodos();
    const todoIndex = todos.findIndex(t => t.id === parseInt(req.params.id));
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const { title, description, completed } = req.body;
    
    todos[todoIndex] = {
      ...todos[todoIndex],
      title: title.trim(),
      description: description ? description.trim() : todos[todoIndex].description,
      completed: completed !== undefined ? completed : todos[todoIndex].completed,
      updatedAt: new Date().toISOString()
    };
    
    await writeTodos(todos);
    
    res.json(todos[todoIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE /todos/:id - Delete a todo
app.delete('/todos/:id', async (req, res) => {
  try {
    const todos = await readTodos();
    const todoIndex = todos.findIndex(t => t.id === parseInt(req.params.id));
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const deletedTodo = todos.splice(todoIndex, 1)[0];
    await writeTodos(todos);
    
    res.json({ message: 'Todo deleted successfully', todo: deletedTodo });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Todo CRUD API is running',
    endpoints: {
      'GET /todos': 'Get all todos',
      'GET /todos/:id': 'Get a single todo',
      'POST /todos': 'Create a new todo',
      'PUT /todos/:id': 'Update a todo',
      'DELETE /todos/:id': 'Delete a todo'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});
