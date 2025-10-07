require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5001;
const influxRouter = require('./routes/influx');
const { router: authRouter } = require('./routes/auth');
const grafanaRouter = require('./routes/grafana');
const cookieParser = require('cookie-parser'); // add

app.use(cors(({
    origin: "http://localhost:3001",
    credentials: true
})));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
console.log('Loaded auth')
console.log('GRAFANA_URL:', process.env.GRAFANA_URL || '(undefined)'); // quick sanity check
app.use('/api/auth', authRouter);
console.log('Loaded influx');
app.use('/api/influx', influxRouter);
app.use('/api/grafana', grafanaRouter);


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
