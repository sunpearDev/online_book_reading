const mysql = require('mysql')

//create connect to msql
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    database: 'reading_book_online'
})

connection.connect((err) => {
    if (err) console.log(err)
    else console.log("Database connect successfully.")
})

module.exports = connection