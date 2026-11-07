// SUZAN TRAVELS - Main Express App Delegate
// Delegates directly to server.js for a single, unified backend architecture.
const app = require('./server');

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`SUZAN TRAVELS server running via app.js at http://localhost:${PORT}`);
  });
}

module.exports = app;
