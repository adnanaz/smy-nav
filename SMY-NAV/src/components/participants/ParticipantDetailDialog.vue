<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="900px"
    scrollable
  >
    <v-card v-if="participant">
      <v-card-title class="text-h5 pa-6 bg-primary text-white">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-avatar size="48" class="me-4" color="white">
              <span class="text-primary text-h6">{{ getInitials(participant.fullName) }}</span>
            </v-avatar>
            <div>
              <div class="text-h6">{{ participant.fullName }}</div>
              <div class="text-body-2 opacity-90">{{ participant.registrationNumber }}</div>
            </div>
          </div>
          <v-chip
            :color="getStatusColor(participant.status)"
            variant="elevated"
          >
            {{ getStatusText(participant.status) }}
          </v-chip>
        </div>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-tabs v-model="activeTab" bg-color="grey-lighten-4">
          <v-tab value="personal">
            <v-icon class="me-2">mdi-account</v-icon>
            Data Pribadi
          </v-tab>
          <v-tab value="training">
            <v-icon class="me-2">mdi-school</v-icon>
            Pelatihan
          </v-tab>
          <v-tab value="documents">
            <v-icon class="me-2">mdi-file-document-multiple</v-icon>
            Dokumen
          </v-tab>
          <v-tab value="progress">
            <v-icon class="me-2">mdi-chart-line</v-icon>
            Progress
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab">
          <!-- Personal Data Tab -->
          <v-tabs-window-item value="personal" class="pa-6">
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="h-100">
                  <v-card-title class="text-h6 pa-4 bg-grey-lighten-5">
                    <v-icon class="me-2">mdi-account-details</v-icon>
                    Informasi Dasar
                  </v-card-title>
                  <v-card-text class="pa-4">
                    <div class="mb-4">
                      <div class="text-caption text-grey-darken-1 mb-1">Nama Lengkap</div>
                      <div class="text-body-1 font-weight-medium">{{ participant.fullName }}</div>
                    </div>
                    <div class="mb-4">
                      <div class="text-caption text-grey-darken-1 mb-1">NIK</div>
                      <div class="text-body-1">{{ participant.nik || '-' }}</div>
                    </div>
                    <div class="mb-4">
                      <div class="text-caption text-grey-darken-1 mb-1">Jenis Kelamin</div>
                      <div class="text-body-1">{{ getGenderText(participant.gender) }}</div>
                    </div>
                    <div class="mb-4">
                      <div class="text-caption text-grey-darken-1 mb-1">Tempat, Tanggal Lahir</div>
                      <div class="text-body-1">{{ getBirthInfo(participant.birthPlace, participant.birthDate) }}</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="outlined" class="h-100">
                  <v-card-title class="text-h6 pa-4 bg-grey-lighten-5">
                    <v-icon class="me-2">mdi-contact-mail</v-icon>
                    Kontak
                  </v-card-title>
                  <v-card-text class="pa-4">
                    <div class="mb-4">
                      <div class="text-caption text-grey-darken-1 mb-1">Email</div>
                      <div class="text-body-1">{{ participant.email || '-' }}</div>
                    </div>
                    <div class="mb-4">
                      <div class="text-caption text-grey-darken-1 mb-1">Nomor Telepon</div>
                      <div class="text-body-1">{{ participant.phone || '-' }}</div>
                    </div>
                    <div class="mb-4">
                      <div class="text-caption text-grey-darken-1 mb-1">Alamat</div>
                      <div class="text-body-1">{{ participant.address || '-' }}</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-tabs-window-item>

          <!-- Training Tab -->
          <v-tabs-window-item value="training" class="pa-6">
            <v-card variant="outlined">
              <v-card-title class="text-h6 pa-4 bg-grey-lighten-5">
                <v-icon class="me-2">mdi-school</v-icon>
                Informasi Pelatihan
              </v-card-title>
              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="mb-4">
                      <div class="text-caption text-grey-darken-1 mb-1">Jenis Diklat</div>
                      <v-chip
                        :color="getTrainingChipColor(participant.trainingProgram)"
                        variant="tonal"
                      >
                        {{ getTrainingProgramName(participant.trainingProgram) }}
                      </v-chip>
                    </div>
                    <div class="mb-4">
                      <div class="text-caption text-grey-darken-1 mb-1">Nomor Registrasi</div>
                      <div class="text-body-1 font-weight-medium">{{ participant.registrationNumber }}</div>
                    </div>
                    <div class="mb-4">
                      <div class="text-caption text-grey-darken-1 mb-1">Status</div>
                      <v-chip
                        :color="getStatusColor(participant.status)"
                        variant="tonal"
                      >
                        {{ getStatusText(participant.status) }}
                      </v-chip>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="mb-4">
                      <div class="text-caption text-grey-darken-1 mb-1">Progress Saat Ini</div>
                      <div class="d-flex align-center mb-2">
                        <v-progress-linear
                          :model-value="participant.progressPercentage"
                          :color="getProgressColor(participant.progressPercentage)"
                          height="8"
                          rounded
                          class="me-3"
                        />
                        <span class="text-body-2 font-weight-medium">{{ Math.round(participant.progressPercentage) }}%</span>
                      </div>
                      <div class="text-body-2 text-grey-darken-1">
                        Step {{ participant.currentProgressStep || 1 }} dari 6
                      </div>
                    </div>
                    <div class="mb-4">
                      <div class="text-caption text-grey-darken-1 mb-1">Agensi</div>
                      <div class="text-body-1">{{ participant.agency?.name || '-' }}</div>
                    </div>
                    <div class="mb-4">
                      <div class="text-caption text-grey-darken-1 mb-1">Dibuat oleh</div>
                      <div class="text-body-1">{{ participant.createdBy?.fullName || '-' }}</div>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>

          <!-- Documents Tab -->
          <v-tabs-window-item value="documents" class="pa-6">
            <v-card variant="outlined">
              <v-card-title class="text-h6 pa-4 bg-grey-lighten-5">
                <v-icon class="me-2">mdi-file-document-multiple</v-icon>
                Dokumen Peserta
              </v-card-title>
              <v-card-text class="pa-4">
                <v-row v-if="participant.documents && Object.keys(participant.documents).length > 0">
                  <v-col 
                    v-for="(docData, docType) in participant.documents" 
                    :key="docType"
                    cols="12" 
                    md="6"
                    lg="4"
                  >
                    <v-card variant="outlined" class="h-100">
                      <!-- Document Preview -->
                      <div class="document-preview" v-if="docData.url">
                        <v-img
                          v-if="isImageDocument(docData)"
                          :src="docData.url"
                          height="200"
                          cover
                          class="cursor-pointer"
                          @click="openDocumentPreview(docData.url)"
                        >
                          <template #placeholder>
                            <v-row class="fill-height ma-0" align="center" justify="center">
                              <v-progress-circular indeterminate color="grey-lighten-5" />
                            </v-row>
                          </template>
                        </v-img>
                        <div v-else class="d-flex align-center justify-center pa-8 bg-grey-lighten-4" style="height: 200px;">
                          <div class="text-center">
                            <v-icon size="48" color="grey-darken-1" class="mb-2">{{ getDocumentIcon(docType) }}</v-icon>
                            <div class="text-body-2 text-grey-darken-1">{{ getFileExtension(docData.original_filename || '') }}</div>
                          </div>
                        </div>
                      </div>
                      
                      <v-card-text class="pa-4">
                        <div class="d-flex align-center mb-3">
                          <v-icon 
                            :color="getDocumentIconColor(docType)" 
                            size="24" 
                            class="me-3"
                          >
                            {{ getDocumentIcon(docType) }}
                          </v-icon>
                          <div class="flex-grow-1">
                            <div class="text-body-1 font-weight-medium">{{ getDocumentTitle(docType) }}</div>
                            <div class="text-caption text-grey-darken-1">{{ docData.original_filename || 'Unknown filename' }}</div>
                            <div class="text-caption text-grey-darken-1" v-if="docData.bytes">{{ formatFileSize(docData.bytes) }}</div>
                          </div>
                        </div>
                        
                        <div class="d-flex gap-2">
                          <v-btn
                            color="primary"
                            variant="outlined"
                            size="small"
                            :href="docData.url"
                            target="_blank"
                            class="flex-grow-1"
                          >
                            <v-icon class="me-2">mdi-download</v-icon>
                            Download
                          </v-btn>
                          <v-btn
                            v-if="isImageDocument(docData)"
                            color="secondary"
                            variant="outlined"
                            size="small"
                            @click="openDocumentPreview(docData.url)"
                          >
                            <v-icon>mdi-eye</v-icon>
                          </v-btn>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
                <div v-else class="text-center py-8">
                  <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-file-document-outline</v-icon>
                  <div class="text-h6 text-grey-darken-1 mb-2">Belum ada dokumen</div>
                  <div class="text-body-2 text-grey-darken-1">Dokumen akan muncul setelah diupload</div>
                </div>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>

          <!-- Progress Tab -->
          <v-tabs-window-item value="progress" class="pa-6">
            <v-card variant="outlined">
              <v-card-title class="text-h6 pa-4 bg-grey-lighten-5">
                <v-icon class="me-2">mdi-chart-line</v-icon>
                Timeline Progress
              </v-card-title>
              <v-card-text class="pa-4">
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
                      <div>
                        <div class="text-body-1 font-weight-medium">{{ step.title }}</div>
                        <div class="text-caption text-grey-darken-1">{{ step.description }}</div>
                      </div>
                      <v-chip
                        v-if="index + 1 <= participant.currentProgressStep"
                        color="success"
                        variant="tonal"
                        size="small"
                      >
                        Selesai
                      </v-chip>
                      <v-chip
                        v-else-if="index + 1 === participant.currentProgressStep + 1"
                        color="warning"
                        variant="tonal"
                        size="small"
                      >
                        Proses
                      </v-chip>
                      <v-chip
                        v-else
                        color="grey"
                        variant="tonal"
                        size="small"
                      >
                        Pending
                      </v-chip>
                    </div>
                  </v-timeline-item>
                </v-timeline>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>

      <v-card-actions class="pa-6 bg-grey-lighten-5">
        <v-btn
          v-if="canGoPrevious"
          color="grey"
          variant="outlined"
          @click="goToPreviousTab"
        >
          <v-icon class="me-2">mdi-arrow-left</v-icon>
          Previous
        </v-btn>
        <v-spacer />
        <v-btn @click="$emit('update:modelValue', false)">
          Tutup
        </v-btn>
        <v-btn
          v-if="canGoNext"
          color="primary"
          variant="elevated"
          @click="goToNextTab"
        >
          <v-icon class="me-2">mdi-arrow-right</v-icon>
          Next
        </v-btn>
        <!-- <v-btn
          color="primary"
          variant="elevated"
          @click="editParticipant"
        >
          <v-icon class="me-2">mdi-pencil</v-icon>
          Edit
        </v-btn> -->
      </v-card-actions>
    </v-card>

    <!-- Document Preview Dialog -->
    <v-dialog v-model="previewDialog" max-width="800px">
      <v-card>
        <v-card-title class="text-h6 pa-4 bg-grey-lighten-5">
          <div class="d-flex align-center justify-space-between">
            <span>Preview Dokumen</span>
            <v-btn icon @click="previewDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-img
            v-if="previewUrl"
            :src="previewUrl"
            max-height="600"
            contain
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            color="primary"
            :href="previewUrl"
            target="_blank"
          >
            <v-icon class="me-2">mdi-download</v-icon>
            Download
          </v-btn>
        </v-card-actions>
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
  participant: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'edit'])

