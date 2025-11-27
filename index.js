require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@databasedesign.lirnheb.mongodb.net/?appName=databaseDesign`;

let db;
let usersCollection;

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
// app.use(cors());
app.use(cors({
  origin: [
    'https://nextjs-client-website.vercel.app',
    'http://localhost:3000' // for local development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello !");
});

// API endpoint to get or create user data
app.post("/api/user", async (req, res) => {
  try {
    const { email, name, image, provider } = req.body;

    if (!email) {
      return res
        .status(400)
        .send({ success: false, message: "Email is required" });
    }

    // Upsert user data
    const result = await usersCollection.updateOne(
      { email },
      {
        $set: {
          name,
          image,
          provider,
          lastLogin: new Date(),
        },
        $setOnInsert: {
          email,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    const user = await usersCollection.findOne({ email });

    res.status(200).send({
      success: true,
      message: "User data saved to MongoDB",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        image: user.image,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});

// Get all users (for testing)
app.get("/api/users", async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).send({
        success: false,
        message: "Database not connected",
      });
    }

    const users = await usersCollection.find({}).toArray();
    res.status(200).send({
      success: true,
      count: users.length,
      users: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});


// // Get user by email
// app.get("/api/user", async (req, res) => {
//   try {
//     const { email } = req.query;
    
//     if (!email) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Email is required" 
//       });
//     }

//     const user = await usersCollection.findOne({ email });
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "User not found" 
//       });
//     }

//     // Remove sensitive data
//     const { password, ...userData } = user;
    
//     res.status(200).json({
//       success: true,
//       user: userData,
//     });
//   } catch (error) {
//     console.error("Error fetching user:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// });

// add product
app.post("/products", async (req, res) => {
  const data = req.body;
  // console.log(data)
  const result = await productCollection.insertOne(data);
  res.send({
    success: true,
    result,
  });
});

// get all event
app.get("/products", async (req, res) => {
  const result = await productCollection.find().toArray();
  res.send(result);
});

// single product details
app.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  const objectId = new ObjectId(id);

  const result = await productCollection.findOne({ _id: objectId });

  res.send({
    success: true,
    result,
  });
});

// delete product
app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  const result = await productCollection.deleteOne({
    _id: new ObjectId(id),
  });

  res.send({
    success: true,
    result,
  });
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    db = client.db("furniture_db");
    usersCollection = db.collection("users");
    productCollection = db.collection("products");
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`User listening on port ${port}`);
});
