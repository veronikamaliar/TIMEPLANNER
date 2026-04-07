<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/common/Button.vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const authStore = useAuthStore()
const router = useRouter()

const isLoggedIn = computed(() => authStore.isAuthenticated)

const showChangePassword = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const changePasswordError = ref('')
const changePasswordSuccess = ref('')
const isChangingPassword = ref(false)

const showForgotPassword = ref(false)
const forgotEmail = ref('')
const forgotError = ref('')
const forgotSuccess = ref('')
const isSendingReset = ref(false)

const logout = () => {
  authStore.logout()
  router.push('/login')
}

const editProfile = () => {
  router.push('/dashboard/account/edit')
}

const handleChangePassword = async () => {
  changePasswordError.value = ''
  changePasswordSuccess.value = ''

  if (!oldPassword.value || !newPassword.value) {
    changePasswordError.value = 'Будь ласка, заповніть усі поля'
    return
  }
  if (newPassword.value.length < 8) {
    changePasswordError.value = 'Новий пароль має містити мінімум 8 символів'
    return
  }

  isChangingPassword.value = true
  try {
    const { data } = await api.put('/auth/change-password', {
      oldPassword: oldPassword.value,
      newPassword: newPassword.value
    })
    changePasswordSuccess.value = data.message
    oldPassword.value = ''
    newPassword.value = ''
  } catch (e: any) {
    changePasswordError.value = e.response?.data?.error || 'Помилка сервера'
  } finally {
    isChangingPassword.value = false
  }
}

const handleForgotPassword = async () => {
  forgotError.value = ''
  forgotSuccess.value = ''

  if (!forgotEmail.value) {
    forgotError.value = 'Введіть email'
    return
  }

  isSendingReset.value = true
  try {
    const { data } = await api.post('/auth/forgot-password', {
      email: forgotEmail.value
    })
    forgotSuccess.value = data.message
    forgotEmail.value = ''
  } catch (e: any) {
    forgotError.value = e.response?.data?.error || 'Помилка сервера'
  } finally {
    isSendingReset.value = false
  }
}

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6 text-center">Мій акаунт</h1>

    <div v-if="isLoggedIn" class="bg-white rounded-2xl p-6 space-y-4 shadow-2xl">

      <div class="flex flex-col items-center space-y-3">
        <div v-if="authStore.user?.avatar" class="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
          <img
  :src="`${apiBaseUrl}/${authStore.user.avatar}`"
  class="w-full h-full object-cover"
/>
        </div>
        <div v-else class="w-20 h-20 rounded-full bg-gray-400 flex items-center justify-center text-2xl font-bold text-white">
          {{ authStore.user?.name?.charAt(0) || 'U' }}
        </div>

        <div class="text-center">
          <h2 class="text-xl font-semibold">{{ authStore.user?.name }}</h2>
          <p class="text-gray-500">{{ authStore.user?.email }}</p>
          <p v-if="authStore.user?.birthDate" class="text-gray-400 text-sm mt-1">
            {{ new Date(authStore.user.birthDate).toLocaleDateString('uk-UA') }}
          </p>
        </div>
      </div>

      
      <div class="flex justify-center flex-wrap gap-3 mt-4">
        <Button variant="primary" @click="editProfile">Редагувати профіль</Button>
        <Button variant="secondary" @click="showChangePassword = !showChangePassword">
          Змінити пароль
        </Button>
        <Button variant="danger" @click="logout">Вийти</Button>
      </div>

      <transition name="fade">
        <div v-if="showChangePassword" class="mt-4 border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
          <h3 class="font-semibold text-gray-700">Зміна паролю</h3>

          <div>
            <label class="block text-sm text-gray-600 mb-1">Поточний пароль</label>
            <input
              v-model="oldPassword"
              type="password"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Введіть поточний пароль"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-600 mb-1">Новий пароль</label>
            <input
              v-model="newPassword"
              type="password"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Мінімум 8 символів"
            />
          </div>

          <p v-if="changePasswordError" class="text-red-500 text-sm">{{ changePasswordError }}</p>
          <p v-if="changePasswordSuccess" class="text-green-600 text-sm">{{ changePasswordSuccess }}</p>

          <div class="flex gap-3">
            <Button variant="primary" :disabled="isChangingPassword" @click="handleChangePassword">
              {{ isChangingPassword ? 'Збереження...' : 'Зберегти' }}
            </Button>
            <Button variant="secondary" @click="showChangePassword = false">Скасувати</Button>
          </div>
        </div>
      </transition>
    </div>

    <div v-else class="bg-white shadow rounded-lg p-6 text-center space-y-4">
      <p class="text-gray-500 text-lg">Ви не авторизовані.</p>
      <div class="flex justify-center gap-4 flex-wrap">
        <Button variant="primary" @click="() => router.push('/login')">Увійти</Button>
        <Button variant="secondary" @click="() => router.push('/register')">Зареєструватися</Button>
        <Button variant="secondary" @click="showForgotPassword = !showForgotPassword">
          Забули пароль?
        </Button>
      </div>

      <transition name="fade">
        <div v-if="showForgotPassword" class="mt-4 border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50 text-left">
          <h3 class="font-semibold text-gray-700">Відновлення паролю</h3>
          <p class="text-sm text-gray-500">Введіть ваш email — ми надішлемо посилання для скидання паролю.</p>

          <div>
            <label class="block text-sm text-gray-600 mb-1">Email</label>
            <input
              v-model="forgotEmail"
              type="email"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="your@email.com"
            />
          </div>

          <p v-if="forgotError" class="text-red-500 text-sm">{{ forgotError }}</p>
          <p v-if="forgotSuccess" class="text-green-600 text-sm">{{ forgotSuccess }}</p>

          <div class="flex gap-3">
            <Button variant="primary" :disabled="isSendingReset" @click="handleForgotPassword">
              {{ isSendingReset ? 'Надсилання...' : 'Надіслати' }}
            </Button>
            <Button variant="secondary" @click="showForgotPassword = false">Скасувати</Button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>