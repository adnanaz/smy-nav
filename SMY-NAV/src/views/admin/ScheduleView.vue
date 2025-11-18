<template>
  <DashboardLayout page-title="Jadwal Pelatihan">
    <v-container fluid>
      <!-- Header -->
      <v-row class="mb-4">
        <v-col>
          <div class="d-flex justify-space-between align-center">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">
                Jadwal Pelatihan
                <v-chip 
                  color="blue" 
                  variant="tonal" 
                  size="small" 
                  class="ml-3"
                >
                  Admin
                </v-chip>
              </h1>
              <p class="text-subtitle-1 text-grey-darken-1">
                Kelola jadwal dan peserta pelatihan
              </p>
            </div>
            <v-btn
              color="primary"
              @click="openCreateDialog"
              prepend-icon="mdi-plus"
              size="large"
            >
              Buat Jadwal Baru
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <!-- Table Header with Filter Indicators -->
            <v-card-title class="d-flex align-center justify-space-between pa-4">
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-calendar-clock</v-icon>
                <span class="text-h6">Daftar Jadwal</span>
                <v-chip
                  v-if="schedules.length > 0"
                  color="primary"
                  variant="tonal"
                  size="small"
                  class="ml-3"
                >
                  {{ schedules.length }} jadwal
                </v-chip>
              </div>
              
              <!-- Active Filters Indicator -->
              <div v-if="hasActiveFilters" class="d-flex align-center gap-2">
                <v-icon color="info" size="small">mdi-filter</v-icon>
                <span class="text-caption text-info">Filter aktif:</span>
                <v-chip
                  v-if="search"
                  color="info"
                  variant="outlined"
                  size="x-small"
                  closable
                  @click:close="clearSearchFilter"
                >
                  "{{ search }}"
                </v-chip>
                <v-chip
                  v-if="filterTrainingProgram"
                  color="info"
                  variant="outlined"
                  size="x-small"
                  closable
                  @click:close="clearTrainingProgramFilter"
                >
                  {{ trainingPrograms.find(opt => opt.value === filterTrainingProgram)?.title }}
                </v-chip>
                <v-chip
                  v-if="filterStatus !== null && filterStatus !== undefined"
                  color="info"
                  variant="outlined"
                  size="x-small"
                  closable
                  @click:close="clearStatusFilter"
                >
                  {{ statusOptions.find(opt => opt.value === filterStatus)?.title }}
                </v-chip>
                <v-chip
                  v-if="filterMode"
                  color="info"
                  variant="outlined"
                  size="x-small"
                  closable
                  @click:close="clearModeFilter"
                >
                  {{ modeOptions.find(opt => opt.value === filterMode)?.title }}
                </v-chip>
              </div>
            </v-card-title>
            
            <v-divider />

          <!-- Filters & Search -->
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="search"
                  prepend-inner-icon="mdi-magnify"
                  label="Cari jadwal..."
                  placeholder="Nama jadwal atau program..."
                  variant="outlined"
                  density="compact"
                  clearable
                  :loading="loading"
                  @keyup.enter="applyFilters"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-autocomplete
                  v-model="filterTrainingProgram"
                  :items="trainingPrograms"
                  label="Program Pelatihan"
                  placeholder="Pilih program..."
                  variant="outlined"
                  density="compact"
                  clearable
                  :loading="loading"
                  item-title="title"
                  item-value="value"
                />
              </v-col>
              <v-col cols="12" md="2">
                <v-select
                  v-model="filterStatus"
                  :items="statusOptions"
                  label="Status"
                  placeholder="Pilih status..."
                  variant="outlined"
                  density="compact"
                  clearable
                  :loading="loading"
                  item-title="title"
                  item-value="value"
                />
              </v-col>
              <v-col cols="12" md="2">
                <v-select
                  v-model="filterMode"
                  :items="modeOptions"
                  label="Mode"
                  placeholder="Pilih mode..."
                  variant="outlined"
                  density="compact"
                  clearable
                  :loading="loading"
                  item-title="title"
                  item-value="value"
                />
              </v-col>
              <v-col cols="12" md="2" class="d-flex align-center" style="gap: 8px;">
                <v-btn
                  color="primary"
                  variant="flat"
                  @click="applyFilters"
                  :loading="loading"
                  size="small"
                >
                  <v-icon start>mdi-filter</v-icon>
                  Filter
                </v-btn>
                <v-btn
                  color="grey"
                  variant="outlined"
                  @click="resetFilters"
                  size="small"
                  :disabled="!hasActiveFilters"
                >
                  <v-icon start>mdi-filter-remove</v-icon>
                  Reset
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>

          <!-- Table Header with Filter Indicators -->
          <v-card-text class="pb-0">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-calendar-clock</v-icon>
                <span class="text-h6">Daftar Jadwal</span>
                <v-chip
                  v-if="schedules.length > 0"
                  color="primary"
                  variant="tonal"
                  size="small"
                  class="ml-3"
                >
                  {{ schedules.length }} jadwal
                </v-chip>
              </div>
              
              <!-- Active Filters Indicator -->
              <div v-if="hasActiveFilters" class="d-flex align-center gap-2">
                <v-icon color="info" size="small">mdi-filter</v-icon>
                <span class="text-caption text-info">Filter aktif:</span>
                <v-chip
                  v-if="search"
                  color="info"
                  variant="outlined"
                  size="x-small"
                  closable
                  @click:close="clearSearchFilter"
                >
                  "{{ search }}"
                </v-chip>
                <v-chip
                  v-if="filterTrainingProgram"
                  color="info"
                  variant="outlined"
                  size="x-small"
                  closable
                  @click:close="clearTrainingProgramFilter"
                >
                  {{ trainingPrograms.find(opt => opt.value === filterTrainingProgram)?.title }}
                </v-chip>
                <v-chip
                  v-if="filterStatus !== null && filterStatus !== ''"
                  color="info"
                  variant="outlined"
                  size="x-small"
                  closable
                  @click:close="clearStatusFilter"
                >
                  {{ statusOptions.find(opt => opt.value === filterStatus)?.title }}
                </v-chip>
                <v-chip
                  v-if="filterMode"
                  color="info"
                  variant="outlined"
                  size="x-small"
                  closable
                  @click:close="clearModeFilter"
                >
                  {{ modeOptions.find(opt => opt.value === filterMode)?.title }}
                </v-chip>
              </div>
            </div>
          </v-card-text>

          <!-- Data Table -->
          <v-data-table
            :headers="headers"
            :items="schedules"
            :loading="loading"
            :items-per-page="itemsPerPage"
            :page="currentPage"
            @update:page="updatePage"
            @update:items-per-page="updateItemsPerPage"
            class="elevation-1"
          >
            <!-- Training Program -->
            <template v-slot:item.trainingProgram="{ item }">
              <v-chip
                :color="getTrainingColor(item.trainingProgram)"
                dark
                small
              >
                {{ item.trainingProgram }}
              </v-chip>
            </template>

            <!-- Start Date -->
            <template v-slot:item.startDate="{ item }">
              <div class="d-flex flex-column">
                <span class="font-weight-medium">{{ formatDate(item.startDate) }}</span>
                <span class="text-caption text-grey">{{ getCountdownText(item.startDate) }}</span>
              </div>
            </template>

            <!-- Duration -->
            <template v-slot:item.duration="{ item }">
              {{ formatDateRange(item.startDate, item.endDate) }}
            </template>

            <!-- Mode -->
            <template v-slot:item.mode="{ item }">
              <v-chip
                :color="getModeColor(item.mode)"
                small
                variant="outlined"
              >
                <v-icon start :icon="getModeIcon(item.mode)" size="small" />
                {{ getModeText(item.mode) }}
              </v-chip>
            </template>

            <!-- Status -->
            <template v-slot:item.isActive="{ item }">
              <v-chip
                :color="item.isActive ? 'success' : 'error'"
                small
              >
                {{ item.isActive ? 'Aktif' : 'Nonaktif' }}
              </v-chip>
            </template>

            <!-- Actions -->
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon="mdi-eye"
                size="small"
                variant="text"
                @click="viewSchedule(item)"
              />
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                @click="editSchedule(item)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="confirmDelete(item)"
              />
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="800px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ editItem ? 'Edit Jadwal' : 'Buat Jadwal Baru' }}</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-row>
              <!-- Training Program -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.trainingProgram"
                  :items="trainingPrograms"
                  label="Program Pelatihan *"
                  :rules="[rules.required]"
                  required
                />
              </v-col>

              <!-- Schedule Name -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.scheduleName"
                  label="Nama Jadwal *"
                  :rules="[rules.required]"
                  placeholder="BST Batch 1 - January 2025"
                  required
                />
              </v-col>

              <!-- Start Date -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.startDate"
                  label="Tanggal Mulai *"
                  type="date"
                  :rules="[rules.required]"
                  required
                />
              </v-col>

              <!-- End Date -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.endDate"
                  label="Tanggal Selesai *"
                  type="date"
                  :rules="[rules.required]"
                  required
                />
              </v-col>

              <!-- Start Time -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.startTime"
                  label="Jam Mulai"
                  type="time"
                  placeholder="08:00"
                />
              </v-col>

              <!-- End Time -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.endTime"
                  label="Jam Selesai"
                  type="time"
                  placeholder="17:00"
                />
              </v-col>

              <!-- Mode -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.mode"
                  :items="modeOptions"
                  label="Mode Pelatihan"
                />
              </v-col>

              <!-- Contact Person -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.contactPerson"
                  label="Contact Person"
                  placeholder="John Doe"
                />
              </v-col>

              <!-- Location -->
              <v-col cols="12">
                <v-textarea
                  v-model="formData.location"
                  label="Lokasi"
                  placeholder="Alamat lengkap pelatihan"
                  rows="2"
                />
              </v-col>

              <!-- Online Link -->
              <v-col cols="12" v-if="formData.mode === 'online' || formData.mode === 'hybrid'">
                <v-text-field
                  v-model="formData.onlineLink"
                  label="Link Meeting"
                  placeholder="https://zoom.us/j/123456789"
                />
              </v-col>

              <!-- Contact Phone -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.contactPhone"
                  label="Nomor Telepon"
                  placeholder="+62xxx"
                />
              </v-col>

              <!-- Status -->
              <v-col cols="12" md="6">
                <v-switch
                  v-model="formData.isActive"
                  label="Jadwal Aktif"
                  color="primary"
                />
              </v-col>

              <!-- Dress Code -->
              <v-col cols="12">
                <v-textarea
                  v-model="formData.dressCode"
                  label="Dress Code"
                  placeholder="Kemeja putih, celana panjang hitam, sepatu formal"
                  rows="2"
                />
              </v-col>

              <!-- Requirements -->
              <v-col cols="12">
                <v-textarea
                  v-model="formData.requirements"
                  label="Perlengkapan"
                  placeholder="Laptop, alat tulis, kalkulator"
                  rows="2"
                />
              </v-col>

              <!-- Max Participants -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.maxParticipants"
                  label="Maksimal Peserta"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="24"
                />
              </v-col>

              <!-- Participant Selection -->
              <v-col cols="12">
                <v-divider class="mb-4" />
                <div class="text-subtitle-2 mb-3">
                  <v-icon class="mr-2">mdi-account-multiple</v-icon>
                  Pilih Peserta ({{ selectedParticipants.length }}/{{ formData.maxParticipants || 24 }})
                </div>
                
                <v-autocomplete
                  v-model="selectedParticipants"
                  :items="availableParticipants"
                  :loading="loadingParticipants"
                  label="Cari dan pilih peserta..."
                  placeholder="Ketik nama peserta untuk mencari"
                  item-title="displayName"
                  item-value="id"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  :rules="[v => v.length <= (formData.maxParticipants || 24) || `Maksimal ${formData.maxParticipants || 24} peserta`]"
                  @update:search="searchParticipants"
                >
                  <template #chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      :color="getParticipantChipColor(item.raw.status)"
                      variant="tonal"
                      size="small"
                    >
                      {{ item.raw.fullName }}
                    </v-chip>
                  </template>

                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #append>
                        <v-chip
                          :color="getParticipantChipColor(item.raw.status)"
                          size="x-small"
                          variant="outlined"
                        >
                          {{ getStatusText(item.raw.status) }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </template>

                  <template #no-data>
                    <v-list-item>
                      <v-list-item-title>
                        {{ searchQuery ? 'Tidak ada peserta yang ditemukan' : 'Ketik untuk mencari peserta' }}
                      </v-list-item-title>
                    </v-list-item>
                  </template>
                </v-autocomplete>

                <v-alert 
                  v-if="selectedParticipants.length > (formData.maxParticipants || 24)"
                  type="warning" 
                  variant="tonal" 
                  class="mt-2"
                >
                  Jumlah peserta melebihi kapasitas maksimal kelas ({{ formData.maxParticipants || 24 }} peserta)
                </v-alert>
              </v-col>

              <!-- Notes -->
              <v-col cols="12">
                <v-textarea
                  v-model="formData.notes"
                  label="Catatan"
                  placeholder="Catatan tambahan untuk peserta"
                  rows="2"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="closeDialog">Batal</v-btn>
          <v-btn 
            color="primary" 
            @click="saveSchedule"
            :disabled="!valid"
            :loading="saving"
          >
            {{ editItem ? 'Update' : 'Simpan' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- View Dialog -->
    <v-dialog v-model="viewDialog" max-width="600px">
      <v-card v-if="viewItem">
        <v-card-title class="d-flex align-center">
          <v-icon left color="primary">mdi-calendar-clock</v-icon>
          {{ viewItem.scheduleName }}
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div class="mb-3">
                <div class="text-caption text-grey">Program Pelatihan</div>
                <v-chip :color="getTrainingColor(viewItem.trainingProgram)" dark small>
                  {{ viewItem.trainingProgram }}
                </v-chip>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-3">
                <div class="text-caption text-grey">Status</div>
                <v-chip :color="viewItem.isActive ? 'success' : 'error'" small>
                  {{ viewItem.isActive ? 'Aktif' : 'Nonaktif' }}
                </v-chip>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-3">
                <div class="text-caption text-grey">Tanggal</div>
                <div class="font-weight-medium">{{ formatDateRange(viewItem.startDate, viewItem.endDate) }}</div>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-3">
                <div class="text-caption text-grey">Waktu</div>
                <div>{{ viewItem.startTime || '-' }} - {{ viewItem.endTime || '-' }}</div>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-3">
                <div class="text-caption text-grey">Mode</div>
                <v-chip :color="getModeColor(viewItem.mode)" small variant="outlined">
                  <v-icon start :icon="getModeIcon(viewItem.mode)" size="small" />
                  {{ getModeText(viewItem.mode) }}
                </v-chip>
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="mb-3">
                <div class="text-caption text-grey">Contact Person</div>
                <div>{{ viewItem.contactPerson || '-' }}</div>
              </div>
            </v-col>

            <v-col cols="12" v-if="viewItem.location">
              <div class="mb-3">
                <div class="text-caption text-grey">Lokasi</div>
                <div>{{ viewItem.location }}</div>
              </div>
            </v-col>

            <v-col cols="12" v-if="viewItem.onlineLink">
              <div class="mb-3">
                <div class="text-caption text-grey">Link Meeting</div>
                <div>{{ viewItem.onlineLink }}</div>
              </div>
            </v-col>

            <v-col cols="12" v-if="viewItem.dressCode">
              <div class="mb-3">
                <div class="text-caption text-grey">Dress Code</div>
                <div>{{ viewItem.dressCode }}</div>
              </div>
            </v-col>

            <v-col cols="12" v-if="viewItem.requirements">
              <div class="mb-3">
                <div class="text-caption text-grey">Perlengkapan</div>
                <div>{{ viewItem.requirements }}</div>
              </div>
            </v-col>

            <v-col cols="12" v-if="viewItem.notes">
              <div class="mb-3">
                <div class="text-caption text-grey">Catatan</div>
                <div>{{ viewItem.notes }}</div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="viewDialog = false">Tutup</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Konfirmasi Hapus</v-card-title>
        <v-card-text>
          Apakah Anda yakin ingin menghapus jadwal "{{ deleteItem?.scheduleName }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Batal</v-btn>
          <v-btn color="error" @click="deleteSchedule" :loading="deleting">Hapus</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    </v-container>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted, reactive, watch, computed } from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import { useSnackbarStore } from '@/stores/snackbar'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'

const scheduleStore = useScheduleStore()
const snackbarStore = useSnackbarStore()

// Refs
const form = ref(null)

// Data
const schedules = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const dialog = ref(false)
const viewDialog = ref(false)
const deleteDialog = ref(false)
const valid = ref(false)
const search = ref('')
const filterTrainingProgram = ref('')
const filterStatus = ref('')
const filterMode = ref('')
const editItem = ref(null)
const viewItem = ref(null)
const deleteItem = ref(null)

// Participant selection
const availableParticipants = ref([])
const selectedParticipants = ref([])
const loadingParticipants = ref(false)
const participantSearchQuery = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)
const totalPages = ref(0)

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(search.value || filterTrainingProgram.value || (filterStatus.value !== '' && filterStatus.value !== null) || filterMode.value)
})

