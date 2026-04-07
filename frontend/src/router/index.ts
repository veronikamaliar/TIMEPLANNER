import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '@/pages/MainPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import CalendarPage from '@/pages/CalendarPage.vue'
import WeekPage from '@/pages/WeekPage.vue'
import AccountPage from '@/pages/AccountPage.vue'

import LoginPage from '@/pages/LoginPage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'

import Board from '@/pages/Board.vue'
import UsersListPage from '@/pages/UsersListPage.vue'
import TasksListPage from '@/pages/TasksListPage.vue'
import CategoriesListPage from '@/pages/CategoriesListPage.vue'

import NotFoundPage from '@/pages/NotFoundPage.vue'

import TaskCreatePage from '@/pages/TaskCreatePage.vue'
import CategoryCreatePage from '@/pages/CategoryCreatePage.vue'

import TaskUpdatePage from '@/pages/TaskUpdatePage.vue'
import CategoryUpdatePage from '@/pages/CategoryUpdatePage.vue'
import UserUpdatePage from '@/pages/UserUpdatePage.vue'

import EisenhowerMatrix from '@/pages/EisenhowerMatrix.vue'

import DashboardLayout from '@/components/layout/DashboardLayout.vue'

import AccountEdit from '@/pages/AccountEdit.vue'

const routes = [
  { path: '/main', component: MainPage },
  { path: '/calendar', component: CalendarPage },
  { path: '/week', component: WeekPage },
  { path: '/account', component: AccountPage },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  {
  path: '/dashboard',
  component: DashboardPage, 
    redirect: '/dashboard/board',
  children: [
    { path: '/', redirect: '/login' },
    { path: 'board', component: Board },
    { path: 'users', component: UsersListPage },
    { path: 'users/update/:id', component: UserUpdatePage },
    { path: 'tasks', component: TasksListPage },
    { path: 'tasks/create', component: TaskCreatePage },
    { path: 'tasks/update/:id', component: TaskUpdatePage }, 
    { path: 'categories', component: CategoriesListPage },
    { path: 'categories/create', component: CategoryCreatePage },
    { path: 'categories/update/:id', component: CategoryUpdatePage },
    { path: 'calendar', component: CalendarPage },
    { path: 'eisenhowermatrix', component: EisenhowerMatrix},
  { path: 'account', component: AccountPage },
  { path: 'account/edit', component: AccountEdit },
  ],
  meta: { requiresAuth: true }
  },

  { path: '/:pathMatch(.*)*', component: NotFoundPage } 
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _, next) => {
 const token = localStorage.getItem('token')

 if (to.meta.requiresAuth && !token) {
  next('/login')
 return
 }

 next()
})

export default router
