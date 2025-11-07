<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800px"
    persistent
    scrollable
  >
    <v-card v-if="participant">
      <v-card-title class="text-h5 pa-6 bg-primary text-white">
        <div class="d-flex align-center">
          <v-icon class="me-3">mdi-chart-timeline-variant</v-icon>
          <div>
            <div class="text-h6">Update Progress: {{ participant.fullName }}</div>
            <div class="text-body-2 opacity-90">{{ participant.registrationNumber }}</div>
          </div>
        </div>
      </v-card-title>

      <v-card-text class="pa-0">
        <!-- Current Status -->
        <div class="pa-6 bg-grey-lighten-5">
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey-darken-1 mb-1">Status Saat Ini</div>
              <v-chip
                :color="getStatusColor(participant.status)"
                variant="elevated"
                size="large"
              >
                <v-icon class="me-2">{{ getStatusIcon(participant.status) }}</v-icon>
                {{ getStatusText(participant.status) }}
              </v-chip>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey-darken-1 mb-1">Progress</div>
              <div class="d-flex align-center">
                <v-progress-linear
                  :model-value="participant.progressPercentage"
                  :color="getProgressColor(participant.progressPercentage)"
                  height="12"
                  rounded
                  class="me-3"
                />
                <span class="text-h6 font-weight-bold">{{ Math.round(participant.progressPercentage) }}%</span>
              </div>
            </v-col>
          </v-row>
        </div>

        <!-- Progress Timeline -->
        <div class="pa-6">
          <h6 class="text-h6 mb-4">
            <v-icon class="me-2">mdi-timeline</v-icon>
            Timeline Progress
          </h6>
          
          <v-timeline side="end" density="compact">
            <v-timeline-item
              v-for="(step, index) in progressSteps"
              :key="index"
              :dot-color="getStepColor(index + 1, participant.currentProgressStep)"
              size="small"
            >
              <template #icon>
                <v-icon size="16" color="white">
                  {{ getStepIcon(index + 1, participant.currentProgressStep) }}
                </v-icon>
              </template>
              <div class="d-flex align-center justify-space-between">
                <div class="flex-grow-1">
                  <div class="text-body-1 font-weight-medium">{{ step.title }}</div>
                  <div class="text-caption text-grey-darken-1">{{ step.description }}</div>
                  <div v-if="step.estimatedDays" class="text-caption text-blue-darken-1">
                    Estimasi: {{ step.estimatedDays }} hari
                  </div>
                </div>
                <div class="ml-4">
                  <v-btn
                    v-if="canUpdateToStep(index + 1)"
                    @click="updateToStep(index + 1, step.status)"
                    color="primary"
                    variant="elevated"
                    size="small"
                  >
                    {{ getActionText(index + 1, participant.currentProgressStep) }}
                  </v-btn>
                  <v-chip
                    v-else-if="index + 1 <= participant.currentProgressStep"
                    color="success"
                    variant="tonal"
                    size="small"
                  >
                    <v-icon class="me-1">mdi-check</v-icon>
                    Selesai
                  </v-chip>
                  <v-chip
                    v-else
                    color="grey"
                    variant="tonal"
                    size="small"
                  >
                    Menunggu
                  </v-chip>
                </div>
              </div>
            </v-timeline-item>
          </v-timeline>
        </div>

        <!-- Quick Actions -->
        <div class="pa-6 bg-grey-lighten-5">
          <h6 class="text-h6 mb-4">
            <v-icon class="me-2">mdi-lightning-bolt</v-icon>
            Aksi Cepat
          </h6>
          <v-row>
            <v-col cols="12" md="6">
              <v-btn
                v-if="participant.status === 'submitted'"
                @click="quickAction('verify')"
                color="success"
                variant="elevated"
                block
                :loading="actionLoading"
              >
                <v-icon class="me-2">mdi-check-circle</v-icon>
                Verifikasi Dokumen
              </v-btn>
              <v-btn
                v-else-if="participant.status === 'verified' && participant.currentProgressStep < 3"
                @click="quickAction('assign_batch')"
                color="primary"
                variant="elevated"
                block
                :loading="actionLoading"
              >
                <v-icon class="me-2">mdi-account-group</v-icon>
                Assign ke Batch
              </v-btn>
              <v-btn
                v-else-if="participant.status === 'waiting_quota'"
                @click="quickAction('send_to_center')"
                color="purple"
                variant="elevated"
                block
                :loading="actionLoading"
                :disabled="!canSendToCenter"
              >
                <v-icon class="me-2">mdi-send</v-icon>
                Kirim ke Pusat
              </v-btn>
            </v-col>
            <v-col cols="12" md="6">
              <v-btn
                v-if="participant.status === 'submitted'"
                @click="quickAction('reject')"
                color="error"
                variant="outlined"
                block
                :loading="actionLoading"
              >
                <v-icon class="me-2">mdi-close-circle</v-icon>
                Tolak Dokumen
              </v-btn>
              <v-btn
                v-else-if="participant.status === 'sent_to_center'"
                @click="quickAction('dispatch')"
                color="orange"
                variant="elevated"
                block
                :loading="actionLoading"
              >
                <v-icon class="me-2">mdi-truck-delivery</v-icon>
                Konfirmasi Pengiriman
              </v-btn>
              <v-btn
                v-else-if="participant.status === 'waiting_dispatch'"
                @click="quickAction('complete')"
                color="success"
                variant="elevated"
                block
                :loading="actionLoading"
              >
                <v-icon class="me-2">mdi-flag-checkered</v-icon>
                Selesaikan
              </v-btn>
            </v-col>
          </v-row>
        </div>

        <!-- Batch Information -->
        <div v-if="participant.batch" class="pa-6">
          <h6 class="text-h6 mb-4">
            <v-icon class="me-2">mdi-account-group</v-icon>
            Informasi Batch
          </h6>
          <v-card variant="outlined">
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <div class="text-caption text-grey-darken-1 mb-1">Nomor Batch</div>
                  <div class="text-body-1 font-weight-medium">{{ participant.batch.batchNumber }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-caption text-grey-darken-1 mb-1">Status Batch</div>
                  <v-chip
                    :color="getBatchStatusColor(participant.batch.status)"
                    variant="tonal"
                    size="small"
                  >
                    {{ getBatchStatusText(participant.batch.status) }}
                  </v-chip>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-caption text-grey-darken-1 mb-1">Peserta</div>
                  <div class="text-body-1">
                    {{ participant.batch.currentParticipants }}/{{ participant.batch.maxParticipants }}
                    <span class="text-caption text-grey-darken-1">
                      (Min: {{ participant.batch.minParticipants }})
                    </span>
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-caption text-grey-darken-1 mb-1">Target Mulai</div>
                  <div class="text-body-1">{{ formatDate(participant.batch.targetStartDate) }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </div>

        <!-- Notes & Invoice Section -->
        <div class="pa-6 bg-grey-lighten-5">
          <v-row>
            <v-col cols="12">
              <v-textarea
                v-model="notes"
                label="Catatan Progress"
                variant="outlined"
                rows="3"
                hint="Tambahkan catatan tentang progress ini"
                persistent-hint
              />
            </v-col>
          </v-row>

          <!-- Invoice Upload Section (Only when participant arrived at SMY) -->
          <v-row v-if="participant.status === 'sent_to_center' || participant.status === 'waiting_dispatch' || participant.status === 'completed'">
            <v-col cols="12">
              <v-card variant="outlined" class="mt-4">
                <v-card-title class="text-h6 py-3">
                  <v-icon class="me-2">mdi-file-document-outline</v-icon>
                  Upload Invoice
                </v-card-title>
                <v-card-text>
                  <v-file-input
                    v-model="invoiceFile"
                    label="Pilih file invoice (PDF/Image)"
                    accept=".pdf,.jpg,.jpeg,.png"
                    variant="outlined"
                    prepend-icon="mdi-paperclip"
                    show-size
                    :rules="invoiceRules"
                    @change="handleInvoiceChange"
                  />
                  
                  <!-- Current Invoice Preview -->
                  <div v-if="participant.documents?.invoice" class="mt-3">
                    <v-divider class="mb-3" />
                    <div class="text-subtitle-2 mb-2">
                      <v-icon class="me-1">mdi-file-check</v-icon>
                      Invoice Saat Ini:
                    </div>
                    <v-chip 
                      color="success" 
                      variant="tonal" 
                      class="me-2"
                      @click="previewInvoice"
                      prepend-icon="mdi-eye"
                    >
                      {{ participant.documents.invoice.original_filename || 'invoice.pdf' }}
                    </v-chip>
                    <v-chip 
                      color="primary" 
                      variant="text" 
                      @click="downloadInvoice"
                      prepend-icon="mdi-download"
                    >
                      Download
                    </v-chip>
                  </div>

                  <v-alert v-if="invoiceFile" type="info" variant="tonal" class="mt-3">
                    File invoice baru akan menggantikan invoice sebelumnya jika ada.
                  </v-alert>

                  <!-- Upload Invoice Button -->
                  <div class="mt-4 d-flex justify-end">
                    <v-btn
                      @click="uploadInvoice"
                      color="success"
                      variant="elevated"
                      :loading="uploadInvoiceLoading"
                      prepend-icon="mdi-cloud-upload"
                    >
                      Upload Invoice
                    </v-btn> 
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-card-text>

      <v-card-actions class="pa-6">
        <v-spacer />
        <v-btn @click="$emit('update:modelValue', false)">
          Tutup
        </v-btn>
        <v-btn
          v-if="hasChanges"
          @click="saveChanges"
          color="primary"
          variant="elevated"
          :loading="saveLoading"
        >
          <v-icon class="me-2">mdi-content-save</v-icon>
          Simpan Perubahan
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">{{ confirmTitle }}</v-card-title>
        <v-card-text>
          {{ confirmMessage }}
          <v-alert v-if="confirmType === 'reject'" type="warning" variant="tonal" class="mt-3">
            Peserta akan dikembalikan ke status draft dan dapat diedit ulang oleh agency.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="confirmDialog = false">Batal</v-btn>
          <v-btn
            @click="executeAction"
            :color="confirmType === 'reject' ? 'error' : 'primary'"
            :loading="actionLoading"
          >
            {{ confirmButtonText }}
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
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useParticipantStore } from '@/stores/participant'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  participant: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'updated'])

