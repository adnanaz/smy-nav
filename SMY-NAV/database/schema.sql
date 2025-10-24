-- SMY-NAV Database Schema
-- PostgreSQL Database Schema for Maritime Training Management System
-- Created: October 22, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'agent');
CREATE TYPE agency_status AS ENUM ('active', 'suspended', 'inactive');
CREATE TYPE participant_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'completed');
CREATE TYPE document_status AS ENUM ('pending', 'uploaded', 'verified', 'rejected');
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed', 'failed');

-- ============================================================================
-- AGENCIES TABLE
-- ============================================================================
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- Agency unique code
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    contact_person VARCHAR(255),
    status agency_status DEFAULT 'active',
    max_participants INTEGER DEFAULT 100, -- Quota limit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- USERS TABLE (Admin & Agents)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PROGRESS TEMPLATES (Define workflow steps)
-- ============================================================================
CREATE TABLE progress_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    step_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    estimated_days INTEGER DEFAULT 7,
    required_documents TEXT[], -- Array of required document types
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PARTICIPANTS TABLE (Calon Pelaut)
-- ============================================================================
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    nik VARCHAR(20) UNIQUE NOT NULL, -- Indonesian ID Number
    email VARCHAR(255),
    phone VARCHAR(20),
    birth_date DATE NOT NULL,
    birth_place VARCHAR(255),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    address TEXT,
    emergency_contact JSONB, -- {name, phone, relation}
    
    -- Training Information
    training_program VARCHAR(255),
    batch_number VARCHAR(50),
    registration_number VARCHAR(100) UNIQUE,
    
    -- Status & Progress
    status participant_status DEFAULT 'draft',
    current_progress_step INTEGER DEFAULT 1,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PROGRESS TRACKING TABLE
-- ============================================================================
CREATE TABLE participant_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES progress_templates(id),
    
    -- Progress Information
    status progress_status DEFAULT 'not_started',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    completed_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(participant_id, template_id)
);

-- ============================================================================
-- DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    
    -- Document Information
    document_type VARCHAR(100) NOT NULL, -- 'ktp', 'ijazah', 'sertifikat', etc.
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    -- Status & Verification
    status document_status DEFAULT 'pending',
    uploaded_by UUID NOT NULL REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    verification_notes TEXT,
    
    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ACTIVITY LOGS (Audit Trail)
-- ============================================================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    participant_id UUID REFERENCES participants(id),
    agency_id UUID REFERENCES agencies(id),
    
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'verify', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'participant', 'document', 'user', etc.
    entity_id UUID,
    description TEXT,
    metadata JSONB, -- Additional context data
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SYSTEM SETTINGS
-- ============================================================================
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_agency_id ON users(agency_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Participants indexes
CREATE INDEX idx_participants_agency_id ON participants(agency_id);
CREATE INDEX idx_participants_status ON participants(status);
CREATE INDEX idx_participants_nik ON participants(nik);
CREATE INDEX idx_participants_created_by ON participants(created_by);
CREATE INDEX idx_participants_registration_number ON participants(registration_number);

-- Progress tracking indexes
CREATE INDEX idx_participant_progress_participant_id ON participant_progress(participant_id);
CREATE INDEX idx_participant_progress_status ON participant_progress(status);

-- Documents indexes
CREATE INDEX idx_documents_participant_id ON documents(participant_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_participant_id ON activity_logs(participant_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) for Multi-tenant
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies (will be created after user management is implemented)
-- Agents can only see data from their agency
-- Admins can see all data

-- ============================================================================
-- TRIGGERS for updated_at columns
-- ============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_participant_progress_updated_at BEFORE UPDATE ON participant_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert default progress templates
INSERT INTO progress_templates (name, description, step_order, required_documents) VALUES
('Pendaftaran', 'Pendaftaran awal dan verifikasi dokumen dasar', 1, '["ktp", "ijazah"]'),
('Verifikasi Dokumen', 'Verifikasi kelengkapan dan validitas dokumen', 2, '["medical_certificate", "police_record"]'),
('Medical Check-up', 'Pemeriksaan kesehatan dan psikologi', 3, '["medical_report"]'),
('Interview', 'Wawancara dan tes kemampuan', 4, '[]'),
('Training Assignment', 'Penugasan kelas dan jadwal training', 5, '[]'),
('Training Completion', 'Penyelesaian program training', 6, '["certificate"]');

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('max_file_size', '5242880', 'Maximum file size in bytes (5MB)'),
('allowed_file_types', 'pdf,jpg,jpeg,png', 'Allowed file extensions for uploads'),
('default_participant_quota', '100', 'Default participant quota per agency'),
('system_email', 'admin@smy-nav.com', 'System email address'),
('training_duration_days', '90', 'Default training duration in days');

-- ============================================================================
-- VIEWS for Common Queries
-- ============================================================================

-- View for participant summary with agency info
CREATE VIEW participant_summary AS
SELECT 
    p.id,
    p.full_name,
    p.nik,
    p.email,
    p.phone,
    p.status,
    p.progress_percentage,
    p.training_program,
    p.created_at,
    a.name as agency_name,
    a.code as agency_code,
    u.full_name as created_by_name
FROM participants p
JOIN agencies a ON p.agency_id = a.id
JOIN users u ON p.created_by = u.id;

-- View for progress tracking summary
CREATE VIEW progress_summary AS
SELECT 
    p.id as participant_id,
    p.full_name,
    pt.name as current_step,
    pp.status as step_status,
    pp.started_at,
    pp.completed_at,
    pt.step_order
FROM participants p
JOIN participant_progress pp ON p.id = pp.participant_id
JOIN progress_templates pt ON pp.template_id = pt.id
WHERE pt.step_order = p.current_progress_step;