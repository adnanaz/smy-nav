<template>
  <DashboardLayout page-title="Daftar Diklat">
    <v-container fluid class="pa-6">
      <!-- Header -->
      <div class="d-flex align-center mb-6">
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          @click="$router.back()"
          class="me-3"
        />
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">{{ editMode ? 'Edit Data Pelatihan' : 'Daftar Pelatihan Maritim' }}</h1>
          <p class="text-subtitle-1 text-grey-darken-1">{{ editMode ? 'Edit data pendaftaran pelatihan maritim Anda' : 'Daftarkan diri Anda untuk mengikuti pelatihan maritim' }}</p>
        </div>
      </div>

      <!-- Progress Stepper -->
      <v-card class="mb-6" elevation="2">
        <v-stepper
          v-model="currentStep"
          :items="stepperItems"
          hide-actions
          flat
        >
          <template #item.1>
            <v-card-text class="pa-6">
              <h3 class="text-h6 mb-4">
                <v-icon class="me-2">mdi-account</v-icon>
                Data Diri & Pilih Jenis Diklat
              </h3>
              
              <!-- Nama Lengkap -->
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="formData.fullName"
                    label="Nama Lengkap *"
                    variant="outlined"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-account"
                    placeholder="Masukkan nama lengkap Anda"
                    hint="Nama yang akan digunakan untuk crosscheck dan sertifikat"
                    persistent-hint
                  />
                </v-col>
              </v-row>
              
              <!-- Training Programs -->
              <v-row class="mt-2">
                <v-col cols="12">
                  <v-autocomplete
                    v-model="formData.trainingPrograms"
                    :items="trainingProgramOptions"
                    label="Jenis Diklat *"
                    variant="outlined"
                    item-title="text"
                    item-value="value"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-school"
                    multiple
                    chips
                    closable-chips
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
                      </v-list-item>
                    </template>
                    <template #selection="{ item }">
                      <v-chip
                        :color="getTrainingChipColor(item.raw.value)"
                        variant="tonal"
                        size="small"
                        closable
                        @click:close="removeTrainingProgram(item.raw.value)"
                      >
                        {{ item.raw.value }}
                      </v-chip>
                    </template>
                  </v-autocomplete>
                </v-col>
              </v-row>

              <!-- BST Certificate Confirmation -->
              <v-row v-if="showBSTCheckbox">
                <v-col cols="12">
                  <v-card variant="outlined" class="mt-4">
                    <v-card-title class="bg-orange-lighten-4">
                      <v-icon class="me-2">mdi-certificate</v-icon>
                      Konfirmasi Sertifikat BST
                    </v-card-title>
                    <v-card-text>
                      <v-alert 
                        type="info" 
                        variant="tonal" 
                        density="compact"
                        icon="mdi-information"
                        class="mb-3"
                      >
                        Anda memilih diklat yang membutuhkan Sertifikat BST. Mohon konfirmasi apakah Anda sudah memiliki sertifikat tersebut.
                      </v-alert>
                      
                      <v-checkbox
                        v-model="formData.hasBSTCertificate"
                        label="Saya sudah memiliki Sertifikat BST"
                        color="primary"
                        :rules="showBSTCheckbox ? [rules.requiredBSTConfirmation] : []"
                      >
                        <template #label>
                          <span class="text-body-1">
                            Saya sudah memiliki Sertifikat BST 
                            <v-icon color="primary" size="small">mdi-certificate</v-icon>
                          </span>
                        </template>
                      </v-checkbox>
                      
                      <div v-if="formData.hasBSTCertificate" class="mt-2">
                        <v-alert 
                          type="success" 
                          variant="tonal" 
                          density="compact"
                          icon="mdi-check"
                        >
                          Bagus! Anda perlu upload scan Sertifikat BST di step berikutnya.
                        </v-alert>
                      </div>
                      
                      <div v-else-if="showBSTCheckbox" class="mt-2">
                        <v-alert 
                          type="warning" 
                          variant="tonal" 
                          density="compact"
                          icon="mdi-alert"
                        >
                          <strong>Perhatian:</strong> Untuk mengikuti diklat yang dipilih, Anda harus memiliki Sertifikat BST terlebih dahulu. 
                          Silakan centang checkbox jika Anda sudah memiliki sertifikat BST, atau pertimbangkan untuk mendaftar BST terlebih dahulu.
                        </v-alert>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Training Program Details -->
              <div v-if="selectedTrainingTypes.length > 0">
                <v-card
                  v-for="training in selectedTrainingTypes"
                  :key="training.key"
                  variant="outlined"
                  class="mt-4"
                >
                  <v-card-title class="bg-grey-lighten-4">
                    <v-icon class="me-2">mdi-information</v-icon>
                    Detail Program {{ training.name }}
                    <v-chip
                      :color="getTrainingChipColor(training.key)"
                      variant="tonal"
                      size="small"
                      class="ms-2"
                    >
                      {{ training.key }}
                    </v-chip>
                  </v-card-title>
                  <v-card-text>
                    <div class="mb-3 mt-3">
                      <strong>Deskripsi:</strong> {{ training.description }}
                    </div>
                    <div class="mb-3">
                      <strong>Durasi Pelatihan:</strong> {{ training.duration }}
                    </div>
                    <div class="mb-3">
                      <strong>Proses Pembuatan Dokumen:</strong> {{ training.processingTime }}
                    </div>
                    <div class="mb-3">
                      <strong>Biaya:</strong> 
                      <v-chip color="success" variant="tonal" size="small" class="ml-2">
                        {{ formatCurrency(trainingPrices[training.key] || 0) }}
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Combined Required Documents -->
                <v-card variant="outlined" class="mt-4">
                  <v-card-title class="bg-blue-lighten-4">
                    <v-icon class="me-2">mdi-file-document-multiple</v-icon>
                    Dokumen yang Diperlukan (Gabungan)
                  </v-card-title>
                  <v-card-text>
                    <v-list density="compact">
                      <v-list-item
                        v-for="doc in combinedRequiredDocs"
                        :key="doc"
                        class="px-0"
                      >
                        <template #prepend>
                          <v-icon color="primary" size="small">mdi-file-document</v-icon>
                        </template>
                        <v-list-item-title class="text-body-2">{{ doc }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>

                <!-- Total Price Summary -->
                <v-card variant="outlined" class="mt-4">
                  <v-card-title class="bg-green-lighten-4">
                    <v-icon class="me-2">mdi-calculator</v-icon>
                    Ringkasan Biaya
                  </v-card-title>
                  <v-card-text>
                    <div class="d-flex justify-space-between align-center mb-2" v-for="training in selectedTrainingTypes" :key="training.key">
                      <span>{{ training.name }} ({{ training.key }})</span>
                      <v-chip color="success" variant="tonal" size="small">
                        {{ formatCurrency(trainingPrices[training.key] || 0) }}
                      </v-chip>
                    </div>
                    <v-divider class="my-3" />
                    <div class="d-flex justify-space-between align-center">
                      <strong class="text-h6">Total Biaya:</strong>
                      <v-chip color="success" variant="flat" size="large" class="text-h6">
                        {{ formatCurrency(totalPrice) }}
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </v-card-text>
          </template>

          <template #item.2>
            <v-card-text class="pa-6">
              <h3 class="text-h6 mb-4">
                <v-icon class="me-2">mdi-card-account-details</v-icon>
                Data Identitas Diri & Alamat
              </h3>
              
              <v-row>
                <!-- Tanggal Daftar -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.registrationDate"
                    label="Tanggal Daftar"
                    variant="outlined"
                    type="date"
                    prepend-inner-icon="mdi-calendar-today"
                    readonly
                    disabled
                    hint="Tanggal pendaftaran otomatis diisi"
                    persistent-hint
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
                    placeholder="16 digit NIK"
                    maxlength="16"
                    @input="onNikInput"
                  />
                </v-col>

                <!-- Tempat Lahir -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.placeOfBirth"
                    label="Tempat Lahir *"
                    variant="outlined"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-map-marker"
                    placeholder="Kota tempat lahir"
                  />
                </v-col>

                <!-- Tanggal Lahir -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.dateOfBirth" 
                    label="Tanggal Lahir *"
                    variant="outlined"
                    type="date"
                    :rules="[rules.required, rules.minimumAge]"
                    prepend-inner-icon="mdi-calendar"
                  />
                </v-col>

                <!-- Jenis Kelamin -->
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

                <!-- Nama Ibu Kandung -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.motherName"
                    label="Nama Ibu Kandung *"
                    variant="outlined"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-account-heart"
                    placeholder="Nama lengkap ibu kandung"
                  />
                </v-col>

                <!-- Kewarganegaraan -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.nationality"
                    label="Kewarganegaraan *"
                    variant="outlined"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-flag"
                    placeholder="Contoh: Indonesia"
                  />
                </v-col>

                <!-- Alamat Lengkap -->
                <v-col cols="12">
                  <v-textarea
                    v-model="formData.address"
                    label="Alamat Lengkap *"
                    variant="outlined" 
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-home"
                    placeholder="Masukkan alamat lengkap"
                    rows="3"
                  />
                </v-col>

                <!-- Provinsi -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.province"
                    label="Provinsi *"
                    variant="outlined"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-map"
                    placeholder="Nama provinsi"
                  />
                </v-col>

                <!-- Kabupaten/Kota -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.city"
                    label="Kabupaten/Kota *"
                    variant="outlined"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-city"
                    placeholder="Nama kabupaten/kota"
                  />
                </v-col>

                <!-- Kecamatan -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.district"
                    label="Kecamatan *"
                    variant="outlined"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-map-marker-outline"
                    placeholder="Nama kecamatan"
                  />
                </v-col>

                <!-- Kelurahan/Desa -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.village"
                    label="Kelurahan/Desa *"
                    variant="outlined"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-home-group"
                    placeholder="Nama kelurahan/desa"
                  />
                </v-col>

                <!-- RT/RW -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.rtRw"
                    label="RT/RW *"
                    variant="outlined"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-home-outline"
                    placeholder="Contoh: 001/002"
                  />
                </v-col>

                <!-- Kode Pos -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.postalCode"
                    label="Kode Pos *"
                    variant="outlined"
                    :rules="[rules.required, rules.postalCode]"
                    prepend-inner-icon="mdi-mailbox"
                    placeholder="5 digit kode pos"
                    maxlength="5"
                  />
                </v-col>

                <!-- No HP -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.phone"
                    label="Nomor HP *"
                    variant="outlined"
                    :rules="[rules.required, rules.phone]"
                    prepend-inner-icon="mdi-phone"
                    placeholder="08xxxxxxxxxx"
                  />
                </v-col>

                <!-- Email -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="formData.email"
                    label="Email *"
                    variant="outlined"
                    type="email"
                    :rules="[rules.required, rules.email]"
                    prepend-inner-icon="mdi-email"
                    placeholder="email@domain.com"
                    readonly
                    hint="Email diambil dari akun Anda"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </template>

          <template #item.3>
            <v-card-text class="pa-6">
              <h3 class="text-h6 mb-4">
                <v-icon class="me-2">mdi-file-upload</v-icon>
                Upload Dokumen Persyaratan
              </h3>

              <v-alert type="info" variant="tonal" class="mb-4">
                <v-icon>mdi-information</v-icon>
                <strong>Petunjuk Upload:</strong><br>
                • Format file: JPG, PNG, atau PDF<br>
                • Ukuran maksimal: 5MB per file<br>
                • Pastikan dokumen terlihat jelas dan dapat dibaca
              </v-alert>

              <v-row>
                <v-col cols="12" v-for="docType in requiredDocuments" :key="docType.key">
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="py-3">
                      <v-icon class="me-2">{{ docType.icon }}</v-icon>
                      {{ docType.name }} 
                      <v-chip color="error" variant="text" size="small" class="ms-2">*</v-chip>
                    </v-card-title>
                    <v-card-text>
                      <v-file-input
                        v-model="formData.documents[docType.key]"
                        :label="`Upload ${docType.name}`"
                        variant="outlined"
                        accept="image/*,application/pdf"
                        prepend-icon=""
                        prepend-inner-icon="mdi-paperclip"
                        :rules="[rules.required]"
                        show-size
                        @change="validateFile($event, docType.key)"
                      >
                        <template #selection="{ fileNames }">
                          <template v-for="(fileName, index) in fileNames" :key="fileName">
                            <v-chip
                              color="primary"
                              size="small"
                              label
                              class="me-2"
                            >
                              {{ fileName }}
                            </v-chip>
                          </template>
                        </template>
                      </v-file-input>
                      
                      <div v-if="docType.note" class="text-caption text-grey-darken-1 mt-1">
                        <v-icon size="small" class="me-1">mdi-information</v-icon>
                        {{ docType.note }}
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </template>

          <template #item.4>
            <v-card-text class="pa-6">
              <h3 class="text-h6 mb-4">
                <v-icon class="me-2">mdi-credit-card</v-icon>
                Pembayaran & Upload Bukti Transfer
              </h3>

              <v-alert type="info" variant="tonal" class="mb-6">
                <v-icon>mdi-information</v-icon>
                <strong>Wajib Bayar di Awal:</strong><br>
                Untuk pendaftaran mandiri, pembayaran wajib dilakukan sebelum pengajuan diproses. 
                Silakan transfer sesuai nominal di bawah dan upload bukti transfernya.
              </v-alert>

              <!-- Payment Summary -->
              <v-card variant="outlined" class="mb-6">
                <v-card-title class="bg-success text-white">
                  <v-icon class="me-2">mdi-calculator</v-icon>
                  Detail Pembayaran
                </v-card-title>
                <v-card-text class="pa-4">
                  <div class="mb-4">
                    <div class="d-flex justify-space-between align-center mb-2" v-for="training in selectedTrainingTypes" :key="training.key">
                      <span class="text-subtitle-1">{{ training.name }} ({{ training.key }})</span>
                      <v-chip color="success" variant="tonal" size="small">
                        {{ formatCurrency(trainingPrices[training.key] || 0) }}
                      </v-chip>
                    </div>
                    <v-divider class="my-3" />
                    <div class="d-flex justify-space-between align-center">
                      <strong class="text-h6">Total yang Harus Dibayar:</strong>
                      <v-chip color="success" variant="flat" size="large" class="text-h6">
                        {{ formatCurrency(totalPrice) }}
                      </v-chip>
                    </div>
                  </div>

                  <!-- Bank Details -->
                  <v-alert type="warning" variant="outlined" class="mb-4">
                    <div class="text-h6 mb-2">
                      <v-icon class="me-2">mdi-bank</v-icon>
                      Informasi Rekening
                    </div>
                    <div class="mb-2"><strong>Bank:</strong> BCA</div>
                    <div class="mb-2"><strong>No. Rekening:</strong> 1234567890</div>
                    <div class="mb-2"><strong>Atas Nama:</strong> PT SMY Maritime Training</div>
                    <div class="text-caption mt-3 text-warning-darken-2">
                      <v-icon size="small" class="me-1">mdi-alert</v-icon>
                      Pastikan nominal transfer sesuai dengan jumlah yang tertera di atas
                    </div>
                  </v-alert>
                </v-card-text>
              </v-card>

              <!-- Upload Payment Proof -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="bg-orange-lighten-4">
                  <v-icon class="me-2">mdi-receipt</v-icon>
                  Upload Bukti Transfer 
                  <v-chip color="error" variant="text" size="small" class="ms-2">*</v-chip>
                </v-card-title>
                <v-card-text>
                  <v-file-input
                    v-model="formData.documents.payment_proof"
                    label="Bukti Transfer / Struk ATM *"
                    variant="outlined"
                    accept="image/*,application/pdf"
                    prepend-icon=""
                    prepend-inner-icon="mdi-receipt"
                    :rules="[rules.required]"
                    show-size
                    @change="validateFile($event, 'payment_proof')"
                  >
                    <template #selection="{ fileNames }">
                      <template v-for="(fileName, index) in fileNames" :key="fileName">
                        <v-chip
                          color="success"
                          size="small"
                          label
                          class="me-2"
                        >
                          {{ fileName }}
                        </v-chip>
                      </template>
                    </template>
                  </v-file-input>
                  
                  <div class="text-caption text-grey-darken-1 mt-1">
                    <v-icon size="small" class="me-1">mdi-information</v-icon>
                    Upload foto bukti transfer/struk ATM dalam format JPG, PNG, atau PDF (maksimal 5MB)
                  </div>

                  <v-alert type="success" variant="tonal" class="mt-4" density="compact">
                    <strong>Tips:</strong> Pastikan bukti transfer menunjukkan nominal yang sesuai dan dapat dibaca dengan jelas
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-card-text>
          </template>

          <template #item.5>
            <v-card-text class="pa-6">
              <h3 class="text-h6 mb-4">
                <v-icon class="me-2">mdi-check-circle</v-icon>
                Review & Konfirmasi
              </h3>

              <!-- Summary Card -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="bg-primary text-white">
                  <v-icon class="me-2">mdi-account-check</v-icon>
                  Ringkasan Pendaftaran
                </v-card-title>
                <v-card-text class="pa-4">
                  <v-row>
                    <v-col cols="12" md="6">
                      <div class="mb-3">
                        <strong>Tanggal Daftar:</strong><br>
                        {{ new Date(formData.registrationDate).toLocaleDateString('id-ID') }}
                      </div>
                      <div class="mb-3">
                        <strong>Nama Lengkap:</strong><br>
                        {{ formData.fullName }}
                      </div>
                      <div class="mb-3">
                        <strong>NIK:</strong><br>
                        {{ formData.nik }}
                      </div>
                      <div class="mb-3">
                        <strong>Tempat, Tanggal Lahir:</strong><br>
                        {{ formData.placeOfBirth }}, {{ new Date(formData.dateOfBirth).toLocaleDateString('id-ID') }}
                      </div>
                      <div class="mb-3">
                        <strong>Jenis Kelamin:</strong><br>
                        {{ formData.gender === 'male' ? 'Laki-laki' : 'Perempuan' }}
                      </div>
                      <div class="mb-3">
                        <strong>Nama Ibu Kandung:</strong><br>
                        {{ formData.motherName }}
                      </div>
                      <div class="mb-3">
                        <strong>Kewarganegaraan:</strong><br>
                        {{ formData.nationality }}
                      </div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="mb-3">
                        <strong>Alamat Lengkap:</strong><br>
                        {{ formData.address }}
                      </div>
                      <div class="mb-3">
                        <strong>Provinsi:</strong><br>
                        {{ formData.province }}
                      </div>
                      <div class="mb-3">
                        <strong>Kab/Kota:</strong><br>
                        {{ formData.city }}
                      </div>
                      <div class="mb-3">
                        <strong>Kecamatan:</strong><br>
                        {{ formData.district }}
                      </div>
                      <div class="mb-3">
                        <strong>Kelurahan/Desa:</strong><br>
                        {{ formData.village }}
                      </div>
                      <div class="mb-3">
                        <strong>RT/RW:</strong><br>
                        {{ formData.rtRw }}
                      </div>
                      <div class="mb-3">
                        <strong>Kode Pos:</strong><br>
                        {{ formData.postalCode }}
                      </div>
                    </v-col>
                  </v-row>
                  
                  <v-divider class="my-4" />
                  
                  <v-row>
                    <v-col cols="12" md="6">
                      <div class="mb-3">
                        <strong>No. HP:</strong><br>
                        {{ formData.phone }}
                      </div>
                      <div class="mb-3">
                        <strong>Email:</strong><br>
                        {{ formData.email }}
                      </div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="mb-3">
                        <strong>Program Diklat:</strong><br>
                        <v-chip
                          v-for="program in formData.trainingPrograms"
                          :key="program"
                          :color="getTrainingChipColor(program)"
                          variant="tonal"
                          size="small"
                          class="me-1 mb-1"
                        >
                          {{ program }}
                        </v-chip>
                      </div>
                      <div class="mb-3">
                        <strong>Total Biaya:</strong><br>
                        <v-chip color="success" variant="flat" size="large">
                          {{ formatCurrency(totalPrice) }}
                        </v-chip>
                      </div>
                      <div class="mb-3">
                        <strong>Dokumen Uploaded:</strong><br>
                        {{ Object.keys(formData.documents).filter(key => formData.documents[key] && key !== 'payment_proof').length }} dari {{ requiredDocuments.length }} dokumen
                      </div>
                      <div class="mb-3">
                        <strong>Bukti Transfer:</strong><br>
                        <v-chip 
                          :color="formData.documents.payment_proof ? 'success' : 'error'" 
                          variant="tonal" 
                          size="small"
                        >
                          {{ formData.documents.payment_proof ? 'Sudah Upload' : 'Belum Upload' }}
                        </v-chip>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- Terms & Conditions -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="bg-grey-lighten-4">
                  <v-icon class="me-2">mdi-file-document-check</v-icon>
                  Syarat & Ketentuan
                </v-card-title>
                <v-card-text>
                  <v-checkbox
                    v-model="formData.agreeToTerms"
                    :rules="[rules.requiredAgreement]"
                    color="primary"
                  >
                    <template #label>
                      <span class="text-body-2">
                        Saya menyetujui <a href="#" @click.prevent="showTermsDialog = true" class="text-primary">syarat dan ketentuan</a> yang berlaku
                      </span>
                    </template>
                  </v-checkbox>
                  
                  <v-checkbox
                    v-model="formData.dataProcessingConsent"
                    :rules="[rules.requiredAgreement]"
                    color="primary"
                    class="mt-2"
                  >
                    <template #label>
                      <span class="text-body-2">
                        Saya memberikan persetujuan untuk pemrosesan data pribadi sesuai dengan kebijakan privasi
                      </span>
                    </template>
                  </v-checkbox>
                </v-card-text>
              </v-card>
            </v-card-text>
          </template>
        </v-stepper>
      </v-card>

      <!-- Navigation Buttons -->
      <v-card elevation="2">
        <v-card-actions class="pa-4">
          <v-btn
            v-if="currentStep > 1"
            variant="outlined"
            prepend-icon="mdi-arrow-left"
            @click="prevStep"
          >
            Sebelumnya
          </v-btn>
          
          <v-spacer />
          
          <v-btn
            v-if="currentStep < stepperItems.length"
            color="primary"
            append-icon="mdi-arrow-right"
            @click="nextStep"
            :disabled="!canProceedToNext"
          >
            Selanjutnya
          </v-btn>
          
          <v-btn
            v-else
            color="success"
            prepend-icon="mdi-check"
            @click="submitForm"
            :loading="submitting"
            :disabled="!canSubmit"
          >
            {{ editMode ? 'Update Data' : 'Daftar Sekarang' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>

    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="bg-success text-white">
          <v-icon class="me-2">mdi-check-circle</v-icon>
          Pendaftaran Berhasil!
        </v-card-title>
        <v-card-text class="pa-6 text-center">
          <v-icon color="success" size="64" class="mb-4">mdi-check-circle-outline</v-icon>
          <h3 class="text-h6 mb-3">Selamat! Data Anda telah berhasil disimpan.</h3>
          <p class="mb-4">
            Nomor registrasi Anda: <strong>{{ registrationNumber }}</strong><br>
            Data masih berstatus <strong>Draft</strong>. Silakan submit pengajuan melalui dashboard untuk memulai proses verifikasi.
          </p>
          
          <v-alert type="info" variant="tonal" class="ma-4">
            <div class="text-left">
              <strong>Langkah selanjutnya:</strong>
              <ol class="mt-2 ml-4">
                <li>Buka menu "Data Saya" di dashboard</li>
                <li>Klik tombol "Ajukan Data" pada data yang baru dibuat</li>
                <li>Tunggu verifikasi dari admin</li>
              </ol>
            </div>
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="primary" @click="goToDashboard">
            Ke Dashboard
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Terms Dialog -->
    <v-dialog v-model="showTermsDialog" max-width="800" scrollable>
      <v-card>
        <v-card-title class="bg-primary text-white">
          <v-icon class="me-2">mdi-file-document-check</v-icon>
          Syarat & Ketentuan
        </v-card-title>
        <v-card-text class="pa-6">
          <div class="terms-content">
            <h4>1. Ketentuan Umum</h4>
            <p>Dengan mendaftar di sistem ini, Anda menyetujui semua syarat dan ketentuan yang berlaku.</p>
            
            <h4>2. Pembayaran</h4>
            <p>Pembayaran harus dilakukan sesuai dengan instruksi yang akan diberikan setelah pendaftaran.</p>
            
            <h4>3. Dokumen</h4>
            <p>Semua dokumen yang diupload harus asli dan valid. Dokumen palsu akan mengakibatkan pembatalan pendaftaran.</p>
            
            <h4>4. Jadwal Pelatihan</h4>
            <p>Jadwal pelatihan akan dikonfirmasi setelah pembayaran lunas dan verifikasi dokumen selesai.</p>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="primary" @click="showTermsDialog = false">
            Tutup
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="5000"
      location="top"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Tutup
        </v-btn>
      </template>
    </v-snackbar>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { useParticipantStore } from '@/stores/participant'
import { useAuthStore } from '@/stores/auth-simple'

const router = useRouter()
const participantStore = useParticipantStore()
const authStore = useAuthStore()

// Check if this is edit mode
const editMode = ref(false)
const editParticipantId = ref(null)

// Reactive data
const currentStep = ref(1)
const submitting = ref(false)
const showSuccessDialog = ref(false)
const showTermsDialog = ref(false)
const registrationNumber = ref('')

// Form data
const formData = ref({
  fullName: '',
  registrationDate: new Date().toISOString().split('T')[0], // Auto generate today's date
  nik: '',
  placeOfBirth: '',
  dateOfBirth: '',
  gender: '',
  motherName: '',
  nationality: 'Indonesia',
  address: '',
  province: '',
  city: '',
  district: '',
  village: '',
  rtRw: '',
  postalCode: '',
  phone: authStore.user?.phone || '',
  email: authStore.user?.email || '',
  trainingPrograms: [],
  hasBSTCertificate: false,
  documents: {},
  agreeToTerms: false,
  dataProcessingConsent: false
})

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Stepper items
const stepperItems = [
  { title: 'Pilih Diklat', value: 1 },
  { title: 'Data Diri', value: 2 },
  { title: 'Upload Dokumen', value: 3 },
  { title: 'Pembayaran', value: 4 },
  { title: 'Review', value: 5 }
]

// Training program options
const trainingProgramOptions = computed(() => {
  if (!participantStore.trainingTypes) return []
  return Object.entries(participantStore.trainingTypes).map(([key, value]) => ({
    value: key,
    text: `${key} - ${value.name}`,
    description: value.description
  }))
})

// Selected training types details
const selectedTrainingTypes = computed(() => {
  if (!formData.value.trainingPrograms || !participantStore.trainingTypes) return []
  return formData.value.trainingPrograms.map(program => ({
    key: program,
    ...participantStore.trainingTypes[program]
  })).filter(training => training.name) // Filter out undefined programs
})

// Training program prices (same as agent)
const trainingPrices = {
  BST: 1875000,          // 1jt 875rb
  SAT: 975000,           // 975rb
  CCM: 1325000,          // 1jt 325rb (merged CCM_CMT and CCM_CMHBT)
  SDSD: 975000,          // 975rb
  PSCRB: 1225000,        // 1jt 225rb
  SB: 1075000,            // 1jt 75rb
  UPDATING_BST: 275000   // 275rb
}

// Total price calculation
const totalPrice = computed(() => {
  return formData.value.trainingPrograms.reduce((total, program) => {
    return total + (trainingPrices[program] || 0)
  }, 0)
})

// Check if participant has basic training (BST)
const hasBasicTraining = computed(() => {
  return formData.value.trainingPrograms.includes('BST') || 
         formData.value.trainingPrograms.includes('UPDATING_BST')
})

// Check if selected programs need BST certificate
const needsBSTCertificateUpload = computed(() => {
  // Programs that require BST certificate (excluding BST itself as it creates new certificate)
  const programsNeedingBST = ['SAT', 'CCM', 'SDSD', 'PSCRB', 'UPDATING_BST']
  return formData.value.trainingPrograms.some(program => programsNeedingBST.includes(program))
})

// Show BST checkbox if programs need BST but user doesn't have basic training
const showBSTCheckbox = computed(() => {
  return needsBSTCertificateUpload.value && !hasBasicTraining.value
})

// Combined required documents
const combinedRequiredDocs = computed(() => {
  const allDocs = new Set()
  selectedTrainingTypes.value.forEach(training => {
    if (training.requiredDocuments) {
      training.requiredDocuments.forEach(doc => allDocs.add(doc))
    }
  })
  return Array.from(allDocs)
})

// Required documents for upload
const requiredDocuments = computed(() => {
  if (!selectedTrainingTypes.value.length) return []
  
  // Collect all required documents from selected training programs
  const allDocs = new Set()
  selectedTrainingTypes.value.forEach(training => {
    training.requiredDocuments?.forEach(doc => {
      // Skip sertifikat_bst from automatic inclusion - we'll handle it separately
      if (doc !== 'sertifikat_bst') {
        allDocs.add(doc)
      }
    })
  })
  
  // Add BST certificate if user confirms they have it and any selected program needs it
  if (formData.value.hasBSTCertificate && needsBSTCertificateUpload.value) {
    allDocs.add('sertifikat_bst')
  }
  
  // Convert to the format expected by the template
  const documentMap = {
    ktp: { key: 'ktp', name: 'KTP/Identitas', icon: 'mdi-card-account-details' },
    ijazah: { key: 'ijazah', name: 'Ijazah Terakhir', icon: 'mdi-certificate' },
    foto: { key: 'foto', name: 'Pas Foto 4x6', icon: 'mdi-account-box' },
    surat_sehat: { key: 'surat_sehat', name: 'Surat Sehat', icon: 'mdi-heart-pulse' },
    passport: { key: 'passport', name: 'Passport', icon: 'mdi-passport' },
    sertifikat_bst: { 
      key: 'sertifikat_bst', 
      name: 'Sertifikat BST', 
      icon: 'mdi-certificate',
      note: 'Upload scan/foto sertifikat BST yang masih berlaku'
    }
  }
  
  return Array.from(allDocs).map(doc => documentMap[doc]).filter(Boolean)
})

// Options
const genderOptions = [
  { title: 'Laki-laki', value: 'male' },
  { title: 'Perempuan', value: 'female' }
]



// Validation rules
const rules = {
  required: value => !!value || 'Field ini wajib diisi',
  email: value => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Format email tidak valid'
  },
  phone: value => {
    const pattern = /^(08|62)[0-9]{8,13}$/
    return pattern.test(value) || 'Format nomor HP tidak valid (contoh: 08xxxxxxxxxx)'
  },
  nik: value => {
    const pattern = /^[0-9]{16}$/
    return pattern.test(value) || 'NIK harus 16 digit angka'
  },
  postalCode: value => {
    const pattern = /^[0-9]{5}$/
    return pattern.test(value) || 'Kode pos harus 5 digit angka'
  },
  minimumAge: value => {
    if (!value) return true
    const birthDate = new Date(value)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    return age >= 17 || 'Umur minimal 17 tahun'
  },
  requiredBSTConfirmation: value => {
    if (!showBSTCheckbox.value) return true
    return !!value || 'Konfirmasi kepemilikan sertifikat BST diperlukan'
  },
  requiredAgreement: value => !!value || 'Persetujuan ini wajib dicentang'
}

// Methods
const getTrainingChipColor = (program) => {
  const colors = {
    BST: 'blue',
    SAT: 'green',
    CCM: 'purple',
    SDSD: 'orange',
    PSCRB: 'cyan',
    SB: 'teal',
    UPDATING_BST: 'amber'
  }
  return colors[program] || 'grey'
}

const onTrainingProgramChange = (programs) => {
  // Reset BST certificate when programs change and BST is no longer needed
  if (!needsBSTCertificateUpload.value) {
    formData.value.hasBSTCertificate = false
  }
}

const removeTrainingProgram = (program) => {
  const index = formData.value.trainingPrograms.indexOf(program)
  if (index > -1) {
    formData.value.trainingPrograms.splice(index, 1)
  }
}

const onNikInput = (event) => {
  // Only allow numbers
  const value = event.target.value.replace(/\D/g, '')
  formData.value.nik = value.slice(0, 16)
}

const validateFile = (files, docType) => {
  if (!files || files.length === 0) return
  
  const file = files[0]
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (file.size > maxSize) {
    showSnackbar('File terlalu besar. Maksimal 5MB.', 'error')
    formData.value.documents[docType] = null
    return
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    showSnackbar('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.', 'error')
    formData.value.documents[docType] = null
    return
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const canProceedToNext = computed(() => {
  switch (currentStep.value) {
    case 1:
      return formData.value.fullName && 
             formData.value.trainingPrograms.length > 0 &&
             (!showBSTCheckbox.value || formData.value.hasBSTCertificate)
    case 2:
      return formData.value.nik && 
             formData.value.placeOfBirth && 
             formData.value.dateOfBirth && 
             formData.value.gender && 
             formData.value.motherName && 
             formData.value.nationality && 
             formData.value.address && 
             formData.value.province && 
             formData.value.city && 
             formData.value.district && 
             formData.value.village && 
             formData.value.rtRw && 
             formData.value.postalCode && 
             formData.value.phone && 
             formData.value.email
    case 3:
      return requiredDocuments.value.every(doc => 
        formData.value.documents[doc.key]
      )
    case 4:
      return formData.value.documents.payment_proof
    default:
      return true
  }
})

const canSubmit = computed(() => {
  return canProceedToNext.value && 
         formData.value.agreeToTerms && 
         formData.value.dataProcessingConsent
})

const nextStep = () => {
  if (canProceedToNext.value && currentStep.value < stepperItems.length) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const submitForm = async () => {
  if (!canSubmit.value) return
  
  submitting.value = true
  
  try {
    // Prepare submit data object
    const submitData = {
      fullName: formData.value.fullName,
      nik: formData.value.nik,
      email: formData.value.email,
      phone: formData.value.phone,
      birthDate: formData.value.dateOfBirth,
      birthPlace: formData.value.placeOfBirth,
      gender: formData.value.gender,
      address: formData.value.address,
      registrationDate: formData.value.registrationDate,
      motherName: formData.value.motherName,
      nationality: formData.value.nationality,
      province: formData.value.province,
      city: formData.value.city,
      district: formData.value.district,
      village: formData.value.village,
      rtRw: formData.value.rtRw,
      postalCode: formData.value.postalCode,
      hasBSTCertificate: formData.value.hasBSTCertificate === 'true' || formData.value.hasBSTCertificate === true,
      agreeToTerms: formData.value.agreeToTerms,
      dataProcessingConsent: formData.value.dataProcessingConsent,
      trainingPrograms: JSON.stringify(formData.value.trainingPrograms),
      files: {}
    }
    
    // Add files to submitData - mimicking agency submission structure
    console.log('=== FRONTEND DEBUG - Documents before processing ===')
    console.log('formData.value.documents:', formData.value.documents)
    console.log('Object.keys(formData.value.documents):', Object.keys(formData.value.documents))
    
    Object.keys(formData.value.documents).forEach(docKey => {
      const fileInput = formData.value.documents[docKey]
      console.log(`Processing document ${docKey}:`, fileInput)
      console.log(`fileInput type:`, typeof fileInput)
      console.log(`fileInput is array:`, Array.isArray(fileInput))
      console.log(`fileInput length:`, fileInput?.length)
      
      if (fileInput) {
        // Handle FileList from v-file-input
        if (fileInput.length > 0) {
          console.log(`Found file for ${docKey}:`, fileInput[0])
          console.log(`File details:`, {
            name: fileInput[0].name,
            size: fileInput[0].size,
            type: fileInput[0].type
          })
          submitData.files[docKey] = fileInput[0]
        } else if (fileInput instanceof File) {
          console.log(`Direct file for ${docKey}:`, fileInput)
          submitData.files[docKey] = fileInput
        } else {
          console.log(`No valid file found for ${docKey}`)
        }
      } else {
        console.log(`No file input for ${docKey}`)
      }
    })
    
    console.log('=== FRONTEND DEBUG - Final submitData ===')
    console.log('submitData.files keys:', Object.keys(submitData.files))
    console.log('submitData.files:', submitData.files)
    
    // Additional check - count files
    const fileCount = Object.keys(submitData.files).length
    console.log(`Total files to upload: ${fileCount}`)
    
    let response
    if (editMode.value) {
      // Update existing participant
      response = await participantStore.updateParticipant(editParticipantId.value, submitData)
      if (response) {
        showSnackbar('Data berhasil diupdate!', 'success')
        goToDashboard()
      }
    } else {
      // Create new participant
      response = await participantStore.createParticipant(submitData)
      
      if (response) {
        // Handle multiple participants response (self-registration)
        if (response.registrationNumber) {
          registrationNumber.value = response.registrationNumber
        } else if (response.registrationNumber) {
          registrationNumber.value = response.registrationNumber
        } else {
          registrationNumber.value = 'TBD'
        }
        
        showSuccessDialog.value = true
        showSnackbar('Pendaftaran berhasil disubmit!', 'success')
      }
    }
    
    if (!response) {
      throw new Error('Gagal menyimpan data')
    }
  } catch (error) {
    console.error('Submit error:', error)
    showSnackbar(error.message || 'Terjadi kesalahan saat menyimpan data', 'error')
  } finally {
    submitting.value = false
  }
}

const goToDashboard = () => {
  router.push('/dashboard')
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

// Auto-fill data from user account
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    formData.value.email = newUser.email
    if (newUser.phone) {
      formData.value.phone = newUser.phone
    }
    if (newUser.fullName) {
      formData.value.fullName = newUser.fullName
    }
  }
}, { immediate: true })

// Load existing participant data for edit
const loadExistingData = async (participantId) => {
  try {
    const response = await participantStore.fetchParticipantById(participantId)
    if (response.success) {
      const participant = response.data.participant
      
      // Populate form with existing data
      formData.value.fullName = participant.fullName || ''
      formData.value.nik = participant.nik || ''
      formData.value.placeOfBirth = participant.birthPlace || ''
      formData.value.dateOfBirth = participant.birthDate ? participant.birthDate.split('T')[0] : ''
      formData.value.gender = participant.gender || ''
      formData.value.address = participant.address || ''
      formData.value.phone = participant.phone || ''
      formData.value.email = participant.email || ''
      formData.value.trainingPrograms = participant.trainingProgram ? [participant.trainingProgram] : []
      
      // Parse additional data from notes if exists
      if (participant.notes) {
        try {
          const additionalData = JSON.parse(participant.notes)
          formData.value.registrationDate = additionalData.registrationDate || new Date().toISOString().split('T')[0]
          formData.value.motherName = additionalData.motherName || ''
          formData.value.nationality = additionalData.nationality || 'Indonesia'
          formData.value.province = additionalData.province || ''
          formData.value.city = additionalData.city || ''
          formData.value.district = additionalData.district || ''
          formData.value.village = additionalData.village || ''
          formData.value.rtRw = additionalData.rtRw || ''
          formData.value.postalCode = additionalData.postalCode || ''
          formData.value.hasBSTCertificate = additionalData.hasBSTCertificate || false
        } catch (e) {
          console.warn('Could not parse additional data from notes:', e)
        }
      }
      
      registrationNumber.value = participant.registrationNumber
    }
  } catch (error) {
    console.error('Failed to load participant data:', error)
    showSnackbar('Gagal memuat data peserta', 'error')
    router.back()
  }
}

// Initialize
onMounted(async () => {
  try {
    // Check if edit mode
    const editId = router.currentRoute.value.query.edit
    if (editId) {
      editMode.value = true
      editParticipantId.value = editId
    }
    
    await participantStore.fetchTrainingTypes()
    
    if (editMode.value) {
      // Load existing participant data
      await loadExistingData(editParticipantId.value)
    } else {
      // Pre-fill user data and set registration date for new registration
      formData.value.registrationDate = new Date().toISOString().split('T')[0]
      
      if (authStore.user) {
        formData.value.email = authStore.user.email
        if (authStore.user.fullName) {
          formData.value.fullName = authStore.user.fullName
        }
        if (authStore.user.phone) {
          formData.value.phone = authStore.user.phone
        }
      }
    }
  } catch (error) {
    console.error('Failed to load training types:', error)
    showSnackbar('Gagal memuat data jenis pelatihan', 'error')
  }
})
</script>

<style scoped>
.terms-content h4 {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #1976d2;
}

.terms-content p {
  margin-bottom: 1rem;
  line-height: 1.5;
}
</style>