<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <div class="d-flex justify-space-between align-center">
          <div>
            <h1 class="text-h4 font-weight-bold mb-2">Manajemen Batch</h1>
            <p class="text-subtitle-1 text-grey-darken-1">Kelola batch/angkatan pelatihan</p>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            size="large"
            @click="createBatchDialog = true"
          >
            Buat Batch Baru
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="mb-4" elevation="2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="filterProgram"
              :items="trainingProgramOptions"
              label="Jenis Diklat"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filterStatus"
              :items="batchStatusOptions"
              label="Status Batch"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filterYear"
              :items="yearOptions"
              label="Tahun"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-center">
            <v-btn
              color="primary"
              variant="flat"
              @click="fetchBatches"
              block
            >
              Filter
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Batch Cards -->
    <v-row>
      <v-col 
        v-for="batch in batches" 
        :key="batch.id"
        cols="12" 
        md="6" 
        lg="4"
      >
        <v-card class="h-100" elevation="2" hover>
          <v-card-title class="d-flex align-center justify-space-between">
            <div>
              <div class="text-h6">{{ batch.batchNumber }}</div>
              <div class="text-caption text-grey-darken-1">
                {{ getTrainingProgramName(batch.trainingProgram) }}
              </div>
            </div>
            <v-chip
              :color="getBatchStatusColor(batch.status)"
              variant="tonal"
              size="small"
            >
              {{ getBatchStatusText(batch.status) }}
            </v-chip>
          </v-card-title>

          <v-card-text>
            <!-- Progress Bar -->
            <div class="mb-4">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-body-2">Kuota Peserta</span>
                <span class="text-body-2 font-weight-medium">
                  {{ batch.currentParticipants }}/{{ batch.maxParticipants }}
                </span>
              </div>
              <v-progress-linear
                :model-value="(batch.currentParticipants / batch.maxParticipants) * 100"
                :color="getQuotaColor(batch)"
                height="8"
                rounded
              />
              <div class="text-caption text-grey-darken-1 mt-1">
                Minimum: {{ batch.minParticipants }} peserta
              </div>
            </div>

            <!-- Status Indicators -->
            <div class="mb-3">
              <v-chip
                v-if="batch.currentParticipants >= batch.minParticipants"
                color="success"
                variant="tonal"
                size="small"
                class="me-2"
              >
                <v-icon class="me-1">mdi-check</v-icon>
                Siap Kirim
              </v-chip>
              <v-chip
                v-if="batch.currentParticipants >= batch.maxParticipants"
                color="warning"
                variant="tonal"
                size="small"
                class="me-2"
              >
                <v-icon class="me-1">mdi-alert</v-icon>
                Penuh
              </v-chip>
            </div>

            <!-- Dates -->
            <div v-if="batch.targetStartDate" class="mb-2">
              <div class="text-caption text-grey-darken-1">Target Mulai</div>
              <div class="text-body-2">{{ formatDate(batch.targetStartDate) }}</div>
            </div>
            <div v-if="batch.actualStartDate" class="mb-2">
              <div class="text-caption text-grey-darken-1">Mulai Aktual</div>
              <div class="text-body-2">{{ formatDate(batch.actualStartDate) }}</div>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              variant="text"
              @click="viewBatchDetail(batch)"
            >
              <v-icon class="me-2">mdi-eye</v-icon>
              Detail
            </v-btn>
            <v-btn
              v-if="batch.status === 'ready' && canSendToCenter(batch)"
              color="primary"
              variant="text"
              @click="sendBatchToCenter(batch)"
            >
              <v-icon class="me-2">mdi-send</v-icon>
              Kirim ke Pusat
            </v-btn>
            <v-spacer />
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  variant="text"
                  v-bind="props"
                />
              </template>
              <v-list>
                <v-list-item @click="editBatch(batch)">
                  <v-list-item-title>Edit</v-list-item-title>
                </v-list-item>
                <v-list-item 
                  v-if="batch.status === 'forming'"
                  @click="deleteBatch(batch)"
                  class="text-error"
                >
                  <v-list-item-title>Hapus</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create Batch Dialog -->
    <v-dialog v-model="createBatchDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h6">Buat Batch Baru</v-card-title>
        <v-form ref="createFormRef" @submit.prevent="createBatch">
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="newBatch.trainingProgram"
                  :items="trainingProgramOptions"
                  label="Jenis Diklat *"
                  variant="outlined"
                  :rules="[rules.required]"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newBatch.minParticipants"
                  label="Min Peserta *"
                  variant="outlined"
                  type="number"
                  :rules="[rules.required, rules.minParticipants]"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newBatch.maxParticipants"
                  label="Max Peserta *"
                  variant="outlined"
                  type="number"
                  :rules="[rules.required, rules.maxParticipants]"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="newBatch.targetStartDate"
                  label="Target Tanggal Mulai"
                  variant="outlined"
                  type="date"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="newBatch.notes"
                  label="Catatan"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="createBatchDialog = false">Batal</v-btn>
            <v-btn
              type="submit"
              color="primary"
              :loading="createLoading"
            >
              Buat Batch
            </v-btn>
          </v-card-actions>
        </v-form>
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
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// Reactive data
const batches = ref([])
const loading = ref(false)
const createBatchDialog = ref(false)
const createLoading = ref(false)
const createFormRef = ref(null)

// Filters
const filterProgram = ref('')
const filterStatus = ref('')
const filterYear = ref(new Date().getFullYear())

