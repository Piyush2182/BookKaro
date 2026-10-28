const express = require("express")
const app = express()
app.get('/test',(req,res)=>{
    res.json({"message":"ye maine bina dehe khud banaya hai "});
    console.log(req.query);
});
app.listen(4000,()=>{
    console.log("server port 4000 par jinda ho gaya")
})
