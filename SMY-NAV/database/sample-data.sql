-- Sample Data for SMY-NAV Database
-- This file contains sample data for testing and development

-- ============================================================================
-- SAMPLE AGENCIES
-- ============================================================================
INSERT INTO agencies (id, name, code, email, phone, contact_person, address) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'PT. Maritime Solutions', 'MSI', 'contact@maritime-solutions.com', '+62-21-12345678', 'John Doe', 'Jl. Sudirman No. 123, Jakarta'),
('550e8400-e29b-41d4-a716-446655440002', 'CV. Ocean Careers', 'OCC', 'info@ocean-careers.com', '+62-31-87654321', 'Jane Smith', 'Jl. Tanjung Perak No. 45, Surabaya'),
('550e8400-e29b-41d4-a716-446655440003', 'PT. Pelaut Nusantara', 'PNU', 'admin@pelaut-nusantara.co.id', '+62-24-55667788', 'Ahmad Rahman', 'Jl. Pemuda No. 67, Semarang');

-- ============================================================================
-- SAMPLE USERS
-- ============================================================================
-- Password for all users: "password123" (hashed with bcrypt)
INSERT INTO users (id, agency_id, username, email, password_hash, full_name, role) VALUES
-- Super Admin
('660e8400-e29b-41d4-a716-446655440001', NULL, 'superadmin', 'admin@smy-nav.com', '$2a$10$3jVHhqPjEsMSjpqNxxqEZ.ToquwArtEiAGiIe1XYBxVL/t.Ke.ydq', 'Super Administrator', 'super_admin'),

-- Agency 1 Users
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'msi_admin', 'admin@maritime-solutions.com', '$2a$10$3jVHhqPjEsMSjpqNxxqEZ.ToquwArtEiAGiIe1XYBxVL/t.Ke.ydq', 'John Doe', 'admin'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'msi_agent1', 'agent1@maritime-solutions.com', '$2a$10$3jVHhqPjEsMSjpqNxxqEZ.ToquwArtEiAGiIe1XYBxVL/t.Ke.ydq', 'Mike Johnson', 'agent'),

-- Agency 2 Users
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'occ_admin', 'admin@ocean-careers.com', '$2a$10$3jVHhqPjEsMSjpqNxxqEZ.ToquwArtEiAGiIe1XYBxVL/t.Ke.ydq', 'Jane Smith', 'admin'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'occ_agent1', 'agent1@ocean-careers.com', '$2a$10$3jVHhqPjEsMSjpqNxxqEZ.ToquwArtEiAGiIe1XYBxVL/t.Ke.ydq', 'Sarah Wilson', 'agent'),

-- Agency 3 Users
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'pnu_admin', 'admin@pelaut-nusantara.co.id', '$2a$10$3jVHhqPjEsMSjpqNxxqEZ.ToquwArtEiAGiIe1XYBxVL/t.Ke.ydq', 'Ahmad Rahman', 'admin'),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'pnu_agent1', 'agent1@pelaut-nusantara.co.id', '$2a$10$3jVHhqPjEsMSjpqNxxqEZ.ToquwArtEiAGiIe1XYBxVL/t.Ke.ydq', 'Budi Santoso', 'agent');

-- ============================================================================
-- SAMPLE PARTICIPANTS
-- ============================================================================
INSERT INTO participants (
    id, agency_id, created_by, full_name, nik, email, phone, birth_date, birth_place, 
    gender, address, training_program, batch_number, registration_number, status, current_progress_step, progress_percentage,
    emergency_contact
) VALUES
-- Agency 1 Participants
(
    '770e8400-e29b-41d4-a716-446655440001', 
    '550e8400-e29b-41d4-a716-446655440001', 
    '660e8400-e29b-41d4-a716-446655440003',
    'Andi Setiawan', 
    '3201234567890001', 
    'andi.setiawan@email.com', 
    '+62-812-3456-7890',
    '1995-05-15',
    'Jakarta',
    'male',
    'Jl. Merdeka No. 123, Jakarta Pusat',
    'Basic Safety Training (BST)',
    'BST-2025-001',
    'SMY-MSI-001-2025',
    'in_review',
    2,
    33.33,
    '{"name": "Siti Setiawan", "phone": "+62-813-2345-6789", "relation": "Istri"}'
),
(
    '770e8400-e29b-41d4-a716-446655440002', 
    '550e8400-e29b-41d4-a716-446655440001', 
    '660e8400-e29b-41d4-a716-446655440003',
    'Rudi Hartono', 
    '3201234567890002', 
    'rudi.hartono@email.com', 
    '+62-812-3456-7891',
    '1992-08-20',
    'Bandung',
    'male',
    'Jl. Asia Afrika No. 456, Bandung',
    'Advanced Fire Fighting',
    'AFF-2025-001',
    'SMY-MSI-002-2025',
    'submitted',
    1,
    16.67,
    '{"name": "Maya Hartono", "phone": "+62-813-2345-6790", "relation": "Istri"}'
),

