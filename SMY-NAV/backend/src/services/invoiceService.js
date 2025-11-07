import prisma from '../config/database.js';
import logger from '../utils/logger.js';

// Training type pricing (bisa dipindah ke database nantinya)
const trainingPrices = {
  BST: 1850000,        // 1.85 juta
  SAT: 950000,         // 950 ribu
  CCM_CMHBT: 1300000,  // 1.3 juta
  CCM_CMT: 1300000,    // 1.3 juta
  SDSD: 950000,        // 950 ribu
  PSCRB: 1200000,      // 1.2 juta
  SB: 1300000,         // 1.3 juta (Seaman Book)
  UPDATING_BST: 750000 // 750 ribu (tetap sama)
};

/**
 * Auto-generate or update invoice when participant is submitted
 */
export async function processParticipantInvoice(participant, allParticipants = null, agencyId = null, paymentProofUrl = null) {
  try {
    const targetAgencyId = agencyId || participant.agencyId;
    const { trainingProgram, paymentOption } = participant;

    // Use allParticipants if provided, otherwise use single participant
    const participantsToProcess = allParticipants || [participant];

    // Check if invoice already exists for this agency + training program
    let invoice = await prisma.trainingInvoice.findFirst({
      where: {
        agencyId: targetAgencyId,
        trainingProgram: trainingProgram, // Fixed: changed from trainingType to trainingProgram
        status: 'pending' // Only add to pending invoices
      },
      include: {
        participants: true,
        agency: true
      }
    });

    const participantPrice = trainingPrices[trainingProgram] || 0;
    
    if (invoice) {
      // Update existing invoice: add participants and recalculate
      const participantIds = participantsToProcess.map(p => ({ id: p.id }));
      const totalParticipants = participantsToProcess.length;
      
      const updatedInvoice = await prisma.trainingInvoice.update({
        where: { id: invoice.id },
        data: {
          participants: {
            connect: participantIds
          },
          totalAmount: invoice.totalAmount + (participantPrice * totalParticipants),
          participantCount: invoice.participantCount + totalParticipants,
          paymentProofUrl: paymentProofUrl || invoice.paymentProofUrl,
          paymentStatus: paymentProofUrl ? 'pending_verification' : invoice.paymentStatus,
          updatedAt: new Date()
        },
        include: {
          participants: true,
          agency: true
        }
      });

      logger.info(`Updated existing invoice ${invoice.invoiceNumber} - added ${totalParticipants} participants`);
      return updatedInvoice;
      
    } else {
      // Create new invoice for this agency + training type
      const invoiceNumber = await generateInvoiceNumber(targetAgencyId, trainingProgram);
      const dueDate = calculateDueDate(paymentOption);
      const participantIds = participantsToProcess.map(p => ({ id: p.id }));
      const totalParticipants = participantsToProcess.length;

      const newInvoice = await prisma.trainingInvoice.create({
        data: {
          invoiceNumber,
          agencyId: targetAgencyId,
          trainingProgram: trainingProgram, // Fixed: changed from trainingType to trainingProgram
          totalAmount: participantPrice * totalParticipants,
          participantCount: totalParticipants,
          status: 'pending',
          paymentStatus: paymentProofUrl ? 'pending_verification' : 'pending',
          paymentProofUrl: paymentProofUrl,
          dueDate,
          participants: {
            connect: participantIds
          }
        },
        include: {
          participants: true,
          agency: true
        }
      });

      logger.info(`Created new invoice ${invoiceNumber} for agency ${newInvoice.agency.name} - ${trainingProgram}`);
      return newInvoice;
    }

  } catch (error) {
    logger.error('Error processing participant invoice:', error);
    throw error;
  }
}

/**
 * Generate unique invoice number
 */
async function generateInvoiceNumber(agencyId, trainingType) {
  try {
    // Get agency info for code
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId }
    });

    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Count existing invoices this month for sequential number
    const startOfMonth = new Date(year, new Date().getMonth(), 1);
    const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);
    
    const invoiceCount = await prisma.trainingInvoice.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    // Format: INV-SMY-[AGENCY_CODE]-[TRAINING_TYPE]-[YEAR][MONTH][SEQUENTIAL]
    const sequential = String(invoiceCount + 1).padStart(3, '0');
    const invoiceNumber = `INV-SMY-${agency.code}-${trainingType}-${year}${month}${sequential}`;

    return invoiceNumber;

  } catch (error) {
    logger.error('Error generating invoice number:', error);
    throw error;
  }
}

/**
 * Calculate due date based on payment option
 */
function calculateDueDate(paymentOption) {
  const now = new Date();
  
  if (paymentOption === 'pay_now') {
    // Due in 3 days for immediate payment
    return new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
  } else {
    // Due in 30 days for pay later
    return new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  }
}

/**
 * Get invoice summary for agency dashboard
 */
export async function getAgencyInvoices(agencyId, filters = {}) {
  try {
    const where = {
      agencyId: agencyId,
      ...filters
    };

    const invoices = await prisma.trainingInvoice.findMany({
      where,
      include: {
        participants: {
          select: {
            id: true,
            fullName: true,
            registrationNumber: true,
            status: true
          }
        },
        agency: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return invoices;

  } catch (error) {
    logger.error('Error fetching agency invoices:', error);
    throw error;
  }
}

/**
 * Update invoice payment status when proof is uploaded
 */
export async function updatePaymentStatus(invoiceId, paymentProofUrl, paymentProofPublicId) {
  try {
    const invoice = await prisma.trainingInvoice.update({
      where: { id: invoiceId },
      data: {
        paymentStatus: 'paid',
        paymentProofUrl,
        paymentProofPublicId,
        paidAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        participants: true,
        agency: true
      }
    });

    logger.info(`Payment proof uploaded for invoice ${invoice.invoiceNumber}`);
    return invoice;

  } catch (error) {
    logger.error('Error updating payment status:', error);
    throw error;
  }
}

/**
 * Admin approve/reject payment
 */
export async function adminApprovePayment(invoiceId, adminId, action, notes = '') {
  try {
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    const invoice = await prisma.trainingInvoice.update({
      where: { id: invoiceId },
      data: {
        paymentStatus: status,
        approvedBy: action === 'approve' ? adminId : null,
        approvedAt: action === 'approve' ? new Date() : null,
        rejectedAt: action === 'reject' ? new Date() : null,
        adminNotes: notes,
        updatedAt: new Date()
      },
      include: {
        participants: true,
        agency: true,
        approvedBy: action === 'approve' ? {
          select: { id: true, name: true, email: true }
        } : false
      }
    });

    logger.info(`Invoice ${invoice.invoiceNumber} payment ${action}d by admin`);
    return invoice;

  } catch (error) {
    logger.error('Error in admin payment approval:', error);
    throw error;
  }
}

export default {
  processParticipantInvoice,
  getAgencyInvoices,
  updatePaymentStatus,
  adminApprovePayment,
  trainingPrices
};

// Also export trainingPrices as named export
export { trainingPrices };