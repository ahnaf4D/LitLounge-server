require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
// custom middlewares 
const verifyToken = async (req, res, next) => {
    // token correctly coming
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
        const productsCollection = db.collection('products');
        // role verification middlewares
        const verifyCustomer = async (req, res, next) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const isCustomer = user?.role === 'customer';
            if (!isCustomer) {
                return res.status(403).send({ massage: "forbidden access" });
            }
            next();
        }
        const verifySeller = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const isSeller = user?.role === 'seller';
            if (!isSeller) {
                return res.status(403).send({ massage: "forbidden access" });
            }
            next();
        }
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email; // quick fix
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ massage: "forbidden access" });
            }
            next();
        }
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
        // get an single users
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
        // get all users
        app.get('/all-users', verifyToken, verifyAdmin, async (req, res) => {
            try {
                const totalUsers = await usersCollection.countDocuments();
                const users = await usersCollection.find().toArray();
                res.status(200).send({ users, totalUsers });
            } catch (error) {
                console.error('Error fetching user:', error.message);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        })
        // Create a product
        app.post('/products', verifyToken, verifySeller, async (req, res) => {
            try {
                const productData = req.body;
                const result = await productsCollection.insertOne(productData);
                res.status(201).send(result);
            }
            catch (error) {
                console.error('Error adding product:', error.message);
                res.status(500).send({ message: 'An error occurred while adding the product' });
            }
        })
        // Get all products
        app.get('/products', async (req, res) => {
            try {
                const { title, sort, category, brand, page = 1, limit = 6 } = req.query;
                const query = {};
                if (title) {
                    query.title = { $regex: title, $options: 'i' };
                }
                if (category) {
                    query.category = category;
                }
                if (brand) {
                    query.brand = brand;
                }
                const pageNumber = Number(page);
                const limitNumber = Number(limit);
                const sortOptions = sort == 'asc' ? 1 : -1;
                const products = await productsCollection.find(query).skip((pageNumber - 1) * limitNumber).sort({ price: sortOptions }).limit(limitNumber).toArray();
                const totalProducts = await productsCollection.countDocuments(query);
                const productBrand = [... new Set(products.map((p) => p.productBrand))];
                const productCategory = [... new Set(products.map((p) => p.
                    productCategory))];
                res.status(200).json({ products, productBrand, productCategory, totalProducts, pageNumber, limit })
            }
            catch (error) {
                console.error('Error getting products:', error.message);
                res.status(500).send({ message: 'An error occurred while getting the product' });
            }
        })
        // Get seller own products
        app.get('/my-products', verifyToken, verifySeller, async (req, res) => {
            try {
                const email = req.query.email;
                if (!email) {
                    return res.status(400).send({ message: 'Email is required' }); // Handle missing email
                }
                const query = { sellerEmail: email }; // Construct the query
                const myProducts = await productsCollection.find(query).toArray(); // Fetch products matching the email
                res.status(200).send(myProducts);
            } catch (error) {
                console.error('Error getting own products:', error.message);
                res.status(500).send({ message: 'An error occurred while getting own products' });
            }
        });
        // Get a single products
        app.get('/products/:id', async (req, res) => {
            const { id } = req.params;
            try {
                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ massage: "Invalid product id format" });
                }
                const product = await productsCollection.findOne({ _id: new ObjectId(id) });
                if (!product) {
                    return res.status(404).json({ massage: "Product not found" });
                }
                res.status(200).json(product);
            }
            catch (error) {
                console.error('Error get single product:', error.message);
                res.status(500).send({ message: 'An error occurred while get a single product' });
            }
        })
        app.put('/products/:id', verifyToken, verifySeller, async (req, res) => {
            try {
                const productId = req.params.id; // Get the ID from the route params
                const updatedData = req.body;
                if (!ObjectId.isValid(productId)) {
                    return res.status(400).json({ message: 'Invalid product ID' });
                }
                if (updatedData._id) {
                    delete updatedData._id;
                }
                // Perform the update operation
                const result = await productsCollection.updateOne(
                    { _id: new ObjectId(productId) }, // Create an ObjectId instance
                    { $set: updatedData }
                );

                // Handle scenarios
                if (result.matchedCount === 0) {
                    return res.status(404).json({ message: "Product not found" });
                }

                if (result.modifiedCount === 0) {
                    return res.status(400).json({ message: 'No changes were made to the product' });
                }

                // Success response
                res.status(200).json({ message: "Product updated successfully" });
            } catch (error) {
                console.error('Error updating single product:', error.message);
                res.status(500).json({ message: 'An error occurred while updating the product' });
            }
        });
        app.delete('/products/:id', verifyToken, verifySeller, async (req, res) => {
            try {
                const productId = req.params.id; // Get the product ID from the route params
                // Check if the productId is a valid ObjectId
                if (!ObjectId.isValid(productId)) {
                    return res.status(400).json({ message: 'Invalid product ID' });
                }

                // Perform the delete operation
                const result = await productsCollection.deleteOne(
                    { _id: new ObjectId(productId) } // Match the product by _id
                );
                if (result.deletedCount === 0) {
                    return res.status(404).json({ message: 'Product not found' });
                }
                // Success response
                res.status(200).json({ message: 'Product deleted successfully' });
            } catch (error) {
                console.error('Error deleting single product:', error.message);
                res.status(500).json({ message: 'An error occurred while deleting the product' });
            }
        });


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
