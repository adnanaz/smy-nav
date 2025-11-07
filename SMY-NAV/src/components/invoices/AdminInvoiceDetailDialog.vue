<template>
  <v-dialog 
    v-model="dialog" 
    max-width="900px"
    scrollable
  >
    <v-card v-if="invoice">
      <v-card-title class="text-h5 d-flex align-center">
        <v-icon class="me-3">mdi-file-document</v-icon>
        Admin - Detail Invoice
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <!-- Invoice Header Info -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">No. Invoice</div>
            <div class="text-h6 font-weight-bold">{{ invoice.invoiceNumber }}</div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Status Pembayaran</div>
            <v-chip
              :color="getPaymentStatusColor(invoice.paymentStatus)"
              variant="tonal"
              size="default"
            >
              {{ getPaymentStatusText(invoice.paymentStatus) }}
            </v-chip>
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Status Invoice</div>
            <v-chip
              :color="getStatusColor(invoice.status)"
              variant="tonal"
              size="default"
            >
              {{ getStatusText(invoice.status) }}
            </v-chip>
          </v-col>
        </v-row>

        <!-- Training & Financial Info -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Jenis Pelatihan</div>
            <v-chip
              :color="getTrainingChipColor(invoice.trainingType)"
              variant="tonal"
              size="default"
            >
              {{ getTrainingTypeName(invoice.trainingType) }}
            </v-chip>
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Jumlah Peserta</div>
            <div class="text-h6">{{ invoice.participantCount }} peserta</div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Total Tagihan</div>
            <div class="text-h5 font-weight-bold text-primary">{{ formatCurrency(invoice.totalAmount) }}</div>
          </v-col>
        </v-row>

        <!-- Dates -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Tanggal Dibuat</div>
            <div class="font-weight-medium">{{ formatDate(invoice.createdAt) }}</div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Jatuh Tempo</div>
            <div class="font-weight-medium">
              {{ formatDate(invoice.dueDate) }}
              <v-chip 
                v-if="isOverdue(invoice.dueDate) && invoice.paymentStatus === 'pending'"
                color="error"
                variant="tonal"
                size="small"
                class="ml-2"
              >
                Overdue
              </v-chip>
            </div>
          </v-col>
          <v-col cols="12" md="4" v-if="invoice.paidAt">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Tanggal Bayar</div>
            <div class="font-weight-medium">{{ formatDate(invoice.paidAt) }}</div>
          </v-col>
        </v-row>

        <!-- Agency Info -->
        <v-card class="mb-4" variant="outlined">
          <v-card-title class="text-subtitle-1">
            <v-icon class="me-2">mdi-domain</v-icon>
            Informasi Agency
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 text-grey-darken-1 mb-1">Nama Agency</div>
                <div class="font-weight-medium">{{ invoice.agency?.name }}</div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 text-grey-darken-1 mb-1">Kode Agency</div>
                <div class="font-weight-medium">{{ invoice.agency?.code }}</div>
              </v-col>
              <v-col cols="12" md="6" v-if="invoice.agency?.email">
                <div class="text-subtitle-2 text-grey-darken-1 mb-1">Email</div>
                <div class="font-weight-medium">{{ invoice.agency?.email }}</div>
              </v-col>
              <v-col cols="12" md="6" v-if="invoice.agency?.phone">
                <div class="text-subtitle-2 text-grey-darken-1 mb-1">Telepon</div>
                <div class="font-weight-medium">{{ invoice.agency?.phone }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Participants List -->
        <v-card class="mb-4" variant="outlined">
          <v-card-title class="text-subtitle-1">
            <v-icon class="me-2">mdi-account-group</v-icon>
            Daftar Peserta ({{ invoice.participants?.length || 0 }})
          </v-card-title>
          <v-card-text>
            <v-data-table
              v-if="invoice.participants?.length"
              :headers="participantHeaders"
              :items="invoice.participants"
              :items-per-page="5"
              density="compact"
            >
              <template #item.fullName="{ item }">
                <div class="font-weight-medium">{{ item.fullName }}</div>
              </template>
              <template #item.registrationNumber="{ item }">
                <div class="text-caption">{{ item.registrationNumber }}</div>
              </template>
              <template #item.status="{ item }">
                <v-chip
                  :color="getParticipantStatusColor(item.status)"
                  variant="tonal"
                  size="small"
                >
                  {{ getParticipantStatusText(item.status) }}
                </v-chip>
              </template>
              <template #item.createdAt="{ item }">
                <div class="text-caption">{{ formatDate(item.createdAt) }}</div>
              </template>
            </v-data-table>
            <div v-else class="text-center py-4 text-grey-darken-1">
              Tidak ada data peserta
            </div>
          </v-card-text>
        </v-card>

        <!-- Payment Proof Section -->
        <v-card v-if="invoice.paymentProofUrl" class="mb-4" variant="outlined">
          <v-card-title class="text-subtitle-1">
            <v-icon class="me-2">mdi-credit-card</v-icon>
            Bukti Pembayaran
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="8">
                <div class="text-center">
                  <div v-if="isImageProof(invoice.paymentProofUrl)">
                    <v-img
                      :src="invoice.paymentProofUrl"
                      max-height="300"
                      class="mx-auto rounded"
                      contain
                      @click="viewFullImage"
                      style="cursor: pointer;"
                    />
                  </div>
                  <div v-else class="py-4">
                    <v-icon size="64" color="red">mdi-file-pdf-box</v-icon>
                    <div class="text-subtitle-2 mt-2">File PDF</div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="mb-3">
                  <div class="text-subtitle-2 text-grey-darken-1 mb-1">Status</div>
                  <v-chip
                    :color="getPaymentStatusColor(invoice.paymentStatus)"
                    variant="tonal"
                    size="default"
                  >
                    {{ getPaymentStatusText(invoice.paymentStatus) }}
                  </v-chip>
                </div>
                <div class="mb-3">
                  <div class="text-subtitle-2 text-grey-darken-1 mb-1">Upload Date</div>
                  <div class="font-weight-medium">{{ formatDate(invoice.paidAt) }}</div>
                </div>
                <div class="d-flex flex-column gap-2">
                  <v-btn
                    variant="outlined"
                    size="small"
                    @click="viewPaymentProof"
                  >
                    <v-icon class="me-2">mdi-eye</v-icon>
                    Lihat Bukti
                  </v-btn>
                  <v-btn
                    v-if="canApprove"
                    color="success"
                    size="small"
                    @click="approvePayment"
                  >
                    <v-icon class="me-2">mdi-check</v-icon>
                    Setujui
                  </v-btn>
                  <v-btn
                    v-if="canReject"
                    color="error"
                    size="small"
                    @click="rejectPayment"
                  >
                    <v-icon class="me-2">mdi-close</v-icon>
                    Tolak
                  </v-btn>
                </div>
              </v-col>
            </v-row>
            
            <!-- Admin Notes -->
            <div v-if="invoice.adminNotes" class="mt-4">
              <v-divider class="mb-3" />
              <div class="text-subtitle-2 text-grey-darken-1 mb-1">Catatan Admin</div>
              <div class="font-weight-medium">{{ invoice.adminNotes }}</div>
              <div v-if="invoice.approvedBy" class="text-caption text-grey-darken-1 mt-2">
                Oleh: {{ invoice.approvedBy?.name }} - {{ formatDate(invoice.approvedAt || invoice.rejectedAt) }}
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- No Payment Proof -->
        <v-card v-else class="mb-4" variant="outlined">
          <v-card-title class="text-subtitle-1">
            <v-icon class="me-2">mdi-credit-card-off</v-icon>
            Bukti Pembayaran
          </v-card-title>
          <v-card-text>
            <v-alert type="info" variant="tonal">
              Bukti pembayaran belum diupload oleh agency
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Action Buttons for Admin -->
        <v-card v-if="hasPaymentActions" variant="outlined" color="blue-lighten-5">
          <v-card-title class="text-subtitle-1">
            <v-icon class="me-2">mdi-account-check</v-icon>
            Aksi Admin
          </v-card-title>
          <v-card-text>
            <div class="d-flex gap-3">
              <v-btn
                v-if="canApprove"
                color="success"
                @click="approvePayment"
              >
                <v-icon class="me-2">mdi-check-circle</v-icon>
                Setujui Pembayaran
              </v-btn>
              <v-btn
                v-if="canReject"
                color="error"
                @click="rejectPayment"
              >
                <v-icon class="me-2">mdi-close-circle</v-icon>
                Tolak Pembayaran
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
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
          @click="viewPaymentProof"
        >
          <v-icon class="me-2">mdi-image</v-icon>
          Lihat Bukti Bayar
        </v-btn>
        <v-btn
          color="primary"
          @click="downloadInvoice"
        >
          <v-icon class="me-2">mdi-download</v-icon>
          Download Invoice
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
import { ref, computed } from 'vue'
import { format, isAfter } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { generateInvoicePDF, generateReceiptPDF } from '@/utils/pdfGenerator'

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

const emit = defineEmits(['update:modelValue', 'payment-updated'])

// Reactive data
const fullImageDialog = ref(false)

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const canApprove = computed(() => {
  return props.invoice?.paymentStatus === 'paid' && props.invoice?.paymentProofUrl
})

const canReject = computed(() => {
  return props.invoice?.paymentStatus === 'paid' && props.invoice?.paymentProofUrl
})

const hasPaymentActions = computed(() => {
  return canApprove.value || canReject.value
})

// Table headers for participants
const participantHeaders = [
  { title: 'Nama Lengkap', key: 'fullName', sortable: false },
  { title: 'No. Registrasi', key: 'registrationNumber', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Tanggal', key: 'createdAt', sortable: false }
]

// Methods
const close = () => {
  dialog.value = false
}

const viewFullImage = () => {
  fullImageDialog.value = true
}

const viewPaymentProof = () => {
  if (props.invoice?.paymentProofUrl) {
    window.open(props.invoice.paymentProofUrl, '_blank')
  }
}

const downloadInvoice = () => {
  if (props.invoice) {
    const doc = generateInvoicePDF(props.invoice)
    doc.save(`Invoice-${props.invoice.invoiceNumber}.pdf`)
  }
}

const approvePayment = () => {
  emit('payment-updated', { action: 'approve', invoice: props.invoice })
}

const rejectPayment = () => {
  emit('payment-updated', { action: 'reject', invoice: props.invoice })
}

const isImageProof = (url) => {
  if (!url) return false
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  return imageExtensions.some(ext => url.toLowerCase().includes(ext))
}

const isOverdue = (dueDate) => {
  return isAfter(new Date(), new Date(dueDate))
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

const getTrainingTypeName = (type) => {
  const trainingTypes = {
    BST: 'BST (Basic Safety Training)',
    SAT: 'SAT (Security Awareness Training)',
    CCM_CMHBT: 'CCM CMHBT',
    CCM_CMT: 'CCM CMT',
    SDSD: 'SDSD (Ship Security Duties)',
    PSCRB: 'PSCRB',
    SB: 'SB (Seaman Book)',
    UPDATING_BST: 'Updating BST'
  }
  return trainingTypes[type] || type
}

const getTrainingChipColor = (type) => {
  const colors = {
    BST: 'blue',
    SAT: 'green',
    CCM_CMHBT: 'purple',
    CCM_CMT: 'indigo',
    SDSD: 'orange',
    PSCRB: 'cyan',
    SB: 'teal',
    UPDATING_BST: 'amber'
  }
  return colors[type] || 'grey'
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'orange',
    active: 'blue',
    completed: 'success',
    cancelled: 'error'
  }
  return colors[status] || 'grey'
}

const getStatusText = (status) => {
  const texts = {
    pending: 'Pending',
    active: 'Aktif',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  }
  return texts[status] || status
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

const getParticipantStatusColor = (status) => {
  const colors = {
    draft: 'grey',
    submitted: 'blue',
    verified: 'indigo',
    waiting_quota: 'orange',
    sent_to_center: 'purple',
    waiting_dispatch: 'cyan',
    completed: 'success',
    rejected: 'error'
  }
  return colors[status] || 'grey'
}

const getParticipantStatusText = (status) => {
  const texts = {
    draft: 'Draft',
    submitted: 'Diajukan',
    verified: 'Diverifikasi',
    waiting_quota: 'Menunggu Kuota',
    sent_to_center: 'Dikirim ke Pusat',
    waiting_dispatch: 'Menunggu Pengiriman',
    completed: 'Selesai',
    rejected: 'Ditolak'
  }
  return texts[status] || status
}
</script>