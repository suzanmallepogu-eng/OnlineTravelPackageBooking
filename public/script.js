/* ===================================================================
   SUZAN TRAVELS - ONLINE TRAVEL PACKAGE BOOKING SYSTEM
   Frontend Application Logic (Vanilla JavaScript)
   Real MySQL CRUD Operations, Dynamic UI & Instant Feedback
   =================================================================== */

// Utility Helpers
const $ = (id) => document.getElementById(id);
const money = (value) => '₹' + Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const safe = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

// Fallback image helper with specific Maldives safeguard
function handleImageError(img) {
  img.onerror = null;
  const alt = (img.alt || '').toLowerCase();
  const src = (img.src || '').toLowerCase();
  if (alt.includes('maldives') || src.includes('maldives')) {
    img.src = '/images/maldives.jpg';
    return;
  }
  img.src = '/images/travel-banner.jpg';
}

// Smart image resolvers ensuring Maldives and all local images load reliably
function resolveDestinationImage(d) {
  const combined = ((d.destination_name || '') + ' ' + (d.location || '') + ' ' + (d.image_url || '')).toLowerCase();
  if (combined.includes('maldives')) {
    return '/images/maldives.jpg';
  }
  let img = (d.image_url || '').trim();
  if (!img) {
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
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  img = img.replace(/\\/g, '/');
  if (img.startsWith('public/')) img = img.substring(7);
  if (img.startsWith('/public/')) img = img.substring(8);
  if (!img.startsWith('/') && !img.startsWith('images/')) {
    img = '/images/' + img;
  } else if (img.startsWith('images/')) {
    img = '/' + img;
  }
  return img;
}

function resolvePackageImage(p) {
  const combined = ((p.package_name || '') + ' ' + (p.destination_name || '') + ' ' + (p.location || '') + ' ' + (p.display_image || p.image_url || '')).toLowerCase();
  if (combined.includes('maldives')) {
    return '/images/maldives.jpg';
  }
  let img = (p.display_image || p.image_url || '').trim();
  if (!img) {
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
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  img = img.replace(/\\/g, '/');
  if (img.startsWith('public/')) img = img.substring(7);
  if (img.startsWith('/public/')) img = img.substring(8);
  if (!img.startsWith('/') && !img.startsWith('images/')) {
    img = '/images/' + img;
  } else if (img.startsWith('images/')) {
    img = '/' + img;
  }
  return img;
}

// Global API Request Helper
async function api(url, options = {}) {
  const fetchOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    }
  };

  const response = await fetch(url, fetchOptions);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Operation failed. Please try again.');
  }
  return data;
}

