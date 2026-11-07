// SUZAN TRAVELS - Automated Verification Test Suite
const pool = require('./db');
const app = require('./server');
const http = require('http');

let server;
const PORT = 3001;
const baseUrl = `http://localhost:${PORT}`;

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 SUZAN TRAVELS - COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  // Start test server
  server = app.listen(PORT);
  await new Promise(resolve => setTimeout(resolve, 500));

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. HEALTH & DB CONNECTIVITY
    console.log('--- 1. Testing System Health & Database Connectivity ---');
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'ok', 'API Health Check', JSON.stringify(health.data));

    // 2. DASHBOARD STATS
    console.log('\n--- 2. Testing Dashboard Statistics ---');
    const stats = await request('/api/stats');
    assert(stats.status === 200, 'Fetch Dashboard Statistics');
    assert(typeof stats.data.totalCustomers === 'number', 'Stats contains totalCustomers');
    assert(typeof stats.data.totalDestinations === 'number', 'Stats contains totalDestinations');
    assert(typeof stats.data.totalPackages === 'number', 'Stats contains totalPackages');
    assert(typeof stats.data.totalBookings === 'number', 'Stats contains totalBookings');
    console.log('  Current stats:', stats.data);

    // 3. DESTINATIONS CRUD
    console.log('\n--- 3. Testing Destinations Operations ---');
    // Add destination
    const newDest = {
      destination_name: 'Test Kyoto Heritage',
      location: 'Kyoto, Japan',
      description: 'Historic wooden temples, geisha districts and bamboo forests.',
      image_url: '/images/travel-banner.jpg'
    };
    const addDestRes = await request('/api/destinations', { method: 'POST', body: JSON.stringify(newDest) });
    assert(addDestRes.status === 201 && addDestRes.data.id, 'Add Destination (Kyoto)', JSON.stringify(addDestRes.data));
    const testDestId = addDestRes.data.id;

    // Display destinations
    const getDestRes = await request('/api/destinations');
    const foundDest = getDestRes.data.find(d => d.destination_id === testDestId);
    assert(foundDest && foundDest.destination_name === 'Test Kyoto Heritage', 'Display & Find Added Destination');

    // Update destination
    const updateDestRes = await request(`/api/destinations/${testDestId}`, {
      method: 'PUT',
      body: JSON.stringify({
        destination_name: 'Test Kyoto Zen Gardens',
        location: 'Kyoto, Japan',
        description: 'Updated description of serene temples and gardens.',
        image_url: '/images/travel-banner.jpg'
      })
    });
    assert(updateDestRes.status === 200, 'Update Destination');
    const verifyDest = (await request('/api/destinations')).data.find(d => d.destination_id === testDestId);
    assert(verifyDest && verifyDest.destination_name === 'Test Kyoto Zen Gardens', 'Verify Destination Updated Value');

    // 4. PACKAGES CRUD
    console.log('\n--- 4. Testing Packages Operations ---');
    // Add package linked to test destination
    const newPkg = {
      destination_id: testDestId,
      package_name: 'Test Kyoto Zen Explorer',
      duration: 6,
      price: 65000,
      available_slots: 10,
      image_url: '/images/travel-banner.jpg'
    };
    const addPkgRes = await request('/api/packages', { method: 'POST', body: JSON.stringify(newPkg) });
    assert(addPkgRes.status === 201 && addPkgRes.data.id, 'Add Package (Kyoto Zen Explorer)', JSON.stringify(addPkgRes.data));
    const testPkgId = addPkgRes.data.id;

    // Display packages
    const getPkgRes = await request('/api/packages');
    const foundPkg = getPkgRes.data.find(p => p.package_id === testPkgId);
    assert(foundPkg && foundPkg.price === '65000.00', 'Display Package with Price');

    // Update package price
    const updatePkgRes = await request(`/api/packages/${testPkgId}`, {
      method: 'PUT',
      body: JSON.stringify({
        destination_id: testDestId,
        package_name: 'Test Kyoto Zen Explorer',
        duration: 6,
        price: 72000,
        available_slots: 10,
        image_url: '/images/travel-banner.jpg'
      })
    });
    assert(updatePkgRes.status === 200, 'Update Package Price to ₹72,000');
    const verifyPkg = (await request('/api/packages')).data.find(p => p.package_id === testPkgId);
    assert(verifyPkg && Number(verifyPkg.price) === 72000, 'Verify Package Updated Price');

    // 5. CUSTOMERS CRUD
    console.log('\n--- 5. Testing Customers Operations ---');
    const testEmail = `testuser_${Date.now()}@example.com`;
    const newCust = {
      name: 'Rohan Sharma',
      email: testEmail,
      phone: '9811223344',
      password: 'password123'
    };
    const addCustRes = await request('/api/customers', { method: 'POST', body: JSON.stringify(newCust) });
    assert(addCustRes.status === 201 && addCustRes.data.id, 'Add Customer (Rohan Sharma)', JSON.stringify(addCustRes.data));
    const testCustId = addCustRes.data.id;

    // Duplicate email rejection check
    const dupCustRes = await request('/api/customers', { method: 'POST', body: JSON.stringify(newCust) });
    assert(dupCustRes.status === 409, 'Reject Duplicate Customer Email (HTTP 409)');

    // Search/display customer
    const getCustRes = await request('/api/customers');
    const foundCust = getCustRes.data.find(c => c.customer_id === testCustId);
    assert(foundCust && foundCust.name === 'Rohan Sharma' && !foundCust.password, 'Display Customer without exposing password');

    // Update customer details
    const updateCustRes = await request(`/api/customers/${testCustId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Rohan S. Sharma',
        email: testEmail,
        phone: '9811223399'
      })
    });
    assert(updateCustRes.status === 200, 'Update Customer Phone & Name');
    const verifyCust = (await request('/api/customers')).data.find(c => c.customer_id === testCustId);
    assert(verifyCust && verifyCust.name === 'Rohan S. Sharma' && verifyCust.phone === '9811223399', 'Verify Customer Update');

    // 6. BOOKINGS CRUD & ATOMIC SLOT LOGIC
    console.log('\n--- 6. Testing Bookings Operations & Slot Consistency ---');
    // Initial slots: 10
    const initialPkg = (await request('/api/packages')).data.find(p => p.package_id === testPkgId);
    assert(initialPkg.available_slots === 10, 'Package Initial Slots = 10');

    // Overbooking check (request 15 seats when only 10 available)
    const futureDate = '2026-12-25';
    const overbookRes = await request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: testCustId,
        package_id: testPkgId,
        travel_date: futureDate,
        persons: 15
      })
    });
    assert(overbookRes.status === 400, 'Reject Overbooking (> available slots)');

    // Valid booking creation (3 persons)
    const validBookingRes = await request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: testCustId,
        package_id: testPkgId,
        travel_date: futureDate,
        persons: 3
      })
    });
    assert(validBookingRes.status === 201 && validBookingRes.data.booking_id, 'Create Booking (3 persons)', JSON.stringify(validBookingRes.data));
    const testBookingId = validBookingRes.data.booking_id;

    // Verify slots decreased: 10 - 3 = 7
    const pkgAfterBook = (await request('/api/packages')).data.find(p => p.package_id === testPkgId);
    assert(pkgAfterBook.available_slots === 7, 'Slots Decreased Correctly: 10 -> 7');

    // Update status to Confirmed
    const confirmRes = await request(`/api/bookings/${testBookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Confirmed' })
    });
    assert(confirmRes.status === 200, 'Update Booking Status to Confirmed');
    const pkgAfterConfirm = (await request('/api/packages')).data.find(p => p.package_id === testPkgId);
    assert(pkgAfterConfirm.available_slots === 7, 'Slots Unchanged on Pending -> Confirmed (Still 7)');

    // Cancel booking -> slots restored: 7 + 3 = 10
    const cancelRes = await request(`/api/bookings/${testBookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Cancelled' })
    });
    assert(cancelRes.status === 200, 'Cancel Booking');
    const pkgAfterCancel = (await request('/api/packages')).data.find(p => p.package_id === testPkgId);
    assert(pkgAfterCancel.available_slots === 10, 'Slots Restored on Cancellation: 7 -> 10');

    // Cancel again -> verify NO double-restoration!
    const cancelAgainRes = await request(`/api/bookings/${testBookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Cancelled' })
    });
    assert(cancelAgainRes.status === 200, 'Repeat Status Update to Cancelled');
    const pkgAfterRepeatCancel = (await request('/api/packages')).data.find(p => p.package_id === testPkgId);
    assert(pkgAfterRepeatCancel.available_slots === 10, 'No Double-Restoration of Slots (Still 10)');

    // Delete test booking
    const deleteBookingRes = await request(`/api/bookings/${testBookingId}`, { method: 'DELETE' });
    assert(deleteBookingRes.status === 200, 'Delete Booking');

    // 7. FOREIGN KEY SAFETY
    console.log('\n--- 7. Testing Foreign Key Restriction Safety ---');
    // Destination has a linked package (testPkgId) -> delete destination should be blocked!
    const blockDestDelete = await request(`/api/destinations/${testDestId}`, { method: 'DELETE' });
    assert(blockDestDelete.status === 400, 'Safely Block Destination Deletion with Dependent Package');

    // Delete package first
    const deletePkgRes = await request(`/api/packages/${testPkgId}`, { method: 'DELETE' });
    assert(deletePkgRes.status === 200, 'Delete Test Package Successfully');

    // Now delete destination should succeed
    const deleteDestRes = await request(`/api/destinations/${testDestId}`, { method: 'DELETE' });
    assert(deleteDestRes.status === 200, 'Delete Test Destination Successfully After Package Removed');

    // Delete customer
    const deleteCustRes = await request(`/api/customers/${testCustId}`, { method: 'DELETE' });
    assert(deleteCustRes.status === 200, 'Delete Test Customer Successfully');

    // 8. CONTACT FORM TEST
    console.log('\n--- 8. Testing Contact Form ---');
    const contactRes = await request('/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Priya Sharma',
        email: 'priya@example.com',
        subject: 'Maldives Honeymoon',
        message: 'Looking for a 5-day package in December.'
      })
    });
    assert(contactRes.status === 200 && contactRes.data.message, 'Submit Contact Form Inquiry');

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

