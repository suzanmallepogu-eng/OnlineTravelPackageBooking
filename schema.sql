-- ========================================================
-- SUZAN TRAVELS - ONLINE TRAVEL PACKAGE BOOKING SYSTEM
-- Database Schema Definition & Sample Seed Data
-- ========================================================

CREATE DATABASE IF NOT EXISTS onlinetravelpackagebooking;
USE onlinetravelpackagebooking;

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  Customer_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(45) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Destinations Table
CREATE TABLE IF NOT EXISTS destinations (
  destination_id INT AUTO_INCREMENT PRIMARY KEY,
  destination_name VARCHAR(150) NOT NULL,
  location VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT
);

-- 3. Packages Table
CREATE TABLE IF NOT EXISTS packages (
  package_id INT AUTO_INCREMENT PRIMARY KEY,
  destination_id INT NOT NULL,
  package_name VARCHAR(150) NOT NULL,
  duration INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  available_slots INT NOT NULL DEFAULT 0,
  image_url TEXT,
  CONSTRAINT fk_package_destination FOREIGN KEY (destination_id)
    REFERENCES destinations(destination_id) ON DELETE RESTRICT
);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  package_id INT NOT NULL,
  travel_date DATE NOT NULL,
  travel_data DATE,
  persons INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('Pending','Confirmed','Cancelled') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id)
    REFERENCES customers(Customer_id) ON DELETE RESTRICT,
  CONSTRAINT fk_booking_package FOREIGN KEY (package_id)
    REFERENCES packages(package_id) ON DELETE RESTRICT
);

-- ========================================================
-- Seed Initial Sample Destinations (Using Local Verified Images)
-- ========================================================
INSERT INTO destinations (destination_name, location, description, image_url)
SELECT 'Goa Beach Paradise', 'Goa, India', 'Sun-kissed beaches, thrilling water sports, coastal cuisine and historic Portuguese architecture.', '/images/goa.jpg'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE destination_name='Goa Beach Paradise');

INSERT INTO destinations (destination_name, location, description, image_url)
SELECT 'Manali Mountain Haven', 'Himachal Pradesh, India', 'Snow-capped peaks, pine forests, Rohtang Pass adventures and cozy Himalayan valleys.', '/images/manali.jpg'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE destination_name='Manali Mountain Haven');

INSERT INTO destinations (destination_name, location, description, image_url)
SELECT 'Kerala Backwaters & Hills', 'Kerala, India', 'Serene houseboat cruises in Alleppey, lush Munnar tea estates and tranquil Ayurvedic retreats.', '/images/kerala.jpg'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE destination_name='Kerala Backwaters & Hills');

INSERT INTO destinations (destination_name, location, description, image_url)
SELECT 'Bali Tropical Escape', 'Bali, Indonesia', 'Verdant rice terraces in Ubud, sacred sea temples, world-class surfing and tropical luxury villas.', '/images/bali.jpg'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE destination_name='Bali Tropical Escape');

INSERT INTO destinations (destination_name, location, description, image_url)
SELECT 'Swiss Alpine Wonders', 'Switzerland', 'Panoramic alpine vistas, iconic Jungfrau railway, crystal lakes and picturesque mountain chalets.', '/images/switzerland.jpg'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE destination_name='Swiss Alpine Wonders');

INSERT INTO destinations (destination_name, location, description, image_url)
SELECT 'Parisian Romance & Art', 'Paris, France', 'The Eiffel Tower, Louvre masterpieces, Seine river cruises and timeless sidewalk cafes.', '/images/paris.jpg'
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE destination_name='Parisian Romance & Art');

-- ========================================================
-- Seed Initial Sample Packages
-- ========================================================
INSERT INTO packages (destination_id, package_name, duration, price, available_slots, image_url)
SELECT destination_id, 'Goa Sun & Sand Getaway', 4, 14999.00, 25, '/images/goa.jpg'
FROM destinations WHERE destination_name='Goa Beach Paradise'
AND NOT EXISTS (SELECT 1 FROM packages WHERE package_name='Goa Sun & Sand Getaway');

INSERT INTO packages (destination_id, package_name, duration, price, available_slots, image_url)
SELECT destination_id, 'Manali Explorer & Rohtang Pass', 6, 22499.00, 18, '/images/manali.jpg'
FROM destinations WHERE destination_name='Manali Mountain Haven'
AND NOT EXISTS (SELECT 1 FROM packages WHERE package_name='Manali Explorer & Rohtang Pass');

INSERT INTO packages (destination_id, package_name, duration, price, available_slots, image_url)
SELECT destination_id, 'Kerala Houseboat & Munnar Trails', 5, 19999.00, 20, '/images/kerala.jpg'
FROM destinations WHERE destination_name='Kerala Backwaters & Hills'
AND NOT EXISTS (SELECT 1 FROM packages WHERE package_name='Kerala Houseboat & Munnar Trails');

INSERT INTO packages (destination_id, package_name, duration, price, available_slots, image_url)
SELECT destination_id, 'Bali Island Discovery Tour', 7, 45999.00, 14, '/images/bali.jpg'
FROM destinations WHERE destination_name='Bali Tropical Escape'
AND NOT EXISTS (SELECT 1 FROM packages WHERE package_name='Bali Island Discovery Tour');

INSERT INTO packages (destination_id, package_name, duration, price, available_slots, image_url)
SELECT destination_id, 'Swiss Alps Scenic Odyssey', 8, 89999.00, 12, '/images/switzerland.jpg'
FROM destinations WHERE destination_name='Swiss Alpine Wonders'
AND NOT EXISTS (SELECT 1 FROM packages WHERE package_name='Swiss Alps Scenic Odyssey');

INSERT INTO packages (destination_id, package_name, duration, price, available_slots, image_url)
SELECT destination_id, 'Paris City of Lights Experience', 5, 64999.00, 15, '/images/paris.jpg'
FROM destinations WHERE destination_name='Parisian Romance & Art'
AND NOT EXISTS (SELECT 1 FROM packages WHERE package_name='Paris City of Lights Experience');
