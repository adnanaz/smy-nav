<template>
  <DashboardLayout :page-title="pageTitle">
    <v-container fluid>
      <!-- Header -->
      <v-row class="mb-4">
        <v-col>
          <div class="d-flex justify-space-between align-center">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">
                {{ pageTitle }}
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
                <v-chip 
                  v-if="authStore.isParticipant" 
                  color="green" 
                  variant="tonal" 
                  size="small" 
                  class="ml-3"
                >
                  Participant
                </v-chip>
              </h1>
              <p class="text-subtitle-1 text-grey-darken-1">
                <template v-if="authStore.isParticipant">
                  Data pelatihan dan progress Anda
                </template>
                <template v-else-if="authStore.isAgent">
                  Kelola data peserta agency Anda
                </template>
                <template v-else>
                  Verifikasi dan kelola semua data peserta
                </template>
              </p>
            </div>
            <div class="d-flex gap-3">
              <v-btn
                v-if="authStore.isAgent"
                color="primary"
                prepend-icon="mdi-plus"
                size="large"
                @click="goToCreatePage"
              >
                Tambah Peserta
              </v-btn>
              <v-btn
                v-if="isParticipant"
                color="success"
                prepend-icon="mdi-school-outline"
                size="large"
                @click="goToDaftarDiklat"
              >
                Pengajuan Diklat
              </v-btn>
            </div>
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
                placeholder="Nama, NIK, atau No. Registrasi..."
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
                :items="trainingProgramOptions"
                label="Jenis Diklat"
                placeholder="Pilih jenis diklat..."
                variant="outlined"
                density="compact"
                clearable
                :loading="loading"
                item-title="text"
                item-value="value"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="filterStatus"
                :items="statusOptions"
                label="Status"
                placeholder="Pilih status..."
                variant="outlined"
                density="compact"
                clearable
                :loading="loading"
                item-title="text"
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
      </v-card>

      <!-- Data Table -->
      <v-card elevation="2">
        <!-- Table Header with Filter Indicators -->
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-account-group</v-icon>
            <span class="text-h6">Daftar Peserta</span>
            <v-chip
              v-if="pagination.total > 0"
              color="primary"
              variant="tonal"
              size="small"
              class="ml-3"
            >
              {{ pagination.total }} peserta
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
              {{ trainingProgramOptions.find(opt => opt.value === filterTrainingProgram)?.text }}
            </v-chip>
            <v-chip
              v-if="filterStatus"
              color="info"
              variant="outlined"
              size="x-small"
              closable
              @click:close="clearStatusFilter"
            >
              {{ statusOptions.find(opt => opt.value === filterStatus)?.text }}
            </v-chip>
          </div>
        </v-card-title>
        
        <v-divider />
        
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

          <!-- Agency (Admin only) -->
          <template #item.agency.name="{ item }">
            <div class="d-flex align-center">
              <v-icon icon="mdi-domain" size="16" class="me-2 text-grey-darken-1" />
              <div>
                <div class="font-weight-medium">{{ item.agency?.name || 'N/A' }}</div>
                <div class="text-caption text-grey-darken-1">{{ item.agency?.code || '' }}</div>
              </div>
            </div>
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

          <!-- Schedule Info -->
          <template #item.scheduleInfo="{ item }">
            <div v-if="item.scheduleInfo && shouldShowSchedule(item.status)">
              <div class="d-flex flex-column">
                <v-chip
                  :color="getCountdownColor(item.scheduleInfo.daysUntilStart)"
                  size="small"
                  variant="tonal"
                  class="mb-1"
                >
                  {{ item.scheduleInfo.countdownText }}
                </v-chip>
                <span class="text-caption text-grey mb-1">
                  {{ formatScheduleDate(item.scheduleInfo.startDate) }}
                </span>
                <v-btn
                  size="x-small"
                  variant="outlined"
                  color="primary"
                  @click="viewScheduleDetail(item.scheduleInfo)"
                  prepend-icon="mdi-information"
                >
                  Detail Kelas
                </v-btn>
              </div>
            </div>
            <div v-else class="text-grey text-caption">
              {{ getScheduleStatusText(item.status) }}
            </div>
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

          <!-- Payment Option -->
          <template #item.paymentOption="{ item }">
            <div class="d-flex flex-column align-start">
              <v-chip
                v-if="item.paymentOption"
                :color="getPaymentColor(item.paymentOption)"
                variant="tonal"
                size="small"
                class="mb-1"
              >
                {{ getPaymentText(item.paymentOption) }}
              </v-chip>
              <div v-else class="text-caption text-grey">-</div>
              
              <!-- Payment Proof Indicator for pay_now -->
              <div v-if="item.paymentOption === 'pay_now'" class="mt-1">
                <v-chip
                  v-if="item.paymentProof"
                  color="success"
                  variant="outlined"
                  size="x-small"
                  prepend-icon="mdi-check"
                >
                  Invoice Terlampir
                </v-chip>
                <v-chip
                  v-else
                  color="warning"
                  variant="outlined"
                  size="x-small"
                  prepend-icon="mdi-alert"
                >
                  Tidak ada Invoice Terlampir
                </v-chip>
              </div>
              
              <!-- Payment Proof Indicator for pay_later -->
              <div v-if="item.paymentOption === 'pay_later'" class="mt-1">
                <v-chip
                  v-if="item.paymentStatus === 'rejected'"
                  color="error"
                  variant="outlined"
                  size="x-small"
                  prepend-icon="mdi-close-circle"
                >
                  Ditolak - Perlu Upload Ulang
                </v-chip>
                <v-chip
                  v-else-if="item.status === 'completed' && !item.paymentProof"
                  color="error"
                  variant="outlined"
                  size="x-small"
                  prepend-icon="mdi-alert-circle"
                >
                  Perlu Bayar
                </v-chip>
                <v-chip
                  v-else-if="item.paymentProof && item.paymentStatus === 'pending'"
                  color="warning"
                  variant="outlined"
                  size="x-small"
                  prepend-icon="mdi-clock"
                >
                  Menunggu Verifikasi
                </v-chip>
                <v-chip
                  v-else-if="item.paymentProof && item.paymentStatus === 'approved'"
                  color="success"
                  variant="outlined"
                  size="x-small"
                  prepend-icon="mdi-check"
                >
                  Sudah Bayar & Disetujui
                </v-chip>
                <v-chip
                  v-else
                  color="info"
                  variant="outlined"
                  size="x-small"
                  prepend-icon="mdi-clock"
                >
                  Belum Waktunya
                </v-chip>
              </div>
            </div>
          </template>

          <!-- Payment Status (Agent only - to see admin approval) -->
          <template #item.paymentStatus="{ item }">
            <div class="d-flex flex-column align-start">
              <v-chip
                v-if="item.paymentStatus && item.paymentOption"
                :color="getPaymentStatusColor(item.paymentStatus)"
                variant="tonal"
                size="small"
                class="mb-1"
              >
                {{ getPaymentStatusText(item.paymentStatus) }}
              </v-chip>
              <div v-else class="text-caption text-grey">-</div>
              
              <!-- Admin notes indicator for agents -->
              <div v-if="item.adminNotes && authStore.isAgent" class="mt-1">
                <v-tooltip location="bottom">
                  <template #activator="{ props }">
                    <v-chip
                      v-bind="props"
                      color="info"
                      variant="outlined"
                      size="x-small"
                      prepend-icon="mdi-message-text"
                      @click="showAdminNotes(item)"
                      style="cursor: pointer;"
                    >
                      Ada Catatan
                    </v-chip>
                  </template>
                  <span>Klik untuk lihat catatan admin</span>
                </v-tooltip>
              </div>
            </div>
          </template>

          <!-- Notes -->
          <template #item.notes="{ item }">
            <div class="text-caption">
              <!-- Show different notes based on role -->
              <template v-if="authStore.isAgent">
                {{ item.notes || '-' }}
              </template>
              <template v-else>
                {{ item.adminNotes || item.notes || '-' }}
              </template>
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
                title="Lihat Detail"
              />
              
              <!-- Payment Proof View Button -->
              <v-btn
                v-if="item.paymentOption === 'pay_now' && item.paymentProof"
                icon="mdi-invoice"
                variant="text"
                size="small"
                color="success"
                @click="viewPaymentProof(item)"
                title="Lihat Bukti Transfer"
              />
              
              <!-- Payment Upload Button for pay_later when completed -->
              <template v-if="authStore.isAgent && item.paymentOption === 'pay_later' && item.status === 'completed'">
                <v-btn
                  v-if="!item.paymentProof || item.paymentStatus === 'rejected'"
                  icon="mdi-upload"
                  variant="text"
                  size="small"
                  :color="item.paymentStatus === 'rejected' ? 'error' : 'warning'"
                  @click="uploadPayment(item)"
                  :title="item.paymentStatus === 'rejected' ? 'Upload Ulang Bukti Pembayaran' : 'Upload Bukti Pembayaran'"
                />
                <v-btn
                  v-else-if="item.paymentProof && item.paymentStatus !== 'rejected'"
                  icon="mdi-invoice"
                  variant="text"
                  size="small"
                  color="success"
                  @click="viewPaymentProof(item)"
                  title="Lihat Bukti Pembayaran"
                />
              </template>
              
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

              <!-- Participant actions - only for their own draft data -->
              <template v-if="isParticipant">
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
                  icon="mdi-chart-timeline-variant"
                  variant="text"
                  size="small"
                  color="primary"
                  @click="updateProgress(item)"
                  title="Update Progress"
                />
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
              <div class="text-h6 text-grey-darken-1 mb-2">
                {{ isParticipant ? 'Belum ada data pelatihan' : 'Tidak ada data peserta' }}
              </div>
              <div v-if="!isParticipant" class="text-body-2 text-grey-darken-1">
                Klik tombol "Tambah Peserta" untuk memulai
              </div>
              <div v-else class="text-body-2 text-grey-darken-1">
                Anda belum terdaftar dalam program pelatihan apapun
              </div>
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

    <!-- Progress Dialog -->
    <ParticipantProgressDialog
      v-model="progressDialog"
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

    <!-- Payment Proof Dialog -->
    <v-dialog v-model="paymentProofDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon class="me-2" color="success">mdi-receipt</v-icon>
          Bukti Transfer - {{ selectedParticipant?.fullName }}
        </v-card-title>
        <v-card-text>
          <div v-if="selectedParticipant?.paymentProof" class="text-center">
            <v-img
              v-if="isImageFile(selectedParticipant.paymentProof)"
              :src="selectedParticipant.paymentProof.url"
              max-height="400"
              contain
              class="mb-3"
            />
            <div v-else class="pa-4">
              <v-icon size="64" color="grey-lighten-1">mdi-file-pdf-box</v-icon>
              <div class="text-h6 mt-2">{{ selectedParticipant.paymentProof.original_filename }}</div>
              <div class="text-caption text-grey-darken-1">
                Format: {{ selectedParticipant.paymentProof.format?.toUpperCase() }} 
                | Size: {{ formatFileSize(selectedParticipant.paymentProof.bytes) }}
              </div>
            </div>
            
            <v-divider class="my-3" />
            
            <div class="text-left">
              <strong>Informasi File:</strong><br>
              <small>
                <strong>Nama File:</strong> {{ selectedParticipant.paymentProof.original_filename }}<br>
                <strong>Format:</strong> {{ selectedParticipant.paymentProof.format?.toUpperCase() }}<br>
                <strong>Ukuran:</strong> {{ formatFileSize(selectedParticipant.paymentProof.bytes) }}<br>
                <strong>Tanggal Upload:</strong> {{ formatDate(selectedParticipant.updatedAt || selectedParticipant.createdAt) }}
              </small>
            </div>
          </div>
          <div v-else>
            <v-alert type="info" variant="tonal">
              Tidak ada bukti transfer yang diupload.
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            v-if="selectedParticipant?.paymentProof"
            color="primary"
            :href="selectedParticipant.paymentProof.url"
            target="_blank"
            prepend-icon="mdi-download"
          >
            Download
          </v-btn>
          <v-btn @click="paymentProofDialog = false">Tutup</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Admin Notes Dialog -->
    <v-dialog v-model="adminNotesDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon class="me-2" color="info">mdi-message-text</v-icon>
          Catatan Admin - {{ selectedParticipant?.fullName }}
        </v-card-title>
        <v-card-text>
          <div class="mb-3">
            <strong>Status Pembayaran:</strong>
            <v-chip
              :color="getPaymentStatusColor(selectedParticipant?.paymentStatus)"
              variant="tonal"
              size="small"
              class="ml-2"
            >
              {{ getPaymentStatusText(selectedParticipant?.paymentStatus) }}
            </v-chip>
          </div>
          
          <div>
            <strong>Catatan Admin:</strong>
            <v-card 
              variant="outlined" 
              class="mt-2 pa-3"
              :color="selectedParticipant?.paymentStatus === 'rejected' ? 'error' : 'info'"
            >
              <div class="text-body-2">
                {{ selectedParticipant?.adminNotes || 'Tidak ada catatan khusus dari admin.' }}
              </div>
            </v-card>
          </div>

          <div v-if="selectedParticipant?.paymentApprovedAt || selectedParticipant?.paymentRejectedAt" class="mt-3">
            <small class="text-grey-darken-1">
              <template v-if="selectedParticipant?.paymentApprovedAt">
                Disetujui pada: {{ formatDate(selectedParticipant.paymentApprovedAt) }}
              </template>
              <template v-else-if="selectedParticipant?.paymentRejectedAt">
                Ditolak pada: {{ formatDate(selectedParticipant.paymentRejectedAt) }}
              </template>
            </small>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="adminNotesDialog = false">Tutup</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Payment Upload Dialog -->
    <v-dialog v-model="paymentUploadDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon class="me-2" color="warning">mdi-upload</v-icon>
          Upload Bukti Pembayaran - {{ selectedParticipant?.fullName }}
        </v-card-title>
        <v-card-text>
          <v-alert 
            :type="selectedParticipant?.paymentStatus === 'rejected' ? 'error' : 'info'" 
            variant="tonal" 
            class="mb-4"
          >
            <template v-if="selectedParticipant?.paymentStatus === 'rejected'">
              <strong>Pembayaran Ditolak:</strong> Silakan upload ulang bukti pembayaran yang benar.
              <div v-if="selectedParticipant?.adminNotes" class="mt-2">
                <strong>Alasan:</strong> {{ selectedParticipant.adminNotes }}
              </div>
            </template>
            <template v-else>
              <strong>Status:</strong> Dokumen sudah selesai diproses. Silakan upload bukti pembayaran untuk melengkapi proses pelatihan.
            </template>
          </v-alert>

          <div class="mb-3">
            <strong>Program Pelatihan:</strong> 
            <v-chip 
              :color="getTrainingChipColor(selectedParticipant?.trainingProgram)" 
              variant="tonal" 
              size="small" 
              class="ml-2"
            >
              {{ getTrainingProgramName(selectedParticipant?.trainingProgram) }}
            </v-chip>
          </div>

          <div class="mb-4">
            <strong>Jumlah Pembayaran:</strong>
            <div class="text-h6 text-success font-weight-bold mt-1">
              {{ formatCurrency(calculatePaymentAmount(selectedParticipant?.trainingProgram)) }}
            </div>
          </div>

          <v-file-input
            v-model="paymentFile"
            label="Bukti Pembayaran *"
            variant="outlined"
            prepend-icon="mdi-camera"
            accept="image/*,application/pdf"
            :rules="[v => !!v || 'Bukti pembayaran wajib diupload']"
            show-size
            class="mb-3"
          >
            <template #selection="{ fileNames }">
              <template v-for="fileName in fileNames" :key="fileName">
                {{ fileName }}
              </template>
            </template>
          </v-file-input>

          <v-alert type="warning" variant="outlined" class="text-caption">
            <strong>Catatan:</strong> Upload bukti transfer/pembayaran dalam format JPG, PNG, atau PDF. Maksimal ukuran file 5MB.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="paymentUploadDialog = false">Batal</v-btn>
          <v-btn
            color="primary"
            @click="confirmPaymentUpload"
            :loading="paymentUploadLoading"
            :disabled="!paymentFile"
          >
            {{ selectedParticipant?.paymentStatus === 'rejected' ? 'Upload Ulang' : 'Upload Pembayaran' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Schedule Detail Dialog -->
    <v-dialog v-model="scheduleDetailDialog" max-width="700">
      <v-card v-if="selectedSchedule">
        <v-card-title class="d-flex align-center">
          <v-icon left color="primary" class="mr-2">mdi-calendar-clock</v-icon>
          <div>
            <div class="text-h6">{{ selectedSchedule.scheduleName }}</div>
            <div class="text-caption text-grey">{{ selectedSchedule.trainingProgram }} - Detail Jadwal Kelas</div>
          </div>
        </v-card-title>

        <v-card-text>
          <v-row>
            <!-- Tanggal & Waktu -->
            <v-col cols="12" md="6">
              <div class="mb-4">
                <div class="text-subtitle-2 text-primary mb-2">📅 Jadwal Pelaksanaan</div>
                <v-card variant="outlined" class="pa-3">
                  <div class="d-flex align-center mb-2">
                    <v-icon class="mr-2" size="small">mdi-calendar-range</v-icon>
                    <strong>Tanggal:</strong>
                  </div>
                  <div class="ml-6 mb-2">
                    {{ formatDateRange(selectedSchedule.startDate, selectedSchedule.endDate) }}
                  </div>
                  
                  <div v-if="selectedSchedule.startTime || selectedSchedule.endTime" class="d-flex align-center mb-2">
                    <v-icon class="mr-2" size="small">mdi-clock-outline</v-icon>
                    <strong>Waktu:</strong>
                  </div>
                  <div v-if="selectedSchedule.startTime || selectedSchedule.endTime" class="ml-6">
                    {{ selectedSchedule.startTime || '08:00' }} - {{ selectedSchedule.endTime || '17:00' }} WIB
                  </div>

                  <!-- Countdown -->
                  <v-divider class="my-2" />
                  <div class="text-center">
                    <v-chip
                      :color="getCountdownColor(selectedSchedule.daysUntilStart)"
                      variant="tonal"
                      size="small"
                    >
                      <v-icon start size="small">mdi-timer-outline</v-icon>
                      {{ selectedSchedule.countdownText }}
                    </v-chip>
                  </div>
                </v-card>
              </div>
            </v-col>

            <!-- Mode & Lokasi -->
            <v-col cols="12" md="6">
              <div class="mb-4">
                <div class="text-subtitle-2 text-primary mb-2">📍 Lokasi & Mode</div>
                <v-card variant="outlined" class="pa-3">
                  <div class="d-flex align-center mb-2">
                    <v-icon class="mr-2" size="small">mdi-laptop</v-icon>
                    <strong>Mode:</strong>
                  </div>
                  <div class="ml-6 mb-2">
                    <v-chip
                      :color="getModeColor(selectedSchedule.mode)"
                      size="small"
                      variant="outlined"
                    >
                      <v-icon start :icon="getModeIcon(selectedSchedule.mode)" size="small" />
                      {{ getModeText(selectedSchedule.mode) }}
                    </v-chip>
                  </div>

                  <div v-if="selectedSchedule.location" class="d-flex align-center mb-2">
                    <v-icon class="mr-2" size="small">mdi-map-marker</v-icon>
                    <strong>Lokasi:</strong>
                  </div>
                  <div v-if="selectedSchedule.location" class="ml-6 mb-2">
                    {{ selectedSchedule.location }}
                  </div>

                  <div v-if="selectedSchedule.onlineLink" class="d-flex align-center mb-2">
                    <v-icon class="mr-2" size="small">mdi-video</v-icon>
                    <strong>Link Meeting:</strong>
                  </div>
                  <div v-if="selectedSchedule.onlineLink" class="ml-6">
                    <v-btn
                      :href="selectedSchedule.onlineLink"
                      target="_blank"
                      size="small"
                      variant="outlined"
                      color="primary"
                      prepend-icon="mdi-open-in-new"
                    >
                      Buka Link
                    </v-btn>
                  </div>
                </v-card>
              </div>
            </v-col>

            <!-- Dress Code -->
            <v-col cols="12" v-if="selectedSchedule.dressCode">
              <div class="mb-4">
                <div class="text-subtitle-2 text-primary mb-2">👔 Dress Code</div>
                <v-card variant="outlined" class="pa-3">
                  <div class="d-flex align-center mb-2">
                    <v-icon class="mr-2" size="small" color="primary">mdi-tshirt-crew</v-icon>
                    <strong>Ketentuan Pakaian:</strong>
                  </div>
                  <div class="ml-6">
                    {{ selectedSchedule.dressCode }}
                  </div>
                </v-card>
              </div>
            </v-col>

            <!-- Perlengkapan -->
            <v-col cols="12" v-if="selectedSchedule.requirements">
              <div class="mb-4">
                <div class="text-subtitle-2 text-primary mb-2">🎒 Perlengkapan yang Harus Dibawa</div>
                <v-card variant="outlined" class="pa-3">
                  <div class="d-flex align-center mb-2">
                    <v-icon class="mr-2" size="small" color="warning">mdi-bag-checked</v-icon>
                    <strong>Checklist Perlengkapan:</strong>
                  </div>
                  <div class="ml-6">
                    <div v-for="item in parseRequirements(selectedSchedule.requirements)" :key="item" class="d-flex align-center mb-1">
                      <v-icon class="mr-2" size="small" color="success">mdi-check-circle</v-icon>
                      {{ item }}
                    </div>
                  </div>
                </v-card>
              </div>
            </v-col>

            <!-- Contact Person -->
            <v-col cols="12" v-if="selectedSchedule.contactPerson || selectedSchedule.contactPhone">
              <div class="mb-4">
                <div class="text-subtitle-2 text-primary mb-2">📞 Kontak Informasi</div>
                <v-card variant="outlined" class="pa-3">
                  <div v-if="selectedSchedule.contactPerson" class="d-flex align-center mb-2">
                    <v-icon class="mr-2" size="small">mdi-account</v-icon>
                    <strong>Contact Person:</strong>
                  </div>
                  <div v-if="selectedSchedule.contactPerson" class="ml-6 mb-2">
                    {{ selectedSchedule.contactPerson }}
                  </div>

                  <div v-if="selectedSchedule.contactPhone" class="d-flex align-center mb-2">
                    <v-icon class="mr-2" size="small">mdi-phone</v-icon>
                    <strong>Nomor Telepon:</strong>
                  </div>
                  <div v-if="selectedSchedule.contactPhone" class="ml-6">
                    <v-btn
                      :href="`tel:${selectedSchedule.contactPhone}`"
                      size="small"
                      variant="outlined"
                      color="success"
                      prepend-icon="mdi-phone"
                    >
                      {{ selectedSchedule.contactPhone }}
                    </v-btn>
                  </div>
                </v-card>
              </div>
            </v-col>

            <!-- Catatan Tambahan -->
            <v-col cols="12" v-if="selectedSchedule.notes">
              <div class="mb-4">
                <div class="text-subtitle-2 text-primary mb-2">📝 Catatan Penting</div>
                <v-card variant="outlined" class="pa-3">
                  <div class="d-flex align-center mb-2">
                    <v-icon class="mr-2" size="small" color="info">mdi-information</v-icon>
                    <strong>Informasi Tambahan:</strong>
                  </div>
                  <div class="ml-6">
                    {{ selectedSchedule.notes }}
                  </div>
                </v-card>
              </div>
            </v-col>
          </v-row>

          <!-- Important Notice -->
          <v-alert type="info" variant="tonal" class="mt-4">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-lightbulb-on</v-icon>
              <strong>Tips Penting:</strong>
            </div>
            <ul class="mt-2 ml-4">
              <li>Harap datang 15 menit sebelum jadwal dimulai</li>
              <li>Pastikan semua perlengkapan sudah disiapkan sebelum hari H</li>
              <li>Simpan nomor kontak untuk komunikasi darurat</li>
              <li v-if="selectedSchedule.mode === 'online' || selectedSchedule.mode === 'hybrid'">Pastikan koneksi internet stabil untuk kelas online</li>
            </ul>
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="scheduleDetailDialog = false">Tutup</v-btn>
          <v-btn
            v-if="selectedSchedule.contactPhone"
            color="success"
            variant="flat"
            :href="`https://wa.me/${selectedSchedule.contactPhone.replace(/\D/g, '')}`"
            target="_blank"
            prepend-icon="mdi-whatsapp"
          >
            WhatsApp
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ParticipantDetailDialog from '@/components/participants/ParticipantDetailDialog.vue'
import ParticipantEditDialog from '@/components/participants/ParticipantEditDialog.vue'
import ParticipantProgressDialog from '@/components/participants/ParticipantProgressDialog.vue'
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
const progressDialog = ref(false)
const deleteDialog = ref(false)
const deleteLoading = ref(false)
const submitDialog = ref(false)
const submitLoading = ref(false)
const paymentProofDialog = ref(false)
const adminNotesDialog = ref(false)
const paymentUploadDialog = ref(false)
const paymentUploadLoading = ref(false)
const scheduleDetailDialog = ref(false)
const selectedParticipant = ref(null)
const selectedSchedule = ref(null)
const paymentFile = ref(null)

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

// Check if current user is participant
const isParticipant = computed(() => authStore.user?.role === 'participant')


// Dynamic page title based on role
const pageTitle = computed(() => {
  return isParticipant.value ? 'Data Saya' : 'Master Peserta'
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(search.value || filterTrainingProgram.value || filterStatus.value)
})

// Table headers - computed to include agency column for admin
const headers = computed(() => {
  const baseHeaders = [
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
    }
  ]

  // Add agency column for admin (with null check)
  if (authStore.user && authStore.isAdmin) {
    baseHeaders.push({
      title: 'Agensi',
      key: 'agency.name',
      sortable: true,
      width: '180px'
    })
  }

  // Add remaining columns
  baseHeaders.push(
    {
      title: 'Status',
      key: 'status',
      sortable: true,
      width: '120px'
    },
    {
      title: 'Jadwal Kelas',
      key: 'scheduleInfo',
      sortable: false,
      width: '150px'
    },
    // {
    //   title: 'Progress',
    //   key: 'progressPercentage',
    //   sortable: true,
    //   width: '120px'
    // },
    {
      title: 'Pembayaran',
      key: 'paymentOption',
      sortable: false,
      width: '150px'
    }
  )

  // Add payment status for agents (to see admin approval) (with null check)
  if (authStore.user && (authStore.isAgent || isParticipant.value)) {
    baseHeaders.push({
      title: 'Status Invoice',
      key: 'paymentStatus',
      sortable: false,
      width: '130px'
    })
  }

  baseHeaders.push(
    {
      title: 'Catatan',
      key: 'notes',
      sortable: false,
      width: '200px'
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
  )

  return baseHeaders
})

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

  // Filter options based on user role (with null checks)
  if (authStore.user) {
    if (authStore.isAgent) {
      // Agent can see draft and submitted status
      return baseOptions.filter(option => option.value !== 'draft')
    } else if (authStore.isAdmin) {
      // Admin can see all status except draft (draft is only for agents/participants)
      return baseOptions.filter(option => option.value !== 'draft')
    } else if (authStore.isParticipant) {
      // Participant can see all their own status including draft
      return baseOptions
    }
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
  // Ensure auth is properly loaded before fetching
  if (!authStore.user || !authStore.token) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: search.value,
      trainingProgram: filterTrainingProgram.value,
      status: filterStatus.value
    }

    // Add role-based filtering (with proper null checks)
    if (authStore.user) {
      if (authStore.isAdmin) {
        // Admin hanya melihat data yang sudah di-submit (bukan draft)
        if (!params.status) {
          params.status = 'submitted,verified,waiting_quota,sent_to_center,waiting_dispatch,completed,rejected'
        }
      } else if (authStore.isAgent) {
        // Agent hanya melihat data mereka sendiri
        params.agencyOnly = true
      } else if (isParticipant.value) {
        // Participant hanya melihat data mereka sendiri
        params.participantOnly = true
      }
    }

    const response = await participantStore.fetchParticipants(params)
    
    if (response.pagination) {
      pagination.value = {
        ...pagination.value,
        ...response.pagination
      }
    }
  } catch (error) {
    console.error('Fetch participants error:', error)
    if (error.message && error.message.trim()) {
      showSnackbar('Gagal memuat data peserta', 'error')
    }
  } finally {
    loading.value = false
  }
}