// Reactive data
const activeTab = ref('personal')
const previewDialog = ref(false)
const previewUrl = ref('')

// Tab navigation
const tabs = ['personal', 'training', 'documents', 'progress']

const canGoNext = computed(() => {
  const currentIndex = tabs.indexOf(activeTab.value)
  return currentIndex < tabs.length - 1
})

const canGoPrevious = computed(() => {
  const currentIndex = tabs.indexOf(activeTab.value)
  return currentIndex > 0
})

// Progress steps definition
const progressSteps = [
  {
    title: 'Pendaftaran',
    description: 'Data peserta dan dokumen telah diinput',
    status: ['draft', 'submitted']
  },
  {
    title: 'Verifikasi Dokumen',
    description: 'Dokumen sedang diverifikasi oleh admin',
    status: ['verified']
  },
  {
    title: 'Menunggu Kuota',
    description: 'Menunggu kuota angkatan terpenuhi (min 15, max 24)',
    status: ['waiting_quota']
  },
  {
    title: 'Diajukan ke Pusat',
    description: 'Dokumen telah diajukan ke pusat pelatihan',
    status: ['sent_to_center']
  },
  {
    title: 'Menunggu Pengiriman',
    description: 'Menunggu konfirmasi dan pengiriman dari pusat',
    status: ['waiting_dispatch']
  },
  {
    title: 'Selesai',
    description: 'Proses dokumen selesai dan siap dikirim ke peserta',
    status: ['completed']
  }
]

