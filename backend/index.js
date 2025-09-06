require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5001;
const influxRouter = require('./routes/influx');
const authRouter = require('./routes/auth');

app.use(cors());
app.use(express.json());
console.log('Loaded influx');
app.use('/api/influx', influxRouter);
console.log('Loaded auth')
app.use('/api/auth', authRouter);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