// Form data
const formData = reactive({
  trainingProgram: '',
  scheduleName: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  mode: 'offline',
  location: '',
  onlineLink: '',
  dressCode: '',
  requirements: '',
  contactPerson: '',
  contactPhone: '',
  maxParticipants: 24,
  reminderDays: [7, 3, 1],
  isActive: true,
  notes: ''
})

// Form validation rules
const rules = {
  required: value => !!value || 'Field ini wajib diisi'
}

// Training programs
const trainingPrograms = [
  { title: 'Basic Safety Training', value: 'BST' },
  { title: 'Security Awareness Training', value: 'SAT' },
  { title: 'Crowd & Crisis Management', value: 'CCM' },
  { title: 'Ship Security Duties', value: 'SDSD' },
  { title: 'Personnel Survival Craft & Rescue Boat', value: 'PSCRB' },
  { title: 'Updating Basic Safety Training', value: 'UPDATING_BST' }
]

// Status options
const statusOptions = [
  { title: 'Aktif', value: true },
  { title: 'Nonaktif', value: false }
]

// Mode options
const modeOptions = [
  { title: 'Offline', value: 'offline' },
  { title: 'Online', value: 'online' },
  { title: 'Hybrid', value: 'hybrid' }
]

// Table headers
const headers = [
  { title: 'Program', value: 'trainingProgram', sortable: false },
  { title: 'Nama Jadwal', value: 'scheduleName', sortable: false },
  { title: 'Tanggal Mulai', value: 'startDate', sortable: false },
  { title: 'Durasi', value: 'duration', sortable: false },
  { title: 'Mode', value: 'mode', sortable: false },
  { title: 'Status', value: 'isActive', sortable: false },
  { title: 'Aksi', value: 'actions', sortable: false, width: '120px' }
]

