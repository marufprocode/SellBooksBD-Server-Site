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
const wishListCollection = client.db("sellBooksAdmin").collection("wishlist");

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
      verified: result.verified,
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

/* app.get('/category/v2/:id', async (req, res) => {
  try{
    const id = req.params.id;
    const category = await categoriesCollection.findOne({category_id:id});
    // const result = await booksCollection.find({category:category.category}).toArray();
    const products = await booksCollection.find({}).toArray();
    const booked = await bookingsCollection.find({}).toArray();
    products.forEach(pdt => {
      const itmBooked = booked.includes(bkd => bkd.itemName ===pdt.bookName);
      console.log(itmBooked);
    })
    res.send(products) 
  } catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
}) */

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

// get all sellers list  by Admin
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
// get all Buyers list  by Admin
app.get('/admin/all-buyers', verifyJwt, async (req, res) => {
  try{
    const decoded = req.decoded;
    if(decoded.email !== req.query.email){
      res.status(403).send({
        success: false,
        message: 'Unauthorized access'
      })
    }
    const result = await usersCollection.find({role:'User'}).project({name:1, email:1, uid:1}).toArray();
    res.send(result);  
  } catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})

// Delete a Buyer by Admin
app.delete('/admin/delete-buyer/:email', verifyJwt, async (req, res) => {
  try{
    console.log(req.query.email,req.params.email,);
    const decoded = req.decoded;
    if(decoded.email !== req.query.email){
      res.status(403).send({
        success: false,
        message: 'Unauthorized access'
      })
    }
    const buyerEmail = req.params.email;
    /* const buyerBookId = await bookingsCollection.find({buyerEmail:buyerEmail}).project({bookId:1}).toArray();
    console.log(buyerBookId);
    const updateBooksList = await booksCollection.updateMany({_id:ObjectId(buyerBookId.bookId)}, {$set:{isBooked:false}}); */
    const result = await usersCollection.deleteOne({email:buyerEmail});
    const findBooking = await bookingsCollection.deleteMany({buyerEmail:buyerEmail});
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
    const updateBooks = await booksCollection.updateMany({sellerId:id}, {$set:req.body}); 
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

//Delete a user from database
app.delete('/delete-user/:id', verifyJwt, async (req, res)=>{
  try{
    const id = req.params.id;
    const deleteUser = await usersCollection.deleteOne({uid:id});
    const deleteProduct = await booksCollection.deleteMany({sellerId:id});
    res.send(deleteUser);
  }catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})


//Delete a product by seller
app.delete('/delete-product/:id', verifyJwt, async (req, res)=>{
  try{
    const decoded = req.decoded;
    if(decoded.email !== req.query.email){
      res.status(403).send({
        success: false,
        message: 'Unauthorized access'
      })
    }
    const result = await booksCollection.deleteOne({_id:ObjectId(req.params.id), sellerEmail:req.query.email});
    const deleteFromBookings = await bookingsCollection.deleteOne({bookId:req.params.id});
    const deleteWishList = await wishListCollection.deleteOne({bookId:req.params.id});
    res.send(result);
  }catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})

// booking a product by buyer 
app.post('/bookings', async (req, res) => {
  try{
    const bookings = req.body;
    const result = await bookingsCollection.insertOne(req.body);
    const updatebooks = await booksCollection.updateOne({_id:ObjectId(bookings.bookId)}, {$set:{isBooked:true}});
    if(result.insertedId && updatebooks.modifiedCount){
      res.send(result);
    }
  }catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})


// Get All The Orders by User 
app.get('/my-orders', verifyJwt, async (req, res) => {
  try{
    const decoded = req.decoded;
    if(decoded.email !== req.query.email){
      res.status(403).send({
        success: false,
        message: 'Unauthorized access'
      })
    }
    const result = await bookingsCollection.find({buyerEmail:req.query.email}).toArray();
    res.send(result);
  }catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})

app.get('/bookingbyid/:id', async (req, res) => {
  try{
    const id = req.params.id;
    const result = await bookingsCollection.findOne({_id:ObjectId(id)});
    if(result){
      res.send(result); 
    }else{
      const result = await wishListCollection.findOne({_id:ObjectId(id)});
      res.send(result);
    }
  }catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})

// Add to Wishlist by User / Buyer 
app.post('/addto-wishlist', async (req, res) => {
  try{
    const data = req.body;
    const isExist = await wishListCollection.findOne({bookId:data.bookId, buyerEmail:data.buyerEmail});
    if(isExist){
      return res.send({
        success:false,
        message:'You have already added to wishlist'
      })
    }
    const result = await wishListCollection.insertOne(data);
    res.send(result)
  }catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})

// Get all wishlist by a buyer 
app.get('/mywishlist', verifyJwt, async (req, res) => {
  try{
    const decoded = req.decoded;
    if(decoded.email !== req.query.email){
      res.status(403).send({
        success: false,
        message: 'Unauthorized access'
      })
    }
    const email = req.query.email;
    const wishList = await wishListCollection.find({buyerEmail:email}).toArray();
    res.send(wishList);
  }catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})

// get all the products by Seller 
app.get('/my-products', verifyJwt, async (req, res) => {
  try{
    const decoded = req.decoded;
    if(decoded.email !== req.query.email){
      res.status(403).send({
        success: false,
        message: 'Unauthorized access'
      })
    }
    const result = await booksCollection.find({sellerEmail:req.query.email}).toArray();
    res.send(result);
  }catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})


// get all the products by Seller 
app.get('/my-products', verifyJwt, async (req, res) => {
  try{
    const decoded = req.decoded;
    if(decoded.email !== req.query.email){
      res.status(403).send({
        success: false,
        message: 'Unauthorized access'
      })
    }
    const result = await booksCollection.find({sellerEmail:req.query.email}).toArray();
    res.send(result);
  }catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})
// get all the Buyers List by Seller 
app.get('/seller/my-buyers', verifyJwt, async (req, res) => {
  try{
    const decoded = req.decoded;
    if(decoded.email !== req.query.email){
      res.status(403).send({
        success: false,
        message: 'Unauthorized access'
      })
    }
    const seller = await usersCollection.findOne({email:req.query.email});
    const buyers = await bookingsCollection.find({sellerId:seller.uid}).toArray();
    res.send(buyers);
  }catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})

// Make Advertisement by Seller 
app.patch('/advertise', verifyJwt, async (req, res) => {
  try{
    const decoded = req.decoded;
    if(decoded.email !== req.query.email){
      res.status(403).send({
        success: false,
        message: 'Unauthorized access'
      })
    }
    const advertiseItem = req.body;
    const result = await booksCollection.updateOne({_id:ObjectId(advertiseItem.product_id)}, {$set:{advertised:true}});
    res.send(result);
  }catch(error){
    console.log(error.name, error.message);
    res.send({
      success: false,
      error: error.message,
    });
  }
})


app.get('/advertised-items', async (req, res) => {
  try{
    const result = await booksCollection.find({advertised:true, isPaid:false}).toArray()
    if(result){
      res.send(result)
    } else{
      res.send({
        success:false,
        message: 'No Items Found'
      })
    }
  }catch(error){
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
