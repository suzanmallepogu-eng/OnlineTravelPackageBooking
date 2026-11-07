const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public, with dedicated aliases for image paths
app.use(express.static('public'));
app.use('/images', express.static('public/images'));
app.use('/public/images', express.static('public/images'));
app.use(express.static('public/images')); // directly serves /maldives.jpg, /bali.jpg, etc.

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ==========================================
// 1. DASHBOARD & SYSTEM STATS
// ==========================================
app.get('/api/stats', asyncRoute(async (req, res) => {
  const [[{ total: totalCustomers }]] = await db.query('SELECT COUNT(*) AS total FROM customers');
  const [[{ total: totalDestinations }]] = await db.query('SELECT COUNT(*) AS total FROM destinations');
  const [[{ total: totalPackages }]] = await db.query('SELECT COUNT(*) AS total FROM packages');
  const [[{ total: totalBookings }]] = await db.query('SELECT COUNT(*) AS total FROM bookings');
  const [[{ total: pendingBookings }]] = await db.query("SELECT COUNT(*) AS total FROM bookings WHERE status = 'Pending'");
  const [[{ total: confirmedBookings }]] = await db.query("SELECT COUNT(*) AS total FROM bookings WHERE status = 'Confirmed'");
  const [[{ total: cancelledBookings }]] = await db.query("SELECT COUNT(*) AS total FROM bookings WHERE status = 'Cancelled'");
  const [[{ total: totalRevenue }]] = await db.query("SELECT COALESCE(SUM(total_amount), 0) AS total FROM bookings WHERE status = 'Confirmed'");

  res.json({
    totalCustomers,
    totalDestinations,
    totalPackages,
    totalBookings,
    pendingBookings,
    confirmedBookings,
    cancelledBookings,
    totalRevenue: Number(totalRevenue)
  });
}));

// ==========================================
// 2. CUSTOMER ROUTES
// ==========================================
app.get('/api/customers', asyncRoute(async (req, res) => {
  const [rows] = await db.query(
    'SELECT Customer_id AS customer_id, name, email, phone, created_at FROM customers ORDER BY Customer_id DESC'
  );
  res.json(rows);
}));

app.post('/api/customers', asyncRoute(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password || password.length < 6) {
    return res.status(400).json({ error: 'Please enter name, valid email, phone number and a password of at least 6 characters.' });
  }

  // Duplicate email check
  const [existing] = await db.query('SELECT Customer_id FROM customers WHERE LOWER(email) = LOWER(?)', [email.trim()]);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'A customer with this email address is already registered.' });
  }

  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO customers(name, email, phone, password) VALUES(?, ?, ?, ?)',
    [name.trim(), email.trim(), phone.trim(), hash]
  );
  res.status(201).json({ message: 'Customer registered successfully.', id: result.insertId });
}));

app.put('/api/customers/:id', asyncRoute(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const customerId = req.params.id;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email and phone number are required.' });
  }

  // Duplicate email check for another customer
  const [existing] = await db.query(
    'SELECT Customer_id FROM customers WHERE LOWER(email) = LOWER(?) AND Customer_id != ?',
    [email.trim(), customerId]
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Another customer with this email address already exists.' });
  }

  if (password && password.trim().length >= 6) {
    const hash = await bcrypt.hash(password.trim(), 10);
    await db.query(
      'UPDATE customers SET name=?, email=?, phone=?, password=? WHERE Customer_id=?',
      [name.trim(), email.trim(), phone.trim(), hash, customerId]
    );
  } else {
    await db.query(
      'UPDATE customers SET name=?, email=?, phone=? WHERE Customer_id=?',
      [name.trim(), email.trim(), phone.trim(), customerId]
    );
  }
  res.json({ message: 'Customer updated successfully.' });
}));

app.delete('/api/customers/:id', asyncRoute(async (req, res) => {
  const customerId = req.params.id;
  // Check if customer has bookings
  const [bookings] = await db.query('SELECT COUNT(*) AS count FROM bookings WHERE customer_id = ?', [customerId]);
  if (bookings[0].count > 0) {
    return res.status(400).json({
      error: `Cannot delete customer: they have ${bookings[0].count} booking(s) on record. Please cancel or delete the bookings first.`
    });
  }

  const [result] = await db.query('DELETE FROM customers WHERE Customer_id = ?', [customerId]);
  if (!result.affectedRows) {
    return res.status(404).json({ error: 'Customer not found.' });
  }
  res.json({ message: 'Customer deleted successfully.' });
}));

