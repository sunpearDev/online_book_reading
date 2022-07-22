require('dotenv').config()
const { Dropbox } = require('dropbox')
const fs = require('fs')
const uniqid = require('uniqid')
const dbx = new Dropbox({ accessToken: process.env.DROPBOX });


var that = module.exports = {
    upload: async (fullPath) => {
        let fileName = '/' + uniqid.time() + '.epub'
        try {
            let create = await dbx.filesUpload({ path: fileName, contents: fs.createReadStream(fullPath) })
            if (create.status === 200) {
                let connect = await dbx.sharingCreateSharedLinkWithSettings({ path: fileName })
                if (connect.status === 200) {
                    let url = connect.result.url.replace('www.dropbox.com', 'dl.dropboxusercontent.com')
                    return url.substring(0, url.length - 5)
                }
            }
        } catch (error) {
            console.error(error)
            return null

        }
    },
    update: async (oldPath, newPath) => {
        try {

            dbx.filesUpload({ path: oldPath, contents: fs.createReadStream(newPath), mode: 'overwrite' })
                .then(function (response) {
                    console.log(response);
                })
                .catch(function (error) {
                    console.error(error);
                });

        } catch (error) {
            return null
            console.error(error)
        }


    },
    delete: async (fileName) => {
        try {
            let result = await dbx.filesDeleteV2({ path: fileName })
            if (result.status === 200) {
                console.log('DROPBOX', result)
                return true
            }
        } catch (error) {
            console.error(error)
            return null

        }
    }
}

