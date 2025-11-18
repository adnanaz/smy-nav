<template>
  <DashboardLayout page-title="Master Invoice">
    <v-container fluid>
      <!-- Header -->
      <v-row class="mb-4">
        <v-col>
          <div class="d-flex justify-space-between align-center">
            <div>
              <h1 class="text-h4 font-weight-bold mb-2">
                Master Invoice
                <v-chip 
                  color="purple" 
                  variant="tonal" 
                  size="small" 
                  class="ml-3"
                >
                  Admin/Finance
                </v-chip>
              </h1>
              <p class="text-subtitle-1 text-grey-darken-1">
                Kelola pembayaran dan invoice dari semua agensi
              </p>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Filters & Search -->
      <v-card class="mb-4" elevation="2">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Cari peserta/agensi..."
                placeholder="Nama, NIK, atau Agency..."
                variant="outlined"
                density="compact"
                clearable
                :loading="loading"
                @keyup.enter="applyFilters"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-select
                v-model="filterPaymentOption"
                :items="paymentOptions"
                label="Metode Pembayaran"
                placeholder="Pilih metode..."
                variant="outlined"
                density="compact"
                clearable
                :loading="loading"
                item-title="text"
                item-value="value"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-select
                v-model="filterPaymentStatus"
                :items="paymentStatusOptions"
                label="Status Pembayaran"
                placeholder="Pilih status..."
                variant="outlined"
                density="compact"
                clearable
                :loading="loading"
                item-title="text"
                item-value="value"
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
            <v-icon class="mr-2" color="primary">mdi-receipt</v-icon>
            <span class="text-h6">Daftar Invoice</span>
            <v-chip
              v-if="pagination.total > 0"
              color="primary"
              variant="tonal"
              size="small"
              class="ml-3"
            >
              {{ pagination.total }} invoice
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
              v-if="filterPaymentOption"
              color="info"
              variant="outlined"
              size="x-small"
              closable
              @click:close="clearPaymentOptionFilter"
            >
              {{ paymentOptions.find(opt => opt.value === filterPaymentOption)?.text }}
            </v-chip>
            <v-chip
              v-if="filterPaymentStatus"
              color="info"
              variant="outlined"
              size="x-small"
              closable
              @click:close="clearPaymentStatusFilter"
            >
              {{ paymentStatusOptions.find(opt => opt.value === filterPaymentStatus)?.text }}
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
          </div>
        </v-card-title>
        
        <v-divider />
        
        <v-data-table
          :headers="headers"
          :items="invoices"
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

          <!-- Participant Info -->
          <template #item.participantInfo="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="32" class="me-3" color="primary">
                <span class="text-white">{{ getInitials(item.fullName) }}</span>
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ item.fullName }}</div>
                <div class="text-caption text-grey-darken-1">{{ item.trainingProgram }}</div>
              </div>
            </div>
          </template>

          <!-- Agency Info -->
          <template #item.agencyInfo="{ item }">
            <div class="d-flex align-center">
              <v-icon icon="mdi-domain" size="16" class="me-2 text-grey-darken-1" />
              <div>
                <div class="font-weight-medium">{{ item.agency?.name || 'N/A' }}</div>
                <div class="text-caption text-grey-darken-1">{{ item.agency?.code || '' }}</div>
              </div>
            </div>
          </template>

          <!-- Payment Option -->
          <template #item.paymentOption="{ item }">
            <v-chip
              :color="getPaymentOptionColor(item.paymentOption)"
              variant="tonal"
              size="small"
            >
              {{ getPaymentOptionText(item.paymentOption) }}
            </v-chip>
          </template>

          <!-- Amount -->
          <template #item.amount="{ item }">
            <div class="font-weight-bold text-success">
              {{ formatCurrency(calculateAmount(item.trainingProgram)) }}
            </div>
          </template>

          <!-- Payment Status -->
          <template #item.paymentStatus="{ item }">
            <v-chip
              :color="getPaymentStatusColor(item.paymentStatus)"
              variant="tonal"
              size="small"
            >
              {{ getPaymentStatusText(item.paymentStatus) }}
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
                <v-btn
                  size="x-small"
                  variant="text"
                  color="primary"
                  @click="viewScheduleDetail(item.scheduleInfo)"
                  prepend-icon="mdi-information"
                >
                  Detail
                </v-btn>
              </div>
            </div>
            <div v-else class="text-grey text-caption">
              {{ getScheduleStatusText(item.status) }}
            </div>
          </template>

          <!-- Payment Proof -->
          <template #item.paymentProof="{ item }">
            <div v-if="item.paymentOption === 'pay_now'">
              <v-btn
                v-if="item.paymentProof"
                icon="mdi-eye"
                variant="text"
                size="small"
                color="success"
                @click="viewPaymentProof(item)"
                title="Lihat Bukti Transfer"
              />
              <v-chip v-else color="warning" variant="outlined" size="x-small">
                Belum Upload
              </v-chip>
            </div>
            <div v-else-if="item.paymentOption === 'pay_later'">
              <v-btn
                v-if="item.paymentProof"
                icon="mdi-eye"
                variant="text"
                size="small"
                color="success"
                @click="viewPaymentProof(item)"
                title="Lihat Bukti Pembayaran"
              />
              <v-chip v-else color="info" variant="outlined" size="x-small">
                Belum Bayar
              </v-chip>
            </div>
            <v-chip v-else color="grey" variant="outlined" size="x-small">
              -
            </v-chip>
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
                icon="mdi-history"
                variant="text"
                size="small"
                color="info"
                @click="viewPaymentHistory(item)"
                title="Lihat Riwayat Pembayaran"
              />
              <v-btn
                icon="mdi-check-circle"
                variant="text"
                size="small"
                color="success"
                @click="approvePayment(item)"
                :disabled="item.paymentStatus === 'approved'"
                title="Approve Pembayaran"
              />
              <v-btn
                icon="mdi-close-circle"
                variant="text"
                size="small"
                color="error"
                @click="rejectPayment(item)"
                :disabled="item.paymentStatus === 'rejected'"
                title="Reject Pembayaran"
              />
              <v-btn
                icon="mdi-note-text"
                variant="text"
                size="small"
                color="primary"
                @click="addNote(item)"
                title="Tambah Catatan"
              />
            </div>
          </template>

          <!-- No data -->
          <template #no-data>
            <div class="text-center py-8">
              <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-receipt-outline</v-icon>
              <div class="text-h6 text-grey-darken-1 mb-2">Tidak ada data invoice</div>
              <div class="text-body-2 text-grey-darken-1">Belum ada peserta dengan opsi pembayaran</div>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-container>

    <!-- Payment Proof Dialog -->
    <v-dialog v-model="paymentProofDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon class="me-2" color="success">mdi-receipt</v-icon>
          Bukti Transfer - {{ selectedInvoice?.fullName }}
        </v-card-title>
        <v-card-text>
          <div v-if="selectedInvoice?.paymentProof" class="text-center">
            <v-img
              v-if="isImageFile(selectedInvoice.paymentProof)"
              :src="selectedInvoice.paymentProof.url"
              max-height="400"
              contain
              class="mb-3"
            />
            <div v-else class="pa-4">
              <v-icon size="64" color="grey-lighten-1">mdi-file-pdf-box</v-icon>
              <div class="text-h6 mt-2">{{ selectedInvoice.paymentProof.original_filename }}</div>
              <div class="text-caption text-grey-darken-1">
                Format: {{ selectedInvoice.paymentProof.format?.toUpperCase() }} 
                | Size: {{ formatFileSize(selectedInvoice.paymentProof.bytes) }}
              </div>
            </div>
            
            <v-divider class="my-3" />
            
            <div class="text-left">
              <strong>Informasi File:</strong><br>
              <small>
                <strong>Nama File:</strong> {{ selectedInvoice.paymentProof.original_filename }}<br>
                <strong>Format:</strong> {{ selectedInvoice.paymentProof.format?.toUpperCase() }}<br>
                <strong>Ukuran:</strong> {{ formatFileSize(selectedInvoice.paymentProof.bytes) }}<br>
                <strong>Tanggal Upload:</strong> {{ formatDate(selectedInvoice.updatedAt || selectedInvoice.createdAt) }}<br>
                <strong>Jumlah:</strong> {{ formatCurrency(calculateAmount(selectedInvoice.trainingProgram)) }}
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
            v-if="selectedInvoice?.paymentProof"
            color="primary"
            :href="selectedInvoice.paymentProof.url"
            target="_blank"
            prepend-icon="mdi-download"
          >
            Download
          </v-btn>
          <v-btn @click="paymentProofDialog = false">Tutup</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Approve Payment Dialog -->
    <v-dialog v-model="approveDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Approve Pembayaran</v-card-title>
        <v-card-text>
          Apakah Anda yakin ingin approve pembayaran untuk peserta <strong>{{ selectedInvoice?.fullName }}</strong>?
          <br><br>
          <v-alert type="success" variant="tonal" class="mt-3">
            Jumlah: {{ formatCurrency(calculateAmount(selectedInvoice?.trainingProgram)) }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="approveDialog = false">Batal</v-btn>
          <v-btn
            color="success"
            @click="confirmApprove"
            :loading="actionLoading"
          >
            Approve
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reject Payment Dialog -->
    <v-dialog v-model="rejectDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Reject Pembayaran</v-card-title>
        <v-card-text>
          <p>Berikan alasan penolakan untuk peserta <strong>{{ selectedInvoice?.fullName }}</strong>:</p>
          <v-textarea
            v-model="rejectReason"
            label="Alasan Penolakan *"
            variant="outlined"
            rows="3"
            :rules="[rules.required]"
            class="mt-3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="rejectDialog = false">Batal</v-btn>
          <v-btn
            color="error"
            @click="confirmReject"
            :loading="actionLoading"
          >
            Reject
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Note Dialog -->
    <v-dialog v-model="noteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Tambah Catatan</v-card-title>
        <v-card-text>
          <p>Tambah catatan untuk peserta <strong>{{ selectedInvoice?.fullName }}</strong>:</p>
          <v-textarea
            v-model="noteText"
            label="Catatan"
            variant="outlined"
            rows="4"
            class="mt-3"
          />
          
          <div v-if="selectedInvoice?.adminNotes" class="mt-4">
            <strong>Catatan Sebelumnya:</strong>
            <v-card variant="outlined" class="mt-2 pa-3">
              <div class="text-body-2">{{ selectedInvoice.adminNotes }}</div>
            </v-card>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="noteDialog = false">Batal</v-btn>
          <v-btn
            color="primary"
            @click="confirmNote"
            :loading="actionLoading"
          >
            Simpan Catatan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Payment History Dialog -->
    <v-dialog v-model="historyDialog" max-width="800">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="me-2">mdi-history</v-icon>
          Riwayat Pembayaran - {{ selectedInvoice?.fullName }}
        </v-card-title>
        
        <v-card-text>
          <div class="mb-4">
            <v-chip :color="getPaymentStatusColor(selectedInvoice?.paymentStatus)" class="mb-2">
              {{ getPaymentStatusText(selectedInvoice?.paymentStatus) }}
            </v-chip>
            <div class="text-subtitle-2">
              Versi Saat Ini: {{ selectedInvoice?.paymentVersion || 1 }}
            </div>
          </div>

          <v-timeline v-if="paymentHistory.length > 0" density="compact">
            <v-timeline-item 
              v-for="(entry, index) in paymentHistory"
              :key="index"
              :dot-color="getHistoryStatusColor(entry.status)"
              size="small"
            >
              <template v-slot:icon>
                <v-icon size="small">{{ getHistoryStatusIcon(entry.status) }}</v-icon>
              </template>
              
              <v-card variant="outlined" class="mb-2">
                <v-card-text class="pa-3">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <v-chip 
                      :color="getHistoryStatusColor(entry.status)" 
                      size="small"
                      variant="flat"
                    >
                      {{ getHistoryStatusText(entry.status) }}
                    </v-chip>
                    <span class="text-caption text-grey">
                      Versi {{ entry.version }}
                    </span>
                  </div>
                  
                  <div class="text-body-2 mb-2">
                    {{ formatDate(entry.timestamp) }}
                  </div>
                  
                  <div v-if="entry.adminNotes" class="mb-2">
                    <strong class="text-body-2">Catatan:</strong>
                    <div class="text-body-2 mt-1">{{ entry.adminNotes }}</div>
                  </div>
                  
                  <div v-if="entry.paymentProof" class="mt-2">
                    <v-btn 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      @click="viewPaymentProof({paymentProof: entry.paymentProof})"
                    >
                      <v-icon start>mdi-eye</v-icon>
                      Lihat Bukti Bayar
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-timeline-item>
          </v-timeline>
          
          <div v-else class="text-center text-grey py-4">
            Belum ada riwayat pembayaran
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="historyDialog = false">Tutup</v-btn>
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

          <!-- Admin Notice -->
          <v-alert type="success" variant="tonal" class="mt-4">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-shield-check</v-icon>
              <strong>Info Admin:</strong>
            </div>
            <ul class="mt-2 ml-4">
              <li>Informasi ini akan terlihat oleh peserta melalui sistem</li>
              <li>Pastikan semua detail jadwal sudah benar dan up-to-date</li>
              <li>Kontak person akan dapat dihubungi langsung oleh peserta</li>
            </ul>
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="scheduleDetailDialog = false">Tutup</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            to="/admin/schedules"
            prepend-icon="mdi-pencil"
          >
            Edit Jadwal
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
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useParticipantStore } from '@/stores/participant'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'

