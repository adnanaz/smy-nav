<template>
  <DashboardLayout page-title="Admin Invoice Management">
    <v-container fluid>
      <!-- Header -->
      <v-row class="mb-4">
        <v-col>
          <div class="d-flex justify-space-between align-center">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">
                Admin Invoice Management
                <v-chip 
                  color="purple" 
                  variant="tonal" 
                  size="small" 
                  class="ml-3"
                >
                  Admin Panel
                </v-chip>
              </h1>
              <p class="text-subtitle-1 text-grey-darken-1">
                Kelola dan verifikasi pembayaran invoice dari semua agency
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
          <v-card class="pa-4" color="orange-lighten-5">
            <div class="d-flex align-center">
              <v-icon color="orange-darken-2" size="40" class="me-3">mdi-clock-outline</v-icon>
              <div>
                <div class="text-h6 font-weight-bold">{{ invoiceSummary.pendingApproval || 0 }}</div>
                <div class="text-caption text-orange-darken-2">Menunggu Persetujuan</div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4" color="green-lighten-5">
            <div class="d-flex align-center">
              <v-icon color="green" size="40" class="me-3">mdi-check-circle</v-icon>
              <div>
                <div class="text-h6 font-weight-bold">{{ invoiceSummary.approved || 0 }}</div>
                <div class="text-caption text-green-darken-2">Disetujui</div>
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
                <div class="text-caption text-purple-darken-2">Total Nilai</div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Filters -->
      <v-card class="mb-4" elevation="2">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="2">
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
            <v-col cols="12" md="2">
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
            <v-col cols="12" md="2">
              <v-autocomplete
                v-model="filterAgency"
                :items="agencyOptions"
                label="Agency"
                variant="outlined"
                density="compact"
                clearable
                item-title="text"
                item-value="value"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-select
                v-model="pagination.limit"
                :items="limitOptions"
                label="Show"
                variant="outlined"
                density="compact"
                item-title="text"
                item-value="value"
                @update:model-value="handleLimitChange"
              />
            </v-col>
            <v-col cols="12" md="2" class="d-flex align-center">
              <v-btn
                color="primary"
                variant="flat"
                @click="applyFilters"
                block
              >
                Filter
              </v-btn>
            </v-col>
            <v-col cols="12" md="2" class="d-flex align-center">
              <v-btn
                color="secondary"
                variant="outlined"
                @click="clearFilters"
                block
              >
                Clear
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Tabs for different views -->
      <v-tabs v-model="activeTab" class="mb-4">
        <v-tab value="verification">
          <v-icon class="me-2">mdi-file-search-outline</v-icon>
          Menunggu Verifikasi ({{ invoiceSummary.pendingVerification || 0 }})
        </v-tab>
        <v-tab value="pending">
          <v-icon class="me-2">mdi-clock-outline</v-icon>
          Menunggu Persetujuan ({{ invoiceSummary.pendingApproval || 0 }})
        </v-tab>
        <v-tab value="all">
          <v-icon class="me-2">mdi-file-document-multiple</v-icon>
          Semua Invoice
        </v-tab>
        <v-tab value="approved">
          <v-icon class="me-2">mdi-check-circle</v-icon>
          Disetujui
        </v-tab>
        <v-tab value="rejected">
          <v-icon class="me-2">mdi-close-circle</v-icon>
          Ditolak
        </v-tab>
      </v-tabs>

      <!-- Invoice Table -->
      <v-card elevation="2">
        <v-data-table
          :headers="headers"
          :items="filteredInvoices"
          :loading="loading"
          :items-per-page="pagination.limit"
          :page="pagination.page"
          :server-items-length="pagination.total"
          @update:page="handlePageChange"
          class="elevation-0"
        >
          <!-- Invoice Number -->
          <template #item.invoiceNumber="{ item }">
            <div class="font-weight-medium">{{ item.invoiceNumber }}</div>
          </template>

          <!-- Agency -->
          <template #item.agency="{ item }">
            <div class="d-flex align-center">
              <v-icon size="16" class="me-2">mdi-domain</v-icon>
              <div>
                <div class="font-weight-medium">{{ item.agency?.name }}</div>
                <div class="text-caption text-grey-darken-1">{{ item.agency?.code }}</div>
              </div>
            </div>
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
              {{ item.participantCount }}
            </div>
          </template>

          <!-- Total Amount -->
          <template #item.totalAmount="{ item }">
            <div class="font-weight-bold">{{ formatCurrency(item.totalAmount) }}</div>
          </template>

          <!-- Payment Option -->
          <template #item.paymentOption="{ item }">
            <div class="d-flex align-center">
              <v-chip
                :color="item.paymentOption === 'pay_now' ? 'success' : 'orange'"
                variant="tonal"
                size="small"
              >
                <v-icon 
                  start 
                  size="14"
                  :icon="item.paymentOption === 'pay_now' ? 'mdi-cash' : 'mdi-clock-outline'"
                />
                {{ item.paymentOption === 'pay_now' ? 'Bayar Sekarang' : 'Bayar Nanti' }}
              </v-chip>
            </div>
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
                title="Bukti pembayaran tersedia"
              >
                mdi-check-circle
              </v-icon>
            </div>
          </template>

          <!-- Payment Proof -->
          <template #item.paymentProof="{ item }">
            <div class="d-flex align-center justify-center">
              <v-btn
                v-if="item.paymentProofUrl"
                icon="mdi-file-image"
                variant="tonal"
                size="small"
                color="blue"
                @click="viewPaymentProof(item)"
                title="Lihat Bukti Transfer"
              />
              <v-chip
                v-else
                size="x-small"
                color="grey"
                variant="tonal"
              >
                <v-icon start size="12">mdi-minus</v-icon>
                Tidak Ada
              </v-chip>
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
                v-if="item.paymentProofUrl"
                icon="mdi-image"
                variant="text"
                size="small"
                color="blue"
                @click="viewPaymentProof(item)"
                title="Lihat Bukti Pembayaran"
              />
              
              <v-btn
                v-if="canApprove(item)"
                icon="mdi-check"
                variant="text"
                size="small"
                color="success"
                @click="approvePayment(item)"
                title="Setujui Pembayaran"
              />
              
              <v-btn
                v-if="canReject(item)"
                icon="mdi-close"
                variant="text"
                size="small"
                color="error"
                @click="rejectPayment(item)"
                title="Tolak Pembayaran"
              />
            </div>
          </template>

          <!-- No data -->
          <template #no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-file-document-outline</v-icon>
              <div class="text-h6 text-grey-darken-1 mb-2">Tidak ada invoice</div>
              <div class="text-body-2 text-grey-darken-1">Invoice akan muncul setelah agency mengajukan peserta</div>
            </div>
          </template>
        </v-data-table>

        <!-- Pagination -->
        <v-pagination
          v-if="pagination.pages > 1"
          v-model="pagination.page"
          :length="pagination.pages"
          @update:model-value="handlePageChange"
          class="pa-4"
        />
      </v-card>
    </v-container>

    <!-- Invoice Detail Dialog -->
    <AdminInvoiceDetailDialog
      v-model="detailDialog"
      :invoice="selectedInvoice"
      @payment-updated="handlePaymentUpdated"
    />

    <!-- Payment Proof Viewer Dialog -->
    <PaymentProofViewerDialog
      v-model="viewProofDialog"
      :invoice="selectedInvoice"
    />

    <!-- Approve Payment Dialog -->
    <ApprovePaymentDialog
      v-model="approveDialog"
      :invoice="selectedInvoice"
      @approved="handlePaymentUpdated"
    />

    <!-- Reject Payment Dialog -->
    <RejectPaymentDialog
      v-model="rejectDialog"
      :invoice="selectedInvoice"
      @rejected="handlePaymentUpdated"
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
import { ref, onMounted, computed, watch } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import AdminInvoiceDetailDialog from '@/components/invoices/AdminInvoiceDetailDialog.vue'
import PaymentProofViewerDialog from '@/components/invoices/PaymentProofViewerDialog.vue'
import ApprovePaymentDialog from '@/components/invoices/ApprovePaymentDialog.vue'
import RejectPaymentDialog from '@/components/invoices/RejectPaymentDialog.vue'
import { useInvoiceStore } from '@/stores/invoice'
import { useAuthStore } from '@/stores/auth-simple'
import { format, isAfter } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const invoiceStore = useInvoiceStore()
const authStore = useAuthStore()

