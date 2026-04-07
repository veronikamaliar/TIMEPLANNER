<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch, ref } from 'vue'
import { useCategoriesStore } from '@/stores/categoriesStore'
import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'
import { useRouter } from 'vue-router'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import socketService from '@/services/socket.service'


const categoriesStore = useCategoriesStore()
const router = useRouter()

const searchQuery = ref('')

onMounted(() => {
  categoriesStore.fetchCategories()
})

watch(searchQuery, value => {
  categoriesStore.setSearchQuery(value)
})

const displayedCategories = computed(() => categoriesStore.filteredCategories)

const addCategory = () => {
  router.push('/dashboard/categories/create')
}

const editCategory = (id: number) => {
  router.push(`/dashboard/categories/update/${id}`)
}

const deleteCategory = async (id: number) => {
  if (confirm('Ви впевнені, що хочете видалити категорію?')) {
    await categoriesStore.deleteCategory(id)
  }
}

const onCreated = (task: any) => {
  categoriesStore.createCategory(task)
}

const onUpdated = (task: any) => {
  categoriesStore.updateCategory(task.id, task)
}

const onDeleted = (id: number) => {
  categoriesStore.deleteCategory(id)
}

onMounted(() => {
  socketService.on('category:created', onCreated)
  socketService.on('category:updated', onUpdated)
  socketService.on('category:deleted', onDeleted)
})

onUnmounted(() => {
  socketService.off('category:created', onCreated)
  socketService.off('category:updated', onUpdated)
  socketService.off('category:deleted', onDeleted)
})
</script>

<template>
  <ErrorMessage :message="categoriesStore.error ?? undefined" />
  
  <div class="max-w-full">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Категорії</h1>
      <Button variant="primary" @click="addCategory">
        Додати категорію
      </Button>
    </div>

    <Input
      v-model="searchQuery"
      type="text"
      placeholder="Пошук категорії..."
      class="mb-4 max-w-sm"
    />

    <div v-if="categoriesStore.loading" class="text-center py-6 text-gray-500">
      Завантаження...
    </div>


    
    <div v-else class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">

            

            <tr>
              <th class="px-4 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">Назва</th>
              <th class="px-4 py-2 text-right font-semibold text-gray-700 whitespace-nowrap">Дії</th>
            </tr>


          </thead>

          <tbody class="divide-y divide-gray-200">
            <tr 
              v-for="cat in displayedCategories" 
              :key="cat.id" 
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-2 whitespace-nowrap">{{ cat.name }}</td>
              <td class="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                <Button class="my-1" size="sm" variant="secondary" @click="editCategory(cat.id)">
                  Редагувати
                </Button>
                <Button size="sm" variant="danger" @click="deleteCategory(cat.id)">
                  Видалити
                </Button>
              </td>
            </tr>

            <tr v-if="displayedCategories.length === 0">
              <td colspan="2" class="px-4 py-6 text-center text-gray-500 font-medium">
                Категорій не знайдено
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>