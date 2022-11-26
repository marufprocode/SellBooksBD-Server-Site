const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleWare
app.use(express.json());
app.use(cors());

// Connect And Test MonGoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lljxxxc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    console.log("Database connected");
  } catch (error) {
    console.log(error.name, error.message);
  }
}
run();
// MongoDB Connected 
// DataBaseCollectionList
const usersCollection = client.db("sellBooksAdmin").collection("users");
const booksCollection = client.db("sellBooksAdmin").collection("books");
const categoriesCollection = client.db("sellBooksAdmin").collection("categories");
const bookingsCollection = client.db("sellBooksAdmin").collection("bookings");

app.get("/", (req, res) => {
  res.send("Hello From MongoDB");
});

// sign a JWT token and give a user when log into website
app.post("/jwt", async (req, res) => {
  try {
    const user = req.body;
    const token = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.send({ token });
  } catch (error) {
    console.log(error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

// middleware for verify jwtToken
function verifyJwt (req, res, next) {
  const userJwtToken = req.headers.authorization;
  if(!userJwtToken){
    return res.status(401).send({
      success: false,
      message:"Unauthorized Access"
    })
  }
  const token = userJwtToken.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded){
    if (err){
      return res.status(403).send({
        success:false,
        message: "Forbidden Access"
      })
    }
    req.decoded = decoded;
    next();
  })
}

// Add a user in the database when first time logging in in our site
app.post("/users", async (req, res) => {
  try {
    const user = req.body;
    const isUserExist = await usersCollection.findOne({ email: user.email });
    if (isUserExist) {
      res.send({
        success: false,
        message: "user exists in database",
      });
      return;
    }
    const result = await usersCollection.insertOne(user);
    res.send(result);
  } catch (error) {
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
});

// Get User for Custom Hook 
app.get('/users/role/:email', verifyJwt, async (req, res)=> {
  try{
    const email = req.params.email;
    const result = await usersCollection.findOne({email:email});
    res.send({
      role:result.role,
    })
  }catch (error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})

// get Product Categories 
app.get('/product-categories', async (req, res) => {
  try{
    const result = await categoriesCollection.find({}).toArray();
    res.send(result);
  } catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})

// get Product by Categories 
app.get('/category/:id', async (req, res) => {
  try{
    const id = req.params.id;
    const category = await categoriesCollection.findOne({category_id:id});
    const result = await booksCollection.find({category:category.category}).toArray();
    res.send(result); 
  } catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})

// Add a Product by Admin 
app.post('/add-products', verifyJwt, async (req, res) => {
  try{
    const decoded = req.decoded;
    if(decoded.email !== req.query.email){
      res.status(403).send({
        success: false,
        message: 'Unauthorized access'
      })
    }
    const product = req.body;
    const result = await booksCollection.insertOne(product);
    res.send(result);
  }
  catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})

// get all sellers list 
app.get('/all-sellers/:role', verifyJwt, async (req, res) => {
  try{
    const decoded = req.decoded;
    if(decoded.email !== req.query.email){
      res.status(403).send({
        success: false,
        message: 'Unauthorized access'
      })
    }
    const role = req.params.role;
    const result = await usersCollection.find({role:role}).toArray();
    res.send(result);
    
  } catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})

// verify the seller from admin 
app.patch('/verify-seller/:id', verifyJwt, async (req, res) => {
  try{
    const decoded = req.decoded;
    if(decoded.email !== req.query.email){
      res.status(403).send({
        success: false,
        message: 'Unauthorized access'
      })
    }
    const id = req.params.id;
    const result = await usersCollection.updateOne({uid:id}, {$set:req.body});
    if(result.modifiedCount){
      res.send(result);
    }
    
  } catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
