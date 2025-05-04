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
  origin: [
            'http://localhost:5173',
            'https://suggestify-bd.web.app',
            'https://suggestify-bd.firebaseapp.com'
        ],
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
          secure: process.env.NODE_ENV=== 'production',
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        }).send({ success: true });
      });
  
      app.post('/logout', (req, res) => {
        res.clearCookie('token', { httpOnly: true, secure:process.env.NODE_ENV=== 'production', sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", }).send({ success: true });
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
  
      app.get('/queries-home', async (req, res) => {
        const cursor = productsCollection.find().limit(6);
        const result = await cursor.toArray();
        res.send(result);
      });
  
      app.get('/queries/:email', verifyToken, async (req, res) => {
        const decodedEmail = req.user?.email;
        const email = req.params.email;
        if (decodedEmail !== email) return res.status(403).send({ message: 'Forbidden access' });
  
        const result = await productsCollection.find({ email }).sort({ date: -1 }).toArray();
        res.send(result);
      });
  
      app.delete('/query/:id', verifyToken, async (req, res) => {
        const result = await productsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.send(result);
      });
  
      app.get('/query/:id', async (req, res) => {
        const result = await productsCollection.findOne({ _id: new ObjectId(req.params.id) });
        res.send(result);
      });
  
      app.put('/update-query/:id', async (req, res) => {
        const update = { $set: req.body };
        const result = await productsCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          update,
          { upsert: true }
        );
        res.send(result);
      });
  
      // Recommendation APIs
      app.post('/add-recommand', async (req, res) => {
        const data = req.body;
        const query = { email: data.recommandEmail, queryId: data.queryId };
        const alreadyExist = await recommendCollection.findOne(query);
        if (alreadyExist) return res.status(401).send('You have already Recommanded');
  
        const result = await recommendCollection.insertOne(data);
        await productsCollection.updateOne(
          { _id: new ObjectId(data.queryId) },
          { $inc: { count: 1 } }
        );
        res.send(result);
      });
  
      app.get('/recommendations/:queryId', async (req, res) => {
        const recommendations = await recommendCollection.find({ queryId: req.params.queryId }).toArray();
        res.send(recommendations);
      });
  
      app.get('/recommand/:email', verifyToken, async (req, res) => {
        const decodedEmail = req.user?.email;
        if (decodedEmail !== req.params.email) return res.status(403).send({ message: 'Forbidden access' });
  
        const result = await recommendCollection.find({ email: req.params.email }).toArray();
        res.send(result);
      });
  
      app.get('/recommand-request/:email', verifyToken, async (req, res) => {
        const decodedEmail = req.user?.email;
        if (decodedEmail !== req.params.email) return res.status(403).send({ message: 'Forbidden access' });
  
        const result = await recommendCollection.find({ recommandEmail: req.params.email }).toArray();
        res.send(result);
      });
  
      app.delete('/delete-recommand/:id', verifyToken, async (req, res) => {
        const decodedEmail = req.user?.email;
        const recommendation = await recommendCollection.findOne({ _id: new ObjectId(req.params.id) });
  
        if (!recommendation || recommendation.recommandEmail !== decodedEmail) {
          return res.status(403).send({ message: 'Forbidden access' });
        }
  
        await recommendCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        await productsCollection.updateOne(
          { _id: new ObjectId(recommendation.queryId) },
          { $inc: { count: -1 } }
        );
  
        res.send({ success: true, message: 'Recommendation deleted successfully' });
      });
  
    //   await client.connect();
    //   await client.db("admin").command({ ping: 1 });
    //   console.log("Connected to MongoDB!");
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
