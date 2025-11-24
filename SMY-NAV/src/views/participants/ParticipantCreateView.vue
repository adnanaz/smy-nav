<template>
  <DashboardLayout page-title="Tambah Peserta Baru">
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
          <h1 class="text-h4 font-weight-bold mb-1">Tambah Peserta Baru</h1>
          <p class="text-subtitle-1 text-grey-darken-1">Isi formulir di bawah untuk mendaftarkan peserta pelatihan maritim</p>
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
                Data Peserta & Pilih Jenis Diklat
              </h3>
              
              <!-- Nama Lengkap -->
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="formData.fullName"
                    label="Nama Lengkap Peserta *"
                    variant="outlined"
                    :rules="[rules.required]"
                    prepend-inner-icon="mdi-account"
                    placeholder="Masukkan nama lengkap peserta"
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
                        <!-- <v-list-item-title>{{ item.raw.text }}</v-list-item-title> -->
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
                        Anda memilih diklat yang membutuhkan Sertifikat BST. Mohon konfirmasi apakah peserta sudah memiliki sertifikat tersebut.
                      </v-alert>
                      
                      <v-checkbox
                        v-model="formData.hasBSTCertificate"
                        label="Peserta sudah memiliki Sertifikat BST"
                        color="primary"
                        :rules="showBSTCheckbox ? [rules.requiredBSTConfirmation] : []"
                      >
                        <template #label>
                          <span class="text-body-1">
                            Peserta sudah memiliki Sertifikat BST 
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
                          <strong>Perhatian:</strong> Untuk mengikuti diklat yang dipilih, peserta harus memiliki Sertifikat BST terlebih dahulu. 
                          Silakan centang checkbox jika peserta sudah memiliki sertifikat BST, atau pertimbangkan untuk mendaftar BST terlebih dahulu.
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
                    <v-alert 
                      type="info" 
                      variant="tonal" 
                      density="compact"
                      icon="mdi-information"
                      class="mb-3"
                    >
                      <strong>Catatan:</strong> Waktu proses ini adalah estimasi kasar, sertifikat bisa jadi lebih cepat daripada itu.
                    </v-alert>
                    
                    <v-alert 
                      v-if="showBSTCheckbox && !formData.hasBSTCertificate"
                      type="warning" 
                      variant="tonal" 
                      density="compact"
                      icon="mdi-alert"
                      class="mb-3"
                    >
                      <strong>Perhatian:</strong> Anda belum mengkonfirmasi kepemilikan Sertifikat BST. Silakan centang checkbox konfirmasi di atas untuk melanjutkan.
                    </v-alert>

                    <v-alert 
                      v-if="formData.hasBSTCertificate && needsBSTCertificateUpload"
                      type="success" 
                      variant="tonal" 
                      density="compact"
                      icon="mdi-check"
                      class="mb-3"
                    >
                      <strong>Bagus:</strong> Sertifikat BST akan diminta untuk diupload di step berikutnya.
                    </v-alert>

                    <div>
                      <v-chip-group class="mt-2">
                        <v-chip
                          v-for="doc in requiredDocuments"
                          :key="doc"
                          size="small"
                          :variant="doc === 'passport_optional' ? 'outlined' : 'tonal'"
                          :color="doc === 'passport_optional' ? 'grey' : 'primary'"
                        >
                          {{ getDocumentName(doc) }}
                          <v-icon v-if="doc === 'passport_optional'" end size="small">mdi-help-circle</v-icon>
                        </v-chip>
                      </v-chip-group>
                    </div>

                    <!-- Total Cost Summary -->
                    <v-divider class="my-4" />
                    <div class="d-flex justify-space-between align-center">
                      <div>
                        <strong class="text-h6">Total Biaya:</strong>
                        <div class="text-caption text-grey-darken-1">
                          {{ formData.trainingPrograms.length }} program diklat
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-h5 font-weight-bold text-success">
                          {{ formatCurrency(totalCost) }}
                        </div>
                        <div class="text-caption text-grey-darken-1">
                          Per peserta
                        </div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </v-card-text>
          </template>

          <template #item.2>
            <v-card-text class="pa-6">
              <h3 class="text-h6 mb-4">
                <v-icon class="me-2">mdi-file-document-multiple</v-icon>
                Upload Dokumen
              </h3>
              
              <v-alert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                Upload dokumen sesuai dengan jenis diklat yang dipilih. Pastikan file dalam format JPG, PNG, atau PDF dengan ukuran maksimal 3MB.
                <div v-if="formData.hasBSTCertificate && needsBSTCertificateUpload" class="mt-2">
                  <strong>Catatan:</strong> Karena Anda sudah mengkonfirmasi kepemilikan Sertifikat BST, pastikan untuk upload scan sertifikat tersebut.
                </div>
              </v-alert>

              <v-row v-if="selectedTrainingTypes.length > 0">
                  <!-- KTP -->
                  <v-col cols="12" md="6" v-if="requiredDocuments.includes('ktp')">
                    <v-file-input
                      v-model="formData.files.ktp"
                      label="Scan KTP *"
                      variant="outlined"
                      accept="image/*,.pdf"
                      prepend-icon="mdi-card-account-details"
                      show-size
                      @change="validateFileSize"
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
                      show-size
                      @change="validateFileSize"
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
                      show-size
                      @change="validateFileSize"
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
                      show-size
                      @change="validateFileSize"
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
                      @change="validateFileSize"
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
                      show-size
                      @change="validateFileSize"
                    />
                  </v-col>
                </v-row>
            </v-card-text>
          </template>

          <template #item.3>
            <v-card-text class="pa-6">
              <h3 class="text-h6 mb-4">
                <v-icon class="me-2">mdi-credit-card</v-icon>
                Pilihan Pembayaran
              </h3>
              
              <v-alert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                Pilih metode pembayaran untuk biaya pelatihan. Pembayaran dapat dilakukan sekarang atau nanti ketika sertifikat sudah jadi.
              </v-alert>

              <!-- Total Cost Display -->
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="bg-blue-lighten-5">
                  <v-icon class="me-2">mdi-calculator</v-icon>
                  Rincian Biaya
                </v-card-title>
                <v-card-text>
                  <div v-for="program in formData.trainingPrograms" :key="program" class="d-flex justify-space-between align-center mb-2">
                    <div class="d-flex align-center">
                      <v-chip
                        :color="getTrainingChipColor(program)"
                        variant="tonal"
                        size="small"
                        class="me-2"
                      >
                        {{ program }}
                      </v-chip>
                      <span>{{ getTrainingProgramName(program) }}</span>
                    </div>
                    <span class="font-weight-medium">{{ formatCurrency(trainingPrices[program] || 0) }}</span>
                  </div>
                  <v-divider class="my-3" />
                  <div class="d-flex justify-space-between align-center">
                    <strong class="text-h6">Total Pembayaran:</strong>
                    <strong class="text-h5 text-success">{{ formatCurrency(totalCost) }}</strong>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Payment Options -->
              <v-row>
                <v-col cols="12">
                  <v-radio-group
                    v-model="formData.paymentOption"
                    :rules="[rules.required]"
                  >
                    <v-radio
                      label="Bayar Sekarang"
                      value="pay_now"
                      color="success"
                    >
                      <template #label>
                        <div class="d-flex align-center">
                          <v-icon color="success" class="me-2">mdi-cash-multiple</v-icon>
                          <span class="text-body-1 font-weight-medium">Bayar Sekarang</span>
                        </div>
                      </template>
                    </v-radio>
                    
                    <v-radio
                      label="Bayar Nanti"
                      value="pay_later"
                      color="orange"
                    >
                      <template #label>
                        <div class="d-flex align-center">
                          <v-icon color="orange" class="me-2">mdi-clock-outline</v-icon>
                          <span class="text-body-1 font-weight-medium">Bayar Nanti</span>
                        </div>
                      </template>
                    </v-radio>
                  </v-radio-group>
                </v-col>
              </v-row>

              <!-- Bank Transfer Info for Pay Now -->
              <v-card v-if="formData.paymentOption === 'pay_now'" variant="outlined" class="mt-4">
                <v-card-title class="bg-success-lighten-4">
                  <v-icon class="me-1">mdi-bank</v-icon>
                  Informasi Transfer Bank
                </v-card-title>
                <v-card-text>
                  <div class="mb-3 d-flex align-center">
                    <v-alert class="me-6" 
                      type="info" 
                      variant="tonal" 
                      density="compact"
                      icon="mdi-bank-transfer">
                     <strong>Bank:</strong> BCA (Bank Central Asia)<br>
                      <strong>No. Rekening : </strong>0607749888<br>
                      <strong>Atas Nama :</strong>  PT SAMUDRA MARITIM YOGYAKARTA
                    </v-alert>
                    <v-alert 
                      type="warning" 
                      variant="tonal" 
                      density="compact"
                      icon="mdi-bank-transfer"
                     class="me-6">
                     <strong>Bank:</strong> BNI (Bank Negara Indonesia)<br>
                      <strong>No. Rekening : </strong>8118881158<br>
                      <strong>Atas Nama :</strong>  PT SAMUDRA MARITIM YOGYAKARTA
                    </v-alert>
                  </div>
                  
                  <v-alert 
                    type="success" 
                    variant="tonal" 
                    density="compact"
                    icon="mdi-cash"
                    class="mb-3"
                  >
                    <strong>Total yang harus dibayar: {{ formatCurrency(totalCost) }}</strong><br>
                    Silakan transfer sesuai nominal di atas ke salah satu rekening bank.
                  </v-alert>
                  
                  <v-alert 
                    type="error" 
                    variant="tonal" 
                    density="compact"
                    icon="mdi-information"
                    class="mb-3"
                  >
                    <strong>Penting:</strong> Pembayaran akan dicek oleh <b>Admin & Finance</b> setelah Anda mengupload bukti transfer.
                  </v-alert>

                  <!-- Upload Payment Proof -->
                  <v-file-input
                    v-model="formData.files.payment_proof"
                    label="Upload Bukti Transfer *"
                    variant="outlined"
                    accept="image/*,.pdf"
                    prepend-icon="mdi-receipt"
                    show-size
                    :rules="formData.paymentOption === 'pay_now' ? [rules.requiredFile] : []"
                    @change="validateFileSize"
                  />
                </v-card-text>
              </v-card>

              <!-- Pay Later Info -->
              <v-card v-if="formData.paymentOption === 'pay_later'" variant="outlined" class="mt-4">
                <v-card-title class="bg-orange-lighten-4">
                  <v-icon class="me-2">mdi-information</v-icon>
                  Informasi Bayar Nanti
                </v-card-title>
                <v-card-text>
                  <v-alert 
                    type="info" 
                    variant="tonal" 
                    density="compact"
                    icon="mdi-clock-outline"
                    class="mt-3"
                  >
                    <strong>Ketentuan Bayar Nanti:</strong><br>
                    • Anda akan diminta untuk melakukan pembayaran ketika sertifikat sudah jadi<br>
                    • Sertifikat akan diberikan setelah pembayaran lunas<br>
                    • Tim kami akan menghubungi Anda untuk konfirmasi pembayaran
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-card-text>
          </template>

          <template #item.4>
            <v-card-text class="pa-6">
              <h3 class="text-h6 mb-4">
                <v-icon class="me-2">mdi-check-circle</v-icon>
                Konfirmasi Data
              </h3>
              
              <!-- Summary Data -->
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title class="bg-grey-lighten-4">Program Pelatihan</v-card-title>
                    <v-card-text>
                      <div class="mb-3">
                        <strong>Jenis Diklat ({{ formData.trainingPrograms.length }}):</strong>
                        <v-chip-group class="mt-2">
                          <v-chip
                            v-for="program in formData.trainingPrograms"
                            :key="program"
                            :color="getTrainingChipColor(program)"
                            variant="tonal"
                            size="small"
                          >
                            {{ program }} - {{ getTrainingProgramName(program) }}
                          </v-chip>
                        </v-chip-group>
                      </div>
                      <div v-if="formData.hasBSTCertificate && needsBSTCertificateUpload" class="mb-2">
                        <v-alert 
                          type="success" 
                          variant="tonal" 
                          density="compact"
                          icon="mdi-check"
                        >
                          Sertifikat BST dikonfirmasi tersedia
                        </v-alert>
                      </div>
                    </v-card-text>
                  </v-card>

                  <v-card variant="outlined" class="mt-4">
                    <v-card-title class="bg-grey-lighten-4">Dokumen Terupload</v-card-title>
                    <v-card-text>
                      <v-chip-group>
                        <v-chip
                          v-for="(file, key) in getUploadedFiles()"
                          :key="key"
                          size="small"
                          color="success"
                          variant="tonal"
                        >
                          <v-icon start>mdi-check</v-icon>
                          {{ getDocumentName(key) }}
                        </v-chip>
                      </v-chip-group>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title class="bg-grey-lighten-4">Informasi Pembayaran</v-card-title>
                    <v-card-text>
                      <div class="mb-3">
                        <strong>Total Biaya:</strong>
                        <div class="text-h6 text-success font-weight-bold">{{ formatCurrency(totalCost) }}</div>
                        <div class="text-caption text-grey-darken-1">
                          {{ formData.trainingPrograms.length }} program diklat
                        </div>
                      </div>
                      
                      <div class="mb-3">
                        <strong>Metode Pembayaran:</strong>
                        <v-chip
                          :color="formData.paymentOption === 'pay_now' ? 'success' : 'orange'"
                          variant="tonal"
                          size="small"
                          class="ml-2"
                        >
                          {{ formData.paymentOption === 'pay_now' ? 'Bayar Sekarang' : 'Bayar Nanti' }}
                        </v-chip>
                      </div>
                      
                      <div v-if="formData.paymentOption === 'pay_now' && formData.files.payment_proof" class="mb-2">
                        <v-alert 
                          type="success" 
                          variant="tonal" 
                          density="compact"
                          icon="mdi-check"
                        >
                          Bukti transfer telah diupload
                        </v-alert>
                      </div>
                      
                      <div v-if="formData.paymentOption === 'pay_later'" class="mb-2">
                        <v-alert 
                          type="info" 
                          variant="tonal" 
                          density="compact"
                          icon="mdi-clock-outline"
                        >
                          Pembayaran akan dilakukan setelah sertifikat jadi
                        </v-alert>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </template>
        </v-stepper>
      </v-card>

      <!-- Navigation Actions -->
      <v-card elevation="2">
        <v-card-actions class="pa-4">
          <v-btn
            v-if="currentStep > 1"
            @click="previousStep"
            :disabled="loading"
          >
            <v-icon start>mdi-chevron-left</v-icon>
            Sebelumnya
          </v-btn>
          
          <v-spacer />
          
          <v-btn
            v-if="currentStep < stepperItems.length"
            color="primary"
            @click="nextStep"
            :disabled="!canProceedToNext"
          >
            Selanjutnya
            <v-icon end>mdi-chevron-right</v-icon>
          </v-btn>
          
          <v-btn
            v-if="currentStep === stepperItems.length"
            color="success"
            @click="submitForm"
            :loading="loading"
            :disabled="!canSubmit"
          >
            <v-icon start>mdi-content-save</v-icon>
            Simpan Peserta
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>

    <!-- Success Dialog -->
    <v-dialog v-model="successDialog" max-width="500" persistent>
      <v-card>
        <v-card-text class="text-center pa-8">
          <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
          <h2 class="text-h5 mb-4">Peserta Berhasil Ditambahkan!</h2>
          <p class="text-body-1 mb-4">
            <span v-if="createdParticipant?.summary">
              Berhasil mendaftarkan <strong>{{ createdParticipant.summary.totalPrograms }} program pelatihan</strong> 
              dengan nomor registrasi dasar <strong>{{ createdParticipant.summary.registrationNumber }}</strong>
              <br>
              <small class="text-grey-darken-1">
                Program: {{ createdParticipant.summary.trainingPrograms.join(', ') }}
              </small>
            </span>
            <span v-else>
              Data peserta untuk program <strong>{{ getTrainingProgramName(createdParticipant?.trainingProgram) }}</strong> telah berhasil disimpan dengan nomor registrasi 
              <strong>{{ createdParticipant?.registrationNumber }}</strong>
            </span>
          </p>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-btn
            block
            color="primary"
            @click="goToParticipantList"
          >
            Lihat Daftar Peserta
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { useParticipantStore } from '@/stores/participant'