// Store
const participantStore = useParticipantStore()

// Reactive data
const actionLoading = ref(false)
const saveLoading = ref(false)
const confirmDialog = ref(false)
const notes = ref('')
const pendingAction = ref(null)

// Invoice upload
const invoiceFile = ref(null)
const uploadInvoiceLoading = ref(false)
const invoiceRules = [
  value => {
    if (!value || !value.length) return true
    const file = Array.isArray(value) ? value[0] : value
    if (file.size > 5 * 1024 * 1024) {
      return 'File size harus kurang dari 5MB'
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return 'File harus berformat PDF, JPEG, atau PNG'
    }
    return true
  }
]

// Confirmation dialog state
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmButtonText = ref('')
const confirmType = ref('')

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Progress steps definition
const progressSteps = [
  {
    title: 'Verifikasi Dokumen',
    description: 'Verifikasi kelengkapan dan validitas dokumen',
    estimatedDays: '2-3',
    status: 'verified'
  },
  {
    title: 'Assign ke Batch',
    description: 'Assign peserta ke batch/angkatan pelatihan',
    estimatedDays: '1',
    status: 'waiting_quota'
  },
  {
    title: 'Menunggu Kuota Penuh',
    description: 'Menunggu kuota batch terpenuhi (min 15 peserta)',
    estimatedDays: '7-14',
    status: 'waiting_quota'
  },
  {
    title: 'Kirim ke Pusat',
    description: 'Dokumen dikirim ke pusat pelatihan',
    estimatedDays: '3-5',
    status: 'sent_to_center'
  },
  {
    title: 'Dokumen diproses Pusat',
    description: 'Konfirmasi penerimaan dari pusat',
    estimatedDays: '3-5',
    status: 'waiting_dispatch'
  },
  {
    title: 'Dokumen Tiba Di SMY',
    description: 'Dokumen telah tiba di SMY',
    estimatedDays: '0',
    status: 'completed'
  }
]

