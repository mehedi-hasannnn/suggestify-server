const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c502c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Verify JWT Token Middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({ message: 'unauthorized access' });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ message: 'unauthorized access' });
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    const db = client.db('Suggestify'); 
    const productsCollection = db.collection('products');
    const recommendCollection = db.collection('recommand');

    // Auth
    app.post('/jwt', (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });
  
        res.cookie('token', token, {
          httpOnly: true,
          secure: false,
        }).send({ success: true });
      });
  
      app.post('/logout', (req, res) => {
        res.clearCookie('token', { httpOnly: true, secure: false }).send({ success: true });
      });
  
      // Product (Query) APIs
      app.post('/add-query', verifyToken, async (req, res) => {
        const productData = req.body;
        const result = await productsCollection.insertOne(productData);
        res.send(result);
      });
  
      app.get('/queries', async (req, res) => {
        const search = req.query.search;
        let query = { productName: { $regex: search, $options: 'i' } };
        const result = await productsCollection.find(query).toArray();
        res.send(result);
      });
  
    
  
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("Connected to MongoDB!");
    } catch (err) {
      console.error(" Error connecting:", err);
    }
}
run().catch(console.dir);

// Default route
app.get('/', (req, res) => {
  res.send('Suggestify server is up and running!');
});

app.listen(port, () => {
  console.log(`Suggestify server is listening on port: ${port}`);
});