const router = useRouter()
const participantStore = useParticipantStore()

// Reactive data
const currentStep = ref(1)
const loading = ref(false)
const documentsValid = ref(false)
const successDialog = ref(false)
const errorSnackbar = ref(false)
const errorMessage = ref('')
const createdParticipant = ref(null)

const formData = ref({
  fullName: '', // Nama lengkap peserta
  trainingPrograms: [], // Changed to array for multiple selection
  hasBSTCertificate: false, // Checkbox for BST certificate ownership
  paymentOption: null, // pay_now or pay_later
  files: {
    ktp: null,
    ijazah: null,
    foto: null,
    surat_sehat: null,
    passport: null,
    sertifikat_bst: null,
    payment_proof: null
  }
})

// Stepper configuration
const stepperItems = [
  { title: 'Jenis Diklat', value: 1 },
  { title: 'Upload Dokumen', value: 2 },
  { title: 'Pembayaran', value: 3 },
  { title: 'Konfirmasi', value: 4 }
]

// Training program prices
const trainingPrices = {
  BST: 1875000,          // 1jt 875rb
  SAT: 975000,           // 975rb
  CCM: 1325000,          // 1jt 325rb
  SDSD: 975000,          // 975rb
  PSCRB: 1225000,        // 1jt 225rb
  SB: 1075000,           // 1jt 75rb
  UPDATING_BST: 275000   // 275rb
}

