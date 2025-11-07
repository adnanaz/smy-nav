<template>
  <v-dialog 
    v-model="dialog" 
    max-width="600px"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5 d-flex align-center">
        <v-icon class="me-3" color="error">mdi-close-circle</v-icon>
        Tolak Pembayaran
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <!-- Invoice Info -->
        <v-alert
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          <div class="font-weight-medium">{{ invoice?.invoiceNumber }}</div>
          <div class="text-caption">{{ invoice?.agency?.name }} - {{ formatCurrency(invoice?.totalAmount || 0) }}</div>
        </v-alert>

        <!-- Payment Proof Preview -->
        <v-card v-if="invoice?.paymentProofUrl" variant="outlined" class="mb-4">
          <v-card-title class="text-subtitle-1">
            <v-icon class="me-2">mdi-image</v-icon>
            Bukti Pembayaran
          </v-card-title>
          <v-card-text>
            <div class="text-center">
              <div v-if="isImageProof(invoice.paymentProofUrl)">
                <v-img
                  :src="invoice.paymentProofUrl"
                  max-height="200"
                  class="mx-auto rounded"
                  contain
                  @click="viewFullImage"
                  style="cursor: pointer;"
                />
                <v-btn
                  variant="text"
                  size="small"
                  class="mt-2"
                  @click="viewFullImage"
                >
                  <v-icon class="me-2">mdi-magnify-plus</v-icon>
                  Lihat Ukuran Penuh
                </v-btn>
              </div>
              <div v-else class="py-4">
                <v-icon size="48" color="red">mdi-file-pdf-box</v-icon>
                <div class="text-subtitle-2 mt-2">File PDF</div>
                <v-btn
                  variant="outlined"
                  size="small"
                  class="mt-2"
                  @click="openPDF"
                >
                  <v-icon class="me-2">mdi-open-in-new</v-icon>
                  Buka PDF
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Rejection Form -->
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <v-textarea
            v-model="rejectionReason"
            label="Alasan Penolakan *"
            placeholder="Jelaskan alasan mengapa pembayaran ditolak..."
            variant="outlined"
            rows="4"
            :rules="reasonRules"
            required
          />

          <!-- Common rejection reasons -->
          <div class="mb-4">
            <div class="text-subtitle-2 mb-2">Alasan Umum:</div>
            <v-chip-group column>
              <v-chip
                v-for="reason in commonReasons"
                :key="reason"
                variant="outlined"
                size="small"
                @click="selectReason(reason)"
              >
                {{ reason }}
              </v-chip>
            </v-chip-group>
          </div>

          <!-- Warning -->
          <v-alert
            type="error"
            variant="tonal"
            class="mt-4"
          >
            <div class="font-weight-medium">Konfirmasi Penolakan</div>
            <div class="text-caption">
              Dengan menolak pembayaran ini:
            </div>
            <ul class="text-caption mt-2">
              <li>Agency akan mendapat notifikasi penolakan</li>
              <li>Agency dapat mengupload ulang bukti pembayaran</li>
              <li>Status invoice akan kembali ke "Ditolak"</li>
            </ul>
          </v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          @click="close"
          :disabled="rejecting"
        >
          Batal
        </v-btn>
        <v-btn
          color="error"
          @click="handleSubmit"
          :loading="rejecting"
          :disabled="!valid"
        >
          <v-icon class="me-2">mdi-close</v-icon>
          Tolak Pembayaran
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Full Image Viewer -->
    <v-dialog 
      v-model="fullImageDialog" 
      fullscreen
      transition="dialog-bottom-transition"
    >
      <v-card>
        <v-toolbar color="black">
          <v-btn icon @click="fullImageDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>{{ invoice?.invoiceNumber }} - Bukti Pembayaran</v-toolbar-title>
        </v-toolbar>
        <v-card-text class="pa-0 d-flex align-center justify-center" style="height: calc(100vh - 64px);">
          <v-img
            v-if="invoice?.paymentProofUrl"
            :src="invoice.paymentProofUrl"
            max-height="100%"
            max-width="100%"
            contain
          />
        </v-card-text>
      </v-card>
    </v-dialog>
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

const emit = defineEmits(['update:modelValue', 'rejected'])

// Reactive data
const form = ref(null)
const valid = ref(false)
const rejecting = ref(false)
const rejectionReason = ref('')
const fullImageDialog = ref(false)

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Common rejection reasons
const commonReasons = [
  'Bukti pembayaran tidak jelas',
  'Jumlah pembayaran tidak sesuai',
  'Nomor invoice tidak tercantum',
  'Format file tidak sesuai',
  'Bukti pembayaran sudah expired',
  'Data pembayar tidak sesuai',
  'Rekening tujuan salah'
]

// Validation rules
const reasonRules = [
  (value) => {
    if (!value || value.trim() === '') return 'Alasan penolakan harus diisi'
    return true
  },
  (value) => {
    if (value && value.length < 10) return 'Alasan penolakan minimal 10 karakter'
    return true
  },
  (value) => {
    if (value && value.length > 500) return 'Alasan penolakan maksimal 500 karakter'
    return true
  }
]

// Methods
const selectReason = (reason) => {
  if (rejectionReason.value) {
    rejectionReason.value += '. ' + reason
  } else {
    rejectionReason.value = reason
  }
}

const handleSubmit = async () => {
  if (!valid.value || !props.invoice) {
    return
  }

  rejecting.value = true

  try {
    await invoiceStore.updatePaymentStatus(
      props.invoice.id, 
      'reject', 
      rejectionReason.value
    )
    
    emit('rejected')
    close()
  } catch (error) {
    console.error('Reject payment error:', error)
    // Error handling is done in the store
  } finally {
    rejecting.value = false
  }
}

const close = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  rejectionReason.value = ''
  valid.value = false
  if (form.value) {
    form.value.resetValidation()
  }
}

const isImageProof = (url) => {
  if (!url) return false
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  return imageExtensions.some(ext => url.toLowerCase().includes(ext))
}

const viewFullImage = () => {
  fullImageDialog.value = true
}

const openPDF = () => {
  if (props.invoice?.paymentProofUrl) {
    window.open(props.invoice.paymentProofUrl, '_blank')
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount)
}

// Watch for dialog changes to reset form
watch(dialog, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>