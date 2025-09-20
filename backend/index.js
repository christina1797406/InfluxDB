require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5001;
const influxRouter = require('./routes/influx');
const {router: authRouter} = require('./routes/auth');

app.use(cors(({
    origin: "http://localhost:3001",
    credentials: true
})));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
console.log('Loaded auth')
app.use('/api/auth', authRouter);
console.log('Loaded influx');
app.use('/api/influx', influxRouter);


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
