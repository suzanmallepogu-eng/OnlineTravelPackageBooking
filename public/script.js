// Helper functions

function resetForm(id) {
    document.getElementById(id).reset();
    document.querySelector(`#${id} input[type="hidden"]`).value = '';
}

async function request(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }

    return data;
}

function makeButton(text, action, id) {
    return `<button type="button" onclick="${action}(${id})">${text}</button>`;
}

// CUSTOMER MANAGEMENT

async function loadCustomers() {
    const data = await request('/customers');

    document.getElementById('customerTable').innerHTML =
        data.map(c => `
        <tr>
            <td>${c.customer_id}</td>
            <td>${c.name}</td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td>
                ${makeButton('Edit', 'editCustomer', c.customer_id)}
                ${makeButton('Delete', 'deleteCustomer', c.customer_id)}
            </td>
        </tr>
    `).join('');
}

if (document.getElementById('customerForm')) {
    loadCustomers();

    document.getElementById('customerForm').onsubmit = async function(e) {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(this));
        const id = data.customer_id;
        delete data.customer_id;

        try {
            await request(id ? `/customers/${id}` : '/customers', {
                method: id ? 'PUT' : 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });

            document.getElementById('customerMessage').innerText =
                'Customer saved successfully!';

            this.reset();
            loadCustomers();
        } catch (err) {
            document.getElementById('customerMessage').innerText = err.message;
        }
    };
}

async function editCustomer(id) {
    const c = (await request('/customers')).find(x => x.customer_id == id);
    const f = document.getElementById('customerForm');

    f.customer_id.value = c.customer_id;
    f.name.value = c.name;
    f.email.value = c.email;
    f.phone.value = c.phone;
    f.password.value = c.password;

    window.scrollTo(0, 0);
}

async function deleteCustomer(id) {
    if (!confirm('Delete this customer?')) return;

    try {
        await request(`/customers/${id}`, {method: 'DELETE'});
        loadCustomers();
    } catch (err) {
        alert(err.message);
    }
}


// DESTINATION MANAGEMENT

async function loadDestinations() {
    const data = await request('/destinations');

    document.getElementById('destinationTable').innerHTML =
        data.map(d => `
        <tr>
            <td>${d.destination_id}</td>
            <td>${d.destination_name}</td>
            <td>${d.location}</td>
            <td>${d.description}</td>
            <td>
                ${makeButton('Edit', 'editDestination', d.destination_id)}
                ${makeButton('Delete', 'deleteDestination', d.destination_id)}
            </td>
        </tr>
    `).join('');
}

if (document.getElementById('destinationForm')) {
    loadDestinations();

    document.getElementById('destinationForm').onsubmit = async function(e) {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(this));
        const id = data.destination_id;
        delete data.destination_id;

        try {
            await request(id ? `/destinations/${id}` : '/destinations', {
                method: id ? 'PUT' : 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });

            document.getElementById('destinationMessage').innerText =
                'Destination saved successfully!';

            this.reset();
            loadDestinations();
        } catch (err) {
            document.getElementById('destinationMessage').innerText = err.message;
        }
    };
}

async function editDestination(id) {
    const d = (await request('/destinations')).find(x => x.destination_id == id);
    const f = document.getElementById('destinationForm');

    f.destination_id.value = d.destination_id;
    f.destination_name.value = d.destination_name;
    f.location.value = d.location;
    f.description.value = d.description;

    window.scrollTo(0, 0);
}

async function deleteDestination(id) {
    if (!confirm('Delete this destination?')) return;

    try {
        await request(`/destinations/${id}`, {method: 'DELETE'});
        loadDestinations();
    } catch (err) {
        alert(err.message);
    }
}


// PACKAGE MANAGEMENT

async function loadPackages() {
    const data = await request('/packages');

    document.getElementById('packageTable').innerHTML =
        data.map(p => `
        <tr>
            <td>${p.package_id}</td>
            <td>${p.destination_name}</td>
            <td>${p.package_name}</td>
            <td>${p.duration} Days</td>
            <td>₹${p.price}</td>
            <td>${p.available_slots}</td>
            <td>
                ${makeButton('Edit', 'editPackage', p.package_id)}
                ${makeButton('Delete', 'deletePackage', p.package_id)}
            </td>
        </tr>
    `).join('');
}