// Computed
const trainingTypes = computed(() => participantStore.trainingTypes)

const trainingProgramOptions = computed(() => {
  if (!trainingTypes.value) return []
  return Object.entries(trainingTypes.value).map(([key, value]) => ({
    value: key,
    text: value.name,
    description: value.description
  }))
})

const selectedTrainingTypes = computed(() => {
  if (!formData.value.trainingPrograms || !trainingTypes.value) return []
  return formData.value.trainingPrograms.map(program => ({
    key: program,
    ...trainingTypes.value[program]
  }))
})

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
  
  return Array.from(allDocs)
})

const hasBasicTraining = computed(() => {
  return formData.value.trainingPrograms.includes('BST') || 
         formData.value.trainingPrograms.includes('UPDATING_BST')
})

const needsBSTCertificateUpload = computed(() => {
  // Programs that require BST certificate (excluding BST itself as it creates new certificate)
  const programsNeedingBST = ['SAT', 'CCM_CMHBT', 'CCM_CMT', 'SDSD', 'PSCRB', 'UPDATING_BST']
  return formData.value.trainingPrograms.some(program => programsNeedingBST.includes(program))
})

const showBSTCheckbox = computed(() => {
  return needsBSTCertificateUpload.value && !hasBasicTraining.value
})

// Calculate total cost
const totalCost = computed(() => {
  if (!formData.value.trainingPrograms || !formData.value.trainingPrograms.length) {
    return 0
  }
  
  return formData.value.trainingPrograms.reduce((total, program) => {
    return total + (trainingPrices[program] || 0)
  }, 0)
})

