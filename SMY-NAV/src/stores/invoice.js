import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useInvoiceStore = defineStore('invoice', {
  state: () => ({
    invoices: [],
    selectedInvoice: null,
    summary: {
      totalInvoices: 0,
      totalAmount: 0,
      pendingAmount: 0,
      paidAmount: 0,
      pendingInvoices: 0,
      paidInvoices: 0
    },
    trainingPrices: {},
    loading: false,
    error: null
  }),

  getters: {
    pendingInvoices: (state) => 
      state.invoices.filter(invoice => invoice.paymentStatus === 'pending'),
    
    paidInvoices: (state) => 
      state.invoices.filter(invoice => ['paid', 'approved'].includes(invoice.paymentStatus)),
    
    overdueInvoices: (state) => 
      state.invoices.filter(invoice => 
        invoice.paymentStatus === 'pending' && 
        new Date(invoice.dueDate) < new Date()
      ),

    invoicesByTrainingType: (state) => {
      const grouped = {}
      state.invoices.forEach(invoice => {
        if (!grouped[invoice.trainingType]) {
          grouped[invoice.trainingType] = []
        }
        grouped[invoice.trainingType].push(invoice)
      })
      return grouped
    }
  },

  actions: {
    // Fetch agency invoices
    async fetchInvoices(filters = {}) {
      this.loading = true
      this.error = null
      
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const params = new URLSearchParams(filters).toString()
        const response = await axios.get(`${API_URL}/invoices?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.data.success) {
          this.invoices = response.data.data.invoices
          this.summary = response.data.data.summary
        } else {
          throw new Error(response.data.error?.message || 'Failed to fetch invoices')
        }

        return { success: true, data: response.data.data }

      } catch (error) {
        console.error('Fetch invoices error:', error)
        this.error = error.response?.data?.error?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch specific invoice details
    async fetchInvoiceById(invoiceId) {
      this.loading = true
      this.error = null
      
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const response = await axios.get(`${API_URL}/invoices/${invoiceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.data.success) {
          this.selectedInvoice = response.data.data.invoice
        } else {
          throw new Error(response.data.error?.message || 'Failed to fetch invoice')
        }

        return { success: true, data: response.data.data }

      } catch (error) {
        console.error('Fetch invoice detail error:', error)
        this.error = error.response?.data?.error?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Upload payment proof
    async uploadPaymentProof(invoiceId, paymentProofFile) {
      this.loading = true
      this.error = null
      
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const formData = new FormData()
        formData.append('paymentProof', paymentProofFile)

        const response = await axios.post(`${API_URL}/invoices/${invoiceId}/payment-proof`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })

        if (response.data.success) {
          // Update invoice in the list
          const invoiceIndex = this.invoices.findIndex(inv => inv.id === invoiceId)
          if (invoiceIndex !== -1) {
            this.invoices[invoiceIndex] = response.data.data.invoice
          }
          
          // Update selected invoice if it's the same
          if (this.selectedInvoice?.id === invoiceId) {
            this.selectedInvoice = response.data.data.invoice
          }
        } else {
          throw new Error(response.data.error?.message || 'Failed to upload payment proof')
        }

        return { success: true, data: response.data.data }

      } catch (error) {
        console.error('Upload payment proof error:', error)
        this.error = error.response?.data?.error?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Fetch training prices
    async fetchTrainingPrices() {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const response = await axios.get(`${API_URL}/invoices/training-prices`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.data.success) {
          this.trainingPrices = response.data.data.trainingPrices
        } else {
          throw new Error(response.data.error?.message || 'Failed to fetch training prices')
        }

        return { success: true, data: response.data.data }

      } catch (error) {
        console.error('Fetch training prices error:', error)
        this.error = error.response?.data?.error?.message || error.message
        throw error
      }
    },

    // Admin actions (if user is admin)
    async fetchAllInvoices(filters = {}, page = 1, limit = 20) {
      this.loading = true
      this.error = null
      
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const params = new URLSearchParams({
          ...filters,
          page: page.toString(),
          limit: limit.toString()
        }).toString()

        const response = await axios.get(`${API_URL}/invoices/admin/all?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.data.success) {
          this.invoices = response.data.data.invoices
          this.summary = response.data.data.summary
        } else {
          throw new Error(response.data.error?.message || 'Failed to fetch invoices')
        }

        return { success: true, data: response.data.data }

      } catch (error) {
        console.error('Fetch all invoices error:', error)
        this.error = error.response?.data?.error?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Admin approve/reject payment
    async updatePaymentStatus(invoiceId, action, notes = '') {
      this.loading = true
      this.error = null
      
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const response = await axios.put(`${API_URL}/invoices/${invoiceId}/payment-status`, {
          action,
          notes
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.data.success) {
          // Update invoice in the list
          const invoiceIndex = this.invoices.findIndex(inv => inv.id === invoiceId)
          if (invoiceIndex !== -1) {
            this.invoices[invoiceIndex] = response.data.data.invoice
          }
          
          // Update selected invoice if it's the same
          if (this.selectedInvoice?.id === invoiceId) {
            this.selectedInvoice = response.data.data.invoice
          }
        } else {
          throw new Error(response.data.error?.message || 'Failed to update payment status')
        }

        return { success: true, data: response.data.data }

      } catch (error) {
        console.error('Update payment status error:', error)
        this.error = error.response?.data?.error?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Calculate invoice totals
    calculateSummary() {
      const totalInvoices = this.invoices.length
      const totalAmount = this.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
      const pendingInvoices = this.invoices.filter(inv => inv.paymentStatus === 'pending')
      const paidInvoices = this.invoices.filter(inv => ['paid', 'approved'].includes(inv.paymentStatus))
      
      this.summary = {
        totalInvoices,
        totalAmount,
        pendingAmount: pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        paidAmount: paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        pendingInvoices: pendingInvoices.length,
        paidInvoices: paidInvoices.length
      }
    },

    // Clear store
    clearInvoices() {
      this.invoices = []
      this.selectedInvoice = null
      this.summary = {
        totalInvoices: 0,
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        pendingInvoices: 0,
        paidInvoices: 0
      }
      this.error = null
    }
  }
})