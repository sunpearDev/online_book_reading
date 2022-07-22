const connect = require('./connection.js')
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const { table } = require('console');

exports.standardDataType = (text) => {
    if (!isNaN(text))
        return text
    else return `'${text}'`
}
const decodeToken = async (token) => {
    try {
        const decoded = await promisify(jwt.verify)(
            token,
            process.env.JWT_SECRET
        )
        return decoded.id
    }
    catch (err) {
        console.log(err)
        return undefined
    }
}
const getByColumns = (columns) => {
    return columns === undefined ? "*" : columns.map((column, index) =>
        (index === columns.length ? column : (column + ',')))
}
exports.getCurrentDate = () => {
    let today = new Date();
    let date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
    let time = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`
    let datetime = date + ' ' + time
    return datetime
}

exports.query = (sql) => {
    return new Promise((resolve, reject) => {
        connect.query(sql, async (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        })
    })
}

exports.getAccountID = async (token) => {
    let id = await decodeToken(token)
    return id
}

exports.validUser = async (token) => {
    let id = await decodeToken(token)
    return await this.getBy('account', { account_ID: id })
        .then(result =>
            ({ status: true, account_category: result[0].account_category })
        )
        .catch(err =>
            ({ status: false, message: err.sqlMessage })
        )
}

exports.getAll = (table, columns = '*', condition = undefined, order = undefined) => {
    let sql = `select ${columns} from  ${table}`
    if (!condition);
    else sql += ` where ${condition}`
    if (!order);
    else sql += ` order by ${order}`
    
    return new Promise((resolve, reject) => {
        connect.query(sql, async (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        })
    })
}


exports.getBy = (table, params, condition = 'and', correct = true, columns = "*", groupBy, having) => {
    let sql = `select ${columns} from ${table} where `

    let keys = Object.keys(params)

    if (correct) {
        sql += `${keys[0]} = ` + this.standardDataType(params[keys[0]])
        for (let i = 1; i < keys.length; i++) {
            sql += ` ${condition} ${keys[i]}`
            sql += ' = ' + this.standardDataType(params[keys[i]])
        }
    } else {
        sql += `${keys[0]} like '%${params[keys[0]]}%'`
        for (let i = 1; i < keys.length; i++) {
            sql += ` ${condition} ${keys[i]}`
            sql += ` like '%${params[keys[i]]}%'`
        }
    }

    //sort
    if (!groupBy);
    else sql += ` group by ${groupBy}`
    if (!having);
    else sql += ` having ${having}`


    return new Promise((resolve, reject) => {
        connect.query(sql, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        })
    })
}
exports.joinTables = (tables, ids, condition) => {

    if (ids.length !== undefined && ids.length !== tables.length + 1) {

        return new Promise((resolve, reject) => {
            reject("Number of id or table name not enough for join.");
        })
    }
    else {

        let sql = `select * from ${tables[0]} `
        let key
        for (let i = 1; i < tables.length; i += 2) {

            if (ids.length === undefined)
                key = Object.keys(ids)
            else key = Object.keys(ids[i - 1])[0]
            sql += `join ${tables[i]} on ${tables[i - 1]}.${key} = ${tables[i]}.${key}`
        }


        if (ids[key] !== undefined && !Array.isArray(ids))
            sql += ` where ${tables[0]}.${key} = ` + standardDataType(ids[key])



        if (condition !== undefined) {
            key = Object.keys(condition)[0]
            if (!sql.includes('where')) sql += ' where '
            else sql += ' and '
            sql += `${key} = ` + standardDataType(condition[key])
        }

        return new Promise((resolve, reject) => {
            connect.query(sql, (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);

            })
        })
    }

}


exports.createOne = async (table, item) => {

    return new Promise((resolve, reject) => {
        connect.query(`insert into ${table} set ? `, item, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        })
    })



}


exports.updateOne = (table, id, item) => {
    let keys = Object.keys(id)
    let params = `${keys[0]} = ` + this.standardDataType(id[keys[0]])

    for (let i = 1; i < keys.length; i++) {
        params += ` and ${keys[i]} = ` + this.standardDataType(id[keys[i]])
    }
    return new Promise((resolve, reject) => {
        connect.query(`update ${table} set ? where ${params}`, item, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        })
    })
}


exports.deleteBy = (table, id) => {
    let keys = Object.keys(id)
    let params = `${keys[0]} = ` + this.standardDataType(id[keys[0]])

    for (let i = 1; i < keys.length; i++) {
        params += ` and ${keys[i]} = ` + this.standardDataType(id[keys[i]])
    }
    return new Promise((resolve, reject) => {
        connect.query(`delete from ${table} where ${params}`, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        })
    })
}