// Methods
const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getGenderText = (gender) => {
  if (!gender) return '-'
  return gender === 'male' ? 'Laki-laki' : 'Perempuan'
}

const getBirthInfo = (birthPlace, birthDate) => {
  const place = birthPlace || '-'
  const date = birthDate ? formatDate(birthDate) : '-'
  if (place === '-' && date === '-') return '-'
  return `${place}, ${date}`
}

const getStatusColor = (status) => {
  const colors = {
    draft: 'grey',
    submitted: 'blue',
    verified: 'indigo',
    approved: 'green',
    training: 'orange',
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
    approved: 'Disetujui',
    training: 'Pelatihan',
    completed: 'Selesai',
    rejected: 'Ditolak'
  }
  return texts[status] || status
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

const getTrainingProgramName = (program) => {
  const names = {
    BST: 'Basic Safety Training',
    SAT: 'Security Awareness Training',
    CCM_CMHBT: 'Crowd & Crisis Management (CMHBT)',
    CCM_CMT: 'Crowd & Crisis Management (CMT)',
    SDSD: 'Ship Security Duties',
    PSCRB: 'Personnel Survival Craft & Rescue Boat',
    SB: 'Survival Boat',
    UPDATING_BST: 'Updating Basic Safety Training'
  }
  return names[program] || program
}

const getProgressColor = (percentage) => {
  if (percentage >= 75) return 'success'
  if (percentage >= 50) return 'warning'
  if (percentage >= 25) return 'info'
  return 'error'
}

const getDocumentIcon = (docType) => {
  const icons = {
    ktp: 'mdi-card-account-details',
    ijazah: 'mdi-school',
    foto: 'mdi-camera',
    surat_sehat: 'mdi-medical-bag',
    passport: 'mdi-passport',
    sertifikat_bst: 'mdi-certificate'
  }
  return icons[docType] || 'mdi-file-document'
}

const getDocumentIconColor = (docType) => {
  const colors = {
    ktp: 'blue',
    ijazah: 'green',
    foto: 'purple',
    surat_sehat: 'red',
    passport: 'indigo',
    sertifikat_bst: 'orange'
  }
  return colors[docType] || 'grey'
}

const getDocumentTitle = (docType) => {
  const titles = {
    ktp: 'Scan KTP',
    ijazah: 'Scan Ijazah',
    foto: 'Pas Foto',
    surat_sehat: 'Surat Keterangan Sehat',
    passport: 'Scan Passport',
    sertifikat_bst: 'Sertifikat BST'
  }
  return titles[docType] || docType
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

const formatDate = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'dd MMMM yyyy', { locale: idLocale })
}