// Computed
const hasChanges = computed(() => {
  const notesChanged = notes.value !== (props.participant?.notes || '')
  return notesChanged
})

const canSendToCenter = computed(() => {
  return props.participant?.batch?.currentParticipants >= props.participant?.batch?.minParticipants
})

// Methods
const handleInvoiceChange = (file) => {
  console.log('Invoice file selected:', file)
}

const previewInvoice = () => {
  if (props.participant?.documents?.invoice?.url) {
    window.open(props.participant.documents.invoice.url, '_blank')
  }
}

const downloadInvoice = () => {
  if (props.participant?.documents?.invoice?.url) {
    const link = document.createElement('a')
    link.href = props.participant.documents.invoice.url
    link.download = props.participant.documents.invoice.original_filename || 'invoice.pdf'
    link.click()
  }
}

const uploadInvoice = async () => {
  
  if (!invoiceFile.value || invoiceFile.value.length === 0) {
    showSnackbar('Pilih file invoice terlebih dahulu', 'error')
    return
  }

  uploadInvoiceLoading.value = true
  
  try {
    const formData = new FormData()
    formData.append('invoice', invoiceFile.value)
    
    // Update participant with invoice only
    await participantStore.updateParticipant(props.participant.id, formData)
    
    // Reset file input and show success message
    invoiceFile.value = null
    showSnackbar('Invoice berhasil diupload', 'success')
    emit('updated')
  } catch (error) {
    console.error('Upload invoice error:', error)
    showSnackbar('Gagal upload invoice', 'error')
  } finally {
    uploadInvoiceLoading.value = false
  }
}

