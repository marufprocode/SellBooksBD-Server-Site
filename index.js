const express = require("express");
const cors = require("cors");
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleWare 
app.use(express.json());
app.use(cors());

// Connect And Test MonGoDB 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lljxxxc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
      await client.connect();
      console.log("Database connected");
    } catch (error) {
      console.log(error.name, error.message);
    }
  }
  
run();

// DataBaseCollectionList
const usersCollection = client.db("sellBooksAdmin").collection("users");


app.get('/', (req, res) => {
    res.send('Hello From MongoDB')
});

app.get('/users', async (req, res)=> {
    const result = await usersCollection.find({}).toArray();
    res.send(result);
})

app.listen(port, ()=>{
    console.log(`Listening to port ${port}`);
})