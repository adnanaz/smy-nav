<template>
  <DashboardLayout page-title="Invoice Management">
    <v-container fluid>
      <!-- Header -->
      <v-row class="mb-4">
        <v-col>
          <div class="d-flex justify-space-between align-center">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">
                Manajemen Invoice
                <v-chip 
                  color="blue" 
                  variant="tonal" 
                  size="small" 
                  class="ml-3"
                >
                  {{ authStore.userAgency?.name || 'Agency' }}
                </v-chip>
              </h1>
              <p class="text-subtitle-1 text-grey-darken-1">
                Kelola tagihan dan pembayaran pelatihan agency Anda
              </p>
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              @click="refreshInvoices"
              :loading="loading"
            >
              Refresh
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Summary Cards -->
      <v-row class="mb-4">
        <v-col cols="12" md="3">
          <v-card class="pa-4" color="blue-lighten-5">
            <div class="d-flex align-center">
              <v-icon color="blue" size="40" class="me-3">mdi-file-document-multiple</v-icon>
              <div>
                <div class="text-h6 font-weight-bold">{{ invoiceSummary.totalInvoices || 0 }}</div>
                <div class="text-caption text-blue-darken-2">Total Invoice</div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4" color="amber-lighten-5">
            <div class="d-flex align-center">
              <v-icon color="amber-darken-2" size="40" class="me-3">mdi-clock-outline</v-icon>
              <div>
                <div class="text-h6 font-weight-bold">{{ invoiceSummary.pendingInvoices || 0 }}</div>
                <div class="text-caption text-amber-darken-2">Menunggu Pembayaran</div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4" color="green-lighten-5">
            <div class="d-flex align-center">
              <v-icon color="green" size="40" class="me-3">mdi-check-circle</v-icon>
              <div>
                <div class="text-h6 font-weight-bold">{{ invoiceSummary.paidInvoices || 0 }}</div>
                <div class="text-caption text-green-darken-2">Sudah Dibayar</div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4" color="purple-lighten-5">
            <div class="d-flex align-center">
              <v-icon color="purple" size="40" class="me-3">mdi-currency-usd</v-icon>
              <div>
                <div class="text-h6 font-weight-bold">{{ formatCurrency(invoiceSummary.totalAmount || 0) }}</div>
                <div class="text-caption text-purple-darken-2">Total Tagihan</div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Filters -->
      <v-card class="mb-4" elevation="2">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="3">
              <v-select
                v-model="filterStatus"
                :items="statusOptions"
                label="Status Invoice"
                variant="outlined"
                density="compact"
                clearable
                item-title="text"
                item-value="value"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="filterPaymentStatus"
                :items="paymentStatusOptions"
                label="Status Pembayaran"
                variant="outlined"
                density="compact"
                clearable
                item-title="text"
                item-value="value"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="filterTrainingType"
                :items="trainingTypeOptions"
                label="Jenis Pelatihan"
                variant="outlined"
                density="compact"
                clearable
                item-title="text"
                item-value="value"
              />
            </v-col>
            <v-col cols="12" md="3" class="d-flex align-center">
              <v-btn
                color="primary"
                variant="flat"
                @click="applyFilters"
                block
              >
                Filter
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Invoice Table -->
      <v-card elevation="2">
        <v-data-table
          :headers="headers"
          :items="invoices"
          :loading="loading"
          class="elevation-0"
        >
          <!-- Invoice Number -->
          <template #item.invoiceNumber="{ item }">
            <div class="font-weight-medium">{{ item.invoiceNumber }}</div>
          </template>

          <!-- Training Type -->
          <template #item.trainingType="{ item }">
            <v-chip
              :color="getTrainingChipColor(item.trainingType)"
              variant="tonal"
              size="small"
            >
              {{ getTrainingTypeName(item.trainingType) }}
            </v-chip>
          </template>

          <!-- Participants Count -->
          <template #item.participantCount="{ item }">
            <div class="d-flex align-center">
              <v-icon size="16" class="me-1">mdi-account-group</v-icon>
              {{ item.participantCount }} peserta
            </div>
          </template>

          <!-- Total Amount -->
          <template #item.totalAmount="{ item }">
            <div class="font-weight-bold">{{ formatCurrency(item.totalAmount) }}</div>
          </template>

          <!-- Status -->
          <template #item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              variant="tonal"
              size="small"
            >
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>

          <!-- Payment Status -->
          <template #item.paymentStatus="{ item }">
            <div class="d-flex align-center">
              <v-chip
                :color="getPaymentStatusColor(item.paymentStatus)"
                variant="tonal"
                size="small"
              >
                {{ getPaymentStatusText(item.paymentStatus) }}
              </v-chip>
              <v-icon 
                v-if="item.paymentProofUrl" 
                color="success" 
                size="16" 
                class="ml-2"
                title="Bukti pembayaran telah diupload"
              >
                mdi-check-circle
              </v-icon>
            </div>
          </template>

          <!-- Due Date -->
          <template #item.dueDate="{ item }">
            <div class="text-caption">
              {{ formatDate(item.dueDate) }}
              <v-chip 
                v-if="isOverdue(item.dueDate) && item.paymentStatus === 'pending'"
                color="error"
                variant="tonal"
                size="x-small"
                class="ml-1"
              >
                Overdue
              </v-chip>
            </div>
          </template>

          <!-- Created Date -->
          <template #item.createdAt="{ item }">
            <div class="text-caption">
              {{ formatDate(item.createdAt) }}
            </div>
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <div class="d-flex justify-center">
              <v-btn
                icon="mdi-eye"
                variant="text"
                size="small"
                @click="viewInvoiceDetail(item)"
                title="Lihat Detail"
              />
              
              <v-btn
                v-if="canUploadPaymentProof(item)"
                icon="mdi-upload"
                variant="text"
                size="small"
                color="primary"
                @click="uploadPaymentProof(item)"
                title="Upload Bukti Pembayaran"
              />
              
              <v-btn
                v-if="item.paymentProofUrl"
                icon="mdi-image"
                variant="text"
                size="small"
                color="success"
                @click="viewPaymentProof(item)"
                title="Lihat Bukti Pembayaran"
              />
              
              <v-btn
                icon="mdi-download"
                variant="text"
                size="small"
                color="purple"
                @click="downloadInvoice(item)"
                title="Download Invoice"
              />
            </div>
          </template>

          <!-- No data -->
          <template #no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-file-document-outline</v-icon>
              <div class="text-h6 text-grey-darken-1 mb-2">Tidak ada invoice</div>
              <div class="text-body-2 text-grey-darken-1">Invoice akan muncul otomatis setelah Anda mengajukan peserta</div>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-container>

    <!-- Invoice Detail Dialog -->
    <InvoiceDetailDialog
      v-model="detailDialog"
      :invoice="selectedInvoice"
    />

    <!-- Payment Proof Upload Dialog -->
    <PaymentProofUploadDialog
      v-model="uploadDialog"
      :invoice="selectedInvoice"
      @uploaded="handlePaymentProofUploaded"
    />

    <!-- Payment Proof Viewer Dialog -->
    <PaymentProofViewerDialog
      v-model="viewProofDialog"
      :invoice="selectedInvoice"
    />

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import InvoiceDetailDialog from '@/components/invoices/InvoiceDetailDialog.vue'
import PaymentProofUploadDialog from '@/components/invoices/PaymentProofUploadDialog.vue'
import PaymentProofViewerDialog from '@/components/invoices/PaymentProofViewerDialog.vue'
import { useInvoiceStore } from '@/stores/invoice'
import { useAuthStore } from '@/stores/auth-simple'
import { format, isAfter } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { generateInvoicePDF, generateReceiptPDF } from '@/utils/pdfGenerator'