const canUpdateToStep = (stepNumber) => {
  if (!props.participant) return false
  const currentStep = props.participant.currentProgressStep
  return stepNumber === currentStep + 1 || (stepNumber === 1 && currentStep === 0)
}

const getActionText = (stepNumber, currentStep) => {
  if (stepNumber === currentStep + 1) {
    return 'Lanjutkan'
  }
  return 'Selesai'
}

const updateToStep = async (stepNumber, status) => {
  const step = progressSteps[stepNumber - 1]
  pendingAction.value = {
    type: 'update_step',
    stepNumber,
    status,
    title: step.title
  }
  
  confirmTitle.value = `Konfirmasi Update Progress`
  confirmMessage.value = `Apakah Anda yakin ingin mengupdate progress ke "${step.title}"?`
  confirmButtonText.value = 'Update'
  confirmType.value = 'update'
  confirmDialog.value = true
}

const quickAction = (action) => {
  pendingAction.value = { type: action }
  
  switch (action) {
    case 'verify':
      confirmTitle.value = 'Konfirmasi Verifikasi'
      confirmMessage.value = `Apakah Anda yakin dokumen ${props.participant.fullName} sudah sesuai dan dapat diverifikasi?`
      confirmButtonText.value = 'Verifikasi'
      confirmType.value = 'verify'
      break
    case 'reject':
      confirmTitle.value = 'Konfirmasi Tolak Dokumen'
      confirmMessage.value = `Apakah Anda yakin ingin menolak dokumen ${props.participant.fullName}?`
      confirmButtonText.value = 'Tolak'
      confirmType.value = 'reject'
      break
    case 'assign_batch':
      confirmTitle.value = 'Konfirmasi Assign Batch'
      confirmMessage.value = `Assign ${props.participant.fullName} ke batch yang tersedia?`
      confirmButtonText.value = 'Assign'
      confirmType.value = 'assign'
      break
    case 'send_to_center':
      confirmTitle.value = 'Konfirmasi Kirim ke Pusat'
      confirmMessage.value = `Kirim batch ${props.participant.batch?.batchNumber} ke pusat pelatihan?`
      confirmButtonText.value = 'Kirim'
      confirmType.value = 'send'
      break
    case 'dispatch':
      confirmTitle.value = 'Konfirmasi Pengiriman'
      confirmMessage.value = `Konfirmasi bahwa dokumen telah diterima pusat?`
      confirmButtonText.value = 'Konfirmasi'
      confirmType.value = 'dispatch'
      break
    case 'complete':
      confirmTitle.value = 'Konfirmasi Selesai'
      confirmMessage.value = `Tandai proses dokumen ${props.participant.fullName} sebagai selesai?`
      confirmButtonText.value = 'Selesaikan'
      confirmType.value = 'complete'
      break
  }
  
  confirmDialog.value = true
}