const fetchTrainingTypes = async () => {
  // Don't fetch if auth is not ready
  if (!authStore.user || !authStore.token) {
    return
  }

  try {
    await participantStore.fetchTrainingTypes()
  } catch (error) {
    console.error('Failed to fetch training types:', error)
    // Don't show snackbar for training types failure as it's not critical
  }
}

const openCreateDialog = () => {
  selectedParticipant.value = null
  dialog.value = true
}

const goToCreatePage = () => {
  router.push('/participants/create')
}

const goToDaftarDiklat = () => {
  router.push('/daftar-diklat')
}

const viewParticipant = (participant) => {
  selectedParticipant.value = participant
  detailDialog.value = true
}

const editParticipant = (participant) => {
  if (authStore.user && authStore.isParticipant) {
    // Participant diarahkan ke form daftar diklat dalam mode edit
    router.push(`/daftar-diklat?edit=${participant.id}`)
  } else {
    // Agent/Admin menggunakan dialog edit
    selectedParticipant.value = participant
    editDialog.value = true
  }
}

const updateProgress = (participant) => {
  selectedParticipant.value = participant
  progressDialog.value = true
}

const viewPaymentProof = (participant) => {
  selectedParticipant.value = participant
  paymentProofDialog.value = true
}

const showAdminNotes = (participant) => {
  selectedParticipant.value = participant
  adminNotesDialog.value = true
}