-- Agency 2 Participants
(
    '770e8400-e29b-41d4-a716-446655440003', 
    '550e8400-e29b-41d4-a716-446655440002', 
    '660e8400-e29b-41d4-a716-446655440005',
    'Dewi Sartika', 
    '3501234567890001', 
    'dewi.sartika@email.com', 
    '+62-812-3456-7892',
    '1990-12-10',
    'Surabaya',
    'female',
    'Jl. Diponegoro No. 789, Surabaya',
    'Medical First Aid',
    'MFA-2025-001',
    'SMY-OCC-001-2025',
    'approved',
    4,
    66.67,
    '{"name": "Agus Sartika", "phone": "+62-813-2345-6791", "relation": "Suami"}'
),

-- Agency 3 Participants
(
    '770e8400-e29b-41d4-a716-446655440004', 
    '550e8400-e29b-41d4-a716-446655440003', 
    '660e8400-e29b-41d4-a716-446655440007',
    'Bayu Pratama', 
    '3301234567890001', 
    'bayu.pratama@email.com', 
    '+62-812-3456-7893',
    '1988-03-25',
    'Semarang',
    'male',
    'Jl. Pemuda No. 321, Semarang',
    'Ship Security Officer',
    'SSO-2025-001',
    'SMY-PNU-001-2025',
    'completed',
    6,
    100.00,
    '{"name": "Rina Pratama", "phone": "+62-813-2345-6792", "relation": "Istri"}'
);

-- ============================================================================
-- SAMPLE PROGRESS TRACKING
-- ============================================================================
-- Get progress template IDs first, then insert progress records
-- For participant 1 (Andi Setiawan) - currently at step 2
INSERT INTO participant_progress (participant_id, template_id, status, started_at, completed_at)
SELECT 
    '770e8400-e29b-41d4-a716-446655440001',
    id,
    CASE 
        WHEN step_order = 1 THEN 'completed'::progress_status
        WHEN step_order = 2 THEN 'in_progress'::progress_status
        ELSE 'not_started'::progress_status
    END,
    CASE 
        WHEN step_order <= 2 THEN CURRENT_TIMESTAMP - INTERVAL '5 days'
        ELSE NULL
    END,
    CASE 
        WHEN step_order = 1 THEN CURRENT_TIMESTAMP - INTERVAL '3 days'
        ELSE NULL
    END
FROM progress_templates;

-- For participant 2 (Rudi Hartono) - currently at step 1
INSERT INTO participant_progress (participant_id, template_id, status, started_at, completed_at)
SELECT 
    '770e8400-e29b-41d4-a716-446655440002',
    id,
    CASE 
        WHEN step_order = 1 THEN 'in_progress'::progress_status
        ELSE 'not_started'::progress_status
    END,
    CASE 
        WHEN step_order = 1 THEN CURRENT_TIMESTAMP - INTERVAL '2 days'
        ELSE NULL
    END,
    NULL
FROM progress_templates;

-- For participant 3 (Dewi Sartika) - currently at step 4
INSERT INTO participant_progress (participant_id, template_id, status, started_at, completed_at)
SELECT 
    '770e8400-e29b-41d4-a716-446655440003',
    id,
    CASE 
        WHEN step_order <= 3 THEN 'completed'::progress_status
        WHEN step_order = 4 THEN 'in_progress'::progress_status
        ELSE 'not_started'::progress_status
    END,
    CASE 
        WHEN step_order <= 4 THEN CURRENT_TIMESTAMP - INTERVAL '10 days' + (step_order * INTERVAL '2 days')
        ELSE NULL
    END,
    CASE 
        WHEN step_order <= 3 THEN CURRENT_TIMESTAMP - INTERVAL '8 days' + (step_order * INTERVAL '2 days')
        ELSE NULL
    END
FROM progress_templates;

-- For participant 4 (Bayu Pratama) - completed all steps
INSERT INTO participant_progress (participant_id, template_id, status, started_at, completed_at)
SELECT 
    '770e8400-e29b-41d4-a716-446655440004',
    id,
    'completed'::progress_status,
    CURRENT_TIMESTAMP - INTERVAL '30 days' + (step_order * INTERVAL '3 days'),
    CURRENT_TIMESTAMP - INTERVAL '25 days' + (step_order * INTERVAL '3 days')