// New batch form
const newBatch = ref({
  trainingProgram: '',
  minParticipants: 15,
  maxParticipants: 24,
  targetStartDate: '',
  notes: ''
})

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Options
const trainingProgramOptions = [
  { title: 'Basic Safety Training', value: 'BST' },
  { title: 'Security Awareness Training', value: 'SAT' },
  { title: 'Crowd & Crisis Management', value: 'CCM' },
  { title: 'Ship Security Duties', value: 'SDSD' },
  { title: 'Personnel Survival Craft & Rescue Boat', value: 'PSCRB' },
  { title: 'Survival Boat', value: 'SB' },
  { title: 'Updating Basic Safety Training', value: 'UPDATING_BST' }
]

const batchStatusOptions = [
  { title: 'Membentuk', value: 'forming' },
  { title: 'Siap', value: 'ready' },
  { title: 'Dikirim ke Pusat', value: 'sent_to_center' },
  { title: 'Sedang Pelatihan', value: 'in_training' },
  { title: 'Selesai', value: 'completed' },
  { title: 'Dibatalkan', value: 'cancelled' }
]

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return [
    { title: currentYear.toString(), value: currentYear },
    { title: (currentYear + 1).toString(), value: currentYear + 1 },
    { title: (currentYear - 1).toString(), value: currentYear - 1 }
  ]
})

// Validation rules
const rules = {
  required: (value) => !!value || 'Field ini wajib diisi',
  minParticipants: (value) => {
    if (!value) return true
    return parseInt(value) >= 1 || 'Minimal 1 peserta'
  },
  maxParticipants: (value) => {
    if (!value) return true
    return parseInt(value) >= parseInt(newBatch.value.minParticipants) || 'Maksimal harus lebih besar dari minimal'
  }
}

// Methods
const fetchBatches = async () => {
  loading.value = true
  try {
    // TODO: Implement API call
    // const response = await batchStore.fetchBatches({
    //   program: filterProgram.value,
    //   status: filterStatus.value,
    //   year: filterYear.value
    // })
    // batches.value = response.data
    
    // Mock data for now
    batches.value = [
      {
        id: '1',
        batchNumber: 'BST-2025-001',
        trainingProgram: 'BST',
        year: 2025,
        sequenceNumber: 1,
        status: 'forming',
        minParticipants: 15,
        maxParticipants: 24,
        currentParticipants: 8,
        targetStartDate: '2025-02-01',
        createdAt: new Date()
      },
      {
        id: '2',
        batchNumber: 'BST-2025-002',
        trainingProgram: 'BST',
        year: 2025,
        sequenceNumber: 2,
        status: 'ready',
        minParticipants: 15,
        maxParticipants: 24,
        currentParticipants: 18,
        targetStartDate: '2025-03-01',
        createdAt: new Date()
      }
    ]
  } catch (error) {
    showSnackbar('Gagal memuat data batch', 'error')
  } finally {
    loading.value = false
  }
}

const createBatch = async () => {
  if (!createFormRef.value) return
  
  const { valid } = await createFormRef.value.validate()
  if (!valid) return
  
  createLoading.value = true
  try {
    // TODO: Implement API call
    // await batchStore.createBatch(newBatch.value)
    showSnackbar('Batch berhasil dibuat', 'success')
    createBatchDialog.value = false
    resetForm()
    await fetchBatches()
  } catch (error) {
    showSnackbar('Gagal membuat batch', 'error')
  } finally {
    createLoading.value = false
  }
}

const resetForm = () => {
  newBatch.value = {
    trainingProgram: '',
    minParticipants: 15,
    maxParticipants: 24,
    targetStartDate: '',
    notes: ''
  }
}

const viewBatchDetail = (batch) => {
  // TODO: Navigate to batch detail page
  console.log('View batch detail:', batch)
}

const editBatch = (batch) => {
  // TODO: Open edit dialog
  console.log('Edit batch:', batch)
}

const deleteBatch = (batch) => {
  // TODO: Show confirmation and delete
  console.log('Delete batch:', batch)
}

const sendBatchToCenter = (batch) => {
  // TODO: Show confirmation and send to center
  console.log('Send to center:', batch)
}

const canSendToCenter = (batch) => {
  return batch.currentParticipants >= batch.minParticipants
}

// Utility methods
const getTrainingProgramName = (program) => {
  const option = trainingProgramOptions.find(opt => opt.value === program)
  return option ? option.title : program
}

const getBatchStatusColor = (status) => {
  const colors = {
    forming: 'orange',
    ready: 'green',
    sent_to_center: 'blue',
    in_training: 'purple',
    completed: 'success',
    cancelled: 'error'
  }
  return colors[status] || 'grey'
}

const getBatchStatusText = (status) => {
  const option = batchStatusOptions.find(opt => opt.value === status)
  return option ? option.title : status
}

const getQuotaColor = (batch) => {
  const percentage = (batch.currentParticipants / batch.maxParticipants) * 100
  if (percentage >= 100) return 'error'
  if (percentage >= 75) return 'warning'
  if (batch.currentParticipants >= batch.minParticipants) return 'success'
  return 'info'
}

const formatDate = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'dd MMMM yyyy', { locale: idLocale })
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

// Lifecycle
onMounted(() => {
  fetchBatches()
})
</script>

<style scoped>
.v-card {
  transition: transform 0.2s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>