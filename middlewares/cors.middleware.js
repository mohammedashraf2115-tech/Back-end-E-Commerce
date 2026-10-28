const cors = require('cors');

const corsMiddleware = cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});

module.exports = corsMiddleware;
