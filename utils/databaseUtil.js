// const mongo = require('mongodb');

// const MongoClient = mongo.MongoClient;

// const url = 'mongodb+srv://aayushkumar3238_db_user:Ak9891%40%21@cluster0.ro9jbct.mongodb.net/?appName=Cluster0'

// let _db ;

// // yha simply connecting server to the cluster we made in mongoDB atlas, cient is the object returned by mongoDB on successful connection using client we can choose and perform operations on db's in the cluster
// // | MongoDB        | Real world                |
// // | -------------- | ------------------------- |
// // | `client`       | Mobile phone              |
// // | Cluster0       | Mobile network            |
// // | `db("shop")`   | Calling a specific person |
// // | `collection()` | Talking about a topic     |
// // | `insertOne()`  | Sending a message         |


// const MongoConnect = (callback) =>{                 
//     MongoClient.connect(url)
//     .then(client =>{
//         console.log('Connected to Database');
//         _db = client.db("airbnb");   
//         callback();
             
//     })
//     .catch(err => {
//         console.log('Database connection failed:', err.message);
//         throw err;
//     });
// };

// const getDB = () =>{
//     if(_db) {
//         return _db;
//     }
//     else{
//         throw 'No database found!';
//     }
// }

// exports.getDB = getDB;
// exports.MongoConnect = MongoConnect;