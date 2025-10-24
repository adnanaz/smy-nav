<template>
  <DashboardLayout page-title="Master Peserta">
    <v-container fluid>
      <!-- Header -->
      <v-row class="mb-4">
        <v-col>
          <div class="d-flex justify-space-between align-center">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">
                Master Peserta
                <v-chip 
                  v-if="authStore.isAgent" 
                  color="blue" 
                  variant="tonal" 
                  size="small" 
                  class="ml-3"
                >
                  {{ authStore.userAgency?.name || 'Agent' }}
                </v-chip>
                <v-chip 
                  v-if="authStore.isAdmin" 
                  color="purple" 
                  variant="tonal" 
                  size="small" 
                  class="ml-3"
                >
                  Admin
                </v-chip>
              </h1>
              <p class="text-subtitle-1 text-grey-darken-1">
                <template v-if="authStore.isAgent">
                  Kelola data peserta agency Anda
                </template>
                <template v-else>
                  Verifikasi dan kelola semua data peserta
                </template>
              </p>
            </div>
            <v-btn
              v-if="authStore.isAgent"
              color="primary"
              prepend-icon="mdi-plus"
              size="large"
              @click="goToCreatePage"
            >
              Tambah Peserta
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Filters & Search -->
      <v-card class="mb-4" elevation="2">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Cari peserta..."
                variant="outlined"
                density="compact"
                clearable
                @keyup.enter="fetchParticipants"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-autocomplete
                v-model="filterTrainingProgram"
                :items="trainingProgramOptions"
                label="Jenis Diklat"
                variant="outlined"
                density="compact"
                clearable
                item-title="text"
                item-value="value"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="filterStatus"
                :items="statusOptions"
                label="Status"
                variant="outlined"
                density="compact"
                clearable
                item-title="text"
                item-value="value"
              />
            </v-col>
            <v-col cols="12" md="2" class="d-flex align-center">
              <v-btn
                color="primary"
                variant="flat"
                @click="fetchParticipants"
                block
              >
                Filter
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Data Table -->
      <v-card elevation="2">
        <v-data-table
          :headers="headers"
          :items="participants"
          :loading="loading"
          :items-per-page="pagination.limit"
          :page="pagination.page"
          :server-items-length="pagination.total"
          @update:page="handlePageChange"
          @update:items-per-page="handleLimitChange"
          class="elevation-0"
        >
          <!-- Registration Number -->
          <template #item.registrationNumber="{ item }">
            <div class="font-weight-medium">{{ item.registrationNumber }}</div>
          </template>

          <!-- Full Name -->
          <template #item.fullName="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="32" class="me-3" color="primary">
                <span class="text-white">{{ getInitials(item.fullName) }}</span>
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ item.fullName }}</div>
                <div class="text-caption text-grey-darken-1">{{ item.nik }}</div>
              </div>
            </div>
          </template>

          <!-- Training Program -->
          <template #item.trainingProgram="{ item }">
            <v-chip
              :color="getTrainingChipColor(item.trainingProgram)"
              variant="tonal"
              size="small"
            >
              {{ getTrainingProgramName(item.trainingProgram) }}
            </v-chip>
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

          <!-- Progress -->
          <template #item.progressPercentage="{ item }">
            <div class="d-flex align-center">
              <v-progress-linear
                :model-value="item.progressPercentage"
                :color="getProgressColor(item.progressPercentage)"
                height="6"
                rounded
                class="me-2"
                style="min-width: 60px;"
              />
              <span class="text-caption">{{ Math.round(item.progressPercentage) }}%</span>
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
                @click="viewParticipant(item)"
              />
              
              <!-- Agent actions - only for draft status -->
              <template v-if="authStore.isAgent">
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  @click="editParticipant(item)"
                  :disabled="item.status !== 'draft'"
                  title="Edit Data"
                />
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click="deleteParticipant(item)"
                  :disabled="item.status !== 'draft'"
                  title="Hapus Data"
                />
                <v-btn
                  v-if="item.status === 'draft'"
                  icon="mdi-send"
                  variant="text"
                  size="small"
                  color="primary"
                  @click="submitParticipant(item)"
                  title="Ajukan Data"
                />
              </template>

              <!-- Admin actions - for verification process -->
              <template v-if="authStore.isAdmin">
                <v-btn
                  v-if="item.status === 'submitted'"
                  icon="mdi-check-circle"
                  variant="text"
                  size="small"
                  color="success"
                  @click="verifyParticipant(item)"
                  title="Verifikasi Dokumen"
                />
                <v-btn
                  v-if="item.status === 'submitted'"
                  icon="mdi-close-circle"
                  variant="text"
                  size="small"
                  color="error"
                  @click="rejectParticipant(item)"
                  title="Tolak Dokumen"
                />
              </template>
            </div>
          </template>

          <!-- No data -->
          <template #no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-account-group-outline</v-icon>
              <div class="text-h6 text-grey-darken-1 mb-2">Tidak ada data peserta</div>
              <div class="text-body-2 text-grey-darken-1">Klik tombol "Tambah Peserta" untuk memulai</div>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-container>

    <!-- View Detail Dialog -->
    <ParticipantDetailDialog
      v-model="detailDialog"
      :participant="selectedParticipant"
      @next="handleNextParticipant"
    />

    <!-- Edit Dialog -->
    <ParticipantEditDialog
      v-model="editDialog"
      :participant="selectedParticipant"
      @updated="handleParticipantUpdated"
    />

    <!-- Submit Confirmation Dialog -->
    <v-dialog v-model="submitDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Konfirmasi Ajukan Data</v-card-title>
        <v-card-text>
          Apakah Anda yakin ingin mengajukan data peserta <strong>{{ selectedParticipant?.fullName }}</strong>?
          <br><br>
          <v-alert type="info" variant="tonal" class="mt-3">
            Setelah diajukan, data akan masuk ke data SMY dan tidak dapat diubah atau dihapus.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="submitDialog = false">Batal</v-btn>
          <v-btn
            color="primary"
            @click="confirmSubmit"
            :loading="submitLoading"
          >
            Ajukan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Konfirmasi Hapus</v-card-title>
        <v-card-text>
          Apakah Anda yakin ingin menghapus peserta <strong>{{ selectedParticipant?.fullName }}</strong>?
          <br><br>
          <v-alert type="warning" variant="tonal" class="mt-3">
            Tindakan ini tidak dapat dibatalkan.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Batal</v-btn>
          <v-btn
            color="error"
            @click="confirmDelete"
            :loading="deleteLoading"
          >
            Hapus
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ParticipantDetailDialog from '@/components/participants/ParticipantDetailDialog.vue'
import ParticipantEditDialog from '@/components/participants/ParticipantEditDialog.vue'
import { useParticipantStore } from '@/stores/participant'
import { useAuthStore } from '@/stores/auth-simple'
import { formatDistanceToNow, format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const router = useRouter()
const participantStore = useParticipantStore()
const authStore = useAuthStore()

// Reactive data
const loading = ref(false)
const detailDialog = ref(false)
const editDialog = ref(false)
const deleteDialog = ref(false)
const deleteLoading = ref(false)
const submitDialog = ref(false)
const submitLoading = ref(false)
const selectedParticipant = ref(null)

// Filters
const search = ref('')
const filterTrainingProgram = ref('')
const filterStatus = ref('')

// Pagination
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Computed
const participants = computed(() => participantStore.participants)
const trainingTypes = computed(() => participantStore.trainingTypes)

// Table headers
const headers = [
  {
    title: 'No. Registrasi',
    key: 'registrationNumber',
    sortable: true,
    width: '150px'
  },
  {
    title: 'Nama Lengkap',
    key: 'fullName',
    sortable: true,
    width: '250px'
  },
  {
    title: 'Jenis Diklat',
    key: 'trainingProgram',
    sortable: true,
    width: '180px'
  },
  {
    title: 'Status',
    key: 'status',
    sortable: true,
    width: '120px'
  },
  {
    title: 'Progress',
    key: 'progressPercentage',
    sortable: true,
    width: '120px'
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
    width: '120px', 
    align: 'center'
  }
]

// Training program options for filter
const trainingProgramOptions = computed(() => {
  if (!trainingTypes.value) return []
  return Object.entries(trainingTypes.value).map(([key, value]) => ({
    value: key,
    text: value.name
  }))
})

// Status options for filter
const statusOptions = computed(() => {
  // Base status options
  const baseOptions = [
    { value: 'draft', text: 'Draft' },
    { value: 'submitted', text: 'Diajukan' },
    { value: 'verified', text: 'Diverifikasi' },
    { value: 'waiting_quota', text: 'Menunggu Kuota' },
    { value: 'sent_to_center', text: 'Dikirim ke Pusat' },
    { value: 'waiting_dispatch', text: 'Menunggu Pengiriman' },
    { value: 'completed', text: 'Selesai' },
    { value: 'rejected', text: 'Ditolak' }
  ]

  // Filter options based on user role
  if (authStore.isAgent) {
    // Agent can see draft and submitted status
    return baseOptions.filter(option => ['draft', 'submitted'].includes(option.value))
  } else if (authStore.isAdmin) {
    // Admin can see all status except draft (draft is only for agents)
    return baseOptions.filter(option => option.value !== 'draft')
  }

  return baseOptions
})

// Methods
const handleNextParticipant = (currentParticipant) => {
  // Logic untuk navigate ke participant berikutnya
  const currentIndex = participants.value.findIndex(p => p.id === currentParticipant.id)
  const nextIndex = (currentIndex + 1) % participants.value.length
  selectedParticipant.value = participants.value[nextIndex]
}

const fetchParticipants = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: search.value,
      trainingProgram: filterTrainingProgram.value,
      status: filterStatus.value
    }

    // Add role-based filtering
    if (authStore.isAdmin) {
      // Admin hanya melihat data yang sudah di-submit (bukan draft)
      if (!params.status) {
        params.status = 'submitted,verified,waiting_quota,sent_to_center,waiting_dispatch,completed,rejected'
      }
    } else if (authStore.isAgent) {
      // Agent hanya melihat data mereka sendiri
      params.agencyOnly = true
    }

    const response = await participantStore.fetchParticipants(params)
    
    if (response.pagination) {
      pagination.value = {
        ...pagination.value,
        ...response.pagination
      }
    }
  } catch (error) {
    showSnackbar('Gagal memuat data peserta', 'error')
  } finally {
    loading.value = false
  }
}