const invoiceStore = useInvoiceStore()
const authStore = useAuthStore()

// Reactive data
const loading = ref(false)
const detailDialog = ref(false)
const uploadDialog = ref(false)
const viewProofDialog = ref(false)
const selectedInvoice = ref(null)

// Filters
const filterStatus = ref('')
const filterPaymentStatus = ref('')
const filterTrainingType = ref('')

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Computed
const invoices = computed(() => invoiceStore.invoices)
const invoiceSummary = computed(() => invoiceStore.summary)

// Table headers
const headers = [
  {
    title: 'No. Invoice',
    key: 'invoiceNumber',
    sortable: true,
    width: '200px'
  },
  {
    title: 'Jenis Pelatihan',
    key: 'trainingType',
    sortable: true,
    width: '180px'
  },
  {
    title: 'Jumlah Peserta',
    key: 'participantCount',
    sortable: true,
    width: '140px'
  },
  {
    title: 'Total Tagihan',
    key: 'totalAmount',
    sortable: true,
    width: '140px'
  },
  {
    title: 'Status',
    key: 'status',
    sortable: true,
    width: '120px'
  },
  {
    title: 'Status Pembayaran',
    key: 'paymentStatus',
    sortable: true,
    width: '160px'
  },
  {
    title: 'Jatuh Tempo',
    key: 'dueDate',
    sortable: true,
    width: '140px'
  },
  {
    title: 'Tanggal Dibuat',
    key: 'createdAt',
    sortable: true,
    width: '140px'
  },
  {
    title: 'Aksi',
    key: 'actions',
    sortable: false,
    width: '200px',
    align: 'center'
  }
]

