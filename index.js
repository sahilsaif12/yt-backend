import connectDb from "./src/db/index.js";
import app from "./app.js"
const port=process.env.PORT  || 8000
connectDb()
.then(()=>{

    app.listen(port,()=>{
        
        console.log(`\nApp listening on http://localhost:${port}`);
    })
    
})

.catch(err=>{
    console.log(`mongo db connection error : ${err}`);
})
