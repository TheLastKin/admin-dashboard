require('dotenv')
const express = require('express');
const app = express();
const mainRouter = require("./routes/main");
const path = require('path');
app.use(express.static(path.join(__dirname, "assets")));
app.set("view engine", "ejs");

app.use("/dashboard", mainRouter);

app.listen(3000, () => {
    console.log("Server is running in port 3000");
})