const uploadPayment = (participant) => {
  selectedParticipant.value = participant
  paymentFile.value = null
  paymentUploadDialog.value = true
}

const viewScheduleDetail = (scheduleInfo) => {
  selectedSchedule.value = scheduleInfo
  scheduleDetailDialog.value = true
}

const confirmPaymentUpload = async () => {
  if (!paymentFile.value) {
    showSnackbar('Pilih file bukti pembayaran terlebih dahulu', 'error')
    return
  }

  paymentUploadLoading.value = true
  try {
    // Prepare data for participant store (not FormData directly)
    const updateData = {
      files: {
        payment_proof: paymentFile.value
      }
    }

    // Update participant with payment proof
    await participantStore.updateParticipant(selectedParticipant.value.id, updateData)
    
    showSnackbar('Bukti pembayaran berhasil diupload', 'success')
    paymentUploadDialog.value = false
    await fetchParticipants()
  } catch (error) {
    showSnackbar('Gagal mengupload bukti pembayaran', 'error')
    console.error('Payment upload error:', error)
  } finally {
    paymentUploadLoading.value = false
  }
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

const handleParticipantUpdated = async () => {
  showSnackbar('Data peserta berhasil diupdate', 'success')
  
  // Store the current selected participant ID
  const selectedId = selectedParticipant.value?.id
  
  // Refresh the participants list
  await fetchParticipants()
  
  // Update selectedParticipant with fresh data from the updated list
  if (selectedId) {
    const updatedParticipant = participants.value.find(p => p.id === selectedId)
    if (updatedParticipant) {
      selectedParticipant.value = updatedParticipant
    } else {
      // If not found in current page, fetch individual participant
      try {
        const response = await participantStore.fetchParticipantById(selectedId)
        if (response.success) {
          selectedParticipant.value = response.data.participant
        }
      } catch (error) {
        console.error('Failed to fetch updated participant:', error)
      }
    }
  }
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

const applyFilters = () => {
  pagination.value.page = 1 // Reset to first page when applying filters
  fetchParticipants()
}

const resetFilters = () => {
  search.value = ''
  filterTrainingProgram.value = ''
  filterStatus.value = ''
  pagination.value.page = 1
  fetchParticipants()
  showSnackbar('Filter berhasil direset', 'info')
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
  filterStatus.value = ''
  applyFilters()
}

const showSnackbar = (message, color = 'success') => {
  // Prevent showing empty snackbars
  if (!message || typeof message !== 'string' || message.trim() === '') {
    console.warn('Attempted to show empty snackbar message:', message)
    return
  }
  
  snackbar.value = {
    show: true,
    message: message.trim(),
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
    CCM: 'purple',
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

const getPaymentColor = (paymentOption) => {
  const colors = {
    pay_now: 'success',
    pay_later: 'orange'
  }
  return colors[paymentOption] || 'grey'
}

const getPaymentText = (paymentOption) => {
  const texts = {
    pay_now: 'Bayar Sekarang',
    pay_later: 'Bayar Nanti'
  }
  return texts[paymentOption] || '-'
}

const getPaymentStatusColor = (paymentStatus) => {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  }
  return colors[paymentStatus] || 'grey'
}

const getPaymentStatusText = (paymentStatus) => {
  const texts = {
    pending: 'Menunggu Verifikasi',
    approved: 'Disetujui',
    rejected: 'Ditolak'
  }
  return texts[paymentStatus] || '-'
}

// Schedule utility functions
const shouldShowSchedule = (status) => {
  const submittedStatuses = ['submitted', 'verified', 'waiting_quota', 'sent_to_center', 'waiting_dispatch', 'completed']
  return submittedStatuses.includes(status)
}

const getScheduleStatusText = (status) => {
  if (status === 'draft') return 'Belum submit'
  if (!shouldShowSchedule(status)) return 'Belum tersedia'
  return 'Tidak ada jadwal'
}

const getCountdownColor = (daysUntilStart) => {
  if (daysUntilStart <= 0) return 'success'
  if (daysUntilStart <= 3) return 'warning'
  if (daysUntilStart <= 7) return 'info'
  return 'grey'
}

const formatScheduleDate = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'dd MMM', { locale: idLocale })
}

const formatDate = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'dd MMM yyyy', { locale: idLocale })
}

