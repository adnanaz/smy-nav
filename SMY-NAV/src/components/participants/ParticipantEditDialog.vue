<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800px"
    scrollable
    persistent
  >
    <v-card v-if="participant">
      <v-card-title class="text-h5 pa-6 bg-primary text-white">
        <div class="d-flex align-center">
          <v-icon class="me-3">mdi-pencil</v-icon>
          <div>
            <div>{{ authStore.isAgent ? 'Update Data' : 'Edit' }} Peserta: {{ participant.fullName }}</div>
            <div v-if="authStore.isAgent" class="text-caption opacity-80">
              Sebagai Agent, Anda hanya dapat mengubah nama dan dokumen
            </div>
          </div>
        </div>
      </v-card-title>

      <v-form ref="formRef" @submit.prevent="submitForm">
        <v-card-text class="pa-6">
          <v-row>
            <!-- Personal Information -->
            <v-col cols="12">
              <h6 class="text-h6 mb-4">
                <v-icon class="me-2">mdi-account</v-icon>
                Informasi Pribadi
              </h6>
            </v-col>
            
            <v-col cols="12" :md="authStore.isAgent ? '12' : '6'">
              <v-text-field
                v-model="formData.fullName"
                label="Nama Lengkap *"
                variant="outlined"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-account"
              />
            </v-col>
            
            <!-- Fields only visible to admin/super_admin -->
            <template v-if="!authStore.isAgent">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.nik"
                  label="NIK"
                  variant="outlined"
                  prepend-inner-icon="mdi-card-account-details"
                  hint="Kosongkan jika belum ada data"
                  persistent-hint
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.email"
                  label="Email"
                  variant="outlined"
                  type="email"
                  prepend-inner-icon="mdi-email"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.phone"
                  label="Nomor Telepon"
                  variant="outlined"
                  prepend-inner-icon="mdi-phone"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.birthPlace"
                  label="Tempat Lahir"
                  variant="outlined"
                  prepend-inner-icon="mdi-map-marker"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.birthDate"
                  label="Tanggal Lahir"
                  variant="outlined"
                  type="date"
                  prepend-inner-icon="mdi-calendar"
                />
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.gender"
                  label="Jenis Kelamin"
                  variant="outlined"
                  :items="genderOptions"
                  prepend-inner-icon="mdi-human-male-female"
                />
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="formData.address"
                  label="Alamat"
                  variant="outlined"
                  rows="3"
                  prepend-inner-icon="mdi-home"
                />
              </v-col>
            </template>

            <!-- Training Information -->
            <v-col cols="12">
              <v-divider class="my-4" />
              <h6 class="text-h6 mb-4">
                <v-icon class="me-2">mdi-school</v-icon>
                Informasi Pelatihan
              </h6>
            </v-col>
            
            <v-col cols="12" :md="authStore.isAgent ? '12' : '6'">
              <v-select
                v-model="formData.trainingProgram"
                label="Jenis Diklat *"
                variant="outlined"
                :items="trainingProgramOptions"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-school"
                disabled
                hint="Training program tidak dapat diubah"
                persistent-hint
              />
            </v-col>
            
            <v-col v-if="!authStore.isAgent" cols="12" md="6">
              <v-text-field
                v-model="formData.registrationNumber"
                label="Nomor Registrasi"
                variant="outlined"
                disabled
                prepend-inner-icon="mdi-identifier"
                hint="Nomor registrasi tidak dapat diubah"
                persistent-hint
              />
            </v-col>

            <!-- Document Upload -->
            <v-col cols="12">
              <v-divider class="my-4" />
              <h6 class="text-h6 mb-4">
                <v-icon class="me-2">mdi-file-document-multiple</v-icon>
                Update Dokumen (Opsional)
              </h6>
              <v-alert type="info" variant="tonal" class="mb-4">
                Upload ulang dokumen hanya jika ingin mengganti file yang sudah ada
              </v-alert>
            </v-col>
            
            <v-col cols="12" md="6" lg="4">
              <v-file-input
                v-model="formData.files.ktp"
                label="Scan KTP"
                variant="outlined"
                accept="image/*,.pdf"
                prepend-icon="mdi-card-account-details"
                show-size
                @change="validateFileSize"
              />
            </v-col>
            
            <v-col cols="12" md="6" lg="4">
              <v-file-input
                v-model="formData.files.ijazah"
                label="Scan Ijazah"
                variant="outlined"
                accept="image/*,.pdf"
                prepend-icon="mdi-school"
                show-size
                @change="validateFileSize"
              />
            </v-col>
            
            <v-col cols="12" md="6" lg="4">
              <v-file-input
                v-model="formData.files.foto"
                label="Pas Foto"
                variant="outlined"
                accept="image/*"
                prepend-icon="mdi-camera"
                show-size
                @change="validateFileSize"
              />
            </v-col>
            
            <v-col cols="12" md="6" lg="4">
              <v-file-input
                v-model="formData.files.surat_sehat"
                label="Surat Keterangan Sehat"
                variant="outlined"
                accept="image/*,.pdf"
                prepend-icon="mdi-medical-bag"
                show-size
                @change="validateFileSize"
              />
            </v-col>
            
            <v-col cols="12" md="6" lg="4">
              <v-file-input
                v-model="formData.files.passport"
                label="Scan Passport"
                variant="outlined"
                accept="image/*,.pdf"
                prepend-icon="mdi-passport"
                show-size
                @change="validateFileSize"
              />
            </v-col>
            
            <v-col cols="12" md="6" lg="4">
              <v-file-input
                v-model="formData.files.sertifikat_bst"
                label="Sertifikat BST"
                variant="outlined"
                accept="image/*,.pdf"
                prepend-icon="mdi-certificate"
                show-size
                @change="validateFileSize"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="pa-6 bg-grey-lighten-5">
          <v-spacer />
          <v-btn @click="$emit('update:modelValue', false)">
            Batal
          </v-btn>
          <v-btn
            type="submit"
            color="primary"
            variant="elevated"
            :loading="loading"
          >
            <v-icon class="me-2">mdi-content-save</v-icon>
            Simpan Perubahan
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>

    <!-- Error Snackbar -->
    <v-snackbar
      v-model="errorSnackbar"
      color="error"
      timeout="5000"
    >
      {{ errorMessage }}
      <template #actions>
        <v-btn @click="errorSnackbar = false" icon="mdi-close" />
      </template>
    </v-snackbar>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useParticipantStore } from '@/stores/participant'