// Methods
const loadSchedules = async () => {
  loading.value = true
  try {
    const result = await scheduleStore.getSchedules({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: search.value,
      trainingProgram: filterTrainingProgram.value,
      isActive: filterStatus.value,
      mode: filterMode.value
    })
    
    schedules.value = result.data
    totalPages.value = result.pagination.pages
  } catch (error) {
    snackbarStore.show('Gagal memuat jadwal', 'error')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 1 // Reset to first page when applying filters
  loadSchedules()
}

const resetFilters = () => {
  search.value = ''
  filterTrainingProgram.value = ''
  filterStatus.value = null
  filterMode.value = ''
  currentPage.value = 1
  loadSchedules()
  snackbarStore.show('Filter berhasil direset', 'info')
}

const clearSearchFilter = () => {
  search.value = ''
  applyFilters()
}

const clearTrainingProgramFilter = () => {
  filterTrainingProgram.value = ''
  applyFilters()
}

const clearStatusFilter = () => {
  filterStatus.value = null
  applyFilters()
}

const clearModeFilter = () => {
  filterMode.value = ''
  applyFilters()
}

const openCreateDialog = () => {
  editItem.value = null
  resetForm()
  dialog.value = true
}

const editSchedule = (item) => {
  editItem.value = item
  Object.assign(formData, {
    ...item,
    startDate: formatDateForInput(item.startDate),
    endDate: formatDateForInput(item.endDate)
  })
  dialog.value = true
}

const viewSchedule = (item) => {
  viewItem.value = item
  viewDialog.value = true
}

const confirmDelete = (item) => {
  deleteItem.value = item
  deleteDialog.value = true
}

const saveSchedule = async () => {
  if (!valid.value) return

  saving.value = true
  try {
    // Debug: Check selected participants
    console.log('Selected participants:', selectedParticipants.value)
    console.log('Participant IDs:', selectedParticipants.value.map(p => p?.id || p))
    
    // Prepare data with participants
    const scheduleData = {
      ...formData,
      participantIds: selectedParticipants.value.map(p => p?.id || p).filter(id => id !== null && id !== undefined),
      maxParticipants: 24
    }

    let result
    if (editItem.value) {
      result = await scheduleStore.updateSchedule(editItem.value.id, scheduleData)
      snackbarStore.show('Jadwal berhasil diupdate', 'success')
    } else {
      result = await scheduleStore.createSchedule(scheduleData)
      snackbarStore.show('Jadwal berhasil dibuat', 'success')
    }
    
    // Ensure dialog closes on success
    closeDialog()
    await loadSchedules()
    
  } catch (error) {
    console.error('Error saving schedule:', error)
    const errorMessage = error.response?.data?.error || error.message || 'Gagal menyimpan jadwal'
    snackbarStore.show(errorMessage, 'error')
  } finally {
    saving.value = false
  }
}

const deleteSchedule = async () => {
  deleting.value = true
  try {
    await scheduleStore.deleteSchedule(deleteItem.value.id)
    snackbarStore.show('Jadwal berhasil dihapus', 'success')
    deleteDialog.value = false
    loadSchedules()
  } catch (error) {
    snackbarStore.show('Gagal menghapus jadwal', 'error')
  } finally {
    deleting.value = false
  }
}

const closeDialog = () => {
  dialog.value = false
  editItem.value = null
  resetForm()
  // Ensure saving state is reset
  saving.value = false
}

const resetForm = () => {
  Object.assign(formData, {
    trainingProgram: '',
    scheduleName: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    mode: 'offline',
    location: '',
    onlineLink: '',
    dressCode: '',
    requirements: '',
    contactPerson: '',
    contactPhone: '',
    maxParticipants: 24,
    reminderDays: [7, 3, 1],
    isActive: true,
    notes: ''
  })
  selectedParticipants.value = []
  availableParticipants.value = []
  valid.value = false
  
  // Reset form validation if form ref exists
  if (form.value) {
    form.value.resetValidation()
  }
}

// Participant management methods
const searchParticipants = async (query) => {
  if (!formData.trainingProgram) {
    snackbarStore.show('Pilih jenis diklat terlebih dahulu', 'warning')
    return
  }

  participantSearchQuery.value = query
  
  if (!query || query.length < 2) {
    // Load all participants for this training program when no search query
    await loadParticipantsForTraining()
    return
  }

  loadingParticipants.value = true
  try {
    const response = await scheduleStore.searchParticipants(formData.trainingProgram, query)
    
    // Format data untuk autocomplete
    if (response && Array.isArray(response)) {
      availableParticipants.value = response.map(participant => ({
        ...participant,
        displayName: `${participant.fullName} - ${getAgencyDisplayName(participant)} - ${participant.trainingProgram}`
      }))
    } else {
      availableParticipants.value = []
    }
  } catch (error) {
    console.error('Error searching participants:', error)
    snackbarStore.show('Gagal mencari peserta', 'error')
  } finally {
    loadingParticipants.value = false
  }
}

const loadParticipantsForTraining = async () => {
  if (!formData.trainingProgram) return
  
  try {
    loading.value = true
    const response = await scheduleStore.searchParticipants(formData.trainingProgram, '')
    
    // Format data untuk autocomplete
    if (response && Array.isArray(response)) {
      availableParticipants.value = response.map(participant => ({
        ...participant,
        displayName: `${participant.fullName} - ${getAgencyDisplayName(participant)} - ${participant.trainingProgram}`
      }))
    } else {
      availableParticipants.value = []
    }
  } catch (error) {
    console.error('Error loading participants:', error)
    snackbarStore.showError('Gagal memuat data peserta')
  } finally {
    loading.value = false
  }
}

const updatePage = (page) => {
  currentPage.value = page
  loadSchedules()
}

const updateItemsPerPage = (items) => {
  itemsPerPage.value = items
  currentPage.value = 1
  loadSchedules()
}

// Utility functions
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (start.toDateString() === end.toDateString()) {
    return formatDate(startDate)
  }
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

const formatDateForInput = (date) => {
  return new Date(date).toISOString().split('T')[0]
}

const getCountdownText = (startDate) => {
  const now = new Date()
  const start = new Date(startDate)
  const diffTime = start.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays > 0) return `H-${diffDays}`
  if (diffDays === 0) return 'Hari ini'
  return 'Sudah dimulai'
}

