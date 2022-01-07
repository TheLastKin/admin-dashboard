const router = require("express").Router();
const { db } = require("../config/config_firebase");

router.get("/", (req, res) => {
  res.render("../index.ejs");
});

router.get("/manage-users", async (req, res) => {
  const User = db.collection("User");

  const snapshot = await User.get();

  const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.render("../pages/manage-users.ejs", { data: list });
});
router.delete("/delete-user/:id", async (req, res) => {
  let id = req.params.id;
  await db.collection("User").doc(id).delete();
  res.send({ ress: true });
});

router.delete("/delete-product/:outerId/:type/:id", async (req, res) => {
  let { outerId, type, id } = req.params;
  await db
    .collection(`products/${outerId}/${type}`)
    .doc(id)
    .delete()
    .then((value) => console.log(value))
    .catch((e) => console.error(e));
  res.send({ status: true });
});

router.get("/edit-product/:outerId/:type/:id", async (req, res) => {
  const { outerId, type, id } = req.params;
  const product = await (
    await db.collection(`products/${outerId}/${type}`).doc(id).get()
  ).data();
  console.log(product);
  res.render("../pages/edit-product.ejs", {
    product: product,
    outerId: outerId,
    type: type,
    id: id,
  });
});

router.post("/edit-product/:outerId/:type/:id", async (req, res) => {
  const { outerId, type, id } = req.params;
  const productInfo = req.body;
  await db.collection(`products/${outerId}/${type}`).doc(id).update({
    name: productInfo.name,
    price: productInfo.price,
    image: productInfo.image,
  });
  res.send({ status: true });
});

router.get("/manage-products", async (req, res) => {
  const Product = db.collection("products");
  const snapshot = await Product.get();
  let data = [];
  for (let i = 0; i < snapshot.docs.length; i++) {
    await db
      .collection(`products/${snapshot.docs[i].id}/featureproduct`)
      .get()
      .then((snapshot2) => {
        data.push(
          ...snapshot2.docs.map((doc) => ({
            outerId: snapshot.docs[i].id,
            id: doc.id,
            type: "featureproduct",
            ...doc.data(),
          }))
        );
      });
    await db
      .collection(`products/${snapshot.docs[i].id}/newachives`)
      .get()
      .then((snapshot3) => {
        data.push(
          ...snapshot3.docs.map((doc) => ({
            outerId: snapshot.docs[i].id,
            id: doc.id,
            type: "newachives",
            ...doc.data(),
          }))
        );
      });
  }
  res.render("../pages/manage-products.ejs", { data: data });
});

router.get("/manage-users2", (req, res) => {
  res.render("../pages/tables/basic-table.ejs");
});

module.exports = router;
