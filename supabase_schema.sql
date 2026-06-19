-- ==========================================================================
-- AVALOKANA - SUPABASE DATABASE SCHEMA MIGRATION
-- SQL Migration Script for Tickets Booking & Admin Attendance Verification
-- ==========================================================================

-- 1. DROP EXISTING CONSTRAINTS AND TABLES (FOR CLEAN INSTALLS)
DROP TRIGGER IF EXISTS trigger_update_event_seats ON bookings;
DROP TRIGGER IF EXISTS trigger_set_booking_id ON bookings;
DROP FUNCTION IF EXISTS update_event_seats();
DROP FUNCTION IF EXISTS set_booking_id();
DROP SEQUENCE IF EXISTS booking_id_seq;

DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS events;

-- 2. CREATE SEQUENCES
-- Sequence for generating sequential Booking IDs (e.g. AVA-2026-0001)
CREATE SEQUENCE booking_id_seq START 1;

-- 3. CREATE EVENTS TABLE
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  venue TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL, -- e.g. "July 05 - 4:00 PM", "July 05 - 6:00 PM"
  ticket_price NUMERIC NOT NULL DEFAULT 150,
  available_seats INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE BOOKINGS TABLE
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  ticket_count INTEGER NOT NULL CHECK (ticket_count > 0),
  ticket_price NUMERIC NOT NULL DEFAULT 100,
  total_amount NUMERIC NOT NULL,
  payment_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Success', 'Failed')),
  booking_status TEXT NOT NULL DEFAULT 'Pending' CHECK (booking_status IN ('Pending', 'Confirmed', 'Cancelled')),
  qr_code_url TEXT,
  checked_in BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CREATE PAYMENTS TABLE
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  transaction_id TEXT,
  payment_gateway TEXT NOT NULL DEFAULT 'MockGateway',
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Success', 'Failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. CREATE FUNCTIONS & TRIGGERS

-- Function to format and assign sequential booking ID (e.g. AVA-000001)
CREATE OR REPLACE FUNCTION set_booking_id()
RETURNS TRIGGER AS $$
DECLARE
  seq_val INT;
BEGIN
  SELECT nextval('booking_id_seq') INTO seq_val;
  NEW.booking_id := 'AVA-' || LPAD(seq_val::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_id
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_id();



-- 7. SEED INITIAL EVENTS
INSERT INTO events (title, description, venue, event_date, event_time, ticket_price, available_seats)
VALUES 
  ('Avalokana', 'A curious spiritual journey exploring Madana''s internal struggle with purity and self-discovery.', 'Chamundeshwari Studios, 48/3, Millers Tank Bund Rd, Vasanth Nagar, Bengaluru - 560052', '2026-07-04', 'Saturday, July 4th, 2026 | 5:00 PM onwards', 99, 100)
ON CONFLICT DO NOTHING;


-- 8. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 9. DEFINE RLS POLICIES

-- Events Policies
CREATE POLICY "Allow public read access to events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated admins full access to events" ON events
  FOR ALL TO authenticated USING (true);

-- Bookings Policies
CREATE POLICY "Allow public to view any booking by code (E-Ticket query)" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Allow public to submit bookings (Anons create booking requests)" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated admins to modify bookings" ON bookings
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated admins to delete bookings" ON bookings
  FOR DELETE TO authenticated USING (true);

-- Payments Policies
CREATE POLICY "Allow public select access to payments" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to payments" ON payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated admins to edit payments" ON payments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated admins to delete payments" ON payments
  FOR DELETE TO authenticated USING (true);
