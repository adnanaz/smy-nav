# Database Update for Invoice System

## New Models to Add:

### 1. TrainingInvoice (Invoice per jenis diklat)
```prisma
model TrainingInvoice {
  id               String            @id @default(uuid()) @db.Uuid
  agencyId         String            @map("agency_id") @db.Uuid
  trainingProgram  String            @map("training_program") @db.VarChar(50)
  invoiceNumber    String            @unique @map("invoice_number") @db.VarChar(100) // INV-MSI-BST-001-2025
  
  // Financial Info
  participantCount Int               @map("participant_count") @default(0)
  pricePerUnit     Decimal           @map("price_per_unit") @db.Decimal(12, 2)
  totalAmount      Decimal           @map("total_amount") @db.Decimal(12, 2)
  
  // Payment Info
  paymentStatus    PaymentStatus     @default(pending) @map("payment_status")
  paymentMethod    String?           @map("payment_method") // transfer_bank, cash, etc
  paymentDate      DateTime?         @map("payment_date") @db.Timestamptz
  
  // Documents
  invoiceDocument  Json?             @map("invoice_document") @db.JsonB // PDF invoice
  paymentProof     Json?             @map("payment_proof") @db.JsonB // Bukti transfer dari agency
  receiptDocument  Json?             @map("receipt_document") @db.JsonB // Kwitansi/receipt
  
  // Metadata
  notes            String?           @db.Text
  approvedBy       String?           @map("approved_by") @db.Uuid
  approvedAt       DateTime?         @map("approved_at") @db.Timestamptz
  createdAt        DateTime          @default(now()) @map("created_at") @db.Timestamptz
  updatedAt        DateTime          @updatedAt @map("updated_at") @db.Timestamptz
  
  // Relations
  agency           Agency            @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  approver         User?             @relation("InvoiceApprover", fields: [approvedBy], references: [id])
  participants     Participant[]     @relation("InvoiceParticipants")
  
  @@index([agencyId])
  @@index([trainingProgram])
  @@index([paymentStatus])
  @@map("training_invoices")
}

enum PaymentStatus {
  pending        // Belum bayar
  paid           // Sudah bayar, menunggu approval
  approved       // Pembayaran sudah diapprove admin
  rejected       // Pembayaran ditolak
  refunded       // Refund
}
```

### 2. Update Participant Model
```prisma
model Participant {
  // ... existing fields
  
  // Payment Reference
  invoiceId        String?           @map("invoice_id") @db.Uuid
  paymentOption    PaymentOption     @default(pay_later) @map("payment_option")
  
  // Relations
  invoice          TrainingInvoice?  @relation("InvoiceParticipants", fields: [invoiceId], references: [id])
}

enum PaymentOption {
  pay_now        // Bayar sekarang
  pay_later      // Bayar nanti (setelah sertifikat jadi)
}
```

## API Endpoints to Create:

### Invoice Management
- `GET /api/invoices` - List invoices for agency
- `GET /api/invoices/:id` - Get invoice detail
- `POST /api/invoices/:id/payment-proof` - Upload bukti transfer
- `PUT /api/invoices/:id/approve` - Admin approve payment
- `PUT /api/invoices/:id/reject` - Admin reject payment

### Document Generation
- `GET /api/invoices/:id/download` - Download invoice PDF
- `GET /api/invoices/:id/receipt` - Download kwitansi PDF
- `GET /api/invoices/:id/payment-proof` - Download bukti transfer

## Frontend Components to Create:

### Agency Side
1. `InvoiceListView.vue` - Daftar tagihan agency
2. `InvoiceDetailDialog.vue` - Detail invoice + upload bukti transfer
3. `PaymentProofUpload.vue` - Component upload bukti transfer

### Admin Side
1. `AdminInvoiceView.vue` - Kelola semua invoice
2. `PaymentApprovalDialog.vue` - Approve/reject pembayaran

### Shared
1. `InvoicePreview.vue` - Preview invoice PDF
2. `ReceiptPreview.vue` - Preview kwitansi