const getTrainingColor = (program) => {
  const colors = {
    BST: 'blue',
    SAT: 'green',
    CCM: 'purple',
    SDSD: 'red',
    PSCRB: 'teal',
    SB: 'indigo',
    UPDATING_BST: 'cyan'
  }
  return colors[program] || 'grey'
}

const getModeColor = (mode) => {
  const colors = {
    offline: 'blue',
    online: 'green',
    hybrid: 'orange'
  }
  return colors[mode] || 'grey'
}

const getModeIcon = (mode) => {
  const icons = {
    offline: 'mdi-school',
    online: 'mdi-video',
    hybrid: 'mdi-television-guide'
  }
  return icons[mode] || 'mdi-help'
}

const getModeText = (mode) => {
  const texts = {
    offline: 'Offline',
    online: 'Online',
    hybrid: 'Hybrid'
  }
  return texts[mode] || mode
}

// Utility functions for participants
const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getParticipantChipColor = (status) => {
  const colors = {
    submitted: 'blue',
    verified: 'indigo',
    waiting_quota: 'orange',
    sent_to_center: 'purple',
    waiting_dispatch: 'cyan',
    completed: 'success'
  }
  return colors[status] || 'grey'
}

const getStatusText = (status) => {
  const texts = {
    submitted: 'Diajukan',
    verified: 'Diverifikasi',
    waiting_quota: 'Menunggu Kuota',
    sent_to_center: 'Dikirim ke Pusat',
    waiting_dispatch: 'Menunggu Pengiriman',
    completed: 'Selesai'
  }
  return texts[status] || status
}

const getAgencyDisplayName = (participant) => {
  if (participant.agency && participant.agency.name) {
    return participant.agency.name
  }
  return 'User Biasa'
}

// Watch for training program changes
watch(() => formData.trainingProgram, (newValue) => {
  if (newValue) {
    selectedParticipants.value = []
    loadParticipantsForTraining()
  } else {
    availableParticipants.value = []
    selectedParticipants.value = []
  }
})

// Debounced search
let searchTimeout
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1 // Reset to first page
    loadSchedules()
  }, 500)
}

// Watchers
watch(search, (newValue, oldValue) => {
  // Only trigger search if there's actual change and not just clearing
  if (newValue !== oldValue) {
    debounceSearch()
  }
})

watch(filterTrainingProgram, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    currentPage.value = 1 // Reset to first page
    loadSchedules()
  }
})

watch(filterStatus, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    currentPage.value = 1 // Reset to first page
    loadSchedules()
  }
})

watch(filterMode, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    currentPage.value = 1 // Reset to first page
    loadSchedules()
  }
})

// Lifecycle
onMounted(() => {
  loadSchedules()
})
</script>