const router = require("express").Router();
const db = require("../config/config_firebase");

router.get("/", (req, res) => {
  res.render("../index.ejs");
});

router.get("/manage-users", async (req, res) => {
  const User = db.collection("User");

  const snapshot = await User.get();
  const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.render("../pages/manage-users.ejs", { data: list });
});

router.get("/manage-products", async (req, res) => {
  const Product = db.collection("products");
  const snapshot = await Product.get();
  let data = [];
  for(let i = 0; i < snapshot.docs.length; i++){
    await db.collection(`products/${snapshot.docs[i].id}/featureproduct`).get().then(snapshot2 => {
      data.push(...snapshot2.docs.map(doc => ({id: doc.id, ...doc.data()})));
    });
    await db.collection(`products/${snapshot.docs[i].id}/newachives`).get().then(snapshot3 => {
      data.push(...snapshot3.docs.map(doc => ({id: doc.id, ...doc.data()})))
    });
  }
  console.log(data);
  res.render("../pages/manage-products.ejs", { data: data });
})

router.get("/manage-users2", (req, res) => {
  res.render("../pages/tables/basic-table.ejs");
});

module.exports = router;
