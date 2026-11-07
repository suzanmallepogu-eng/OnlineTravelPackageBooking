const express = require('express');
const db = require('./db');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


// ================= CUSTOMERS =================

// Display customers
app.get('/customers', (req, res) => {
    db.query('SELECT * FROM customers', (err, result) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(result);
    });
});

// Insert customer
app.post('/customers', (req, res) => {
    const {name, email, phone, password} = req.body;

    db.query(
        'INSERT INTO customers (name,email,phone,password) VALUES (?,?,?,?)',
        [name, email, phone, password],
        (err, result) => {
            if (err) return res.status(400).json({error: err.message});
            res.json({message: 'Customer added successfully'});
        }
    );
});

// Update customer
app.put('/customers/:id', (req, res) => {
    const {name, email, phone, password} = req.body;

    db.query(
        'UPDATE customers SET name=?,email=?,phone=?,password=? WHERE customer_id=?',
        [name, email, phone, password, req.params.id],
        (err) => {
            if (err) return res.status(400).json({error: err.message});
            res.json({message: 'Customer updated successfully'});
        }
    );
});

// Delete customer
app.delete('/customers/:id', (req, res) => {
    db.query(
        'DELETE FROM customers WHERE customer_id=?',
        [req.params.id],
        (err) => {
            if (err) return res.status(400).json({error: err.message});
            res.json({message: 'Customer deleted successfully'});
        }
    );
});


// ================= DESTINATIONS =================

// Display destinations
app.get('/destinations', (req, res) => {
    db.query('SELECT * FROM destinations', (err, result) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(result);
    });
});

// Insert destination
app.post('/destinations', (req, res) => {
    const {destination_name, location, description} = req.body;

    db.query(
        'INSERT INTO destinations (destination_name,location,description) VALUES (?,?,?)',
        [destination_name, location, description],
        (err) => {
            if (err) return res.status(400).json({error: err.message});
            res.json({message: 'Destination added successfully'});
        }
    );
});

// Update destination
app.put('/destinations/:id', (req, res) => {
    const {destination_name, location, description} = req.body;

    db.query(
        'UPDATE destinations SET destination_name=?,location=?,description=? WHERE destination_id=?',
        [destination_name, location, description, req.params.id],
        (err) => {
            if (err) return res.status(400).json({error: err.message});
            res.json({message: 'Destination updated successfully'});
        }
    );
});

// Delete destination
app.delete('/destinations/:id', (req, res) => {
    db.query(
        'DELETE FROM destinations WHERE destination_id=?',
        [req.params.id],
        (err) => {
            if (err) return res.status(400).json({error: err.message});
            res.json({message: 'Destination deleted successfully'});
        }
    );
});


// ================= PACKAGES =================

// Display packages with destination names
app.get('/packages', (req, res) => {
    db.query(
        `SELECT packages.*, destinations.destination_name
         FROM packages
         JOIN destinations
         ON packages.destination_id = destinations.destination_id`,
        (err, result) => {
            if (err) return res.status(500).json({error: err.message});
            res.json(result);
        }
    );
});

// Insert package
app.post('/packages', (req, res) => {
    const {destination_id, package_name, duration, price, available_slots} = req.body;

    db.query(
        `INSERT INTO packages
        (destination_id,package_name,duration,price,available_slots)
        VALUES (?,?,?,?,?)`,
        [destination_id, package_name, duration, price, available_slots],
        (err) => {
            if (err) return res.status(400).json({error: err.message});
            res.json({message: 'Package added successfully'});
        }
    );
});

// Update package
app.put('/packages/:id', (req, res) => {
    const {destination_id, package_name, duration, price, available_slots} = req.body;

    db.query(
        `UPDATE packages SET destination_id=?,package_name=?,
        duration=?,price=?,available_slots=? WHERE package_id=?`,
        [destination_id, package_name, duration, price, available_slots, req.params.id],
        (err) => {
            if (err) return res.status(400).json({error: err.message});
            res.json({message: 'Package updated successfully'});
        }
    );
});

// Delete package
app.delete('/packages/:id', (req, res) => {
    db.query(
        'DELETE FROM packages WHERE package_id=?',
        [req.params.id],
        (err) => {
            if (err) return res.status(400).json({error: err.message});
            res.json({message: 'Package deleted successfully'});
        }
    );
});


// ================= BOOKINGS =================

// Display all bookings
app.get('/bookings', (req, res) => {
    db.query(
        'SELECT * FROM bookings ORDER BY booking_id DESC',
        (err, result) => {
            if (err) return res.status(500).json({error: err.message});
            res.json(result);
        }
    );
});

// Display bookings by customer
app.get('/bookings/customer/:id', (req, res) => {
    db.query(
        `SELECT bookings.*, packages.package_name
         FROM bookings
         JOIN packages ON bookings.package_id=packages.package_id
         WHERE customer_id=?`,
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({error: err.message});
            res.json(result);
        }
    );
});

// Insert booking
app.post('/bookings', (req, res) => {
    const {customer_id, package_id, travel_data, persons} = req.body;

    const count = Number(persons);

    if (!Number.isInteger(count) || count <= 0) {
        return res.status(400).json({error: 'Enter a valid number of persons'});
    }

    db.query(
        'SELECT price, available_slots FROM packages WHERE package_id=?',
        [package_id],
        (err, result) => {
            if (err) return res.status(500).json({error: err.message});

            if (result.length === 0) {
                return res.status(400).json({error: 'Package not found'});
            }

            const packageData = result[0];

            if (count > packageData.available_slots) {
                return res.status(400).json({error: 'Not enough available slots'});
            }

            const total = packageData.price * count;

            db.query(
                `INSERT INTO bookings
                (customer_id,package_id,travel_data,persons,total_amount,status)
                VALUES (?,?,?,?,?,?)`,
                [customer_id, package_id, travel_data, count, total, 'Pending'],
                (err) => {
                    if (err) return res.status(400).json({error: err.message});

                    db.query(
                        'UPDATE packages SET available_slots=available_slots-? WHERE package_id=?',
                        [count, package_id],
                        (err) => {
                            if (err) return res.status(500).json({error: err.message});

                            res.json({
                                message: 'Booking successful!',
                                total: total
                            });
                        }
                    );
                }
            );
        }
    );
});

// Update booking status
app.put('/bookings/:id/status', (req, res) => {
    const {status} = req.body;

    if (!['Pending', 'Confirmed', 'Cancelled'].includes(status)) {
        return res.status(400).json({error: 'Invalid booking status'});
    }

    db.query(
        'UPDATE bookings SET status=? WHERE booking_id=?',
        [status, req.params.id],
        (err) => {
            if (err) return res.status(400).json({error: err.message});
            res.json({message: 'Booking status updated'});
        }
    );
});

// Delete booking
app.delete('/bookings/:id', (req, res) => {
    db.query(
        'SELECT package_id, persons FROM bookings WHERE booking_id=?',
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({error: err.message});

            if (!result.length) {
                return res.status(404).json({error: 'Booking not found'});
            }

            const {package_id, persons} = result[0];

            db.query(
                'DELETE FROM bookings WHERE booking_id=?',
                [req.params.id],
                (err) => {
                    if (err) return res.status(400).json({error: err.message});

                    db.query(
                        'UPDATE packages SET available_slots=available_slots+? WHERE package_id=?',
                        [persons, package_id],
                        (err) => {
                            if (err) return res.status(500).json({error: err.message});
                            res.json({message: 'Booking deleted successfully'});
                        }
                    );
                }
            );
        }
    );
});


// START SERVER

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});