const isImageDocument = (docData) => {
  if (!docData) return false
  const format = docData.format || ''
  const filename = docData.original_filename || ''
  const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  return imageFormats.includes(format.toLowerCase()) || 
         imageFormats.some(ext => filename.toLowerCase().endsWith(`.${ext}`))
}

const getFileExtension = (filename) => {
  if (!filename) return 'FILE'
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE'
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const openDocumentPreview = (url) => {
  previewUrl.value = url
  previewDialog.value = true
}

const downloadDocument = (docType, docData) => {
  // If docData is object with url, use url; if string, assume it's filename
  const url = typeof docData === 'object' ? docData.url : docData
  if (url) {
    window.open(url, '_blank')
  }
}

const editParticipant = () => {
  emit('edit', props.participant)
  emit('update:modelValue', false)
}

const goToNextTab = () => {
  const currentIndex = tabs.indexOf(activeTab.value)
  if (currentIndex < tabs.length - 1) {
    activeTab.value = tabs[currentIndex + 1]
  }
}

const goToPreviousTab = () => {
  const currentIndex = tabs.indexOf(activeTab.value)
  if (currentIndex > 0) {
    activeTab.value = tabs[currentIndex - 1]
  }
}
</script>

<style scoped>
.v-timeline >>> .v-timeline-item__body {
  padding-bottom: 24px !important;
}

.document-preview {
  position: relative;
  overflow: hidden;
  border-radius: 4px 4px 0 0;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  opacity: 0.8;
  transition: opacity 0.3s ease;
}
</style>