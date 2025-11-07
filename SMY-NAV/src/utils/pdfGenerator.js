import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function generateInvoicePDF(invoice) {
  const doc = new jsPDF()
  
  // Company Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('SMY-NAV', 20, 30)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistem Manajemen Pelatihan Maritim', 20, 40)
  doc.text('Jl. Maritime Training Center No. 123', 20, 50)
  doc.text('Jakarta, Indonesia', 20, 60)
  doc.text('Tel: +62-21-123-4567 | Email: admin@smy-nav.com', 20, 70)

  // Invoice Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 150, 30)
  
  // Invoice Details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 150, 45)
  doc.text(`Date: ${formatDate(invoice.createdAt)}`, 150, 55)
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 150, 65)
  
  // Line separator
  doc.line(20, 80, 190, 80)
  
  // Bill To
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill To:', 20, 95)
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.agency?.name || 'N/A', 20, 105)
  doc.text(`Code: ${invoice.agency?.code || 'N/A'}`, 20, 115)
  if (invoice.agency?.address) {
    doc.text(invoice.agency.address, 20, 125)
  }
  if (invoice.agency?.email) {
    doc.text(`Email: ${invoice.agency.email}`, 20, 135)
  }
  if (invoice.agency?.phone) {
    doc.text(`Phone: ${invoice.agency.phone}`, 20, 145)
  }

  // Training Details
  doc.setFont('helvetica', 'bold')
  doc.text('Training Details:', 110, 95)
  doc.setFont('helvetica', 'normal')
  doc.text(`Training Type: ${getTrainingTypeName(invoice.trainingType)}`, 110, 105)
  doc.text(`Participants: ${invoice.participantCount} person(s)`, 110, 115)
  doc.text(`Status: ${getPaymentStatusText(invoice.paymentStatus)}`, 110, 125)

  // Participants Table
  const participantData = invoice.participants?.map((participant, index) => [
    index + 1,
    participant.fullName,
    participant.registrationNumber,
    getParticipantStatusText(participant.status)
  ]) || []

  doc.autoTable({
    startY: 160,
    head: [['No', 'Participant Name', 'Registration Number', 'Status']],
    body: participantData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 139, 202] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 70 },
      2: { cellWidth: 60 },
      3: { halign: 'center', cellWidth: 35 }
    }
  })

  // Calculate Y position after table
  const finalY = doc.lastAutoTable.finalY + 20

  // Cost Breakdown
  const unitPrice = Math.round(invoice.totalAmount / invoice.participantCount)
  
  doc.autoTable({
    startY: finalY,
    body: [
      ['Training Cost per Participant', '', '', formatCurrency(unitPrice)],
      ['Number of Participants', '', '', `${invoice.participantCount} person(s)`],
      ['Subtotal', '', '', formatCurrency(invoice.totalAmount)],
      ['Tax (0%)', '', '', formatCurrency(0)],
      ['Total Amount', '', '', formatCurrency(invoice.totalAmount)]
    ],
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 130, fontStyle: 'bold' },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { halign: 'right', cellWidth: 40, fontStyle: 'bold' }
    },
    theme: 'plain'
  })

  // Payment Information
  const paymentY = doc.lastAutoTable.finalY + 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Information:', 20, paymentY)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Bank Transfer:', 20, paymentY + 15)
  doc.text('Bank: Bank Central Asia (BCA)', 20, paymentY + 25)
  doc.text('Account Number: 1234567890', 20, paymentY + 35)
  doc.text('Account Name: PT SMY Navigation Training', 20, paymentY + 45)
  doc.text(`Reference: ${invoice.invoiceNumber}`, 20, paymentY + 55)

  // Payment Status
  if (invoice.paymentStatus === 'approved') {
    doc.setFillColor(76, 175, 80) // Green
    doc.rect(110, paymentY + 10, 70, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('PAID', 140, paymentY + 25)
    doc.text(`Date: ${formatDate(invoice.approvedAt)}`, 115, paymentY + 35)
  } else if (invoice.paymentStatus === 'paid') {
    doc.setFillColor(255, 193, 7) // Yellow
    doc.rect(110, paymentY + 10, 70, 20, 'F')
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.text('PENDING VERIFICATION', 115, paymentY + 25)
  } else {
    doc.setFillColor(244, 67, 54) // Red
    doc.rect(110, paymentY + 10, 70, 20, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('UNPAID', 135, paymentY + 25)
  }

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Footer
  const footerY = 270
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text('Thank you for choosing SMY-NAV Maritime Training Services', 20, footerY)
  doc.text('This is a computer-generated invoice. No signature required.', 20, footerY + 10)
  doc.text(`Generated on: ${formatDate(new Date())}`, 20, footerY + 20)

  return doc
}

export function generateReceiptPDF(invoice) {
  const doc = new jsPDF()
  
  // Receipt Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT RECEIPT', 70, 30)
  
  // Company Info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('SMY-NAV', 20, 50)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistem Manajemen Pelatihan Maritim', 20, 60)
  
  // Receipt Details
  doc.setFont('helvetica', 'bold')
  doc.text('Receipt No:', 130, 50)
  doc.text('Date:', 130, 60)
  doc.setFont('helvetica', 'normal')
  doc.text(`${invoice.invoiceNumber}-RCP`, 160, 50)
  doc.text(formatDate(invoice.approvedAt || new Date()), 150, 60)
  
  // Line separator
  doc.line(20, 70, 190, 70)
  
  // Payment Details
  const details = [
    ['Invoice Number', invoice.invoiceNumber],
    ['Agency', invoice.agency?.name || 'N/A'],
    ['Training Type', getTrainingTypeName(invoice.trainingType)],
    ['Participants', `${invoice.participantCount} person(s)`],
    ['Amount Paid', formatCurrency(invoice.totalAmount)],
    ['Payment Date', formatDate(invoice.paidAt)],
    ['Approved Date', formatDate(invoice.approvedAt)],
    ['Approved By', invoice.approvedBy?.name || 'Admin']
  ]

  let yPos = 85
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 20, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 80, yPos)
    yPos += 12
  })

  // Payment Status Stamp
  doc.setFillColor(76, 175, 80) // Green
  doc.rect(20, yPos + 10, 170, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT CONFIRMED', 70, yPos + 27)

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text('This receipt confirms that payment has been received and verified.', 20, 250)
  doc.text(`Generated on: ${formatDate(new Date())}`, 20, 260)

  return doc
}

// Utility functions
function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount)
}

function getTrainingTypeName(type) {
  const trainingTypes = {
    BST: 'BST (Basic Safety Training)',
    SAT: 'SAT (Security Awareness Training)',
    CCM_CMHBT: 'CCM CMHBT',
    CCM_CMT: 'CCM CMT',
    SDSD: 'SDSD (Ship Security Duties)',
    PSCRB: 'PSCRB',
    SB: 'SB (Seaman Book)',
    UPDATING_BST: 'Updating BST'
  }
  return trainingTypes[type] || type
}

function getPaymentStatusText(status) {
  const texts = {
    pending: 'Belum Dibayar',
    paid: 'Menunggu Konfirmasi',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    refunded: 'Dikembalikan'
  }
  return texts[status] || status
}

function getParticipantStatusText(status) {
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