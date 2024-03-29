const express= require('express');
const cors= require('cors');
const app= express();
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port= process.env.PORT || 5000;


// middleware...
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ungcn7e.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // database collection
    const articleCollection= client.db("newDb").collection("articles");
    const MyArticleCollection= client.db("newDb").collection("myArticle");
    const userCollection= client.db("newDb").collection("users");

    // jwt related api
    app.post('/jwt',async(req,res)=>{
        const user= req.body;
        const token= jwt.sign(user, process.env.Access_Token,{ expiresIn: '1h'});
        res.send({token});
    })
    //user related api
    app.post('/users',async(req,res)=>{
        const user= req.body;
        const query={email: user.email}
        const existingUser= await userCollection.findOne(query);
        if(existingUser){
            return res.send({message:'user already exist'})
        }
        const result= await userCollection.insertOne(user);
        res.send(result);
    }) 

    app.get('/users',async(req,res)=>{
        const result=await userCollection.find().toArray();
        res.send(result);
    })
    app.patch('/users/admin/:id',async(req,res)=>{
        const id= req.params.id;
        const filter={_id: new ObjectId(id)};
        const updatedDoc={
            $set:{
                role: 'admin'
            }
        }
        const result= await userCollection.updateOne(filter, updatedDoc)
        res.send(result);

    })
    // my article collection..
    app.post('/myArticle',async(req,res)=>{
        const ArticleItem=req.body;
        const result= await MyArticleCollection.insertOne(ArticleItem);
        res.send(result);
    })
    app.get('/myArticle', async(req,res)=>{
        const email=req.query.email;
        const query={email: email}
        const result= await MyArticleCollection.find(query).toArray();
        res.send(result);
    })
   // get data for article
   app.get('/articles', async(req, res)=>{
    const result= await articleCollection.find().toArray();
    res.send(result);
   })   

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req, res)=>{
    res.send('news server is running');
})

app.listen(port, ()=>{
    console.log(`news server running on port : ${port}`);
})