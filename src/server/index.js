const argv = require('minimist')(process.argv.slice(2));
const express = require('express');
const express_static_gzip = require('express-static-gzip');
const http = require('http');
const path = require('path');
// const { allowMapFromLocalhostOnly } = require('./glov/request_utils.js');
const glov_server = require('./glov/server.js');
// const test_worker = require('./test_worker.js');

let app = express();
let server = new http.Server(app);
// allowMapFromLocalhostOnly(app);
app.use(express_static_gzip(path.join(__dirname, '../client/'), {
  enableBrotli: true,
  orderPreference: ['br'],
}));

glov_server.startup({ server });

// test_worker.init(glov_server.channel_server);

let port = argv.port || process.env.port || 3000;

server.listen(port, () => {
  console.info(`Running server at http://localhost:${port}`);
});