// Reactive data
const loading = ref(false)
const activeTab = ref('verification')
const detailDialog = ref(false)
const viewProofDialog = ref(false)
const approveDialog = ref(false)
const rejectDialog = ref(false)
const selectedInvoice = ref(null)

// Filters
const filterPaymentStatus = ref('')
const filterTrainingType = ref('')
const filterAgency = ref('')

// Pagination
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Computed
const invoices = computed(() => invoiceStore.invoices)
const invoiceSummary = computed(() => invoiceStore.summary)

const filteredInvoices = computed(() => {
  let filtered = invoices.value

  if (activeTab.value === 'verification') {
    filtered = filtered.filter(inv => inv.paymentStatus === 'pending_verification')
  } else if (activeTab.value === 'pending') {
    filtered = filtered.filter(inv => inv.paymentStatus === 'paid')
  } else if (activeTab.value === 'approved') {
    filtered = filtered.filter(inv => inv.paymentStatus === 'approved')
  } else if (activeTab.value === 'rejected') {
    filtered = filtered.filter(inv => inv.paymentStatus === 'rejected')
  }

  return filtered
})

// Table headers
const headers = [
  {
    title: 'No. Invoice',
    key: 'invoiceNumber',
    sortable: true,
    width: '180px'
  },
  {
    title: 'Agency',
    key: 'agency',
    sortable: true,
    width: '180px'
  },
  {
    title: 'Jenis Pelatihan',
    key: 'trainingType',
    sortable: true,
    width: '160px'
  },
  {
    title: 'Peserta',
    key: 'participantCount',
    sortable: true,
    width: '100px'
  },
  {
    title: 'Total',
    key: 'totalAmount',
    sortable: true,
    width: '120px'
  },
  {
    title: 'Opsi Bayar',
    key: 'paymentOption',
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
    title: 'Bukti Transfer',
    key: 'paymentProof',
    sortable: false,
    width: '130px'
  },
  {
    title: 'Jatuh Tempo',
    key: 'dueDate',
    sortable: true,
    width: '120px'
  },
  {
    title: 'Dibuat',
    key: 'createdAt',
    sortable: true,
    width: '120px'
  },
  {
    title: 'Aksi',
    key: 'actions',
    sortable: false,
    width: '160px',
    align: 'center'
  }
]

