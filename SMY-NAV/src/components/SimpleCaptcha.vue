<template>
  <div class="captcha-container">
    <v-card variant="outlined" class="pa-4 mb-3">
      <div class="d-flex align-center justify-space-between">
        <div class="captcha-display">
          <canvas
            ref="captchaCanvas"
            width="200"
            height="60"
            class="captcha-canvas"
            @click="generateCaptcha"
          ></canvas>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          @click="generateCaptcha"
          class="ml-2"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </div>
    </v-card>
    
    <v-text-field
      v-model="userInput"
      label="Masukkan kode captcha"
      variant="outlined"
      prepend-inner-icon="mdi-shield-check"
      :error-messages="errorMessage"
      @input="validateCaptcha"
      placeholder="Ketik kode di atas"
      class="captcha-input"
    ></v-text-field>
    
    <p class="text-caption text-grey text-center mt-2">
      <v-icon size="small" class="me-1">mdi-information-outline</v-icon>
      Klik kode atau tombol refresh untuk generate ulang
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const captchaCanvas = ref(null)
const userInput = ref('')
const captchaCode = ref('')
const errorMessage = ref('')

const emit = defineEmits(['captcha-valid'])

// Generate random captcha code
const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Draw captcha on canvas
const drawCaptcha = (code) => {
  const canvas = captchaCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Background with gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, '#f8f9fa')
  gradient.addColorStop(1, '#e9ecef')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Add some noise lines
  ctx.strokeStyle = '#dee2e6'
  ctx.lineWidth = 1
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
    ctx.stroke()
  }
  
  // Draw captcha text
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  
  // Draw each character with random color and slight rotation
  for (let i = 0; i < code.length; i++) {
    const char = code[i]
    const x = centerX + (i - 2) * 30
    const y = centerY + (Math.random() - 0.5) * 10
    
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((Math.random() - 0.5) * 0.3)
    
    // Random colors
    const colors = ['#1976d2', '#2e7d32', '#d32f2f', '#f57c00', '#7b1fa2']
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
    
    ctx.fillText(char, 0, 0)
    ctx.restore()
  }
  
  // Add some noise dots
  ctx.fillStyle = '#adb5bd'
  for (let i = 0; i < 50; i++) {
    ctx.fillRect(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      2,
      2
    )
  }
}

// Generate new captcha
const generateCaptcha = () => {
  captchaCode.value = generateRandomCode()
  nextTick(() => {
    drawCaptcha(captchaCode.value)
  })
  
  // Clear user input and error
  userInput.value = ''
  errorMessage.value = ''
  emit('captcha-valid', false)
}

// Validate captcha
const validateCaptcha = () => {
  if (!userInput.value) {
    errorMessage.value = ''
    emit('captcha-valid', false)
    return
  }
  
  if (userInput.value.toUpperCase() === captchaCode.value) {
    errorMessage.value = ''
    emit('captcha-valid', true)
  } else {
    errorMessage.value = 'Kode captcha tidak sesuai'
    emit('captcha-valid', false)
  }
}

// Reset captcha (exposed for parent component)
const resetCaptcha = () => {
  generateCaptcha()
}

// Initialize captcha on mount
onMounted(() => {
  generateCaptcha()
})

// Expose methods for parent component
defineExpose({
  resetCaptcha,
  isValid: () => userInput.value.toUpperCase() === captchaCode.value
})
</script>

<style scoped>
.captcha-container {
  width: 100%;
}

.captcha-canvas {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.captcha-canvas:hover {
  border-color: #1976d2;
}

.captcha-display {
  display: flex;
  align-items: center;
}

.captcha-input :deep(.v-field) {
  font-family: monospace;
  font-size: 16px;
  letter-spacing: 2px;
}
</style>