// Format currency
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
      const hasPrograms = formData.value.trainingPrograms && formData.value.trainingPrograms.length > 0
      // If BST checkbox is shown, it must be checked to proceed
      const bstConfirmed = !showBSTCheckbox.value || formData.value.hasBSTCertificate
      return hasPrograms && bstConfirmed
    case 2:
      return documentsValid.value
    case 3:
      // Payment step validation
      const hasPaymentOption = !!formData.value.paymentOption
      if (formData.value.paymentOption === 'pay_now') {
        // Check if payment proof is uploaded
        const paymentProof = formData.value.files.payment_proof
        const hasPaymentProof = paymentProof && (
          (Array.isArray(paymentProof) && paymentProof.length > 0) ||
          (!Array.isArray(paymentProof) && paymentProof)
        )
        return hasPaymentOption && hasPaymentProof
      } else {
        return hasPaymentOption
      }
    default:
      return false
  }
})

const canSubmit = computed(() => {
  const hasPrograms = formData.value.trainingPrograms && formData.value.trainingPrograms.length > 0
  const bstConfirmed = !showBSTCheckbox.value || formData.value.hasBSTCertificate
  const hasPaymentOption = !!formData.value.paymentOption
  
  // Check payment validation
  let paymentValid = false
  if (formData.value.paymentOption === 'pay_later') {
    paymentValid = true
  } else if (formData.value.paymentOption === 'pay_now') {
    const paymentProof = formData.value.files.payment_proof
    paymentValid = paymentProof && (
      (Array.isArray(paymentProof) && paymentProof.length > 0) ||
      (!Array.isArray(paymentProof) && paymentProof)
    )
  }
  
  return hasPrograms && bstConfirmed && documentsValid.value && hasPaymentOption && paymentValid
})

