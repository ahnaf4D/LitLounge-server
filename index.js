require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 3001;
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174',],
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zrua0aj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const verifyToken = async (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = req.headers.authorization;
    jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}
async function run() {
    try {
        const db = client.db('LitLounge-DB');
        const usersCollection = db.collection('users');
        // ping db
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        // all api endpoints
        // users endpoints
        app.post('/users', async (req, res) => {
            try {
                const user = req.body;
                const query = { email: user.email };
                const existingEmail = await usersCollection.findOne(query);
                if (existingEmail) {
                    return res.send({ massage: "User already exits" });
                }
                const result = await usersCollection.insertOne(user);
                res.status(200).send(result);
            }
            catch (error) {
                console.error("Error massage ", error.massage);
                res.status(500).send({ massage: "Internal server error" });
            }
        })
        app.get(`/user`, verifyToken, async (req, res) => {
            try {
                const { email } = req.query;
                if (!email) {
                    return res.status(400).json({ massage: "Email query parameter is required" });
                }
                const user = await usersCollection.findOne({ email });
                if (!user) {
                    return res.status(404).json({ message: 'User not found with the provided email.' });
                }
                res.status(200).json(user);
            }
            catch (error) {
                console.error('Error fetching user:', error.message);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        })
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.status(200).send("LitLounge Server is running!!");
})
// jwt
app.post('/auth', async (req, res) => {
    const userEmail = req.body;
    const token = jwt.sign(userEmail, process.env.JWT_ACCESS_TOKEN, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.send({ token });
})
app.listen(port, () => {
    console.log(`Server listening at port ${port}`);
})
