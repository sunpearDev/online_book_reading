require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});



var that = module.exports = {

    upload: async (file) => {
        try {

            const fileStr = file;
            const uploadResponse = await cloudinary.uploader.upload(fileStr, {
                upload_preset: 'SunPear',
            });
            console.log(uploadResponse)
            return (uploadResponse.url)
        } catch (err) {
            console.error(err);
            return null;
        }
    },
    update: async (oldFileID, newFile) => {
        try {
            const update = await cloudinary.uploader.upload(newFile, {
                upload_preset: 'SunPear',
                public_id: oldFileID
            });
            console.log(update);
            return update.url
        } catch (err) {
           
            console.error(err);
            return null
        }
        // let deleteImage = await that.delete(oldFileID)
        // if (deleteImage.result === 'ok') {
        //     let url = await that.upload(newFile)
        //     return url
        // }
        // else return null
    },
    delete: async (fileId) => {
        console.log(fileId)
        try {
            const deleteResponse = await cloudinary.uploader.destroy(fileId, {
                upload_preset: 'SunPear',
            });
            console.log('CLOUDINARY', deleteResponse);
            if (deleteResponse.result==='ok'||deleteResponse.result==='not found') 
            return true
        } catch (err) {
            console.error(err);
            return null;
        }
    }
};