// Validation rules
const rules = {
  required: (value) => {
    if (Array.isArray(value)) {
      return value.length > 0 || 'Field ini wajib diisi'
    }
    return !!value || 'Field ini wajib diisi'
  },
  requiredFile: (value) => {
    if (!value) return 'File wajib diupload'
    if (Array.isArray(value)) {
      return value.length > 0 || 'File wajib diupload'
    }
    return !!value || 'File wajib diupload'
  },
  requiredBSTConfirmation: (value) => {
    return !!value || 'Anda harus mengkonfirmasi kepemilikan Sertifikat BST untuk melanjutkan'
  }
}

// Methods
const removeTrainingProgram = (programToRemove) => {
  formData.value.trainingPrograms = formData.value.trainingPrograms.filter(
    program => program !== programToRemove
  )
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
  // Reset BST certificate checkbox
  formData.value.hasBSTCertificate = false
  documentsValid.value = false
}

const validateFileSize = (files) => {
  if (!files || files.length === 0) return
  
  const file = files[0]
  const maxSize = 30 * 1024 * 1024 // 3MB
  
  if (file.size > maxSize) {
    errorMessage.value = `File ${file.name} terlalu besar. Maksimal 3MB.`
    errorSnackbar.value = true
    return false
  }
  return true
}

