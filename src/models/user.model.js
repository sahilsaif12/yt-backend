import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new Schema(
    {
        username:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index:true,
            trim: true,
        },
        email:{
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        fullName:{
            type: String,
            required: true,
            index:true,
            trim: true,
        },
        avatar:{
            type: String,
            required: true
        },
        coverImage:{
            type: String
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
                
            }
        ],
        password:{
            type:String,
            required: [true,"password is required"]
        },
        refreshToken:{
            type:String,
        }
        
    },
    {timestamps:true}
)

userSchema.pre('save', async function(next){
    if(this.isModified("password")){
        this.password=await bcrypt.hashSync(this.password,10)
        next()
    }
})

userSchema.methods.isPasswordCorrect= async function(password){
    
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken= async function(){
    return await jwt.sign(
        {
            _id:this._id,
            username:this.username,
            email:this.email,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET_KEY,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRE
        }
    )
}

userSchema.methods.generateRefreshToken= async function(){
    return await jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET_KEY,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRE
        }
    )
}
export const User=mongoose.model("User",userSchema)