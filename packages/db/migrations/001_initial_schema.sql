-- Physician Scheduling Platform - Initial Schema
-- Run this against your Neon database (or use Neon MCP)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('admin', 'physician');
CREATE TYPE shift_type AS ENUM ('call', 'clinic');
CREATE TYPE schedule_status AS ENUM ('draft', 'published');
CREATE TYPE open_shift_status AS ENUM ('open', 'claimed', 'approved', 'rejected');
CREATE TYPE pickup_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE swap_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE roster_event_type AS ENUM ('drop', 'pickup', 'swap', 'approve');

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE physicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE REFERENCES profiles(user_id),
  name TEXT NOT NULL,
  email TEXT,
  specialties TEXT[],
  max_shifts_per_week INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE blackout_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  physician_id UUID NOT NULL REFERENCES physicians(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status schedule_status DEFAULT 'draft',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  physician_id UUID REFERENCES physicians(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  type shift_type DEFAULT 'call',
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_shift_times CHECK (end_time > start_time)
);

CREATE INDEX idx_shifts_schedule_start ON shifts(schedule_id, start_time);
CREATE INDEX idx_shifts_physician_start ON shifts(physician_id, start_time);

CREATE TABLE open_shift_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  dropped_by_physician_id UUID NOT NULL REFERENCES physicians(id),
  status open_shift_status DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shift_pickup_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  open_shift_request_id UUID NOT NULL REFERENCES open_shift_requests(id) ON DELETE CASCADE,
  requested_by_physician_id UUID NOT NULL REFERENCES physicians(id),
  status pickup_status DEFAULT 'pending',
  approved_by_admin_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_a_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  shift_b_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  physician_a_id UUID NOT NULL REFERENCES physicians(id),
  physician_b_id UUID NOT NULL REFERENCES physicians(id),
  status swap_status DEFAULT 'pending',
  admin_id TEXT,
  admin_approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roster_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type roster_event_type NOT NULL,
  entity_id UUID,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_roster_events_created ON roster_events(created_at DESC);

CREATE TABLE schedule_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read);

CREATE TABLE physician_fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
