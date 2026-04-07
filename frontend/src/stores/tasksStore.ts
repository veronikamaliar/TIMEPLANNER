import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task } from '@/types/task'
import api from '@/services/api'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')

  const fetchTasks = async () => {
  try {
    loading.value = true
    error.value = null

    const token = localStorage.getItem('token')
    const { data } = await api.get('/tasks', {
      headers: { Authorization: `Bearer ${token}` },
    })

    tasks.value = data.data
  } catch (err) {
    error.value = 'Не вдалося завантажити завдання'
  } finally {
    loading.value = false
  }
}

  const fetchTaskById = async (id: number) => {
  try {
    const res = await api.get(`/tasks/${id}`)
    return res.data
  } catch (err) {
    console.error('Fetch task by id error:', err)
    return null
  }
}

const createTask = async (taskData: FormData | Omit<Task, 'id'>) => {
  try {
    loading.value = true
    error.value = null

    const res = await api.post('/tasks', taskData)

    const newTask = res.data.task || res.data
    tasks.value.unshift(newTask)

    return newTask
  } catch (err: any) {
    console.error('Create task error:', err)
    console.log('Деталі помилки 400:', err.response?.data)
    
    error.value = err.response?.data?.error || err.response?.data?.message || 'Помилка створення задачі'
    throw err
  } finally {
    loading.value = false
  }
}

  const updateTask = async (id: number, payload: Partial<Task>) => {
  try {
    const res = await api.put(`/tasks/${id}`, payload)
    
    const updatedData = res.data.task || res.data 

    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value[index] = { 
        ...tasks.value[index], 
        ...updatedData 
      }
    }
    return tasks.value[index]
  } catch (err: any) {
    console.error('Update task error:', err)
    throw err
  }
}

  const deleteTask = async (id: number) => {
    try {
      await api.delete(`/tasks/${id}`)
      tasks.value = tasks.value.filter(t => t.id !== id)
    } catch (err: any) {
      console.error('Delete task error:', err)
      throw err
    }
  }

  const filteredTasks = computed(() => {
    if (!searchQuery.value) return tasks.value

    return tasks.value.filter(t =>
      t.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })

  return {
    tasks,
    filteredTasks,
    loading,
    error,
    searchQuery,
    fetchTasks,
    fetchTaskById,
    createTask,
    updateTask,
    deleteTask,
  }
})
