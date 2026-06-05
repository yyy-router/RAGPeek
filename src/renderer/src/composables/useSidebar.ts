import { ref } from 'vue'

const collapsed = ref(false)

export function useSidebar() {
  function toggle(): void {
    collapsed.value = !collapsed.value
  }
  return { collapsed, toggle }
}