const executeAction = async () => {
  actionLoading.value = true
  
  try {
    const action = pendingAction.value
    
    switch (action.type) {
      case 'verify':
        await participantStore.verifyParticipant(props.participant.id)
        showSnackbar('Dokumen berhasil diverifikasi', 'success')
        break
      case 'reject':
        await participantStore.rejectParticipant(props.participant.id, notes.value)
        showSnackbar('Dokumen ditolak', 'warning')
        break
      case 'update_step':
        await participantStore.updateParticipantProgress(props.participant.id, {
          currentProgressStep: action.stepNumber,
          status: action.status,
          notes: notes.value
        })
        showSnackbar(`Progress berhasil diupdate ke "${action.title}"`, 'success')
        break
      case 'assign_batch':
        await participantStore.assignToBatch(props.participant.id)
        showSnackbar('Peserta berhasil di-assign ke batch', 'success')
        break
      case 'send_to_center':
        await participantStore.sendBatchToCenter(props.participant.batch.id)
        showSnackbar('Batch berhasil dikirim ke pusat', 'success')
        break
      case 'dispatch':
        await participantStore.confirmDispatch(props.participant.id)
        showSnackbar('Pengiriman dikonfirmasi', 'success')
        break
      case 'complete':
        await participantStore.completeParticipant(props.participant.id)
        showSnackbar('Proses dokumen selesai', 'success')
        break
    }
    
    confirmDialog.value = false
    emit('updated')
    
  } catch (error) {
    showSnackbar('Gagal mengupdate progress', 'error')
    console.error('Error executing action:', error)
  } finally {
    actionLoading.value = false
  }
}

const saveChanges = async () => {
  saveLoading.value = true
  
  try {
    // Only update notes (invoice has separate upload method)
    if (notes.value !== (props.participant?.notes || '')) {
      await participantStore.updateParticipantNotes(props.participant.id, notes.value)
      showSnackbar('Catatan berhasil disimpan', 'success')
      emit('updated')
    }
  } catch (error) {
    console.error('Save changes error:', error)
    showSnackbar('Gagal menyimpan catatan', 'error')
  } finally {
    saveLoading.value = false
  }
}

// Utility methods
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

const getStatusIcon = (status) => {
  const icons = {
    draft: 'mdi-file-edit',
    submitted: 'mdi-file-send',
    verified: 'mdi-file-check',
    waiting_quota: 'mdi-clock-outline',
    sent_to_center: 'mdi-send',
    waiting_dispatch: 'mdi-truck-delivery',
    completed: 'mdi-check-circle',
    rejected: 'mdi-close-circle'
  }
  return icons[status] || 'mdi-help-circle'
}

const getStepColor = (stepNumber, currentStep) => {
  if (stepNumber <= currentStep) return 'success'
  if (stepNumber === currentStep + 1) return 'warning'
  return 'grey'
}

const getStepIcon = (stepNumber, currentStep) => {
  if (stepNumber <= currentStep) return 'mdi-check'
  if (stepNumber === currentStep + 1) return 'mdi-clock'
  return 'mdi-circle-outline'
}

const getProgressColor = (percentage) => {
  if (percentage >= 75) return 'success'
  if (percentage >= 50) return 'warning'
  if (percentage >= 25) return 'info'
  return 'error'
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
  const texts = {
    forming: 'Membentuk',
    ready: 'Siap',
    sent_to_center: 'Dikirim ke Pusat',
    in_training: 'Sedang Pelatihan',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  }
  return texts[status] || status
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

// Watch for participant changes
watch(() => props.participant, (newParticipant) => {
  if (newParticipant) {
    notes.value = newParticipant.notes || ''
  }
}, { immediate: true })
</script>

<style scoped>
.v-timeline >>> .v-timeline-item__body {
  padding-bottom: 24px !important;
}
</style>