const isImageFile = (fileInfo) => {
  if (!fileInfo || !fileInfo.format) return false
  const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  return imageFormats.includes(fileInfo.format.toLowerCase())
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const calculatePaymentAmount = (trainingProgram) => {
  const trainingPrices = {
    BST: 1850000,          // 1jt 850rb
    SAT: 950000,           // 950rb
    CCM_CMT: 650000,       // 650rb
    CCM_CMHBT: 650000,     // 650rb
    SDSD: 950000,          // 950rb
    PSCRB: 1200000,        // 1jt 200rb
    SB: 500000,            // Seaman Book (estimasi)
    UPDATING_BST: 750000   // Updating BST (estimasi)
  }
  return trainingPrices[trainingProgram] || 0
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

// Schedule detail utility functions
const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (start.toDateString() === end.toDateString()) {
    return format(start, 'EEEE, dd MMMM yyyy', { locale: idLocale })
  }
  
  return `${format(start, 'dd MMM', { locale: idLocale })} - ${format(end, 'dd MMM yyyy', { locale: idLocale })}`
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
    offline: 'Offline (Tatap Muka)',
    online: 'Online (Virtual)',
    hybrid: 'Hybrid (Campuran)'
  }
  return texts[mode] || mode
}

const parseRequirements = (requirements) => {
  if (!requirements) return []
  
  // Split by common separators and clean up
  const items = requirements
    .split(/[,;\n]/)
    .map(item => item.trim())
    .filter(item => item.length > 0)
    
  return items.length > 0 ? items : [requirements]
}

