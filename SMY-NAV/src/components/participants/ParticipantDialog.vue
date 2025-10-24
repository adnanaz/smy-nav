<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800px"
    persistent
    scrollable
  >
    <v-card>
      <v-card-title class="text-h5 pa-6 bg-primary text-white">
        <div class="d-flex align-center">
          <v-icon class="me-3">mdi-account-plus</v-icon>
          {{ isEdit ? 'Edit Peserta' : 'Tambah Peserta Baru' }}
        </div>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <v-row>
            <!-- Jenis Diklat -->
            <v-col cols="12">
              <v-autocomplete
                v-model="formData.trainingProgram"
                :items="trainingProgramOptions"
                label="Jenis Diklat *"
                variant="outlined"
                item-title="text"
                item-value="value"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-school"
                :readonly="isEdit"
                @update:model-value="onTrainingProgramChange"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-chip
                        :color="getTrainingChipColor(item.raw.value)"
                        variant="tonal"
                        size="small"
                        class="me-3"
                      >
                        {{ item.raw.value }}
                      </v-chip>
                    </template>
                    <v-list-item-title>{{ item.raw.text }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- Nama Lengkap -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.fullName"
                label="Nama Lengkap *"
                variant="outlined"
                :rules="[rules.required, rules.minLength(2)]"
                prepend-inner-icon="mdi-account"
                counter="255"
              />
            </v-col>

            <!-- NIK -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.nik"
                label="NIK (Nomor Induk Kependudukan) *"
                variant="outlined"
                :rules="[rules.required, rules.nik]"
                prepend-inner-icon="mdi-card-account-details"
                maxlength="16"
                @input="onNikInput"
              />
            </v-col>

            <!-- Email -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.email"
                label="Email"
                variant="outlined"
                :rules="[rules.email]"
                prepend-inner-icon="mdi-email"
                type="email"
              />
            </v-col>

            <!-- Phone -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.phone"
                label="Nomor Telepon"
                variant="outlined"
                :rules="[rules.phone]"
                prepend-inner-icon="mdi-phone"
                placeholder="08xxxxxxxxxx"
              />
            </v-col>

            <!-- Birth Place -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.birthPlace"
                label="Tempat Lahir *"
                variant="outlined"
                :rules="[rules.required, rules.minLength(2)]"
                prepend-inner-icon="mdi-map-marker"
              />
            </v-col>

            <!-- Birth Date -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.birthDate"
                label="Tanggal Lahir *"
                variant="outlined"
                type="date"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-calendar"
              />
            </v-col>

            <!-- Gender -->
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.gender"
                :items="genderOptions"
                label="Jenis Kelamin *"
                variant="outlined"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-human-male-female"
              />
            </v-col>

            <!-- Address -->
            <v-col cols="12">
              <v-textarea
                v-model="formData.address"
                label="Alamat Lengkap *"
                variant="outlined"
                :rules="[rules.required, rules.minLength(10)]"
                prepend-inner-icon="mdi-home"
                rows="3"
                counter="500"
              />
            </v-col>

            <!-- Document Upload Section -->
            <v-col cols="12" v-if="selectedTrainingType">
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-h6 pa-4 bg-grey-lighten-4">
                  <v-icon class="me-2">mdi-file-document-multiple</v-icon>
                  Dokumen yang Diperlukan
                </v-card-title>
                <v-card-text class="pa-4">
                  <div class="text-body-2 text-grey-darken-1 mb-4">
                    {{ selectedTrainingType.description }}
                  </div>
                  
                  <v-row>
                    <!-- KTP -->
                    <v-col cols="12" md="6" v-if="requiredDocuments.includes('ktp')">
                      <v-file-input
                        v-model="formData.files.ktp"
                        label="Scan KTP *"
                        variant="outlined"
                        accept="image/*,.pdf"
                        prepend-icon="mdi-card-account-details"
                        :rules="isEdit ? [] : [rules.requiredFile]"
                        show-size
                      />
                    </v-col>

                    <!-- Ijazah -->
                    <v-col cols="12" md="6" v-if="requiredDocuments.includes('ijazah')">
                      <v-file-input
                        v-model="formData.files.ijazah"
                        label="Scan Ijazah *"
                        variant="outlined"
                        accept="image/*,.pdf"
                        prepend-icon="mdi-school"
                        :rules="isEdit ? [] : [rules.requiredFile]"
                        show-size
                      />
                    </v-col>

                    <!-- Foto -->
                    <v-col cols="12" md="6" v-if="requiredDocuments.includes('foto')">
                      <v-file-input
                        v-model="formData.files.foto"
                        label="Pas Foto *"
                        variant="outlined"
                        accept="image/*"
                        prepend-icon="mdi-camera"
                        :rules="isEdit ? [] : [rules.requiredFile]"
                        show-size
                      />
                    </v-col>

                    <!-- Surat Sehat -->
                    <v-col cols="12" md="6" v-if="requiredDocuments.includes('surat_sehat')">
                      <v-file-input
                        v-model="formData.files.surat_sehat"
                        label="Surat Keterangan Sehat *"
                        variant="outlined"
                        accept="image/*,.pdf"
                        prepend-icon="mdi-medical-bag"
                        :rules="isEdit ? [] : [rules.requiredFile]"
                        show-size
                      />
                    </v-col>

                    <!-- Passport (Optional) -->
                    <v-col cols="12" md="6" v-if="requiredDocuments.includes('passport_optional')">
                      <v-file-input
                        v-model="formData.files.passport"
                        label="Scan Passport (Opsional)"
                        variant="outlined"
                        accept="image/*,.pdf"
                        prepend-icon="mdi-passport"
                        show-size
                      />
                    </v-col>

                    <!-- Sertifikat BST -->
                    <v-col cols="12" md="6" v-if="requiredDocuments.includes('sertifikat_bst')">
                      <v-file-input
                        v-model="formData.files.sertifikat_bst"
                        label="Sertifikat BST *"
                        variant="outlined"
                        accept="image/*,.pdf"
                        prepend-icon="mdi-certificate"
                        :rules="isEdit ? [] : [rules.requiredFile]"
                        show-size
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6 bg-grey-lighten-5">
        <v-spacer />
        <v-btn
          @click="handleCancel"
          :disabled="loading"
          size="large"
        >
          Batal
        </v-btn>
        <v-btn
          @click="handleSubmit"
          color="primary"
          :loading="loading"
          :disabled="!valid"
          size="large"
        >
          {{ isEdit ? 'Update' : 'Simpan' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useParticipantStore } from '@/stores/participant'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  participant: {
    type: Object,
    default: null
  },
  trainingTypes: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const participantStore = useParticipantStore()

// Reactive data
const form = ref(null)
const valid = ref(false)
const loading = ref(false)

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
  files: {
    ktp: null,
    ijazah: null,
    foto: null,
    surat_sehat: null,
    passport: null,
    sertifikat_bst: null
  }
})