// Helper to resolve and normalize image paths (including specific Maldives handling)
function normalizeImagePath(imageUrl, name = '', location = '') {
  const combined = ((name || '') + ' ' + (location || '') + ' ' + (imageUrl || '')).toLowerCase();
  if (combined.includes('maldives')) {
    return '/images/maldives.jpg';
  }
  let clean = (imageUrl && typeof imageUrl === 'string') ? imageUrl.trim() : '';
  if (!clean) {
    if (combined.includes('bali')) return '/images/bali.jpg';
    if (combined.includes('goa')) return '/images/goa.jpg';
    if (combined.includes('manali')) return '/images/manali.jpg';
    if (combined.includes('kerala')) return '/images/kerala.jpg';
    if (combined.includes('paris')) return '/images/paris.jpg';
    if (combined.includes('swiss') || combined.includes('switzerland')) return '/images/switzerland.jpg';
    if (combined.includes('dubai')) return '/images/dubai.jpg';
    if (combined.includes('thailand')) return '/images/thailand.jpg';
    if (combined.includes('taj') || combined.includes('agra')) return '/images/tajmahal.jpg';
    return '/images/travel-banner.jpg';
  }
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  clean = clean.replace(/\\/g, '/');
  if (clean.startsWith('public/')) clean = clean.substring(7);
  if (clean.startsWith('/public/')) clean = clean.substring(8);
  if (!clean.startsWith('/') && !clean.startsWith('images/')) {
    clean = '/images/' + clean;
  } else if (clean.startsWith('images/')) {
    clean = '/' + clean;
  }
  return clean;
}

// ==========================================
// 3. DESTINATION ROUTES
// ==========================================
app.get('/api/destinations', asyncRoute(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM destinations ORDER BY destination_id DESC');
  const normalized = rows.map(d => ({
    ...d,
    image_url: normalizeImagePath(d.image_url, d.destination_name, d.location)
  }));
  res.json(normalized);
}));

app.post('/api/destinations', asyncRoute(async (req, res) => {
  const { destination_name, location, description, image_url } = req.body;
  if (!destination_name || !location || !description) {
    return res.status(400).json({ error: 'Destination name, location and description are required.' });
  }
  const image = normalizeImagePath(image_url, destination_name, location);
  const [r] = await db.query(
    'INSERT INTO destinations(destination_name, location, description, image_url) VALUES(?, ?, ?, ?)',
    [destination_name.trim(), location.trim(), description.trim(), image]
  );
  res.status(201).json({ message: 'Destination created successfully.', id: r.insertId });
}));

app.put('/api/destinations/:id', asyncRoute(async (req, res) => {
  const { destination_name, location, description, image_url } = req.body;
  if (!destination_name || !location || !description) {
    return res.status(400).json({ error: 'Destination name, location and description are required.' });
  }
  const image = normalizeImagePath(image_url, destination_name, location);
  const [r] = await db.query(
    'UPDATE destinations SET destination_name=?, location=?, description=?, image_url=? WHERE destination_id=?',
    [destination_name.trim(), location.trim(), description.trim(), image, req.params.id]
  );
  if (!r.affectedRows) {
    return res.status(404).json({ error: 'Destination not found.' });
  }
  res.json({ message: 'Destination updated successfully.' });
}));

app.delete('/api/destinations/:id', asyncRoute(async (req, res) => {
  const destId = req.params.id;
  // Check if packages are linked to this destination
  const [packs] = await db.query('SELECT COUNT(*) AS count FROM packages WHERE destination_id = ?', [destId]);
  if (packs[0].count > 0) {
    return res.status(400).json({
      error: `Cannot delete destination: it is used by ${packs[0].count} package(s). Please remove or reassign those packages first.`
    });
  }

  const [r] = await db.query('DELETE FROM destinations WHERE destination_id = ?', [destId]);
  if (!r.affectedRows) {
    return res.status(404).json({ error: 'Destination not found.' });
  }
  res.json({ message: 'Destination deleted successfully.' });
}));

// ==========================================
// 4. PACKAGE ROUTES
// ==========================================
app.get('/api/packages', asyncRoute(async (req, res) => {
  const [rows] = await db.query(`
    SELECT p.*, d.destination_name, d.location,
           COALESCE(p.image_url, d.image_url, '/images/travel-banner.jpg') AS display_image
    FROM packages p
    LEFT JOIN destinations d ON p.destination_id = d.destination_id
    ORDER BY p.package_id DESC
  `);
  const normalized = rows.map(p => ({
    ...p,
    display_image: normalizeImagePath(p.display_image || p.image_url, p.package_name, p.destination_name)
  }));
  res.json(normalized);
}));

