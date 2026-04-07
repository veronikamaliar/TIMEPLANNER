<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, type User } from '@/stores/authStore'
import api from '@/services/api'
import { onMounted } from 'vue'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref<'login' | 'register'>('login')

const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref('')

const regName = ref('')
const regEmail = ref('')
const regBirthDate = ref('')
const regPassword = ref('')
const regError = ref('')

const onLogin = async () => {
  loginError.value = ''
  try {
    const res = await api.post('/auth/login', {
      email: loginEmail.value,
      password: loginPassword.value,
    })
    const user: User = res.data.user
    const token: string = res.data.tokens.accessToken

    authStore.login(user, token)
    localStorage.setItem('token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    router.push('/dashboard/board')
  } catch (err: any) {
    loginError.value = err.response?.data?.message || 'Помилка входу'
  }
}

const onRegister = async () => {
  regError.value = ''
  if (!regName.value || !regEmail.value || !regPassword.value || !regBirthDate.value) {
    regError.value = 'Будь ласка, заповніть всі поля'
    return
  }
  try {
    const res = await api.post('/auth/register', {
      name: regName.value,
      email: regEmail.value,
      birthDate: regBirthDate.value,
      password: regPassword.value,
    })
    const user: User = res.data.user
    const token: string = res.data.tokens.accessToken 

    authStore.login(user, token)
    router.push('/dashboard/board')
  } catch (err: any) {
    regError.value = err.response?.data?.error || err.response?.data?.message || 'Помилка реєстрації'
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.replace('/dashboard/board')
  } else {
    router.replace('/login')
  }
})

const showForgotPassword = ref(false)
const forgotEmail = ref('')
const forgotError = ref('')
const forgotSuccess = ref('')
const isSendingReset = ref(false)

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

</script>

<template>
  <div class="min-h-screen flex bg-white">

    <div class="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 branding-section-bg border-r border-pink-100">
      <div class="text-center">
        <div class="w-24 h-24 bg-white/40 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-md  border border-white/50 p-5">
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round" 
    class="w-full h-full text-pink-900" 
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
</div>

        <h1 class="text-4xl font-bold mb-4 tracking-tight text-pink-950/80">
          TimePlanner
        </h1>
        <p class="text-pink-900/70 text-lg leading-relaxed max-w-xs font-medium">
          Все для продуктивності в одному місці
        </p>

        <div class="mt-12 space-y-4 text-left inline-block">
  <div class="flex items-center gap-3 text-pink-950/70 font-medium">
    <div>
      <img src="/check.svg" class="w-4 h-4" style="filter: brightness(0) saturate(100%) invert(13%) sepia(29%) saturate(4322%) hue-rotate(316deg) brightness(91%) contrast(98%); opacity: 0.7;" />
    </div>
    <span>Керування завданнями</span>
  </div>

  <div class="flex items-center gap-3 text-pink-950/70 font-medium">
    <div >
      <img src="/check.svg" class="w-4 h-4" style="filter: brightness(0) saturate(100%) invert(13%) sepia(29%) saturate(4322%) hue-rotate(316deg) brightness(91%) contrast(98%); opacity: 0.7;" />
    </div>
    <span>Календар і планування тижня</span>
  </div>

  <div class="flex items-center gap-3 text-pink-950/70 font-medium">
    <div>
      <img src="/check.svg" class="w-4 h-4" style="filter: brightness(0) saturate(100%) invert(13%) sepia(29%) saturate(4322%) hue-rotate(316deg) brightness(91%) contrast(98%); opacity: 0.7;" />
    </div>
    <span>Аналітика продуктивності</span>
  </div>