// Filter options
const statusOptions = [
  { value: 'pending', text: 'Pending' },
  { value: 'active', text: 'Active' },
  { value: 'completed', text: 'Completed' },
  { value: 'cancelled', text: 'Cancelled' }
]

const paymentStatusOptions = [
  { value: 'pending', text: 'Belum Dibayar' },
  { value: 'paid', text: 'Menunggu Konfirmasi' },
  { value: 'approved', text: 'Disetujui' },
  { value: 'rejected', text: 'Ditolak' },
  { value: 'refunded', text: 'Dikembalikan' }
]

const trainingTypeOptions = [
  { value: 'BST', text: 'BST (Basic Safety Training)' },
  { value: 'SAT', text: 'SAT (Security Awareness Training)' },
  { value: 'CCM_CMHBT', text: 'CCM CMHBT' },
  { value: 'CCM_CMT', text: 'CCM CMT' },
  { value: 'SDSD', text: 'SDSD (Ship Security Duties)' },
  { value: 'PSCRB', text: 'PSCRB' },
  { value: 'SB', text: 'SB (Seaman Book)' },
  { value: 'UPDATING_BST', text: 'Updating BST' }
]

// Methods
const fetchInvoices = async () => {
  loading.value = true
  try {
    const filters = {}
    if (filterStatus.value) filters.status = filterStatus.value
    if (filterPaymentStatus.value) filters.paymentStatus = filterPaymentStatus.value
    if (filterTrainingType.value) filters.trainingType = filterTrainingType.value

    await invoiceStore.fetchInvoices(filters)
  } catch (error) {
    showSnackbar('Gagal memuat data invoice', 'error')
  } finally {
    loading.value = false
  }
}

const refreshInvoices = () => {
  // Clear filters and refresh
  filterStatus.value = ''
  filterPaymentStatus.value = ''
  filterTrainingType.value = ''
  fetchInvoices()
}

const applyFilters = () => {
  fetchInvoices()
}

const viewInvoiceDetail = (invoice) => {
  selectedInvoice.value = invoice
  detailDialog.value = true
}

const uploadPaymentProof = (invoice) => {
  selectedInvoice.value = invoice
  uploadDialog.value = true
}

const viewPaymentProof = (invoice) => {
  selectedInvoice.value = invoice
  viewProofDialog.value = true
}

const downloadInvoice = (invoice) => {
  const doc = generateInvoicePDF(invoice)
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`)
}

const handlePaymentProofUploaded = () => {
  showSnackbar('Bukti pembayaran berhasil diupload', 'success')
  fetchInvoices()
}

const canUploadPaymentProof = (invoice) => {
  return invoice.paymentStatus === 'pending'
}

const isOverdue = (dueDate) => {
  return isAfter(new Date(), new Date(dueDate))
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
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
  return format(new Date(date), 'dd MMM yyyy', { locale: idLocale })
}

const getTrainingTypeName = (type) => {
  const option = trainingTypeOptions.find(opt => opt.value === type)
  return option ? option.text : type
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

const getPaymentStatusColor = (paymentStatus) => {
  const colors = {
    pending: 'orange',
    paid: 'blue',
    approved: 'success',
    rejected: 'error',
    refunded: 'purple'
  }
  return colors[paymentStatus] || 'grey'
}

const getPaymentStatusText = (paymentStatus) => {
  const texts = {
    pending: 'Belum Dibayar',
    paid: 'Menunggu Konfirmasi',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    refunded: 'Dikembalikan'
  }
  return texts[paymentStatus] || paymentStatus
}

// Lifecycle
onMounted(() => {
  fetchInvoices()
})
</script>

<style scoped>
.v-data-table >>> .v-data-table__td {
  padding: 12px 16px !important;
}

.v-data-table >>> .v-data-table-header__content {
  font-weight: 600 !important;
}
</style>