-- Seed data for Vieregge Immobilien CRM
-- Run AFTER creating a user account and replacing the user_id below
-- Replace 'YOUR-USER-ID-HERE' with your actual Supabase user ID (found in Auth > Users)

DO $$
DECLARE
  v_user_id UUID := 'YOUR-USER-ID-HERE';
  c1 UUID; c2 UUID; c3 UUID; c4 UUID; c5 UUID; c6 UUID;
  p1 UUID; p2 UUID; p3 UUID; p4 UUID; p5 UUID; p6 UUID;
  d1 UUID; d2 UUID; d3 UUID;
BEGIN

-- Contacts
INSERT INTO contacts (id, user_id, name, email, phone, type, status, budget, notes) VALUES
  (uuid_generate_v4(), v_user_id, 'Klaus Bauer', 'k.bauer@gmail.com', '+49 176 23456789', 'buyer', 'active', 650000, 'Sucht 4-Zimmer-Wohnung in Berlin-Mitte oder Prenzlauer Berg.')
  RETURNING id INTO c1;

INSERT INTO contacts (id, user_id, name, email, phone, type, status, notes) VALUES
  (uuid_generate_v4(), v_user_id, 'Sabine Hoffmann', 'sabine.hoffmann@web.de', '+49 151 98765432', 'seller', 'active', 'Verkauft Erbschaft-Eigentumswohnung in Hamburg.')
  RETURNING id INTO c2;

INSERT INTO contacts (id, user_id, name, email, phone, type, status, budget, notes) VALUES
  (uuid_generate_v4(), v_user_id, 'Thomas Müller', 't.mueller@outlook.de', '+49 170 11223344', 'buyer', 'active', 890000, 'Interessiert an Einfamilienhaus in München oder Umgebung.')
  RETURNING id INTO c3;

INSERT INTO contacts (id, user_id, name, email, phone, type, status, budget) VALUES
  (uuid_generate_v4(), v_user_id, 'Anna Schmidt', 'anna.schmidt@t-online.de', '+49 172 55667788', 'prospect', 'active', 420000)
  RETURNING id INTO c4;

INSERT INTO contacts (id, user_id, name, email, phone, type, status, notes) VALUES
  (uuid_generate_v4(), v_user_id, 'Werner Fischer', 'w.fischer@gmx.de', '+49 163 44556677', 'seller', 'active', 'Verkauft Gewerbeimmobilie in Frankfurt, zeitkritisch.')
  RETURNING id INTO c5;

INSERT INTO contacts (id, user_id, name, email, phone, type, status, budget) VALUES
  (uuid_generate_v4(), v_user_id, 'Petra Lange', 'petra.lange@gmail.com', '+49 179 99887766', 'buyer', 'active', 1200000)
  RETURNING id INTO c6;

-- Properties
INSERT INTO properties (id, user_id, title, address, city, price, size, rooms, type, status, description) VALUES
  (uuid_generate_v4(), v_user_id, 'Luxus-Penthouse Prenzlauer Berg', 'Kollwitzstraße 58, 10405 Berlin', 'Berlin', 1480000, 142, 5, 'apartment', 'available', 'Exklusives Penthouse mit Dachterrasse und Panoramablick.')
  RETURNING id INTO p1;

INSERT INTO properties (id, user_id, title, address, city, price, size, rooms, type, status, description) VALUES
  (uuid_generate_v4(), v_user_id, 'Einfamilienhaus Grünwald', 'Birkenweg 12, 82031 Grünwald', 'München', 2100000, 280, 7, 'house', 'reserved', 'Repräsentatives Einfamilienhaus in begehrter Münchner Südlage.')
  RETURNING id INTO p2;

INSERT INTO properties (id, user_id, title, address, city, price, size, rooms, type, status) VALUES
  (uuid_generate_v4(), v_user_id, '3-Zimmer-Wohnung Eppendorf', 'Eppendorfer Landstraße 91, 20249 Hamburg', 'Hamburg', 620000, 89, 3, 'apartment', 'available')
  RETURNING id INTO p3;

INSERT INTO properties (id, user_id, title, address, city, price, size, rooms, type, status) VALUES
  (uuid_generate_v4(), v_user_id, 'Gewerbeeinheit Sachsenhausen', 'Schweizer Straße 44, 60594 Frankfurt am Main', 'Frankfurt', 890000, 210, 0, 'commercial', 'available')
  RETURNING id INTO p4;

INSERT INTO properties (id, user_id, title, address, city, price, size, rooms, type, status) VALUES
  (uuid_generate_v4(), v_user_id, 'Doppelhaushälfte Bogenhausen', 'Oberföhringer Straße 107, 81925 München', 'München', 1350000, 195, 6, 'house', 'sold')
  RETURNING id INTO p5;

INSERT INTO properties (id, user_id, title, address, city, price, size, rooms, type, status) VALUES
  (uuid_generate_v4(), v_user_id, '2-Zimmer-Wohnung Mitte', 'Friedrichstraße 120, 10117 Berlin', 'Berlin', 480000, 58, 2, 'apartment', 'available')
  RETURNING id INTO p6;

-- Deals
INSERT INTO deals (id, user_id, contact_id, property_id, status, value, commission, notes) VALUES
  (uuid_generate_v4(), v_user_id, c1, p1, 'viewing', 1480000, 44400, 'Zweite Besichtigung geplant.')
  RETURNING id INTO d1;

INSERT INTO deals (id, user_id, contact_id, property_id, status, value, commission, notes) VALUES
  (uuid_generate_v4(), v_user_id, c3, p2, 'offer', 2050000, 61500, 'Angebot unter Listenpreis eingereicht.')
  RETURNING id INTO d2;

INSERT INTO deals (id, user_id, contact_id, property_id, status, value, commission) VALUES
  (uuid_generate_v4(), v_user_id, c6, p5, 'won', 1350000, 40500)
  RETURNING id INTO d3;

-- Viewings
INSERT INTO viewings (user_id, contact_id, property_id, deal_id, date, time, status, notes) VALUES
  (v_user_id, c1, p1, d1, '2025-06-10', '14:00', 'scheduled', 'Zweite Besichtigung. Bitte Dachterrasse zeigen.'),
  (v_user_id, c3, p2, d2, '2025-06-05', '11:00', 'completed', 'Sehr positives Feedback.'),
  (v_user_id, c6, p5, d3, '2025-05-28', '10:00', 'completed', 'Besichtigung erfolgreich. Kauf abgeschlossen.');

END $$;