const nextStep = () => {
  if (canProceedToNext.value && currentStep.value < stepperItems.length) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const submitForm = async () => {
  if (!canSubmit.value) return
  
  loading.value = true
  
  try {
    const result = await participantStore.createAgencySubmission(formData.value)
    createdParticipant.value = result
    successDialog.value = true
  } catch (error) {
    errorMessage.value = error.message || 'Gagal menyimpan data peserta'
    errorSnackbar.value = true
  } finally {
    loading.value = false
  }
}

const goToParticipantList = async () => {
  // Close dialog first to avoid blank page navigation issue
  successDialog.value = false
  // Wait for next tick to ensure dialog is properly closed
  await nextTick()
  // Navigate to participant list
  router.push('/participants')
}

const getUploadedFiles = () => {
  const uploaded = {}
  Object.keys(formData.value.files).forEach(key => {
    const file = formData.value.files[key]
    // Check if file exists - handle both array and direct file formats
    const hasFile = file && (
      (Array.isArray(file) && file.length > 0) ||
      (!Array.isArray(file) && file)
    )
    if (hasFile) {
      uploaded[key] = file
    }
  })
  return uploaded
}

// Utility methods
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
  return trainingTypes.value?.[program]?.name || program
}

const getDocumentName = (docType) => {
  const names = {
    ktp: 'KTP',
    ijazah: 'Ijazah',
    foto: 'Pas Foto',
    surat_sehat: 'Surat Sehat',
    passport: 'Passport',
    passport_optional: 'Passport (Opsional)',
    sertifikat_bst: 'Sertifikat BST',
    payment_proof: 'Bukti Transfer'
  }
  return names[docType] || docType
}

const formatDate = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'dd MMMM yyyy', { locale: idLocale })
}

// Lifecycle
onMounted(async () => {
  try {
    await participantStore.fetchTrainingTypes()
  } catch (error) {
    errorMessage.value = 'Gagal memuat data jenis diklat'
    errorSnackbar.value = true
  }
})

// Watch for file changes to update validation
watch(() => formData.value.files, () => {
  nextTick(() => {
    checkDocumentsValidation()
  })
}, { deep: true })

watch(() => formData.value.trainingPrograms, () => {
  nextTick(() => {
    checkDocumentsValidation()
  })
}, { deep: true })

watch(() => formData.value.hasBSTCertificate, () => {
  nextTick(() => {
    checkDocumentsValidation()
  })
})

const checkDocumentsValidation = () => {
  if (!formData.value.trainingPrograms || !formData.value.trainingPrograms.length || !requiredDocuments.value.length) {
    documentsValid.value = false
    return
  }
  
  let allValid = true
  
  for (const docType of requiredDocuments.value) {
    if (docType === 'passport_optional') continue // Skip optional documents
    
    const file = formData.value.files[docType === 'passport_optional' ? 'passport' : docType]
    if (!file || (Array.isArray(file) && file.length === 0)) {
      allValid = false
      break
    }
  }
  
  documentsValid.value = allValid
}
</script>

<style scoped>
.v-stepper >>> .v-stepper-header {
  box-shadow: none !important;
}

.v-file-input >>> .v-field__input {
  padding-top: 8px;
}

.v-textarea >>> .v-field__input {
  padding-top: 12px;
}
</style>