FROM progress_templates;

-- ============================================================================
-- SAMPLE DOCUMENTS
-- ============================================================================
INSERT INTO documents (participant_id, document_type, original_filename, file_path, status, uploaded_by) VALUES
-- Andi Setiawan documents
('770e8400-e29b-41d4-a716-446655440001', 'ktp', 'ktp_andi.pdf', '/uploads/documents/ktp_andi_001.pdf', 'verified', '660e8400-e29b-41d4-a716-446655440003'),
('770e8400-e29b-41d4-a716-446655440001', 'ijazah', 'ijazah_andi.pdf', '/uploads/documents/ijazah_andi_001.pdf', 'verified', '660e8400-e29b-41d4-a716-446655440003'),
('770e8400-e29b-41d4-a716-446655440001', 'medical_certificate', 'medical_andi.pdf', '/uploads/documents/medical_andi_001.pdf', 'uploaded', '660e8400-e29b-41d4-a716-446655440003'),

-- Rudi Hartono documents
('770e8400-e29b-41d4-a716-446655440002', 'ktp', 'ktp_rudi.pdf', '/uploads/documents/ktp_rudi_002.pdf', 'uploaded', '660e8400-e29b-41d4-a716-446655440003'),
('770e8400-e29b-41d4-a716-446655440002', 'ijazah', 'ijazah_rudi.pdf', '/uploads/documents/ijazah_rudi_002.pdf', 'pending', '660e8400-e29b-41d4-a716-446655440003'),

-- Dewi Sartika documents
('770e8400-e29b-41d4-a716-446655440003', 'ktp', 'ktp_dewi.pdf', '/uploads/documents/ktp_dewi_003.pdf', 'verified', '660e8400-e29b-41d4-a716-446655440005'),
('770e8400-e29b-41d4-a716-446655440003', 'ijazah', 'ijazah_dewi.pdf', '/uploads/documents/ijazah_dewi_003.pdf', 'verified', '660e8400-e29b-41d4-a716-446655440005'),
('770e8400-e29b-41d4-a716-446655440003', 'medical_certificate', 'medical_dewi.pdf', '/uploads/documents/medical_dewi_003.pdf', 'verified', '660e8400-e29b-41d4-a716-446655440005'),
('770e8400-e29b-41d4-a716-446655440003', 'police_record', 'police_dewi.pdf', '/uploads/documents/police_dewi_003.pdf', 'verified', '660e8400-e29b-41d4-a716-446655440005'),

-- Bayu Pratama documents (complete set)
('770e8400-e29b-41d4-a716-446655440004', 'ktp', 'ktp_bayu.pdf', '/uploads/documents/ktp_bayu_004.pdf', 'verified', '660e8400-e29b-41d4-a716-446655440007'),
('770e8400-e29b-41d4-a716-446655440004', 'ijazah', 'ijazah_bayu.pdf', '/uploads/documents/ijazah_bayu_004.pdf', 'verified', '660e8400-e29b-41d4-a716-446655440007'),
('770e8400-e29b-41d4-a716-446655440004', 'medical_certificate', 'medical_bayu.pdf', '/uploads/documents/medical_bayu_004.pdf', 'verified', '660e8400-e29b-41d4-a716-446655440007'),
('770e8400-e29b-41d4-a716-446655440004', 'police_record', 'police_bayu.pdf', '/uploads/documents/police_bayu_004.pdf', 'verified', '660e8400-e29b-41d4-a716-446655440007'),
('770e8400-e29b-41d4-a716-446655440004', 'medical_report', 'medical_report_bayu.pdf', '/uploads/documents/medical_report_bayu_004.pdf', 'verified', '660e8400-e29b-41d4-a716-446655440007'),
('770e8400-e29b-41d4-a716-446655440004', 'certificate', 'certificate_bayu.pdf', '/uploads/documents/certificate_bayu_004.pdf', 'verified', '660e8400-e29b-41d4-a716-446655440007');

-- ============================================================================
-- SAMPLE ACTIVITY LOGS
-- ============================================================================
INSERT INTO activity_logs (user_id, participant_id, action, entity_type, description) VALUES
('660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 'create', 'participant', 'Created new participant: Andi Setiawan'),
('660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 'upload', 'document', 'Uploaded KTP document'),
('660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'verify', 'document', 'Verified KTP document'),
('660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', 'create', 'participant', 'Created new participant: Rudi Hartono'),
('660e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440003', 'create', 'participant', 'Created new participant: Dewi Sartika'),
('660e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440004', 'create', 'participant', 'Created new participant: Bayu Pratama'),
('660e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440004', 'complete', 'training', 'Completed all training requirements');