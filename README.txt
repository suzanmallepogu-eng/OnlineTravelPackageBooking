===================================================================
SUZAN TRAVELS – ONLINE TRAVEL PACKAGE BOOKING SYSTEM
B.Tech CSE Full-Stack Web Development Project
===================================================================

SUZAN TRAVELS is a modern, responsive, full-stack travel booking 
web application built with Node.js, Express.js, MySQL, HTML5, 
CSS3, and Vanilla JavaScript.

Tagline: "Explore the World, Create Memories."

-------------------------------------------------------------------
1. TECH STACK & SYSTEM ARCHITECTURE
-------------------------------------------------------------------
- Frontend: HTML5, CSS3 (Custom Responsive Theme), Vanilla JavaScript (ES6+)
- Typography & Theme: Manrope & DM Sans, Deep Navy Blue (#0b1e36), 
  Turquoise (#0d9488), Light Sky Blue (#e0f2fe), Golden Accents (#d97706)
- Backend: Node.js with Express.js REST API
- Database: MySQL (mysql2 with connection pooling & atomic transactions)
- Security: bcryptjs password hashing, parameterized SQL queries (SQL injection prevention)
- Architecture: Single-page dynamic updates (AJAX Fetch API), no full page reloads

-------------------------------------------------------------------
2. PROJECT STRUCTURE
-------------------------------------------------------------------
OnlineTravelPackageBooking/
│
├── public/
│   ├── index.html            # Homepage (Hero banner, Search, Popular Places, Why Choose Us, Testimonials, Contact)
│   ├── destinations.html     # Destinations CRUD Management & Live Search
│   ├── packages.html         # Travel Packages CRUD Management & Price/Destination Filters
│   ├── customers.html        # Customer Profiles Management & Registration
│   ├── bookings.html         # Booking Management with Live Price/Slot Calculator
│   ├── admin.html            # Admin Control Center with Live MySQL Statistics
│   ├── style.css             # Unified CSS Theme with Navy, Turquoise & Gold Accents
│   ├── script.js            # Vanilla JavaScript CRUD Controllers & Toast Notifications
│   └── images/               # High-Resolution Travel Destination Photos & Banner
│       ├── travel-banner.jpg # Homepage Hero Banner
│       ├── bali.jpg          # Bali, Indonesia
│       ├── dubai.jpg         # Dubai, UAE
│       ├── goa.jpg           # Goa, India
│       ├── kerala.jpg        # Kerala, India
│       ├── maldives.jpg      # Maldives
│       ├── manali.jpg        # Manali, Himachal Pradesh
│       ├── paris.jpg         # Paris, France
│       ├── switzerland.jpg   # Swiss Alps
│       ├── tajmahal.jpg      # Agra, India
│       └── thailand.jpg      # Thailand
│
├── db.js                     # MySQL Database Connection Pool (with Environment Variable fallback)
├── server.js                 # Primary Express.js Server & REST API Endpoints
├── app.js                    # Express Application Delegate (redirects cleanly to server.js)
├── schema.sql                # Complete MySQL Schema with AUTO_INCREMENT & Seed Data
├── test_suite.js             # Automated 35-point End-to-End Verification Test Script
└── package.json              # Project Dependencies & Start Scripts

-------------------------------------------------------------------
3. STEP-BY-STEP SETUP INSTRUCTIONS
-------------------------------------------------------------------

STEP 1: Verify MySQL Server
Make sure MySQL is running on your computer.
Default database name: onlinetravelpackagebooking

If setting up for the first time on a fresh MySQL instance:
1. Open MySQL Workbench.
2. Open schema.sql from this project folder.
3. Click the Execute button (lightning bolt).

STEP 2: Configure Database Credentials (if different)
In db.js (or via environment variables):
  host: 'localhost'
  user: 'root'
  password: 'root'   <-- Change this if your MySQL root password is different
  database: 'onlinetravelpackagebooking'

Alternatively, set environment variables:
  $env:DB_PASSWORD="your_password" (in PowerShell)

STEP 3: Start the Application
Open the project directory in VS Code Terminal:
  npm start

Output:
  ====================================================
  ✈ SUZAN TRAVELS - Online Travel Package Booking
  Server running at http://localhost:3000
  ====================================================

STEP 4: Open in Web Browser
Navigate to:
  http://localhost:3000

-------------------------------------------------------------------
4. KEY FEATURES & BUSINESS LOGIC
-------------------------------------------------------------------
1. Atomic Booking & Slot Allocation:
   - When a booking is submitted, the package row is locked inside a MySQL 
     transaction (SELECT ... FOR UPDATE).
   - If requested seats > available slots, the transaction rolls back and 
     informs the traveler.
   - On success, package available slots are atomically deducted.

2. Strict Cancellation & Restoration:
   - Changing status to 'Cancelled' restores reserved seats to the package.
   - Repeatedly saving 'Cancelled' will NOT double-restore slots.
   - Reactivating a cancelled booking validates that enough slots are currently 
     available before deducting again.

3. Foreign Key Deletion Protection:
   - Destinations cannot be deleted if packages reference them.
   - Packages cannot be deleted if active bookings reference them.
   - Customers cannot be deleted if they have bookings on record.

4. Live Pricing & Search Filters:
   - Real-time price calculator updates total price when package or traveler count changes.
   - Interactive search and filter controls across all modules with zero page reloads.

-------------------------------------------------------------------
5. VERIFICATION COMMANDS (VS CODE TERMINAL)
-------------------------------------------------------------------
To run the automated 35-point test suite:
  node test_suite.js

To start the server normally:
  npm start

To run in development mode with nodemon auto-restart:
  npm run dev

-------------------------------------------------------------------
6. MYSQL WORKBENCH VERIFICATION QUERIES
-------------------------------------------------------------------
You can open MySQL Workbench and run these verification queries:

USE onlinetravelpackagebooking;

-- Check all tables and record counts:
SELECT 'customers' AS tbl, COUNT(*) AS count FROM customers
UNION ALL
SELECT 'destinations', COUNT(*) FROM destinations
UNION ALL
SELECT 'packages', COUNT(*) FROM packages
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings;

-- Inspect all packages with their available slots:
SELECT p.package_id, p.package_name, d.destination_name, p.price, p.available_slots
FROM packages p
JOIN destinations d ON p.destination_id = d.destination_id;

-- Inspect customer bookings with joined details:
SELECT b.booking_id, c.name AS customer_name, p.package_name, b.travel_date, b.persons, b.total_amount, b.status
FROM bookings b
JOIN customers c ON b.customer_id = c.Customer_id
JOIN packages p ON b.package_id = p.package_id
ORDER BY b.booking_id DESC;