const fetchTrainingTypes = async () => {
  try {
    await participantStore.fetchTrainingTypes()
  } catch (error) {
    console.error('Failed to fetch training types:', error)
  }
}

const openCreateDialog = () => {
  selectedParticipant.value = null
  dialog.value = true
}

const goToCreatePage = () => {
  router.push('/participants/create')
}

const viewParticipant = (participant) => {
  selectedParticipant.value = participant
  detailDialog.value = true
}

const editParticipant = (participant) => {
  selectedParticipant.value = participant
  editDialog.value = true
}

const submitParticipant = (participant) => {
  selectedParticipant.value = participant
  submitDialog.value = true
}

const confirmSubmit = async () => {
  submitLoading.value = true
  try {
    await participantStore.submitParticipant(selectedParticipant.value.id)
    showSnackbar('Data peserta berhasil diajukan', 'success')
    submitDialog.value = false
    await fetchParticipants()
  } catch (error) {
    showSnackbar('Gagal mengajukan data peserta', 'error')
  } finally {
    submitLoading.value = false
  }
}

const deleteParticipant = (participant) => {
  selectedParticipant.value = participant
  deleteDialog.value = true
}

const confirmDelete = async () => {
  deleteLoading.value = true
  try {
    await participantStore.deleteParticipant(selectedParticipant.value.id)
    showSnackbar('Peserta berhasil dihapus', 'success')
    deleteDialog.value = false
    await fetchParticipants()
  } catch (error) {
    showSnackbar('Gagal menghapus peserta', 'error')
  } finally {
    deleteLoading.value = false
  }
}

