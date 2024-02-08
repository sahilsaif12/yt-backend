import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { extractPublicId } from 'cloudinary-build-url'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
    fs.unlinkSync(localFilePath)
    // console.log(response);
    return response;
  } catch (error) {
    console.log("error while uploading in cloudinary : " + error.message);
    fs.unlinkSync(localFilePath)
    return null;
  }
}

const deleteFromCloudinary = async (publicLink,type) => {
  if (publicLink == "") return null
  const publicId = extractPublicId(publicLink)
  
  cloudinary.uploader.destroy(publicId,{resource_type: type}, (error, result) => {
    if (error) {
      console.log("error while deleting old file in cloudinary : " + error.message);
    } else {
      console.log(result);
      return true;
    }
  });

}
export { uploadOnCloudinary, deleteFromCloudinary }