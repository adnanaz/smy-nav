<template>
  <v-dialog 
    v-model="dialog" 
    max-width="600px"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5 d-flex align-center">
        <v-icon class="me-3" color="success">mdi-check-circle</v-icon>
        Setujui Pembayaran
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

        <!-- Approval Form -->
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <v-textarea
            v-model="approvalNotes"
            label="Catatan Persetujuan (Opsional)"
            placeholder="Tambahkan catatan jika diperlukan..."
            variant="outlined"
            rows="3"
            :rules="notesRules"
          />

          <!-- Confirmation -->
          <v-alert
            type="success"
            variant="tonal"
            class="mt-4"
          >
            <div class="font-weight-medium">Konfirmasi Persetujuan</div>
            <div class="text-caption">
              Dengan menyetujui pembayaran ini, Anda mengkonfirmasi bahwa:
            </div>
            <ul class="text-caption mt-2">
              <li>Bukti pembayaran telah diverifikasi</li>
              <li>Jumlah pembayaran sesuai dengan invoice</li>
              <li>Pembayaran valid dan dapat diterima</li>
            </ul>
          </v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          @click="close"
          :disabled="approving"
        >
          Batal
        </v-btn>
        <v-btn
          color="success"
          @click="handleSubmit"
          :loading="approving"
          :disabled="!valid"
        >
          <v-icon class="me-2">mdi-check</v-icon>
          Setujui Pembayaran
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

const emit = defineEmits(['update:modelValue', 'approved'])

// Reactive data
const form = ref(null)
const valid = ref(false)
const approving = ref(false)
const approvalNotes = ref('')
const fullImageDialog = ref(false)

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Validation rules
const notesRules = [
  (value) => {
    if (value && value.length > 500) return 'Catatan maksimal 500 karakter'
    return true
  }
]

// Methods
const handleSubmit = async () => {
  if (!valid.value || !props.invoice) {
    return
  }

  approving.value = true

  try {
    await invoiceStore.updatePaymentStatus(
      props.invoice.id, 
      'approve', 
      approvalNotes.value
    )
    
    emit('approved')
    close()
  } catch (error) {
    console.error('Approve payment error:', error)
    // Error handling is done in the store
  } finally {
    approving.value = false
  }
}

const close = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  approvalNotes.value = ''
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