if (document.getElementById('packageForm')) {
    loadPackages();

    document.getElementById('packageForm').onsubmit = async function(e) {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(this));
        const id = data.package_id;
        delete data.package_id;

        try {
            await request(id ? `/packages/${id}` : '/packages', {
                method: id ? 'PUT' : 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });

            document.getElementById('packageMessage').innerText =
                'Package saved successfully!';

            this.reset();
            loadPackages();
        } catch (err) {
            document.getElementById('packageMessage').innerText = err.message;
        }
    };
}

async function editPackage(id) {
    const p = (await request('/packages')).find(x => x.package_id == id);
    const f = document.getElementById('packageForm');

    f.package_id.value = p.package_id;
    f.destination_id.value = p.destination_id;
    f.package_name.value = p.package_name;
    f.duration.value = p.duration;
    f.price.value = p.price;
    f.available_slots.value = p.available_slots;

    window.scrollTo(0, 0);
}

async function deletePackage(id) {
    if (!confirm('Delete this package?')) return;

    try {
        await request(`/packages/${id}`, {method: 'DELETE'});
        loadPackages();
    } catch (err) {
        alert(err.message);
    }
}


// BOOKING MANAGEMENT

async function loadBookings() {
    const data = await request('/bookings');

    document.getElementById('bookingTable').innerHTML =
        data.map(b => `
        <tr>
            <td>${b.booking_id}</td>
            <td>${b.customer_id}</td>
            <td>${b.package_id}</td>
            <td>${String(b.travel_data).slice(0, 10)}</td>
            <td>${b.persons}</td>
            <td>₹${b.total_amount}</td>
            <td>
                <select onchange="updateStatus(${b.booking_id}, this.value)">
                    ${['Pending', 'Confirmed', 'Cancelled'].map(s =>
                        `<option value="${s}" ${b.status === s ? 'selected' : ''}>${s}</option>`
                    ).join('')}
                </select>
            </td>
            <td>${makeButton('Delete', 'deleteBooking', b.booking_id)}</td>
        </tr>
    `).join('');
}

if (document.getElementById('bookingForm')) {
    loadBookings();

    document.getElementById('bookingForm').onsubmit = async function(e) {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(this));

        try {
            const result = await request('/bookings', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });

            document.getElementById('bookingMessage').innerText =
                result.message + ' | Total: ₹' + result.total;

            this.reset();
            loadBookings();
        } catch (err) {
            document.getElementById('bookingMessage').innerText = err.message;
        }
    };
}

async function checkBooking() {
    const id = document.getElementById('searchCustomer').value;

    try {
        const data = await request('/bookings/customer/' + id);

        document.getElementById('bookingResult').innerHTML =
            data.length ? data.map(b => `
                <div class="card">
                    <h3>Booking #${b.booking_id}</h3>
                    <p>Package: ${b.package_name}</p>
                    <p>Travel Date: ${String(b.travel_data).slice(0, 10)}</p>
                    <p>Amount: ₹${b.total_amount}</p>
                    <p>Status: ${b.status}</p>
                </div>
            `).join('') : 'No bookings found.';
    } catch (err) {
        alert(err.message);
    }
}

async function updateStatus(id, status) {
    try {
        await request(`/bookings/${id}/status`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status})
        });

        alert('Booking status updated!');
    } catch (err) {
        alert(err.message);
        loadBookings();
    }
}

async function deleteBooking(id) {
    if (!confirm('Delete this booking?')) return;

    try {
        await request(`/bookings/${id}`, {method: 'DELETE'});
        loadBookings();
    } catch (err) {
        alert(err.message);
    }
}


// ADMIN DASHBOARD

if (document.getElementById('totalCustomers')) {
    async function loadDashboard() {
        try {
            const [c, d, p, b] = await Promise.all([
                request('/customers'),
                request('/destinations'),
                request('/packages'),
                request('/bookings')
            ]);

            document.getElementById('totalCustomers').innerText = c.length;
            document.getElementById('totalDestinations').innerText = d.length;
            document.getElementById('totalPackages').innerText = p.length;
            document.getElementById('totalBookings').innerText = b.length;
        } catch (err) {
            alert(err.message);
        }
    }

    loadDashboard();
}