const authStore = useAuthStore()
const participantStore = useParticipantStore()

// Reactive data
const loading = ref(false)
const invoicesData = ref([])
const paymentProofDialog = ref(false)
const approveDialog = ref(false)
const rejectDialog = ref(false)
const noteDialog = ref(false)
const historyDialog = ref(false)
const scheduleDetailDialog = ref(false)
const actionLoading = ref(false)
const selectedInvoice = ref(null)
const selectedSchedule = ref(null)
const rejectReason = ref('')
const noteText = ref('')
const paymentHistory = ref([])

// Filters
const search = ref('')
const filterPaymentOption = ref('')
const filterPaymentStatus = ref('')
const filterTrainingProgram = ref('')

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

// Training program prices
const trainingPrices = {
  BST: 1875000,          // 1jt 875rb
  SAT: 975000,           // 975rb
  CCM: 1325000,          // 1jt 325rb (merged CCM_CMT and CCM_CMHBT)
  SDSD: 975000,          // 975rb
  PSCRB: 1225000,        // 1jt 225rb
  SB: 1075000,           // 1jt 75rb
  UPDATING_BST: 275000   // 275rb
}

// Computed
const invoices = computed(() => invoicesData.value || [])
const trainingTypes = computed(() => participantStore.trainingTypes)

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return !!(search.value || filterPaymentOption.value || filterPaymentStatus.value || filterTrainingProgram.value)
})

