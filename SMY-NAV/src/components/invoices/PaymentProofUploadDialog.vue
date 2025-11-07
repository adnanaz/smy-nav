<template>
  <v-dialog 
    v-model="dialog" 
    max-width="600px"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5 d-flex align-center">
        <v-icon class="me-3">mdi-upload</v-icon>
        Upload Bukti Pembayaran
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <!-- Invoice Info -->
        <v-alert
          type="info"
          variant="tonal"
          class="mb-4"
        >
          <div class="font-weight-medium">{{ invoice?.invoiceNumber }}</div>
          <div class="text-caption">Total: {{ formatCurrency(invoice?.totalAmount || 0) }}</div>
        </v-alert>

        <!-- Upload Form -->
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <v-file-input
            v-model="paymentProofFile"
            label="Pilih file bukti pembayaran"
            prepend-icon="mdi-paperclip"
            accept="image/*,application/pdf"
            :rules="fileRules"
            variant="outlined"
            show-size
            @change="onFileChange"
          >
            <template #selection="{ fileNames }">
              <template v-for="fileName in fileNames" :key="fileName">
                <v-chip
                  size="small"
                  label
                  color="primary"
                  class="me-2"
                >
                  {{ fileName }}
                </v-chip>
              </template>
            </template>
          </v-file-input>

          <!-- File Preview -->
          <v-card v-if="filePreview" class="mt-4" variant="outlined">
            <v-card-title class="text-subtitle-1">Preview</v-card-title>
            <v-card-text>
              <div v-if="isImageFile" class="text-center">
                <v-img
                  :src="filePreview"
                  max-height="300"
                  max-width="400"
                  class="mx-auto"
                  contain
                />
              </div>
              <div v-else-if="isPDFFile" class="text-center py-4">
                <v-icon size="64" color="red">mdi-file-pdf-box</v-icon>
                <div class="text-subtitle-2 mt-2">File PDF: {{ paymentProofFile?.[0]?.name }}</div>
                <div class="text-caption text-grey-darken-1">
                  Size: {{ formatFileSize(paymentProofFile?.[0]?.size || 0) }}
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Upload Guidelines -->
          <v-alert
            type="warning"
            variant="tonal"
            class="mt-4"
          >
            <div class="text-subtitle-2 mb-2">Persyaratan File:</div>
            <ul class="text-caption">
              <li>Format: JPG, PNG, atau PDF</li>
              <li>Ukuran maksimal: 5MB</li>
              <li>Pastikan bukti pembayaran jelas dan mudah dibaca</li>
              <li>Cantumkan nomor invoice pada bukti transfer</li>
            </ul>
          </v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          @click="close"
          :disabled="uploading"
        >
          Batal
        </v-btn>
        <v-btn
          color="primary"
          @click="handleSubmit"
          :loading="uploading"
          :disabled="!valid || !paymentProofFile?.length"
        >
          <v-icon class="me-2">mdi-upload</v-icon>
          Upload
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useInvoiceStore } from '@/stores/invoice'

const invoiceStore = useInvoiceStore()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  invoice: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['update:modelValue', 'uploaded'])

// Reactive data
const form = ref(null)
const valid = ref(false)
const uploading = ref(false)
const paymentProofFile = ref([])
const filePreview = ref(null)

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isImageFile = computed(() => {
  return paymentProofFile.value?.[0]?.type?.startsWith('image/')
})

const isPDFFile = computed(() => {
  return paymentProofFile.value?.[0]?.type === 'application/pdf'
})

// Validation rules
const fileRules = [
  (value) => {
    if (!value || !value.length) return 'File bukti pembayaran harus dipilih'
    return true
  },
  (value) => {
    if (!value || !value.length) return true
    const file = value[0]
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) return 'Ukuran file maksimal 5MB'
    return true
  },
  (value) => {
    if (!value || !value.length) return true
    const file = value[0]
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return 'Format file harus JPG, PNG, atau PDF'
    }
    return true
  }
]

// Methods
const onFileChange = () => {
  if (paymentProofFile.value && paymentProofFile.value.length > 0) {
    const file = paymentProofFile.value[0]
    
    if (file.type.startsWith('image/')) {
      // Create preview for image files
      const reader = new FileReader()
      reader.onload = (e) => {
        filePreview.value = e.target.result
      }
      reader.readAsDataURL(file)
    } else {
      // For PDF files, just show file info
      filePreview.value = 'pdf'
    }
  } else {
    filePreview.value = null
  }
}

const handleSubmit = async () => {
  if (!valid.value || !paymentProofFile.value?.length || !props.invoice) {
    return
  }

  uploading.value = true

  try {
    await invoiceStore.uploadPaymentProof(props.invoice.id, paymentProofFile.value[0])
    
    emit('uploaded')
    close()
  } catch (error) {
    console.error('Upload payment proof error:', error)
    // Error handling is done in the store
  } finally {
    uploading.value = false
  }
}

const close = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  paymentProofFile.value = []
  filePreview.value = null
  valid.value = false
  if (form.value) {
    form.value.resetValidation()
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount)
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Watch for dialog changes to reset form
watch(dialog, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>