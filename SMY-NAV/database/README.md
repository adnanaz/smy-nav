# SMY-NAV Database Setup Guide

## Prerequisites
- PostgreSQL 12+ installed and running
- Database administrator access

## Database Setup Instructions

### 1. Create Database
```sql
-- Connect to PostgreSQL as admin user
CREATE DATABASE smy_nav;
CREATE USER smy_nav_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE smy_nav TO smy_nav_user;
```

### 2. Run Schema Creation
```bash
# Connect to the database and run schema
psql -U smy_nav_user -d smy_nav -f database/schema.sql
```

### 3. Load Sample Data (Optional)
```bash
# Load sample data for testing
psql -U smy_nav_user -d smy_nav -f database/sample-data.sql
```

## Database Connection String
```
postgresql://smy_nav_user:your_secure_password@localhost:5432/smy_nav
```

## Environment Variables
Add these to your `.env` file:
```env
DATABASE_URL="postgresql://smy_nav_user:your_secure_password@localhost:5432/smy_nav"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smy_nav
DB_USER=smy_nav_user
DB_PASSWORD=your_secure_password
```

## Key Features of the Schema

### 🏢 **Multi-tenant Architecture**
- Each agency has isolated data
- Row Level Security (RLS) for data protection
- Agency-specific user management

### 👥 **User Management**
- Three roles: `super_admin`, `admin`, `agent`
- Agency-based access control
- Secure password hashing

### 📊 **Progress Tracking**
- Configurable workflow steps via `progress_templates`
- Real-time progress percentage calculation
- Status tracking for each step

### 📁 **Document Management**
- File upload with metadata
- Document verification workflow
- Support for multiple document types

### 🔍 **Audit Trail**
- Complete activity logging
- User action tracking
- System-wide monitoring

### 📈 **Performance Optimized**
- Proper indexes for fast queries
- Efficient joins and relationships
- Optimized for read-heavy workloads

## Sample Data Overview

The sample data includes:
- **3 Agencies**: Maritime Solutions, Ocean Careers, Pelaut Nusantara
- **7 Users**: 1 super admin, 3 agency admins, 3 agents
- **4 Participants**: Various stages of progress
- **6 Progress Steps**: Complete training workflow
- **Progress Records**: Real progress tracking examples
- **Document Records**: File upload examples
- **Activity Logs**: Audit trail examples

## Next Steps

After setting up the database:
1. ✅ **Database Schema** - COMPLETED
2. 🔄 **Backend API Setup** - NEXT
3. 🔄 **Authentication System**
4. 🔄 **Frontend Integration**

## Database Schema Diagram

```
agencies (1) ----< users (M)
agencies (1) ----< participants (M)
users (1) ----< participants (M) [created_by]
participants (1) ----< participant_progress (M)
participants (1) ----< documents (M)
progress_templates (1) ----< participant_progress (M)
```

## Useful Queries

### Get participant with progress
```sql
SELECT * FROM participant_summary WHERE agency_name = 'PT. Maritime Solutions';
```

### Get current progress for all participants
```sql
SELECT * FROM progress_summary;
```

### Get agency statistics
```sql
SELECT 
  a.name,
  COUNT(p.id) as total_participants,
  COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed
FROM agencies a
LEFT JOIN participants p ON a.id = p.agency_id
GROUP BY a.id, a.name;
```