// Training program options for filter
const trainingProgramOptions = computed(() => {
  if (!trainingTypes.value) return []
  return Object.entries(trainingTypes.value).map(([key, value]) => ({
    value: key,
    text: value.name
  }))
})

// Table headers
const headers = [
  {
    title: 'No. Registrasi',
    key: 'registrationNumber',
    sortable: true,
    width: '150px'
  },
  {
    title: 'Peserta',
    key: 'participantInfo',
    sortable: false,
    width: '200px'
  },
  {
    title: 'Agensi',
    key: 'agencyInfo',
    sortable: false,
    width: '180px'
  },
  {
    title: 'Metode Bayar',
    key: 'paymentOption',
    sortable: true,
    width: '130px'
  },
  {
    title: 'Jumlah',
    key: 'amount',
    sortable: false,
    width: '120px'
  },
  {
    title: 'Status Bayar',
    key: 'paymentStatus',
    sortable: true,
    width: '120px'
  },
  {
    title: 'Jadwal',
    key: 'scheduleInfo',
    sortable: false,
    width: '120px'
  },
  {
    title: 'Bukti',
    key: 'paymentProof',
    sortable: false,
    width: '100px'
  },
  {
    title: 'Tanggal',
    key: 'createdAt',
    sortable: true,
    width: '120px'
  },
  {
    title: 'Aksi',
    key: 'actions',
    sortable: false,
    width: '140px', 
    align: 'center'
  }
]

