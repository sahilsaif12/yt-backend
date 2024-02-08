import multer from "multer"
import mime from 'mime-types'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const extension = mime.extension(file.mimetype);

      // console.log(file);
      cb(null, file?.fieldname + '-' + uniqueSuffix+"."+extension)
    }
  })
  
const upload = multer({ storage: storage })

export {upload}