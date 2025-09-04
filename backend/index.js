const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const influxRoutes = require('./routes/influx.routes');
console.log('Loaded influx.routes');
app.use('/api/influx', influxRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