// Filter options
const paymentOptions = [
  { value: 'pay_now', text: 'Bayar Sekarang' },
  { value: 'pay_later', text: 'Bayar Nanti' }
]

const paymentStatusOptions = [
  { value: 'pending', text: 'Pending' },
  { value: 'approved', text: 'Approved' },
  { value: 'rejected', text: 'Rejected' }
]

// Validation rules
const rules = {
  required: (value) => !!value || 'Field ini wajib diisi'
}

// Methods
const fetchInvoices = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: search.value,
      paymentOption: filterPaymentOption.value,
      paymentStatus: filterPaymentStatus.value,
      trainingProgram: filterTrainingProgram.value
    }

    const response = await participantStore.fetchInvoices(params)
    
    // Update local data
    invoicesData.value = response.data || []
    
    if (response.pagination) {
      pagination.value = {
        page: response.pagination.currentPage,
        limit: response.pagination.itemsPerPage,
        total: response.pagination.totalItems,
        totalPages: response.pagination.totalPages
      }
    }
  } catch (error) {
    console.error('Fetch invoices error:', error)
    showSnackbar('Gagal memuat data invoice', 'error')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  pagination.value.page = 1 // Reset to first page when applying filters
  fetchInvoices()
}

const resetFilters = () => {
  search.value = ''
  filterPaymentOption.value = ''
  filterPaymentStatus.value = ''
  filterTrainingProgram.value = ''
  pagination.value.page = 1
  fetchInvoices()
  showSnackbar('Filter berhasil direset', 'info')
}