app.post('/api/packages', asyncRoute(async (req, res) => {
  const { destination_id, package_name, duration, price, available_slots, image_url } = req.body;
  if (!destination_id || !package_name || Number(duration) < 1 || Number(price) < 0 || Number(available_slots) < 0) {
    return res.status(400).json({ error: 'Please enter valid destination, package name, duration (>=1), price (>=0) and available slots (>=0).' });
  }

  const image = (image_url && image_url.trim()) ? image_url.trim() : null;
  const [r] = await db.query(
    'INSERT INTO packages(destination_id, package_name, duration, price, available_slots, image_url) VALUES(?, ?, ?, ?, ?, ?)',
    [Number(destination_id), package_name.trim(), Number(duration), Number(price), Number(available_slots), image]
  );
  res.status(201).json({ message: 'Package created successfully.', id: r.insertId });
}));

app.put('/api/packages/:id', asyncRoute(async (req, res) => {
  const { destination_id, package_name, duration, price, available_slots, image_url } = req.body;
  if (!destination_id || !package_name || Number(duration) < 1 || Number(price) < 0 || Number(available_slots) < 0) {
    return res.status(400).json({ error: 'Please enter valid package details.' });
  }

  const image = (image_url && image_url.trim()) ? image_url.trim() : null;
  const [r] = await db.query(
    'UPDATE packages SET destination_id=?, package_name=?, duration=?, price=?, available_slots=?, image_url=? WHERE package_id=?',
    [Number(destination_id), package_name.trim(), Number(duration), Number(price), Number(available_slots), image, req.params.id]
  );
  if (!r.affectedRows) {
    return res.status(404).json({ error: 'Package not found.' });
  }
  res.json({ message: 'Package updated successfully.' });
}));

app.delete('/api/packages/:id', asyncRoute(async (req, res) => {
  const packageId = req.params.id;
  // Check if any bookings exist for this package
  const [bookings] = await db.query('SELECT COUNT(*) AS count FROM bookings WHERE package_id = ?', [packageId]);
  if (bookings[0].count > 0) {
    return res.status(400).json({
      error: `Cannot delete package: it has ${bookings[0].count} booking(s) associated with it. Please manage those bookings first.`
    });
  }

  const [r] = await db.query('DELETE FROM packages WHERE package_id = ?', [packageId]);
  if (!r.affectedRows) {
    return res.status(404).json({ error: 'Package not found.' });
  }
  res.json({ message: 'Package deleted successfully.' });
}));

// ==========================================
// 5. BOOKING ROUTES (WITH ATOMIC TRANSACTIONS)
// ==========================================
app.get('/api/bookings', asyncRoute(async (req, res) => {
  const [rows] = await db.query(`
    SELECT b.booking_id, b.customer_id, b.package_id,
           COALESCE(b.travel_date, b.travel_data) AS travel_date,
           b.persons, b.total_amount, b.status, b.created_at,
           c.name AS customer_name, c.email AS customer_email,
           p.package_name, p.price AS package_price,
           d.destination_name, d.location
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.Customer_id
    LEFT JOIN packages p ON b.package_id = p.package_id
    LEFT JOIN destinations d ON p.destination_id = d.destination_id
    ORDER BY b.booking_id DESC
  `);
  res.json(rows);
}));

