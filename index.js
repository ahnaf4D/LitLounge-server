require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3001;
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174',],
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));
app.use(express.json());
app.get('/', (req, res) => {
    res.status(200).send("LitLounge Server is running!!");
})
app.listen(port, () => {
    console.log(`Server listening at port ${port}`);
})