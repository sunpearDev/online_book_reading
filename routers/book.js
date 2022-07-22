const express = require('express')
const router = express.Router()
const uniqid = require('uniqid')
const handleFactory = require('../handleFactory.js');
const Cloudinary = require('../cloudinary')
const Dropbox = require('../dropbox')
const Book = 'book'
const Genre = 'genre'
const connect = require('../connection')

// router.post('/uploadBook', async (req, res) => {

//     res.json({ status: true, fileId: fileId })
// })
// router.post('/uploadImage', async (req, res) => {


//     res.json({ status: true, imageURL: url })
// })
router.get('/get/:id', (req, res) => {
    handleFactory.getBy(Book, { book_ID: req.params.id }).then(async result => {
        let item = result[0]
        item.genre_IDs = JSON.parse(item.genre)
        item.author = JSON.parse(item.author)
        item.intro = item.intro.split('/n')

       
        let genres = await handleFactory.getAll(Genre)
        item.genre = []
        await genres.map(async genre => {

           
            let result = await item.genre_IDs.includes(genre.genre_ID)

            if (result) item.genre.push(genre.genre_name)

        })





        res.json({ status: true, book: item })
    }).catch(err => {
        res.json({ status: false, message: err.sqlMessage })
    })
})
// router.get('/getUrl/:id', (req, res) => {
//     handleFactory.getBy(Book, { book_ID: req.params.id }).then(async result => {
//         let item = result[0]
//         item.url = await getLink(item.book_file)
//         res.json({ status: true, url: item.url })
//     }).catch(err => {
//         res.json({ status: false, message: err.sqlMessage })
//     })
// })

router.get('/getAll/:by', async (req, res) => {


    let columns = undefined
    let condition = undefined
    let order = undefined
    switch (req.params.by) {
        case 'special':
            condition = 'note=' + handleFactory.standardDataType(req.params.by)
            break
        case 'update':
            order = 'day_upload desc'
            break
        default:
            if (req.params.by.includes('account')) {
                let token = req.params.by.substring(req.params.by.indexOf('_') + 1)
                let id = await handleFactory.getAccountID(token)
                condition = `user_ID_upload = '${id}'`
            }
    }

    handleFactory.getAll(Book, columns, condition, order).then(result => {
        try {
            result.map(item => {
                item.author = JSON.parse(item.author)
                item.genre = JSON.parse(item.genre)
                item.intro = item.intro.split('/n')
            })
        }
        catch (err) {
            console.log(err)
        }
        res.json({ status: true, list: result })
    }).catch(err => {
        res.json({ status: false, message: err.sqlMessage })
    })
})
router.put('/one/:id', async (req, res) => {
    let book = req.body.book
    
    try {
        let temp = ''
       
        book.author.map((item, index) => {
            temp += `"${item}"`
            if (index === book.author.length - 1);
            else temp += ', '
        })
        book.author = `[${temp}]`
        
        temp = ''
        book.genre.map((item, index) => {
            temp += `"${item}"`
            if (index === book.genre.length - 1);
            else temp += ', '
        })
        book.genre = `[${temp}]`

        handleFactory.updateOne(Book, { book_ID: req.params.id }, { book_name: book.book_name, author: book.author, genre: book.genre }).then(result => {
            res.json({ status: true})
        }).catch(err => {
            console.log(err)
            res.json({ status: false })
        })

        if (!book.book_cover && !book.book_link);
        else {
            handleFactory.getBy(Book, { book_ID: req.params.id }).then(async dbBook => {
                if (!req.body.book.book_cover);
                else {
                    let imagePath = 'online_book_reading' + dbBook[0].book_cover.split('online_book_reading')[1]
                    imagePath = imagePath.substring(0, imagePath.length - 4)

                    handleFactory.updateOne(Book, { book_ID: req.params.id }, {
                        book_cover: await Cloudinary.update(imagePath, book.book_cover)
                    }).then(result => {
                        res.json({ status: true })
                    }).catch(err => {
                        console.log(err)
                        res.json({ status: false })
                    })


                }
                if (!req.body.book.book_link);
                else {
                    console.log(req.body.book.book_link)
                    let bookLink = await Dropbox.update(dbBook[0].book_file.substring(dbBook[0].book_file.lastIndexOf('/')), book.book_link)
                    if (bookLink !== null) {
                        book.book_file = bookLink
                    } else res.json({ status: false })
                }
            }).catch(err => {
                console.log(err)
                res.json({ status: false })
            })


        }



    } catch (err) {
        console.log(err)
    }

})
router.post('/add', async (req, res) => {
    let url = await Cloudinary.upload(req.body.book.book_cover)
    let bookLink = await Dropbox.upload(req.body.book.book_link)

    if (!url || !bookLink)
        res.json({ status: false, message: 'Lỗi tải lên cloud' })
    else {
        var authors = req.body.book.author.split(',')
        let book = {
            book_ID: uniqid.time(),
            book_name: req.body.book.book_name,
            author: `[${authors.map((item, index) => index === (authors.lenght - 1) ? `"${item}"` : `"${item}" `)}]`,
            genre: `[${req.body.book.genre.map((item, index) => index === (req.body.book.genre.lenght - 1) ? `"${item}"` : `"${item}" `)}]`,
            intro: req.body.book.intro,
            book_file: bookLink,
            book_cover: url,
            user_ID_upload: await handleFactory.getAccountID(req.body.token),
            day_upload: new Date(),
            note: ''
        }
        console.log(book)


        handleFactory.createOne(Book, book).then(result => {
            res.json({ status: true })
        }).catch(err => {
            console.log(err)
            res.json({ status: false, message: err.sqlMessage })
        })
    }

})
router.delete('/one/:id', (req, res) => {
    handleFactory.getBy(Book, { book_ID: req.params.id }).then(async result => {
        let imagePath = 'online_book_reading' + result[0].book_cover.split('online_book_reading')[1]
        let deleteImage = await Cloudinary.delete(imagePath.substring(0, imagePath.length - 4))
        if (deleteImage) {
            let deleteBook = await Dropbox.delete(result[0].book_file.substring(result[0].book_file.lastIndexOf('/')))
            if (deleteBook) {
                handleFactory.deleteBy(Book, { book_ID: req.params.id }).then(result => {
                    res.json({ status: true, message: 'Delete success' })
                }).catch(err => {
                    console.log(err)
                    res.json({ status: false })
                })
            } else res.json({ status: false, message: 'SQL ERROR' })
        } else res.json({ status: false, message: 'SQL ERROR' })
    }).catch(err => {
        console.log(err)
        res.json({ status: false })
    })



})

module.exports = router