// Debounced search
let searchTimeout
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1 // Reset to first page
    fetchParticipants()
  }, 500)
}

// Watchers
watch(search, (newValue, oldValue) => {
  // Only trigger search if there's actual change, not initial load, and auth is ready
  if (newValue !== oldValue && authStore.user && authStore.token) {
    debounceSearch()
  }
})

watch(filterTrainingProgram, (newValue, oldValue) => {
  // Only trigger if there's actual change, not initial load, and auth is ready
  if (newValue !== oldValue && authStore.user && authStore.token) {
    pagination.value.page = 1 // Reset to first page
    fetchParticipants()
  }
})

watch(filterStatus, (newValue, oldValue) => {
  // Only trigger if there's actual change, not initial load, and auth is ready
  if (newValue !== oldValue && authStore.user && authStore.token) {
    pagination.value.page = 1 // Reset to first page
    fetchParticipants()
  }
})

// Lifecycle
onMounted(async () => {
  // Wait for auth to be properly loaded
  if (authStore.user && authStore.token) {
    // Fetch training types first (non-critical)
    await fetchTrainingTypes()
    // Then fetch participants (critical)
    await fetchParticipants()
  } else {
    // If auth is not ready, wait a bit and try again
    setTimeout(async () => {
      if (authStore.user && authStore.token) {
        await fetchTrainingTypes()
        await fetchParticipants()
      }
    }, 100)
  }
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