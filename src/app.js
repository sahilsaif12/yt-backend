import express from "express";
const app = express();
import cookieParser from "cookie-parser";
import cors from "cors";

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}))
app.use(cookieParser())
app.use(express.json({limit:'20kb'}))
app.use(express.urlencoded({extended:true,limit:'20kb'}))
app.use(express.static("public"))
app.get('/',(req, res) => {

//   console.log('Cookies: ', req.cookies)

    res.send("sahil")
})

// importing routes
import userRouter from './routes/user.route.js'
import subscriptionRouter from './routes/subscription.route.js'
import videoRouter from './routes/video.route.js'

app.use("/api/v1/users",userRouter)
app.use("/api/v1/subscriptions",subscriptionRouter)
app.use("/api/v1/videos",videoRouter)

export default app