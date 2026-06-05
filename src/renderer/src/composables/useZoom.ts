import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'ragpeek-zoom'
const MIN = 60
const MAX = 200
const STEP = 10

const zoom = ref(Number(localStorage.getItem(STORAGE_KEY)) || 100)

function apply(): void {
  const body = document.querySelector('.app-body')
  if (body) (body as HTMLElement).style.zoom = `${zoom.value}%`
  localStorage.setItem(STORAGE_KEY, String(zoom.value))
}

function zoomIn(): void {
  zoom.value = Math.min(MAX, zoom.value + STEP)
  apply()
}

function zoomOut(): void {
  zoom.value = Math.max(MIN, zoom.value - STEP)
  apply()
}

function zoomReset(): void {
  zoom.value = 100
  apply()
}

function onZoomCommand(key: string): void {
  if (key === '=') zoomIn()
  else if (key === '-') zoomOut()
  else if (key === '0') zoomReset()
}

export function useZoom() {
  onMounted(() => {
    apply()
    window.electron.ipcRenderer.on('zoom-command', (_e, key: string) => onZoomCommand(key))
  })
  return { zoom, zoomIn, zoomOut, zoomReset }
}