const verifyParticipant = async (participant) => {
  try {
    // TODO: Implement verify participant API call
    // await participantStore.verifyParticipant(participant.id)
    showSnackbar(`Dokumen ${participant.fullName} berhasil diverifikasi`, 'success')
    await fetchParticipants()
  } catch (error) {
    showSnackbar('Gagal memverifikasi dokumen', 'error')
  }
}

const rejectParticipant = async (participant) => {
  try {
    // TODO: Implement reject participant API call
    // await participantStore.rejectParticipant(participant.id)
    showSnackbar(`Dokumen ${participant.fullName} ditolak`, 'warning')
    await fetchParticipants()
  } catch (error) {
    showSnackbar('Gagal menolak dokumen', 'error')
  }
}

const handleParticipantSaved = () => {
  showSnackbar('Data peserta berhasil disimpan', 'success')
  fetchParticipants()
}

const handleParticipantUpdated = () => {
  showSnackbar('Data peserta berhasil diupdate', 'success')
  fetchParticipants()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  fetchParticipants()
}

const handleLimitChange = (limit) => {
  pagination.value.limit = limit
  pagination.value.page = 1
  fetchParticipants()
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

// Utility methods
const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getTrainingProgramName = (program) => {
  return trainingTypes.value?.[program]?.name || program
}

const getTrainingChipColor = (program) => {
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
  return colors[program] || 'grey'
}

const getStatusColor = (status) => {
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

const getStatusText = (status) => {
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

const getProgressColor = (percentage) => {
  if (percentage >= 75) return 'success'
  if (percentage >= 50) return 'warning'
  if (percentage >= 25) return 'info'
  return 'error'
}

const formatDate = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'dd MMM yyyy', { locale: idLocale })
}

// Lifecycle
onMounted(() => {
  fetchParticipants()
  fetchTrainingTypes()
})
</script>

<style scoped>
.participant-view {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.v-data-table >>> .v-data-table__td {
  padding: 12px 16px !important;
}

.v-data-table >>> .v-data-table-header__content {
  font-weight: 600 !important;
}
</style>