// Modern Toast Notification System
function showToast(message, type = 'info') {
  let container = $('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `<span style="font-weight: 800; font-size: 16px;">${icon}</span><span>${safe(message)}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Inline Message Helper
function showMessage(elementId, message, isError = false) {
  const el = $(elementId);
  if (!el) return;
  if (!message) {
    el.textContent = '';
    el.className = 'message-box';
    return;
  }
  el.textContent = message;
  el.className = `message-box show ${isError ? 'error' : 'success'}`;
}

// Global Custom Confirmation Modal
function confirmAction(title, message) {
  return new Promise((resolve) => {
    let backdrop = $('confirmModalBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'confirmModalBackdrop';
      backdrop.className = 'modal-backdrop';
      backdrop.innerHTML = `
        <div class="modal-window">
          <h3 class="modal-title" id="confirmModalTitle"></h3>
          <p class="modal-text" id="confirmModalText"></p>
          <div class="modal-actions">
            <button class="btn btn-outline-dark btn-sm" id="confirmModalCancel">Cancel</button>
            <button class="btn btn-danger btn-sm" id="confirmModalOk">Delete</button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);
    }

    $('confirmModalTitle').textContent = title || 'Confirm Action';
    $('confirmModalText').textContent = message || 'Are you sure you want to proceed?';

    const okBtn = $('confirmModalOk');
    const cancelBtn = $('confirmModalCancel');

    function cleanup(result) {
      backdrop.classList.remove('open');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      resolve(result);
    }

    okBtn.onclick = () => cleanup(true);
    cancelBtn.onclick = () => cleanup(false);
    backdrop.classList.add('open');
  });
}

// Application In-Memory Cache
const cache = {
  customers: [],
  destinations: [],
  packages: [],
  bookings: [],
  stats: {}
};

// Form data extraction helper
function getFormData(form) {
  const formData = new FormData(form);
  const data = {};
  for (const [key, value] of formData.entries()) {
    data[key] = typeof value === 'string' ? value.trim() : value;
  }
  return data;
}

// ==========================================
// 1. DESTINATIONS CONTROLLER
// ==========================================
async function loadDestinations(searchQuery = '') {
  try {
    cache.destinations = await api('/api/destinations');
    renderDestinations(searchQuery);

    // Populate dropdowns in packages form & homepage search
    populateDestinationSelects();
  } catch (err) {
    console.error('Error loading destinations:', err);
    if ($('destinationsGrid')) {
      $('destinationsGrid').innerHTML = `<p class="section-desc" style="color:var(--danger)">Failed to load destinations: ${err.message}</p>`;
    }
  }
}

function renderDestinations(searchQuery = '') {
  const grid = $('destinationsGrid') || $('homeDestinationsGrid');
  if (!grid) return;

  const query = (searchQuery || '').toLowerCase().trim();
  const filtered = cache.destinations.filter(d =>
    !query ||
    (d.destination_name && d.destination_name.toLowerCase().includes(query)) ||
    (d.location && d.location.toLowerCase().includes(query)) ||
    (d.description && d.description.toLowerCase().includes(query))
  );

  if (!filtered.length) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: white; border-radius: 12px; border: 1px dashed var(--line);">
        <h3 style="color: var(--navy); margin-bottom: 8px;">No Destinations Found</h3>
        <p style="color: var(--text-muted);">No destinations matched "${safe(query)}". Try clearing your search.</p>
      </div>
    `;
    return;
  }

  const isManagementPage = !!$('destinationForm');

  grid.innerHTML = filtered.map(d => `
    <article class="destination-card" onclick="${isManagementPage ? '' : `location.href='packages.html?dest=${encodeURIComponent(d.destination_name)}'`}">
      <img class="destination-card-img" src="${safe(resolveDestinationImage(d))}" alt="${safe(d.destination_name)}" onerror="handleImageError(this)">
      <div class="destination-card-gradient"></div>
      <div class="destination-card-body">
        <span class="destination-location-tag">📍 ${safe(d.location)}</span>
        <h3 class="destination-card-title">${safe(d.destination_name)}</h3>
        <p class="destination-card-desc">${safe(d.description)}</p>
        
        <div class="destination-card-actions">
          ${isManagementPage ? `
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); editDestination(${d.destination_id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteDestination(${d.destination_id}, '${safe(d.destination_name)}')">Delete</button>
          ` : `
            <a class="btn btn-sm btn-gold" href="packages.html?dest=${encodeURIComponent(d.destination_name)}">View Packages →</a>
          `}
        </div>
      </div>
    </article>
  `).join('');

  if ($('destinationCountBadge')) {
    $('destinationCountBadge').textContent = `${filtered.length} destination${filtered.length === 1 ? '' : 's'}`;
  }
}

function populateDestinationSelects() {
  const selects = ['packageDestination', 'homeSearchDestination', 'filterPackageDestination'];
  selects.forEach(id => {
    const el = $(id);
    if (!el) return;
    const currentVal = el.value;
    const isFilter = id.startsWith('home') || id.startsWith('filter');
    let options = isFilter ? '<option value="">All Destinations</option>' : '<option value="">-- Choose Destination --</option>';
    options += cache.destinations.map(d => `<option value="${d.destination_id}">${safe(d.destination_name)} (${safe(d.location)})</option>`).join('');
    el.innerHTML = options;
    if (currentVal) el.value = currentVal;
  });
}

function resetDestinationForm() {
  const f = $('destinationForm');
  if (!f) return;
  f.reset();
  f.destination_id.value = '';
  $('destinationFormTitle').textContent = 'Add a New Destination';
  $('destinationSubmitBtn').textContent = 'Save Destination';
  showMessage('destinationMessage', '');
}

async function editDestination(id) {
  const d = cache.destinations.find(x => Number(x.destination_id) === Number(id));
  if (!d) return showToast('Destination not found', 'error');

  const f = $('destinationForm');
  if (!f) return;
  f.destination_id.value = d.destination_id;
  f.destination_name.value = d.destination_name || '';
  f.location.value = d.location || '';
  f.description.value = d.description || '';
  f.image_url.value = d.image_url || '';

  $('destinationFormTitle').textContent = `Edit Destination: ${d.destination_name}`;
  $('destinationSubmitBtn').textContent = 'Update Destination';
  f.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function deleteDestination(id, name) {
  const confirmed = await confirmAction(
    'Delete Destination',
    `Are you sure you want to delete "${name}"? Packages linked to this destination will prevent deletion.`
  );
  if (!confirmed) return;

  try {
    const res = await api(`/api/destinations/${id}`, { method: 'DELETE' });
    showToast(res.message || 'Destination deleted successfully.', 'success');
    await loadDestinations();
    await loadPackages();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// 2. PACKAGES CONTROLLER
// ==========================================
async function loadPackages(filters = {}) {
  try {
    cache.packages = await api('/api/packages');
    renderPackages(filters);
    populateBookingPackageSelect();
  } catch (err) {
    console.error('Error loading packages:', err);
    if ($('packagesGrid')) {
      $('packagesGrid').innerHTML = `<p class="section-desc" style="color:var(--danger)">Failed to load packages: ${err.message}</p>`;
    }
  }
}

function renderPackages(filters = {}) {
  const grid = $('packagesGrid') || $('homePackagesGrid');
  if (!grid) return;

  const query = (filters.search || '').toLowerCase().trim();
  const destFilter = filters.destination ? String(filters.destination) : '';
  const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;

  const filtered = cache.packages.filter(p => {
    const matchesSearch = !query ||
      (p.package_name && p.package_name.toLowerCase().includes(query)) ||
      (p.destination_name && p.destination_name.toLowerCase().includes(query)) ||
      (p.location && p.location.toLowerCase().includes(query));

    const matchesDest = !destFilter ||
      String(p.destination_id) === destFilter ||
      (p.destination_name && p.destination_name.toLowerCase() === destFilter.toLowerCase());

    const matchesPrice = !maxPrice || Number(p.price) <= maxPrice;

    return matchesSearch && matchesDest && matchesPrice;
  });

  if (!filtered.length) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: white; border-radius: 12px; border: 1px dashed var(--line);">
        <h3 style="color: var(--navy); margin-bottom: 8px;">No Travel Packages Found</h3>
        <p style="color: var(--text-muted);">Try adjusting your search keywords, destination filter or price range.</p>
      </div>
    `;
    return;
  }

  const isManagementPage = !!$('packageForm');

  grid.innerHTML = filtered.map(p => {
    const slots = Number(p.available_slots || 0);
    const slotClass = slots > 5 ? 'badge-slots-ok' : slots > 0 ? 'badge-slots-low' : 'badge-slots-full';
    const slotText = slots > 5 ? `${slots} Slots Available` : slots > 0 ? `Only ${slots} Slots Left!` : 'Sold Out';

    return `
      <article class="package-card">
        <div class="package-card-header">
          <img class="package-card-img" src="${safe(resolvePackageImage(p))}" alt="${safe(p.package_name)}" onerror="handleImageError(this)">
          <div class="package-duration-pill">⏱ ${p.duration} Days</div>
          <div class="package-slots-pill ${slotClass}">${slotText}</div>
        </div>
        <div class="package-card-body">
          <span class="package-card-dest">📍 ${safe(p.destination_name || 'Destination')} · ${safe(p.location || '')}</span>
          <h3 class="package-card-title">${safe(p.package_name)}</h3>
          
          <div class="package-card-footer">
            <div class="package-price-wrap">
              <span class="package-price-label">Starting From</span>
              <div class="package-price">${money(p.price)} <span>/ person</span></div>
            </div>
            
            <a class="btn btn-sm btn-primary" href="bookings.html?package_id=${p.package_id}" ${slots <= 0 ? 'style="pointer-events:none;opacity:0.6;"' : ''}>
              ${slots <= 0 ? 'Sold Out' : 'Book Now ↗'}
            </a>
          </div>

          ${isManagementPage ? `
            <div class="package-card-controls">
              <button class="btn btn-sm btn-outline-dark" style="flex:1;" onclick="editPackage(${p.package_id})">Edit Package</button>
              <button class="btn btn-sm btn-danger" onclick="deletePackage(${p.package_id}, '${safe(p.package_name)}')">Delete</button>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }).join('');

  if ($('packageCountBadge')) {
    $('packageCountBadge').textContent = `${filtered.length} package${filtered.length === 1 ? '' : 's'}`;
  }
}

function populateBookingPackageSelect() {
  const el = $('bookingPackage');
  if (!el) return;

  const currentVal = el.value;
  el.innerHTML = '<option value="">-- Choose Travel Package --</option>' + cache.packages.map(p => {
    const slots = Number(p.available_slots || 0);
    const isSoldOut = slots <= 0;
    return `<option value="${p.package_id}" data-price="${p.price}" data-slots="${slots}" ${isSoldOut ? 'disabled' : ''}>
      ${safe(p.package_name)} — ${money(p.price)} (${isSoldOut ? 'SOLD OUT' : `${slots} slots left`})
    </option>`;
  }).join('');

  if (currentVal) el.value = currentVal;

  // Handle URL query param: ?package_id=...
  const urlParams = new URLSearchParams(window.location.search);
  const pkgParam = urlParams.get('package_id');
  if (pkgParam && el.querySelector(`option[value="${pkgParam}"]`)) {
    el.value = pkgParam;
    updateBookingPricePreview();
  }
}

function resetPackageForm() {
  const f = $('packageForm');
  if (!f) return;
  f.reset();
  f.package_id.value = '';
  $('packageFormTitle').textContent = 'Add a New Travel Package';
  $('packageSubmitBtn').textContent = 'Save Package';
  showMessage('packageMessage', '');
}

async function editPackage(id) {
  const p = cache.packages.find(x => Number(x.package_id) === Number(id));
  if (!p) return showToast('Package not found', 'error');

  const f = $('packageForm');
  if (!f) return;
  f.package_id.value = p.package_id;
  f.destination_id.value = p.destination_id || '';
  f.package_name.value = p.package_name || '';
  f.duration.value = p.duration || 1;
  f.price.value = p.price || 0;
  f.available_slots.value = p.available_slots ?? 0;
  f.image_url.value = p.image_url || '';

  $('packageFormTitle').textContent = `Edit Package: ${p.package_name}`;
  $('packageSubmitBtn').textContent = 'Update Package';
  f.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function deletePackage(id, name) {
  const confirmed = await confirmAction(
    'Delete Travel Package',
    `Are you sure you want to delete "${name}"? Packages with existing bookings cannot be deleted.`
  );
  if (!confirmed) return;

  try {
    const res = await api(`/api/packages/${id}`, { method: 'DELETE' });
    showToast(res.message || 'Package deleted successfully.', 'success');
    await loadPackages();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// 3. CUSTOMERS CONTROLLER
// ==========================================
async function loadCustomers(searchQuery = '') {
  try {
    cache.customers = await api('/api/customers');
    renderCustomersTable(searchQuery);
    populateBookingCustomerSelect();
  } catch (err) {
    console.error('Error loading customers:', err);
    if ($('customerTableBody')) {
      $('customerTableBody').innerHTML = `<tr><td colspan="6" style="color:var(--danger)">Failed to load customers: ${err.message}</td></tr>`;
    }
  }
}

function renderCustomersTable(searchQuery = '') {
  const tbody = $('customerTableBody');
  if (!tbody) return;

  const query = (searchQuery || '').toLowerCase().trim();
  const filtered = cache.customers.filter(c =>
    !query ||
    String(c.customer_id).includes(query) ||
    (c.name && c.name.toLowerCase().includes(query)) ||
    (c.email && c.email.toLowerCase().includes(query)) ||
    (c.phone && c.phone.includes(query))
  );

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted)">No registered customers found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td><strong>#${c.customer_id}</strong></td>
      <td style="font-weight:700; color:var(--navy);">${safe(c.name)}</td>
      <td><a href="mailto:${safe(c.email)}" style="color:var(--turquoise);">${safe(c.email)}</a></td>
      <td>${safe(c.phone)}</td>
      <td><small style="color:var(--text-muted);">${c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</small></td>
      <td>
        <div class="table-action-btns">
          <button class="table-btn table-btn-edit" onclick="editCustomer(${c.customer_id})">Edit</button>
          <button class="table-btn table-btn-delete" onclick="deleteCustomer(${c.customer_id}, '${safe(c.name)}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  if ($('customerCountBadge')) {
    $('customerCountBadge').textContent = `${filtered.length} traveler${filtered.length === 1 ? '' : 's'}`;
  }
}

function populateBookingCustomerSelect() {
  const el = $('bookingCustomer');
  if (!el) return;

  const currentVal = el.value;
  el.innerHTML = '<option value="">-- Choose Registered Traveler --</option>' + cache.customers.map(c => `
    <option value="${c.customer_id}">${safe(c.name)} (${safe(c.email)})</option>
  `).join('');

  if (currentVal) el.value = currentVal;
}

function resetCustomerForm() {
  const f = $('customerForm');
  if (!f) return;
  f.reset();
  f.customer_id.value = '';
  f.password.required = true;
  $('customerFormTitle').textContent = 'Register New Traveler';
  $('customerSubmitBtn').textContent = 'Save Customer';
  $('passwordHint').textContent = 'Required for new registrations (min 6 characters).';
  showMessage('customerMessage', '');
}

async function editCustomer(id) {
  const c = cache.customers.find(x => Number(x.customer_id) === Number(id));
  if (!c) return showToast('Customer not found', 'error');

  const f = $('customerForm');
  if (!f) return;
  f.customer_id.value = c.customer_id;
  f.name.value = c.name || '';
  f.email.value = c.email || '';
  f.phone.value = c.phone || '';
  f.password.value = '';
  f.password.required = false;

  $('customerFormTitle').textContent = `Edit Traveler: ${c.name}`;
  $('customerSubmitBtn').textContent = 'Update Customer';
  $('passwordHint').textContent = 'Leave blank to keep existing password, or enter new password to change.';
  f.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function deleteCustomer(id, name) {
  const confirmed = await confirmAction(
    'Delete Customer',
    `Are you sure you want to delete customer "${name}"? Customers with active bookings cannot be deleted.`
  );
  if (!confirmed) return;

  try {
    const res = await api(`/api/customers/${id}`, { method: 'DELETE' });
    showToast(res.message || 'Customer deleted successfully.', 'success');
    await loadCustomers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// 4. BOOKINGS CONTROLLER
// ==========================================
async function loadBookings(searchQuery = '', statusFilter = 'All') {
  try {
    cache.bookings = await api('/api/bookings');
    renderBookingsTable(searchQuery, statusFilter);
  } catch (err) {
    console.error('Error loading bookings:', err);
    if ($('bookingTableBody')) {
      $('bookingTableBody').innerHTML = `<tr><td colspan="8" style="color:var(--danger)">Failed to load bookings: ${err.message}</td></tr>`;
    }
  }
}

function renderBookingsTable(searchQuery = '', statusFilter = 'All') {
  const tbody = $('bookingTableBody') || $('adminRecentBookings');
  if (!tbody) return;

  const query = (searchQuery || '').toLowerCase().trim();
  const filtered = cache.bookings.filter(b => {
    const matchesSearch = !query ||
      String(b.booking_id).includes(query) ||
      (b.customer_name && b.customer_name.toLowerCase().includes(query)) ||
      (b.package_name && b.package_name.toLowerCase().includes(query)) ||
      (b.customer_email && b.customer_email.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:var(--text-muted)">No bookings found matching criteria.</td></tr>`;
    return;
  }

  const isAdminTable = tbody.id === 'adminRecentBookings';
  const displayRows = isAdminTable ? filtered.slice(0, 8) : filtered;

  tbody.innerHTML = displayRows.map(b => {
    const statusClass = b.status === 'Confirmed' ? 'badge-confirmed' : b.status === 'Cancelled' ? 'badge-cancelled' : 'badge-pending';
    const travelDateStr = b.travel_date ? String(b.travel_date).slice(0, 10) : '—';

    return `
      <tr>
        <td><strong>#BK-${b.booking_id}</strong></td>
        <td>
          <div style="font-weight:700; color:var(--navy);">${safe(b.customer_name || 'Customer')}</div>
          <small style="color:var(--text-muted);">${safe(b.customer_email || '')}</small>
        </td>
        <td>
          <div style="font-weight:600; color:var(--navy);">${safe(b.package_name || 'Package')}</div>
          <small style="color:var(--turquoise);">${safe(b.destination_name || '')}</small>
        </td>
        <td>📅 ${travelDateStr}</td>
        <td>👥 <strong>${b.persons}</strong> person${b.persons === 1 ? '' : 's'}</td>
        <td style="font-weight:800; color:var(--navy);">${money(b.total_amount)}</td>
        <td>
          <select class="status-dropdown ${statusClass}" onchange="changeBookingStatus(${b.booking_id}, this.value, '${b.status}')">
            <option value="Pending" ${b.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
            <option value="Confirmed" ${b.status === 'Confirmed' ? 'selected' : ''}>✓ Confirmed</option>
            <option value="Cancelled" ${b.status === 'Cancelled' ? 'selected' : ''}>✕ Cancelled</option>
          </select>
        </td>
        <td>
          <button class="table-btn table-btn-delete" title="Delete Booking & Restore Slots" onclick="deleteBooking(${b.booking_id})">
            Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if ($('bookingCountBadge')) {
    $('bookingCountBadge').textContent = `${filtered.length} reservation${filtered.length === 1 ? '' : 's'}`;
  }
}

// Live Booking Price & Availability Calculator
function updateBookingPricePreview() {
  const pkgSelect = $('bookingPackage');
  const personsInput = $('bookingPersons');
  const previewBox = $('bookingCalcCard');
  if (!pkgSelect || !personsInput || !previewBox) return;

  const selectedOption = pkgSelect.options[pkgSelect.selectedIndex];
  const pkgId = pkgSelect.value;
  const persons = parseInt(personsInput.value, 10) || 0;

  if (!pkgId || !selectedOption) {
    previewBox.style.display = 'none';
    return;
  }

  const unitPrice = parseFloat(selectedOption.getAttribute('data-price')) || 0;
  const availableSlots = parseInt(selectedOption.getAttribute('data-slots'), 10) || 0;
  const total = unitPrice * persons;

  previewBox.style.display = 'flex';
  $('bookingCalcDetails').textContent = `${persons} traveler(s) × ${money(unitPrice)} (Available slots: ${availableSlots})`;
  $('bookingCalcTotal').textContent = money(total);

  if (persons > availableSlots) {
    $('bookingCalcDetails').innerHTML = `<span style="color:var(--danger); font-weight:700;">⚠ Requested ${persons} seats, but only ${availableSlots} slots are available!</span>`;
    $('bookingSubmitBtn').disabled = true;
    $('bookingSubmitBtn').style.opacity = '0.5';
  } else if (persons <= 0) {
    $('bookingCalcDetails').innerHTML = `<span style="color:var(--danger)">Please enter at least 1 traveler.</span>`;
    $('bookingSubmitBtn').disabled = true;
    $('bookingSubmitBtn').style.opacity = '0.5';
  } else {
    $('bookingSubmitBtn').disabled = false;
    $('bookingSubmitBtn').style.opacity = '1';
  }
}

async function changeBookingStatus(id, newStatus, currentStatus) {
  if (newStatus === currentStatus) return;

  try {
    const res = await api(`/api/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    showToast(res.message || 'Status updated successfully.', 'success');
    await loadBookings();
    await loadPackages(); // Slots may have been restored or deducted
    if ($('totalBookings')) loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
    await loadBookings(); // Reset select back to current state
  }
}

async function deleteBooking(id) {
  const confirmed = await confirmAction(
    'Delete Booking',
    'Are you sure you want to delete this booking? If it is not cancelled, reserved package slots will be automatically restored.'
  );
  if (!confirmed) return;

  try {
    const res = await api(`/api/bookings/${id}`, { method: 'DELETE' });
    showToast(res.message || 'Booking deleted successfully.', 'success');
    await loadBookings();
    await loadPackages();
    if ($('totalBookings')) loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================
// 5. ADMIN DASHBOARD CONTROLLER
// ==========================================
async function loadDashboard() {
  if (!$('totalCustomers')) return;

  try {
    const stats = await api('/api/stats');
    cache.stats = stats;

    $('totalCustomers').textContent = (stats.totalCustomers || 0).toLocaleString();
    $('totalDestinations').textContent = (stats.totalDestinations || 0).toLocaleString();
    $('totalPackages').textContent = (stats.totalPackages || 0).toLocaleString();
    $('totalBookings').textContent = (stats.totalBookings || 0).toLocaleString();

    if ($('pendingBookings')) $('pendingBookings').textContent = (stats.pendingBookings || 0).toLocaleString();
    if ($('confirmedBookings')) $('confirmedBookings').textContent = (stats.confirmedBookings || 0).toLocaleString();
    if ($('cancelledBookings')) $('cancelledBookings').textContent = (stats.cancelledBookings || 0).toLocaleString();
    if ($('totalRevenue')) $('totalRevenue').textContent = money(stats.totalRevenue || 0);

    // Load recent bookings table
    await loadBookings();
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

// ==========================================
// 6. FORM HANDLERS & EVENT LISTENERS
// ==========================================
function setupForms() {
  // Destination Form
  const destForm = $('destinationForm');
  if (destForm) {
    destForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = $('destinationSubmitBtn');
      submitBtn.disabled = true;
      const data = getFormData(destForm);
      const id = data.destination_id;
      delete data.destination_id;

      try {
        const res = await api(id ? `/api/destinations/${id}` : '/api/destinations', {
          method: id ? 'PUT' : 'POST',
          body: JSON.stringify(data)
        });
        showToast(res.message || 'Destination saved successfully.', 'success');
        resetDestinationForm();
        await loadDestinations();
      } catch (err) {
        showMessage('destinationMessage', err.message, true);
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // Package Form
  const pkgForm = $('packageForm');
  if (pkgForm) {
    pkgForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = $('packageSubmitBtn');
      submitBtn.disabled = true;
      const data = getFormData(pkgForm);
      const id = data.package_id;
      delete data.package_id;

      try {
        const res = await api(id ? `/api/packages/${id}` : '/api/packages', {
          method: id ? 'PUT' : 'POST',
          body: JSON.stringify(data)
        });
        showToast(res.message || 'Travel package saved successfully.', 'success');
        resetPackageForm();
        await loadPackages();
      } catch (err) {
        showMessage('packageMessage', err.message, true);
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // Customer Form
  const custForm = $('customerForm');
  if (custForm) {
    custForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = $('customerSubmitBtn');
      submitBtn.disabled = true;
      const data = getFormData(custForm);
      const id = data.customer_id;
      delete data.customer_id;

      if (!id && (!data.password || data.password.length < 6)) {
        showMessage('customerMessage', 'Password must be at least 6 characters.', true);
        submitBtn.disabled = false;
        return;
      }

      if (id && !data.password) {
        delete data.password;
      }

      try {
        const res = await api(id ? `/api/customers/${id}` : '/api/customers', {
          method: id ? 'PUT' : 'POST',
          body: JSON.stringify(data)
        });
        showToast(res.message || 'Customer saved successfully.', 'success');
        resetCustomerForm();
        await loadCustomers();
      } catch (err) {
        showMessage('customerMessage', err.message, true);
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // Booking Form
  const bookForm = $('bookingForm');
  if (bookForm) {
    const dateInput = $('bookingTravelDate');
    if (dateInput) {
      dateInput.min = new Date().toISOString().slice(0, 10);
    }

    $('bookingPackage')?.addEventListener('change', updateBookingPricePreview);
    $('bookingPersons')?.addEventListener('input', updateBookingPricePreview);

    bookForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = $('bookingSubmitBtn');
      submitBtn.disabled = true;
      const data = getFormData(bookForm);

      try {
        const res = await api('/api/bookings', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        showToast(res.message || 'Booking created successfully!', 'success');
        bookForm.reset();
        $('bookingCalcCard').style.display = 'none';
        await loadBookings();
        await loadPackages(); // update slots
      } catch (err) {
        showMessage('bookingMessage', err.message, true);
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // Contact Form
  const contactForm = $('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = $('contactSubmitBtn');
      submitBtn.disabled = true;
      const data = getFormData(contactForm);

      try {
        const res = await api('/api/contact', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        showToast(res.message, 'success');
        contactForm.reset();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // Homepage Search Widget
  const homeSearchForm = $('homeSearchForm');
  if (homeSearchForm) {
    homeSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = $('homeSearchInput')?.value.trim() || '';
      const dest = $('homeSearchDestination')?.value || '';
      location.href = `packages.html?search=${encodeURIComponent(q)}&dest=${encodeURIComponent(dest)}`;
    });
  }
}

// Live Search & Filter Bindings
function setupSearchAndFilters() {
  // Destinations Search
  const destSearch = $('destinationSearchInput');
  if (destSearch) {
    destSearch.addEventListener('input', (e) => {
      renderDestinations(e.target.value);
    });
  }

  // Packages Search & Filters
  const pkgSearch = $('packageSearchInput');
  const pkgDestFilter = $('filterPackageDestination');
  const pkgMaxPrice = $('filterPackageMaxPrice');

  function triggerPackageFilter() {
    renderPackages({
      search: pkgSearch ? pkgSearch.value : '',
      destination: pkgDestFilter ? pkgDestFilter.value : '',
      maxPrice: pkgMaxPrice ? pkgMaxPrice.value : null
    });
  }

  if (pkgSearch) pkgSearch.addEventListener('input', triggerPackageFilter);
  if (pkgDestFilter) pkgDestFilter.addEventListener('change', triggerPackageFilter);
  if (pkgMaxPrice) pkgMaxPrice.addEventListener('input', (e) => {
    if ($('priceDisplay')) $('priceDisplay').textContent = money(e.target.value);
    triggerPackageFilter();
  });

  // Check URL parameters on packages.html
  if (window.location.pathname.endsWith('packages.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const destParam = urlParams.get('dest');
    if (searchParam && pkgSearch) pkgSearch.value = searchParam;
    if (destParam && pkgDestFilter) pkgDestFilter.value = destParam;
  }

  // Customers Search
  const custSearch = $('customerSearchInput');
  if (custSearch) {
    custSearch.addEventListener('input', (e) => {
      renderCustomersTable(e.target.value);
    });
  }

  // Bookings Search & Status Filter
  const bookSearch = $('bookingSearchInput');
  const bookStatusFilter = $('bookingStatusFilter');

  function triggerBookingFilter() {
    renderBookingsTable(
      bookSearch ? bookSearch.value : '',
      bookStatusFilter ? bookStatusFilter.value : 'All'
    );
  }

  if (bookSearch) bookSearch.addEventListener('input', triggerBookingFilter);
  if (bookStatusFilter) bookStatusFilter.addEventListener('change', triggerBookingFilter);
}

// ==========================================
// 7. INITIALIZATION ON DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  // Mobile Navigation Hamburger Toggle
  const toggle = $('menuToggle');
  const navLinks = $('navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Initialize form event listeners
  setupForms();
  setupSearchAndFilters();

  // Load relevant data based on page
  try {
    await Promise.all([loadDestinations(), loadCustomers()]);
    await loadPackages();
    await loadBookings();
    if ($('totalCustomers')) await loadDashboard();
  } catch (err) {
    console.error('Initial data load error:', err);
    showToast('Could not connect to SUZAN TRAVELS server. Ensure Node & MySQL are running.', 'error');
  }
});
