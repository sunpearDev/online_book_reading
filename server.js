const express = require('express')
const cors = require("cors")
const connect = require('./connection.js')
// const path = require('path');
const app = express();
const port = process.env.PORT || 5000;

require('dotenv').config()

// app.use(express.json());
app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());


const Account = require('./routers/account')
const Book = require('./routers/book')
const Genre = require('./routers/genre')
app.use('/account', Account)
app.use('/book', Book)
app.use('/genre', Genre)




// if (process.env.NODE_ENV == 'production') {
//   //set static frontend
//   app.use(express.static(path.join(__dirname, "client", "build")))
//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "client", "build", "index.html"));
//   });
// }


app.listen(port, () => {
  console.log("Server is running on port: " + port);
});
