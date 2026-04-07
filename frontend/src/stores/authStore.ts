import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import socket from '@/services/socket.service'

export interface User {
  id: number
  name: string
  email: string
  role?: 'ADMIN' | 'USER'
  birthDate?: string
  avatar?: string
  createdAt?: string
}

export const useAuthStore = defineStore('auth', () => {
 
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const onlineUsers = ref<number[]>([])
  
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  if (token.value) {
    api.defaults.headers.common.Authorization = `Bearer ${token.value}`
  }

  const storedUser = localStorage.getItem('user')
  if (storedUser) {
  user.value = JSON.parse(storedUser)

  if (user.value) {
    socket.emit('user:online', user.value.id)
  }
}

  socket.on('users:online', (users: number[]) => {
    onlineUsers.value = users
  })

  function login(newUser: User, newToken: string) {
    user.value = newUser
    token.value = newToken

    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))

    api.defaults.headers.common.Authorization = `Bearer ${newToken}`

    socket.emit('user:online', newUser.id)
  }

  function logout() {
    user.value = null
    token.value = null
    onlineUsers.value = []

    localStorage.removeItem('token')
    localStorage.removeItem('user')

    delete api.defaults.headers.common.Authorization
  }

  const isUserOnline = (userId?: number) => {
    if (!userId) return false
    return onlineUsers.value.includes(userId)
  }

  return {
    user,
    token,
    onlineUsers,
    isAuthenticated,
    isAdmin,
    isUserOnline,
    login,
    logout,
  }
})
