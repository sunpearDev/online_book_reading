const express = require('express')
const router = express.Router()
const uniqid = require('uniqid')
const handleFactory = require('../handleFactory.js');
const Genre = 'genre'
const Book = 'book'

router.get('/all', async (req, res) => {
    handleFactory.getAll(Genre).then(result => {
        res.json({ status: true, list: result })
    }).catch(err => {
        res.json({ status: false, message: err.sqlMessage })
    })
})
router.get('/get/:id', async (req, res) => {
    handleFactory.getBy(Genre, { genre_ID: req.params.id }).then(result => {
        handleFactory.getAll(Book).then(result1 => {
            let books = []
            result1.map(item => {
                if (JSON.parse(item.genre).includes(req.params.id))
                    books.push(item)
            })
            res.json({ status: true, genre_name: result[0].genre_name, books: books })
        })

    }).catch(err => {
        res.json({ status: false, message: err.sqlMessage })
    })
})
module.exports = router