const clearSearchFilter = () => {
  search.value = ''
  applyFilters()
}

const clearPaymentOptionFilter = () => {
  filterPaymentOption.value = ''
  applyFilters()
}

const clearPaymentStatusFilter = () => {
  filterPaymentStatus.value = ''
  applyFilters()
}

const clearTrainingProgramFilter = () => {
  filterTrainingProgram.value = ''
  applyFilters()
}

const viewPaymentProof = (invoice) => {
  selectedInvoice.value = invoice
  paymentProofDialog.value = true
}

const viewScheduleDetail = (scheduleInfo) => {
  selectedSchedule.value = scheduleInfo
  scheduleDetailDialog.value = true
}

const approvePayment = (invoice) => {
  selectedInvoice.value = invoice
  approveDialog.value = true
}

const rejectPayment = (invoice) => {
  selectedInvoice.value = invoice
  rejectReason.value = ''
  rejectDialog.value = true
}

const addNote = (invoice) => {
  selectedInvoice.value = invoice
  noteText.value = ''
  noteDialog.value = true
}

const viewPaymentHistory = async (invoice) => {
  try {
    selectedInvoice.value = invoice
    loading.value = true
    
    const response = await participantStore.getPaymentHistory(invoice.id)
    paymentHistory.value = response.data.paymentHistory || []
    historyDialog.value = true
  } catch (error) {
    console.error('Error fetching payment history:', error)
    showSnackbar('Gagal memuat riwayat pembayaran', 'error')
  } finally {
    loading.value = false
  }
}

