<template>
  <v-dialog 
    v-model="dialog" 
    max-width="800px"
    scrollable
  >
    <v-card v-if="invoice">
      <v-card-title class="text-h5 d-flex align-center">
        <v-icon class="me-3">mdi-file-document</v-icon>
        Detail Invoice
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
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">No. Invoice</div>
            <div class="text-h6 font-weight-bold">{{ invoice.invoiceNumber }}</div>
          </v-col>
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
        </v-row>

        <!-- Training Info -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Jenis Pelatihan</div>
            <v-chip
              :color="getTrainingChipColor(invoice.trainingType)"
              variant="tonal"
              size="default"
            >
              {{ getTrainingTypeName(invoice.trainingType) }}
            </v-chip>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Jumlah Peserta</div>
            <div class="text-h6">{{ invoice.participantCount }} peserta</div>
          </v-col>
        </v-row>

        <!-- Financial Info -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Total Tagihan</div>
            <div class="text-h5 font-weight-bold text-primary">{{ formatCurrency(invoice.totalAmount) }}</div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-subtitle-2 text-grey-darken-1 mb-1">Jatuh Tempo</div>
            <div class="text-h6">
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
            <v-list v-if="invoice.participants?.length">
              <v-list-item
                v-for="(participant, index) in invoice.participants"
                :key="participant.id"
                class="px-0"
              >
                <template #prepend>
                  <v-avatar size="32" color="primary" class="me-3">
                    <span class="text-white">{{ index + 1 }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ participant.fullName }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ participant.registrationNumber }}
                </v-list-item-subtitle>
                <template #append>
                  <v-chip
                    :color="getParticipantStatusColor(participant.status)"
                    variant="tonal"
                    size="small"
                  >
                    {{ getParticipantStatusText(participant.status) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            <div v-else class="text-center py-4 text-grey-darken-1">
              Tidak ada data peserta
            </div>
          </v-card-text>
        </v-card>

        <!-- Payment Info -->
        <v-card v-if="invoice.paymentProofUrl || invoice.paidAt" class="mb-4" variant="outlined">
          <v-card-title class="text-subtitle-1">
            <v-icon class="me-2">mdi-credit-card</v-icon>
            Informasi Pembayaran
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6" v-if="invoice.paidAt">
                <div class="text-subtitle-2 text-grey-darken-1 mb-1">Tanggal Pembayaran</div>
                <div class="font-weight-medium">{{ formatDate(invoice.paidAt) }}</div>
              </v-col>
              <v-col cols="12" md="6" v-if="invoice.paymentProofUrl">
                <div class="text-subtitle-2 text-grey-darken-1 mb-1">Bukti Pembayaran</div>
                <v-btn
                  variant="outlined"
                  size="small"
                  @click="viewPaymentProof"
                >
                  <v-icon class="me-2">mdi-image</v-icon>
                  Lihat Bukti
                </v-btn>
              </v-col>
              <v-col cols="12" v-if="invoice.approvedBy">
                <div class="text-subtitle-2 text-grey-darken-1 mb-1">Disetujui oleh</div>
                <div class="font-weight-medium">{{ invoice.approvedBy?.name }} ({{ formatDate(invoice.approvedAt) }})</div>
              </v-col>
              <v-col cols="12" v-if="invoice.adminNotes">
                <div class="text-subtitle-2 text-grey-darken-1 mb-1">Catatan Admin</div>
                <div class="font-weight-medium">{{ invoice.adminNotes }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Timeline -->
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">
            <v-icon class="me-2">mdi-timeline</v-icon>
            Timeline
          </v-card-title>
          <v-card-text>
            <v-timeline density="compact" side="end">
              <v-timeline-item
                dot-color="primary"
                size="small"
              >
                <template #opposite>
                  <span class="text-caption">{{ formatDate(invoice.createdAt) }}</span>
                </template>
                <div>
                  <div class="font-weight-medium">Invoice Dibuat</div>
                  <div class="text-caption text-grey-darken-1">Invoice otomatis dibuat setelah peserta diajukan</div>
                </div>
              </v-timeline-item>
              
              <v-timeline-item
                v-if="invoice.paidAt"
                dot-color="blue"
                size="small"
              >
                <template #opposite>
                  <span class="text-caption">{{ formatDate(invoice.paidAt) }}</span>
                </template>
                <div>
                  <div class="font-weight-medium">Bukti Pembayaran Diupload</div>
                  <div class="text-caption text-grey-darken-1">Menunggu verifikasi admin</div>
                </div>
              </v-timeline-item>
              
              <v-timeline-item
                v-if="invoice.approvedAt"
                dot-color="success"
                size="small"
              >
                <template #opposite>
                  <span class="text-caption">{{ formatDate(invoice.approvedAt) }}</span>
                </template>
                <div>
                  <div class="font-weight-medium">Pembayaran Disetujui</div>
                  <div class="text-caption text-grey-darken-1">Oleh: {{ invoice.approvedBy?.name }}</div>
                </div>
              </v-timeline-item>
              
              <v-timeline-item
                v-if="invoice.rejectedAt"
                dot-color="error"
                size="small"
              >
                <template #opposite>
                  <span class="text-caption">{{ formatDate(invoice.rejectedAt) }}</span>
                </template>
                <div>
                  <div class="font-weight-medium">Pembayaran Ditolak</div>
                  <div class="text-caption text-grey-darken-1">{{ invoice.adminNotes || 'Tidak ada catatan' }}</div>
                </div>
              </v-timeline-item>
            </v-timeline>
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
        <v-btn
          v-if="invoice.paymentStatus === 'approved'"
          color="success"
          @click="downloadReceipt"
        >
          <v-icon class="me-2">mdi-receipt</v-icon>
          Download Receipt
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
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

const emit = defineEmits(['update:modelValue'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const close = () => {
  dialog.value = false
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

const downloadReceipt = () => {
  if (props.invoice && props.invoice.paymentStatus === 'approved') {
    const doc = generateReceiptPDF(props.invoice)
    doc.save(`Receipt-${props.invoice.invoiceNumber}.pdf`)
  }
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