</div>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 form-section-bg">

      <div class="lg:hidden text-center mb-8">
        <div class="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 p-3">
           <img 
            src="/calendar-days.svg" 
            alt="Calendar Icon" 
            class="w-full h-full object-contain opacity-80"
          />
        </div>
        <h1 class="text-2xl font-bold text-pink-600">TimePlanner</h1>
      </div>

      <div class="w-full max-w-md bg-white/50 p-6 sm:p-8 rounded-3xl backdrop-blur-sm shadow-xl shadow-pink-950/5 border border-white/30">

        <div class="flex bg-pink-50 border border-pink-100 rounded-2xl p-1 mb-10">
          <button
            @click="activeTab = 'login'"
            :class="[
              'flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
              activeTab === 'login'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-gray-400 hover:text-pink-400'
            ]"
          >
            Вхід
          </button>
          <button
            @click="activeTab = 'register'"
            :class="[
              'flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
              activeTab === 'register'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-gray-400 hover:text-pink-400'
            ]"
          >
            Реєстрація
          </button>
        </div>

        <Transition name="fade" mode="out-in">
          <div v-if="activeTab === 'login'" key="login" class="space-y-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Вітаємо!</h2>
              <p class="text-gray-500 text-sm mt-1 font-medium">Будь ласка, увійдіть у свій акаунт</p>
            </div>

            <div v-if="loginError" class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {{ loginError }}
            </div>

            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <label class="w-36 text-sm font-medium text-gray-600 flex-shrink-0">Email</label>
                <input
                  v-model="loginEmail"
                  type="email"
                  placeholder="name@example.com"
                  class="w-full border border-gray-200 bg-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition"
                />
              </div>
              <div class="flex items-center gap-3">
                <label class="w-36 text-sm font-medium text-gray-600 flex-shrink-0">Пароль</label>
                <input
                  v-model="loginPassword"
                  type="password"
                  placeholder="••••••••"
                  class="w-full border border-gray-200 bg-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition"
                  @keyup.enter="onLogin"
                />
              </div>
            </div>

            <button
              @click="onLogin"
              class="w-full bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-pink-300/50 mt-2"
            >
              Продовжити
            </button>

            <!-- Забули пароль -->
<div class="text-center">
  <button
    type="button"
    @click="showForgotPassword = !showForgotPassword"
    class="text-sm text-pink-400 hover:text-pink-600 transition-colors"
  >
    Забули пароль?
  </button>
</div>

<!-- Форма відновлення -->
<Transition name="fade">
  <div v-if="showForgotPassword" class="bg-pink-50 border border-pink-100 rounded-2xl p-4 space-y-3">
    <p class="text-sm text-gray-500">Введіть ваш email — ми надішлемо посилання для скидання паролю.</p>

    <input
      v-model="forgotEmail"
      type="email"
      placeholder="your@email.com"
      class="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition"
    />

    <p v-if="forgotError" class="text-red-500 text-sm">{{ forgotError }}</p>
    <p v-if="forgotSuccess" class="text-green-600 text-sm">{{ forgotSuccess }}</p>

    <button
      type="button"
      :disabled="isSendingReset"
      @click="handleForgotPassword"
      class="w-full bg-pink-400 hover:bg-pink-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all duration-200"
    >
      {{ isSendingReset ? 'Надсилання...' : 'Надіслати' }}
    </button>
  </div>
</Transition>

          </div>

          

          <div v-else key="register" class="space-y-5">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Реєстрація</h2>
              <p class="text-gray-500 text-sm mt-1 font-medium">Введіть свої дані щоб зареєструватись</p>
            </div>

            <div v-if="regError" class="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {{ regError }}
            </div>

            <div class="space-y-4">
               <div class="flex items-center gap-3">
                <label class="w-36 text-sm font-medium text-gray-600 flex-shrink-0">Повне ім'я</label>
                <input
                    v-model="regName"
                    placeholder="Ваше ім'я"
                    class="w-full border border-gray-200 bg-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition"
                />
              </div>
               <div class="flex items-center gap-3">
                <label class="w-36 text-sm font-medium text-gray-600 flex-shrink-0">Email адреса</label>
                <input
                    v-model="regEmail"
                    type="email"
                    placeholder="Email адреса"
                    class="w-full border border-gray-200 bg-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition"
                />
              </div>
               <div class="flex items-center gap-3">
                <label class="w-36 text-sm font-medium text-gray-600 flex-shrink-0">Дата народження</label>
                <input
                    v-model="regBirthDate"
                    type="date"
                    class="w-full border border-gray-200 bg-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition text-gray-500"
                />
              </div>
               <div class="flex items-center gap-3">
                <label class="w-36 text-sm font-medium text-gray-600 flex-shrink-0">Створіть пароль</label>
                <input
                    v-model="regPassword"
                    type="password"
                    placeholder="••••••••"
                    class="w-full border border-gray-200 bg-white/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition"
                    @keyup.enter="onRegister"
                />
              </div>
            </div>

            <button
              @click="onRegister"
              class="w-full bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-pink-300/50 mt-2"
            >
              Створити акаунт
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.branding-section-bg {
  background-color: #ffc0cb; 
  background-image: radial-gradient(circle at center, #fffbe0 0%, #ffc0cb 80%);
}

.form-section-bg {
  background-color: #FFFFFF; 
  background-image: radial-gradient(circle at center, #FFFDFE 0%, #FFFFFF 100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>