// Filter options
const paymentStatusOptions = [
  { value: 'pending', text: 'Belum Dibayar' },
  { value: 'pending_verification', text: 'Menunggu Verifikasi' },
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

const agencyOptions = computed(() => {
  const agencies = new Set()
  invoices.value.forEach(invoice => {
    if (invoice.agency) {
      agencies.add(JSON.stringify({
        value: invoice.agency.id,
        text: `${invoice.agency.name} (${invoice.agency.code})`
      }))
    }
  })
  return Array.from(agencies).map(agencyStr => JSON.parse(agencyStr))
})

const limitOptions = [
  { value: 10, text: '10' },
  { value: 20, text: '20' },
  { value: 50, text: '50' },
  { value: 100, text: '100' }
]

// Methods
const fetchInvoices = async () => {
  loading.value = true
  try {
    const filters = {}
    if (filterPaymentStatus.value) filters.paymentStatus = filterPaymentStatus.value
    if (filterTrainingType.value) filters.trainingType = filterTrainingType.value
    if (filterAgency.value) filters.agencyId = filterAgency.value

    await invoiceStore.fetchAllInvoices(filters, pagination.value.page, pagination.value.limit)
    
    // Update pagination from response
    if (invoiceStore.summary.totalPages) {
      pagination.value.pages = invoiceStore.summary.totalPages
      pagination.value.total = invoiceStore.summary.totalInvoices
    }
  } catch (error) {
    showSnackbar('Gagal memuat data invoice', 'error')
  } finally {
    loading.value = false
  }
}

const refreshInvoices = () => {
  fetchInvoices()
}

const applyFilters = () => {
  pagination.value.page = 1
  fetchInvoices()
}

const clearFilters = () => {
  filterPaymentStatus.value = ''
  filterTrainingType.value = ''
  filterAgency.value = ''
  pagination.value.page = 1
  fetchInvoices()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  fetchInvoices()
}

const handleLimitChange = () => {
  pagination.value.page = 1
  fetchInvoices()
}

const viewInvoiceDetail = (invoice) => {
  selectedInvoice.value = invoice
  detailDialog.value = true
}

const viewPaymentProof = (invoice) => {
  selectedInvoice.value = invoice
  viewProofDialog.value = true
}

const approvePayment = (invoice) => {
  selectedInvoice.value = invoice
  approveDialog.value = true
}

const rejectPayment = (invoice) => {
  selectedInvoice.value = invoice
  rejectDialog.value = true
}

const handlePaymentUpdated = () => {
  showSnackbar('Status pembayaran berhasil diupdate', 'success')
  fetchInvoices()
}

const canApprove = (invoice) => {
  return invoice.paymentStatus === 'paid' && invoice.paymentProofUrl
}

const canReject = (invoice) => {
  return invoice.paymentStatus === 'paid' && invoice.paymentProofUrl
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

const getPaymentStatusColor = (paymentStatus) => {
  const colors = {
    pending: 'orange',
    pending_verification: 'amber',
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
    pending_verification: 'Menunggu Verifikasi',
    paid: 'Menunggu Konfirmasi',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    refunded: 'Dikembalikan'
  }
  return texts[paymentStatus] || paymentStatus
}

// Watch for tab changes
watch(activeTab, () => {
  // Auto-filter based on active tab
  if (activeTab.value === 'verification') {
    filterPaymentStatus.value = 'pending_verification'
  } else if (activeTab.value === 'pending') {
    filterPaymentStatus.value = 'paid'
  } else if (activeTab.value === 'approved') {
    filterPaymentStatus.value = 'approved'
  } else if (activeTab.value === 'rejected') {
    filterPaymentStatus.value = 'rejected'
  } else {
    filterPaymentStatus.value = ''
  }
  applyFilters()
})

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