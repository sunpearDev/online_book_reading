const express = require('express')
const router = express.Router()
const uniqid = require('uniqid')
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const handleFactory = require('../handleFactory.js');
const Account = 'account'
const nodemailer = require('nodemailer');


const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};
const sendMail = (email, subject, text) => {
    require('dotenv').config()
    const option = {
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_SENDER, // email hoặc username
            pass: process.env.PASSWORD_SENDER // password
        }
    };
    var transporter = nodemailer.createTransport(option);

    transporter.verify(function (error, success) {
        // Nếu có lỗi.
        if (error) {
            console.log(error);
            return false;
        } else { //Nếu thành công.
            console.log('Kết nối thành công!');
            var mail = {
                from: process.env.EMAIL_SENDER, // Địa chỉ email của người gửi
                to: email, // Địa chỉ email của người gửi
                subject: subject, // Tiêu đề mail
                text: text, // Nội dung mail dạng text
            };
            //Tiến hành gửi email
            transporter.sendMail(mail, function (error, info) {
                if (error) { // nếu có lỗi
                    console.log(error);
                    return false;
                } else { //nếu thành công
                    console.log('Email sent: ' + info.response);
                    return true
                }
            });
        }
    });
}
router.post('/send-code', (req, res) => {
    let validCode = Math.floor(Math.random() * 999999);
    sendMail(req.body.email, 'XÁC THỰC TÀI KHOẢN', 'Mã xác thực của bạn là ' + validCode)
    res.json({ status: true, validCode: validCode })
})



router.post('/', (req, res) => {
    handleFactory.getBy(Account, { username: req.body.username }).then(async result => {
        if (result.length === 0) {
            let account = {
                account_ID: uniqid.time(),
                username: req.body.username,
                password: await bcrypt.hash(req.body.password, 12),
                email: req.body.email,
                account_category: 'user'
            }
            handleFactory.createOne(Account, account).then(result => {
                res.json({ status: true })
            }).catch(err => {
                res.json({ status: false, message: err.sqlMessage })
            })
        }
        else res.json({ status: false, message: `Username ${req.body.username} đã được đăng kí` })
    }).catch(err => {
        res.json({ status: false, message: err.sqlMessage })
    })


})

router.post('/login', (req, res) => {
    handleFactory.getBy(Account, { username: req.body.username }).then(async results => {
        if (results.length > 0) {
            let account = results[0]
            if (await bcrypt.compare(req.body.password, account.password)) {
                res.json({ status: true, token: createToken(account.account_ID), username: account.username })
            }
            else res.json({ status: false, message: 'Mật khẩu không đúng' })
        }
        else res.json({ status: false, message: 'Không tìm thấy ' + req.body.username })
    }).catch(err =>
        res.json({ status: false, message: err.sqlMessage })
    )
})
router.put('/:id', async (req, res) => {
    let valid = await handleFactory.validUser(req.body.jwt)
    let category = valid.account_category
    if (category === 'admin' || category === 'nhansu') {
        handleFactory.updateOne(Account, { account_ID: req.params.id }, req.body.data)
            .then(result => res.json({ status: result }))
            .catch(err => {
                res.json({ status: false, message: err.sqlMessage })
            })
    }
})
router.delete('/:id/:jwt', async (req, res) => {
    let valid = await handleFactory.validUser(req.params.jwt)
    let category = valid.account_category
    if (category === 'admin' || category === 'nhansu')
        handleFactory.deleteBy(Account, { account_ID: req.params.id })
            .then(result => res.json({ status: 'success' }))
            .catch(err => {
                res.json({ status: false, message: err.sqlMessage })
            })
})
module.exports = router