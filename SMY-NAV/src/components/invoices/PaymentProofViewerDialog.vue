<template>
  <v-dialog 
    v-model="dialog" 
    max-width="800px"
    scrollable
  >
    <v-card v-if="invoice">
      <v-card-title class="text-h5 d-flex align-center">
        <v-icon class="me-3">mdi-image</v-icon>
        Bukti Pembayaran
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <!-- Invoice Info -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">No. Invoice</div>
            <div class="text-h6 font-weight-bold">{{ invoice.invoiceNumber }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Total Tagihan</div>
            <div class="text-h6 font-weight-bold text-primary">{{ formatCurrency(invoice.totalAmount) }}</div>
          </v-col>
        </v-row>

        <!-- Payment Info -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Status Pembayaran</div>
            <v-chip
              :color="getPaymentStatusColor(invoice.paymentStatus)"
              variant="tonal"
              size="default"
            >
              {{ getPaymentStatusText(invoice.paymentStatus) }}
            </v-chip>
          </v-col>
          <v-col cols="12" md="6" v-if="invoice.paidAt">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Tanggal Upload</div>
            <div class="font-weight-medium">{{ formatDate(invoice.paidAt) }}</div>
          </v-col>
        </v-row>

        <!-- Payment Proof Display -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="text-subtitle-1">
            <v-icon class="me-2">mdi-file-document</v-icon>
            Bukti Pembayaran
          </v-card-title>
          <v-card-text>
            <div v-if="invoice.paymentProofUrl" class="text-center">
              <!-- Check if it's an image or PDF -->
              <div v-if="isImageProof(invoice.paymentProofUrl)">
                <v-img
                  :src="invoice.paymentProofUrl"
                  max-height="500"
                  class="mx-auto rounded"
                  contain
                  @click="openFullscreen"
                  style="cursor: pointer;"
                />
                <v-btn
                  variant="outlined"
                  size="small"
                  class="mt-3"
                  @click="openFullscreen"
                >
                  <v-icon class="me-2">mdi-magnify-plus</v-icon>
                  Lihat Ukuran Penuh
                </v-btn>
              </div>
              <div v-else class="py-8">
                <v-icon size="64" color="red">mdi-file-pdf-box</v-icon>
                <div class="text-h6 mt-3 mb-4">File PDF</div>
                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="openInNewTab"
                >
                  <v-icon class="me-2">mdi-open-in-new</v-icon>
                  Buka PDF
                </v-btn>
              </div>
            </div>
            <div v-else class="text-center py-8 text-grey-darken-1">
              <v-icon size="64" color="grey-lighten-2">mdi-image-off</v-icon>
              <div class="text-subtitle-1 mt-3">Bukti pembayaran tidak tersedia</div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Admin Notes (if any) -->
        <v-card v-if="invoice.adminNotes" variant="outlined" class="mb-4">
          <v-card-title class="text-subtitle-1">
            <v-icon class="me-2">mdi-note-text</v-icon>
            Catatan Admin
          </v-card-title>
          <v-card-text>
            <div class="font-weight-medium">{{ invoice.adminNotes }}</div>
            <div v-if="invoice.approvedBy" class="text-caption text-grey-darken-1 mt-2">
              Oleh: {{ invoice.approvedBy?.name }} - {{ formatDate(invoice.approvedAt || invoice.rejectedAt) }}
            </div>
          </v-card-text>
        </v-card>

        <!-- Action Buttons for Agency -->
        <v-alert
          v-if="invoice.paymentStatus === 'rejected'"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          <div class="font-weight-medium">Bukti Pembayaran Ditolak</div>
          <div class="text-caption">{{ invoice.adminNotes || 'Silakan upload ulang bukti pembayaran yang sesuai.' }}</div>
        </v-alert>

        <v-alert
          v-if="invoice.paymentStatus === 'approved'"
          type="success"
          variant="tonal"
          class="mb-4"
        >
          <div class="font-weight-medium">Pembayaran Telah Disetujui</div>
          <div class="text-caption">Terima kasih, pembayaran Anda telah dikonfirmasi oleh admin.</div>
        </v-alert>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          @click="close"
        >
          Tutup
        </v-btn>
        <v-btn
          v-if="invoice.paymentProofUrl"
          color="primary"
          variant="outlined"
          @click="downloadProof"
        >
          <v-icon class="me-2">mdi-download</v-icon>
          Download
        </v-btn>
        <v-btn
          v-if="canReupload"
          color="orange"
          @click="reupload"
        >
          <v-icon class="me-2">mdi-upload</v-icon>
          Upload Ulang
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Fullscreen Image Viewer -->
    <v-dialog 
      v-model="fullscreenDialog" 
      fullscreen
      transition="dialog-bottom-transition"
    >
      <v-card>
        <v-toolbar color="black">
          <v-btn icon @click="fullscreenDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>{{ invoice?.invoiceNumber }} - Bukti Pembayaran</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="downloadProof">
            <v-icon>mdi-download</v-icon>
          </v-btn>
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
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

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

const emit = defineEmits(['update:modelValue', 'reupload'])

// Reactive data
const fullscreenDialog = ref(false)

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const canReupload = computed(() => {
  return props.invoice?.paymentStatus === 'rejected'
})

// Methods
const close = () => {
  dialog.value = false
}

const isImageProof = (url) => {
  if (!url) return false
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  return imageExtensions.some(ext => url.toLowerCase().includes(ext))
}

const openFullscreen = () => {
  if (props.invoice?.paymentProofUrl && isImageProof(props.invoice.paymentProofUrl)) {
    fullscreenDialog.value = true
  }
}

const openInNewTab = () => {
  if (props.invoice?.paymentProofUrl) {
    window.open(props.invoice.paymentProofUrl, '_blank')
  }
}

const downloadProof = () => {
  if (props.invoice?.paymentProofUrl) {
    const link = document.createElement('a')
    link.href = props.invoice.paymentProofUrl
    link.download = `bukti-pembayaran-${props.invoice.invoiceNumber}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

const reupload = () => {
  emit('reupload')
  close()
}

// Utility methods
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount)
}

const formatDate = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: idLocale })
}

const getPaymentStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    paid: 'blue',
    approved: 'success',
    rejected: 'error',
    refunded: 'purple'
  }
  return colors[status] || 'grey'
}

const getPaymentStatusText = (status) => {
  const texts = {
    pending: 'Belum Dibayar',
    paid: 'Menunggu Konfirmasi',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    refunded: 'Dikembalikan'
  }
  return texts[status] || status
}
</script>

<style scoped>
.v-img {
  border-radius: 8px;
}
</style>