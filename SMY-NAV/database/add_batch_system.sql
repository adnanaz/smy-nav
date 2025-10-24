-- Add batch/angkatan system
-- Untuk mengelola kuota dan batch pelatihan

-- Enum untuk status batch
CREATE TYPE batch_status AS ENUM (
  'forming',        -- Sedang mengumpulkan peserta
  'ready',          -- Siap dikirim ke pusat (min 15 peserta)
  'sent_to_center', -- Sudah dikirim ke pusat
  'in_training',    -- Sedang pelatihan
  'completed',      -- Selesai
  'cancelled'       -- Dibatalkan
);

-- Update participant status enum
ALTER TYPE participant_status ADD VALUE IF NOT EXISTS 'waiting_quota';
ALTER TYPE participant_status ADD VALUE IF NOT EXISTS 'sent_to_center';
ALTER TYPE participant_status ADD VALUE IF NOT EXISTS 'waiting_dispatch';

-- Tabel untuk batch/angkatan
CREATE TABLE training_batches (
  id SERIAL PRIMARY KEY,
  batch_number VARCHAR(50) UNIQUE NOT NULL, -- Format: BST-2025-001, BST-2025-002, dll
  training_program VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  sequence_number INTEGER NOT NULL, -- 1, 2, 3, dst untuk angkatan ke-
  status batch_status NOT NULL DEFAULT 'forming',
  min_participants INTEGER NOT NULL DEFAULT 15,
  max_participants INTEGER NOT NULL DEFAULT 24,
  current_participants INTEGER NOT NULL DEFAULT 0,
  target_start_date DATE,
  actual_start_date DATE,
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- Add batch_id to participants table
ALTER TABLE participants ADD COLUMN batch_id INTEGER REFERENCES training_batches(id);

-- Index untuk performa
CREATE INDEX idx_training_batches_program_year ON training_batches(training_program, year);
CREATE INDEX idx_training_batches_status ON training_batches(status);
CREATE INDEX idx_participants_batch_id ON participants(batch_id);

-- Function untuk auto-generate batch number
CREATE OR REPLACE FUNCTION generate_batch_number(p_training_program VARCHAR, p_year INTEGER)
RETURNS VARCHAR AS $$
DECLARE
  next_sequence INTEGER;
  batch_number VARCHAR;
BEGIN
  -- Get next sequence number for this program and year
  SELECT COALESCE(MAX(sequence_number), 0) + 1
  INTO next_sequence
  FROM training_batches
  WHERE training_program = p_training_program AND year = p_year;
  
  -- Generate batch number: BST-2025-001
  batch_number := p_training_program || '-' || p_year || '-' || LPAD(next_sequence::TEXT, 3, '0');
  
  RETURN batch_number;
END;
$$ LANGUAGE plpgsql;

-- Function untuk auto-assign participant ke batch yang tersedia
CREATE OR REPLACE FUNCTION assign_participant_to_batch(p_participant_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  participant_program VARCHAR;
  available_batch_id INTEGER;
  new_batch_id INTEGER;
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  -- Get participant's training program
  SELECT training_program INTO participant_program
  FROM participants WHERE id = p_participant_id;
  
  -- Find available batch (forming status and not full)
  SELECT id INTO available_batch_id
  FROM training_batches
  WHERE training_program = participant_program
    AND status = 'forming'
    AND current_participants < max_participants
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- If no available batch, create new one
  IF available_batch_id IS NULL THEN
    INSERT INTO training_batches (
      batch_number,
      training_program,
      year,
      sequence_number
    ) VALUES (
      generate_batch_number(participant_program, current_year),
      participant_program,
      current_year,
      (SELECT COALESCE(MAX(sequence_number), 0) + 1 FROM training_batches WHERE training_program = participant_program AND year = current_year)
    ) RETURNING id INTO new_batch_id;
    
    available_batch_id := new_batch_id;
  END IF;
  
  -- Assign participant to batch
  UPDATE participants 
  SET batch_id = available_batch_id 
  WHERE id = p_participant_id;
  
  -- Update batch participant count
  UPDATE training_batches 
  SET current_participants = current_participants + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = available_batch_id;
  
  -- Check if batch is ready (min participants reached)
  UPDATE training_batches 
  SET status = 'ready'
  WHERE id = available_batch_id 
    AND current_participants >= min_participants 
    AND status = 'forming';
  
  RETURN available_batch_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-assign batch ketika participant status berubah ke verified
CREATE OR REPLACE FUNCTION trigger_assign_batch()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika status berubah ke verified, assign ke batch
  IF NEW.status = 'verified' AND OLD.status != 'verified' AND NEW.batch_id IS NULL THEN
    NEW.batch_id := assign_participant_to_batch(NEW.id);
    NEW.status := 'waiting_quota'; -- Update status ke waiting_quota
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER participants_assign_batch_trigger
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION trigger_assign_batch();

-- View untuk dashboard batch
CREATE VIEW batch_dashboard AS
SELECT 
  tb.*,
  ROUND((tb.current_participants::DECIMAL / tb.max_participants) * 100, 1) as fill_percentage,
  CASE 
    WHEN tb.current_participants >= tb.min_participants THEN true
    ELSE false
  END as is_ready_for_center,
  CASE 
    WHEN tb.current_participants >= tb.max_participants THEN true
    ELSE false
  END as is_full
FROM training_batches tb
ORDER BY tb.created_at DESC;

-- Sample data
INSERT INTO training_batches (batch_number, training_program, year, sequence_number, status) VALUES
('BST-2025-001', 'BST', 2025, 1, 'forming'),
('SAT-2025-001', 'SAT', 2025, 1, 'forming'),
('CCM_CMHBT-2025-001', 'CCM_CMHBT', 2025, 1, 'forming');