app.post('/api/bookings', asyncRoute(async (req, res) => {
  const { customer_id, package_id, travel_date, persons } = req.body;
  const count = Number(persons);

  if (!customer_id || !package_id || !travel_date || !Number.isInteger(count) || count < 1) {
    return res.status(400).json({ error: 'Please choose a customer, package, valid travel date and at least 1 person.' });
  }

  // Validate travel date is not in the past
  const chosenDate = new Date(travel_date + 'T00:00:00');
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
  if (chosenDate < today) {
    return res.status(400).json({ error: 'Travel date cannot be in the past.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Lock package row to prevent race conditions on slots
    const [packages] = await conn.query(
      'SELECT price, available_slots, package_name FROM packages WHERE package_id = ? FOR UPDATE',
      [package_id]
    );

    if (!packages.length) {
      throw new Error('Selected travel package does not exist.');
    }

    const pkg = packages[0];
    if (pkg.available_slots <= 0) {
      throw new Error(`Package "${pkg.package_name}" is currently sold out (0 slots available).`);
    }

    if (count > pkg.available_slots) {
      throw new Error(`Only ${pkg.available_slots} slot(s) available for "${pkg.package_name}". You requested ${count}.`);
    }

    const total = Number(pkg.price) * count;

    // Insert into bookings populating both travel_date and travel_data for full backward compatibility
    const [r] = await conn.query(
      `INSERT INTO bookings(customer_id, package_id, travel_date, travel_data, persons, total_amount, status)
       VALUES(?, ?, ?, ?, ?, ?, 'Pending')`,
      [Number(customer_id), Number(package_id), travel_date, travel_date, count, total]
    );

    // Atomically reduce available slots
    await conn.query(
      'UPDATE packages SET available_slots = available_slots - ? WHERE package_id = ?',
      [count, package_id]
    );

    await conn.commit();
    res.status(201).json({
      message: `Booking created successfully for ${count} traveler(s)! Total: ₹${total.toLocaleString('en-IN')}`,
      booking_id: r.insertId,
      total_amount: total
    });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
}));

// Update booking status with strict slot restoration & double-counting prevention
app.put('/api/bookings/:id/status', asyncRoute(async (req, res) => {
  const { status } = req.body;
  const bookingId = req.params.id;

  if (!['Pending', 'Confirmed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid booking status. Allowed: Pending, Confirmed, Cancelled.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT booking_id, status, package_id, persons FROM bookings WHERE booking_id = ? FOR UPDATE',
      [bookingId]
    );

    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Booking record not found.' });
    }

    const current = rows[0];

    // CASE 1: Transitioning to Cancelled from non-cancelled -> restore slots exactly once
    if (status === 'Cancelled' && current.status !== 'Cancelled') {
      await conn.query(
        'UPDATE packages SET available_slots = available_slots + ? WHERE package_id = ?',
        [current.persons, current.package_id]
      );
    }
    // CASE 2: Transitioning from Cancelled to active (Pending or Confirmed) -> re-decrement slots if available
    else if (current.status === 'Cancelled' && status !== 'Cancelled') {
      const [pkg] = await conn.query(
        'SELECT available_slots, package_name FROM packages WHERE package_id = ? FOR UPDATE',
        [current.package_id]
      );

      if (!pkg.length) {
        throw new Error('Associated package does not exist.');
      }

      if (pkg[0].available_slots < current.persons) {
        throw new Error(
          `Cannot reactivate booking: only ${pkg[0].available_slots} slot(s) available in package "${pkg[0].package_name}", but this booking requires ${current.persons}.`
        );
      }

      await conn.query(
        'UPDATE packages SET available_slots = available_slots - ? WHERE package_id = ?',
        [current.persons, current.package_id]
      );
    }
    // CASE 3: Status is unchanged or changing between Pending <-> Confirmed: no slot adjustments needed

    await conn.query('UPDATE bookings SET status = ? WHERE booking_id = ?', [status, bookingId]);
    await conn.commit();

    res.json({ message: `Booking status updated to ${status}.` });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
}));

// Delete booking (restores slots if the booking was not cancelled)
app.delete('/api/bookings/:id', asyncRoute(async (req, res) => {
  const bookingId = req.params.id;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT package_id, persons, status FROM bookings WHERE booking_id = ? FOR UPDATE',
      [bookingId]
    );

    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const { package_id, persons, status } = rows[0];

    await conn.query('DELETE FROM bookings WHERE booking_id = ?', [bookingId]);

    // Only restore slots if the booking wasn't already Cancelled
    if (status !== 'Cancelled') {
      await conn.query(
        'UPDATE packages SET available_slots = available_slots + ? WHERE package_id = ?',
        [persons, package_id]
      );
    }

    await conn.commit();
    res.json({ message: 'Booking deleted successfully and package slots restored.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
}));

// ==========================================
// 6. CONTACT FORM SUBMISSION
// ==========================================
app.post('/api/contact', (req, res) => {
  const { name, email, phone, message, subject } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }
  // In a production app this would trigger an email or CRM lead
  res.json({
    message: `Thank you ${name}! Your inquiry regarding "${subject || 'General Travel'}" has been received. A SUZAN TRAVELS specialist will contact you at ${email} shortly.`
  });
});

// ==========================================
// 7. HEALTH CHECK
// ==========================================
app.get('/api/health', asyncRoute(async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', brand: 'SUZAN TRAVELS', message: 'SUZAN TRAVELS API is fully operational' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database connection failed: ' + err.message });
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'This record or email address already exists.' });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ error: 'Cannot delete: record is referenced by another active record.' });
  }
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`✈ SUZAN TRAVELS - Online Travel Package Booking`);
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