// Computed
const isEdit = computed(() => !!props.participant)

const trainingProgramOptions = computed(() => {
  if (!props.trainingTypes) return []
  return Object.entries(props.trainingTypes).map(([key, value]) => ({
    value: key,
    text: value.name,
    description: value.description
  }))
})

const selectedTrainingType = computed(() => {
  if (!formData.value.trainingProgram || !props.trainingTypes) return null
  return props.trainingTypes[formData.value.trainingProgram]
})

const requiredDocuments = computed(() => {
  return selectedTrainingType.value?.requiredDocuments || []
})

const genderOptions = [
  { title: 'Laki-laki', value: 'male' },
  { title: 'Perempuan', value: 'female' }
]

// Validation rules
const rules = {
  required: (value) => !!value || 'Field ini wajib diisi',
  requiredFile: (value) => !!(value && value.length > 0) || 'File wajib diupload',
  email: (value) => {
    if (!value) return true
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Format email tidak valid'
  },
  phone: (value) => {
    if (!value) return true
    const pattern = /^08[0-9]{8,12}$/
    return pattern.test(value) || 'Format nomor telepon tidak valid (contoh: 081234567890)'
  },
  nik: (value) => {
    if (!value) return 'NIK wajib diisi'
    if (value.length !== 16) return 'NIK harus 16 digit'
    if (!/^\d+$/.test(value)) return 'NIK hanya boleh berisi angka'
    return true
  },
  minLength: (min) => (value) => {
    if (!value) return true
    return value.length >= min || `Minimal ${min} karakter`
  }
}

// Methods
const resetForm = () => {
  formData.value = {
    fullName: '',
    nik: '',
    email: '',
    phone: '',
    birthPlace: '',
    birthDate: '',
    gender: '',
    address: '',
    trainingProgram: '',
    files: {
      ktp: null,
      ijazah: null,
      foto: null,
      surat_sehat: null,
      passport: null,
      sertifikat_bst: null
    }
  }
  
  if (form.value) {
    form.value.resetValidation()
  }
}

const loadParticipantData = () => {
  if (props.participant) {
    formData.value = {
      fullName: props.participant.fullName || '',
      nik: props.participant.nik || '',
      email: props.participant.email || '',
      phone: props.participant.phone || '',
      birthPlace: props.participant.birthPlace || '',
      birthDate: props.participant.birthDate ? 
        new Date(props.participant.birthDate).toISOString().split('T')[0] : '',
      gender: props.participant.gender || '',
      address: props.participant.address || '',
      trainingProgram: props.participant.trainingProgram || '',
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

const onNikInput = (event) => {
  // Only allow numeric input
  const value = event.target.value.replace(/\D/g, '')
  formData.value.nik = value
}

const onTrainingProgramChange = () => {
  // Reset file inputs when training program changes
  formData.value.files = {
    ktp: null,
    ijazah: null,
    foto: null,
    surat_sehat: null,
    passport: null,
    sertifikat_bst: null
  }
}

const handleSubmit = async () => {
  if (!form.value) return
  
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return

  loading.value = true
  
  try {
    if (isEdit.value) {
      await participantStore.updateParticipant(props.participant.id, formData.value)
    } else {
      await participantStore.createParticipant(formData.value)
    }
    
    emit('saved')
    resetForm()
  } catch (error) {
    console.error('Save participant error:', error)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  resetForm()
  emit('update:modelValue', false)
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

// Watchers
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (isEdit.value) {
        loadParticipantData()
      } else {
        resetForm()
      }
    })
  }
})

watch(() => props.participant, () => {
  if (props.modelValue && isEdit.value) {
    loadParticipantData()
  }
}, { deep: true })
</script>

<style scoped>
.v-file-input >>> .v-field__input {
  padding-top: 8px;
}

.v-textarea >>> .v-field__input {
  padding-top: 12px;
}
</style>