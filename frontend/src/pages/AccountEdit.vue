<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import Button from '@/components/common/Button.vue'
import api from '@/services/api'

const authStore = useAuthStore()
const router = useRouter()

const name = ref(authStore.user?.name || '')
const email = ref(authStore.user?.email || '')
const birthDate = ref(
  authStore.user?.birthDate
    ? new Date(authStore.user.birthDate).toISOString().split('T')[0]
    : ''
)

const avatarFile = ref<File | null>(null)

const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const onAvatarChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

const handleSave = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  if (!name.value.trim()) {
    errorMessage.value = "Ім'я не може бути порожнім"
    return
  }

  isLoading.value = true
  try {
    const formData = new FormData()
    formData.append('name', name.value)
    formData.append('email', email.value)
    
    if (birthDate.value) {
      formData.append('birthDate', new Date(birthDate.value).toISOString())
    }
    
    if (avatarFile.value) {
      formData.append('avatar', avatarFile.value)
    }

    const userId = authStore.user?.id
    if (!userId) throw new Error('Користувача не знайдено')

    const { data } = await api.put(`/users/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (data.user) {
  authStore.login(data.user, authStore.token!)
  localStorage.setItem('user', JSON.stringify(data.user)) 
  avatarPreview.value = getAvatarUrl(data.user.avatar)    
  successMessage.value = 'Профіль успішно оновлено'
  setTimeout(() => router.push('/dashboard/account'), 1500)
}
  } catch (e: any) {
    console.error('Update profile error:', e)
    errorMessage.value = e.response?.data?.error || e.response?.data?.message || 'Помилка сервера'
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  router.push('/dashboard/account')
}

const getAvatarUrl = (path: string | null) => {
  if (!path) return null
  if (path.startsWith('blob:')) return path
  
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  
  return `${baseUrl}/${path}`
}

const avatarPreview = ref<string | null>(
  authStore.user?.avatar ? getAvatarUrl(authStore.user.avatar) : null
)

</script>

<template>
  <div class="max-w-xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6 text-center">Редагувати профіль</h1>

    <div class="bg-white rounded-2xl p-6 shadow-2xl space-y-6">

      <!-- Аватар -->
      <div class="flex flex-col items-center space-y-3">
        <div class="relative">
          <div
            v-if="avatarPreview"
            class="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200"
          >
            <img :src="avatarPreview" class="w-full h-full object-cover" />
          </div>
          <div
            v-else
            class="w-24 h-24 rounded-full bg-gray-400 flex items-center justify-center text-3xl font-bold text-white"
          >
            {{ authStore.user?.name?.charAt(0) || 'U' }}
          </div>

          <!-- Кнопка завантаження -->
          <label
  class="absolute bottom-0 right-0 bg-pink-100 hover:bg-pink-200 text-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer shadow"
  title="Змінити фото"
>
  <img src="/pencil.svg" class="w-4 h-4" />
  <input type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
</label>
        </div>
        <p class="text-xs text-gray-400">Натисніть на іконку щоб змінити фото</p>
      </div>

      <!-- Поля -->
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Ім'я</label>
          <input
            v-model="name"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Введіть ім'я"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Дата народження</label>
          <input
            v-model="birthDate"
            type="date"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <!-- Повідомлення -->
      <p v-if="errorMessage" class="text-red-500 text-sm text-center">{{ errorMessage }}</p>
      <p v-if="successMessage" class="text-green-600 text-sm text-center">{{ successMessage }}</p>

      <!-- Кнопки -->
      <div class="flex justify-center gap-3">
        <Button variant="primary" :disabled="isLoading" @click="handleSave">
          {{ isLoading ? 'Збереження...' : 'Зберегти' }}
        </Button>
        <Button variant="secondary" @click="handleCancel">Скасувати</Button>
      </div>
    </div>
  </div>
</template>