const confirmApprove = async () => {
  actionLoading.value = true
  try {
    await participantStore.approvePayment(selectedInvoice.value.id)
    showSnackbar('Pembayaran berhasil diapprove', 'success')
    approveDialog.value = false
    await fetchInvoices()
  } catch (error) {
    showSnackbar('Gagal approve pembayaran', 'error')
  } finally {
    actionLoading.value = false
  }
}

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    showSnackbar('Alasan penolakan wajib diisi', 'error')
    return
  }
  
  actionLoading.value = true
  try {
    await participantStore.rejectPayment(selectedInvoice.value.id, rejectReason.value)
    showSnackbar('Pembayaran berhasil direject', 'success')
    rejectDialog.value = false
    await fetchInvoices()
  } catch (error) {
    showSnackbar('Gagal reject pembayaran', 'error')
  } finally {
    actionLoading.value = false
  }
}

const confirmNote = async () => {
  actionLoading.value = true
  try {
    // Update participant with admin notes
    await participantStore.updateParticipant(selectedInvoice.value.id, {
      adminNotes: noteText.value
    })
    showSnackbar('Catatan berhasil disimpan', 'success')
    noteDialog.value = false
    await fetchInvoices()
  } catch (error) {
    showSnackbar('Gagal menyimpan catatan', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handlePageChange = (page) => {
  pagination.value.page = page
  fetchInvoices()
}

const handleLimitChange = (limit) => {
  pagination.value.limit = limit
  pagination.value.page = 1
  fetchInvoices()
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

const getPaymentOptionColor = (option) => {
  const colors = {
    pay_now: 'success',
    pay_later: 'orange'
  }
  return colors[option] || 'grey'
}

const getPaymentOptionText = (option) => {
  const texts = {
    pay_now: 'Bayar Sekarang',
    pay_later: 'Bayar Nanti'
  }
  return texts[option] || '-'
}

const getPaymentStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  }
  return colors[status] || 'grey'
}

const getPaymentStatusText = (status) => {
  const texts = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected'
  }
  return texts[status] || 'Pending'
}

const calculateAmount = (trainingProgram) => {
  return trainingPrices[trainingProgram] || 0
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
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

// Payment history helper methods
const getHistoryStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    resubmitted: 'info'
  }
  return colors[status] || 'grey'
}

const getHistoryStatusText = (status) => {
  const texts = {
    pending: 'Menunggu Review',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    resubmitted: 'Dikirim Ulang'
  }
  return texts[status] || status
}

const getHistoryStatusIcon = (status) => {
  const icons = {
    pending: 'mdi-clock-outline',
    approved: 'mdi-check-circle',
    rejected: 'mdi-close-circle',
    resubmitted: 'mdi-upload'
  }
  return icons[status] || 'mdi-circle'
}

const fetchTrainingTypes = async () => {
  try {
    await participantStore.fetchTrainingTypes()
  } catch (error) {
    console.error('Failed to fetch training types:', error)
  }
}

// Debounced search
let searchTimeout
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1 // Reset to first page
    fetchInvoices()
  }, 500)
}

// Watchers
watch(search, (newValue, oldValue) => {
  // Only trigger search if there's actual change and not just clearing
  if (newValue !== oldValue) {
    debounceSearch()
  }
})

watch(filterPaymentOption, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    pagination.value.page = 1 // Reset to first page
    fetchInvoices()
  }
})

watch(filterPaymentStatus, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    pagination.value.page = 1 // Reset to first page
    fetchInvoices()
  }
})

watch(filterTrainingProgram, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    pagination.value.page = 1 // Reset to first page
    fetchInvoices()
  }
})

// Lifecycle
onMounted(() => {
  fetchInvoices()
  fetchTrainingTypes()
})
</script>

<style scoped>
.v-data-table >>> .v-data-table__td {
  padding: 12px 16px !important;
}

.v-data-table >>> .v-data-table-header__content {
  font-weight: 600 !important;
}
</style>