const db = require("./config/config_firebase");
require("dotenv");
const express = require("express");
const app = express();
const mainRouter = require("./routes/main");
const path = require("path");
app.use(express.static(path.join(__dirname, "assets")));
app.set("view engine", "ejs");

app.use("/", mainRouter);

app.get("/", async (req, res) => {
  const User = db.collection("User");

  const snapshot = await User.get();
  const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.send(list);
});

app.listen(3000, () => {
  console.log("Server is running in port 3000");
});