import { useAuthStore } from '@/stores/auth'

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
const authStore = useAuthStore()

// Reactive data
const formRef = ref(null)
const loading = ref(false)
const errorSnackbar = ref(false)
const errorMessage = ref('')

const formData = ref({
  fullName: '',
  nik: '',
  email: '',
  phone: '',
  birthPlace: '',
  birthDate: '',
  gender: '',
  address: '',
  trainingProgram: '',
  registrationNumber: '',
  files: {
    ktp: null,
    ijazah: null,
    foto: null,
    surat_sehat: null,
    passport: null,
    sertifikat_bst: null
  }
})

// Options
const genderOptions = [
  { title: 'Laki-laki', value: 'male' },
  { title: 'Perempuan', value: 'female' }
]

const trainingProgramOptions = computed(() => {
  if (!participantStore.trainingTypes) return []
  return Object.entries(participantStore.trainingTypes).map(([key, value]) => ({
    title: value.name,
    value: key
  }))
})

// Validation rules
const rules = {
  required: (value) => !!value || 'Field ini wajib diisi'
}

// Watch for participant changes to populate form
watch(() => props.participant, (newParticipant) => {
  if (newParticipant) {
    populateForm(newParticipant)
  }
}, { immediate: true })

// Methods
const populateForm = (participant) => {
  if (authStore.isAgent) {
    // Agent hanya bisa edit nama dan dokumen
    formData.value = {
      fullName: participant.fullName || '',
      nik: '', // Tidak ditampilkan untuk agent
      email: '',
      phone: '',
      birthPlace: '',
      birthDate: '',
      gender: '',
      address: '',
      trainingProgram: participant.trainingProgram || '',
      registrationNumber: participant.registrationNumber || '',
      files: {
        ktp: null,
        ijazah: null,
        foto: null,
        surat_sehat: null,
        passport: null,
        sertifikat_bst: null
      }
    }
  } else {
    // Admin dapat edit semua field
    formData.value = {
      fullName: participant.fullName || '',
      nik: participant.nik || '',
      email: participant.email || '',
      phone: participant.phone || '',
      birthPlace: participant.birthPlace || '',
      birthDate: participant.birthDate ? participant.birthDate.split('T')[0] : '',
      gender: participant.gender || '',
      address: participant.address || '',
      trainingProgram: participant.trainingProgram || '',
      registrationNumber: participant.registrationNumber || '',
      files: {
        ktp: null,
        ijazah: null,
        foto: null,
        surat_sehat: null,
        passport: null,
        sertifikat_bst: null
      }
    }
  }
}

const validateFileSize = (files) => {
  if (!files || files.length === 0) return
  
  const file = files[0]
  const maxSize = 3 * 1024 * 1024 // 3MB
  
  if (file.size > maxSize) {
    errorMessage.value = `File ${file.name} terlalu besar. Maksimal 3MB.`
    errorSnackbar.value = true
    return false
  }
  return true
}

const submitForm = async () => {
  if (!formRef.value) return
  
  const { valid } = await formRef.value.validate()
  if (!valid) return
  
  loading.value = true
  
  try {
    // Prepare data based on user role
    let dataToSubmit = { ...formData.value }
    
    if (authStore.isAgent) {
      // Agent bisa update nama lengkap dan file saja
      dataToSubmit = {
        fullName: formData.value.fullName,
        files: formData.value.files
      }
      // Hapus field yang null/undefined untuk agent
      Object.keys(dataToSubmit).forEach(key => {
        if (key !== 'files' && (dataToSubmit[key] === null || dataToSubmit[key] === '' || dataToSubmit[key] === undefined)) {
          delete dataToSubmit[key]
        }
      })
    } else {
      // Admin bisa update semua field
      // Hapus field yang null/undefined
      Object.keys(dataToSubmit).forEach(key => {
        if (key !== 'files' && (dataToSubmit[key] === null || dataToSubmit[key] === '' || dataToSubmit[key] === undefined)) {
          delete dataToSubmit[key]
        }
      })
    }
    
    console.log('Data to submit:', dataToSubmit)
    console.log('User role - isAgent:', authStore.isAgent)
    
    await participantStore.updateParticipant(props.participant.id, dataToSubmit)
    emit('updated')
    emit('update:modelValue', false)
  } catch (error) {
    console.error('Update error:', error)
    errorMessage.value = error.message || 'Gagal mengupdate data peserta'
    errorSnackbar.value = true
  } finally {
    loading.value = false
  }
}
</script>