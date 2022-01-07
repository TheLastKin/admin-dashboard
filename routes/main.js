const router = require("express").Router();
const { db, store, auth } = require("../config/config_firebase");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");

router.get("/", (req, res) => {
  res.redirect("/manage-products");
});

router.get("/manage-users", async (req, res) => {
  const User = db.collection("User");

  const snapshot = await User.get();

  let list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  await auth.listUsers().then((data) => {
    list = list.map((user) => {
      for (let item of data.users) {
        if (user.id === item.uid) {
          return { ...user, disabled: item.disabled };
        }
      }
      return user;
    });
  });
  res.render("../pages/manage-users.ejs", { data: list });
});
router.post("/disable-users/:id", async (req, res) => {
  let id = req.params.id;
  auth.updateUser(id, {
    disabled: true,
  });

  res.send({ ress: true });
});
router.post("/enable-users/:id", async (req, res) => {
  let id = req.params.id;
  auth.updateUser(id, {
    disabled: false,
  });

  res.send({ ress: true });
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
  res.render("../pages/edit-product.ejs", {
    product: product,
    outerId: outerId,
    type: type,
    id: id,
  });
});

router.post(
  "/edit-product/:outerId/:type/:id",
  upload.single("image"),
  async (req, res) => {
    const { outerId, type, id } = req.params;
    const productInfo = req.body;
    const productImage = req.file;
    if (productImage) {
      const bucket = store.bucket("duantotnghiep-73075.appspot.com");
      const fileName = `${Date.now()}-${productImage.originalname}`;
      await bucket
        .upload(productImage.path, {
          destination: `productImages/${fileName}`,
        })
        .then(async (value) => {
          bucket
            .file(`productImages/${fileName}`)
            .getSignedUrl({
              action: "read",
              expires: "03-17-2025",
            })
            .then(async (results) => {
              await db
                .collection(`products/${outerId}/${type}`)
                .doc(id)
                .update({
                  name: productInfo.name,
                  price: productInfo.price,
                  image: results[0],
                });
              fs.unlinkSync(productImage.path);
            })
            .catch((e) => console.log(e));
        });
    } else {
      await db.collection(`products/${outerId}/${type}`).doc(id).update({
        name: productInfo.name,
        price: productInfo.price,
      });
    }
    res.redirect("/manage-products");
  }
);

router.get("/add-product", (req, res) => {
  res.render("../pages/add-product.ejs");
});

router.post("/add-product", upload.single("image"), async (req, res) => {
  const productInfo = req.body;
  const productImage = req.file;
  const fileName = `${Date.now()}-${productImage.originalname}`;
  if (productImage) {
    const bucket = store.bucket("duantotnghiep-73075.appspot.com");
    const fileName = `${Date.now()}-${productImage.originalname}`;
    await bucket
      .upload(productImage.path, {
        destination: `productImages/${fileName}`,
      })
      .then(async (value) => {
        bucket
          .file(`productImages/${fileName}`)
          .getSignedUrl({
            action: "read",
            expires: "10-10-9999",
          })
          .then(async (results) => {
            await db.collection(`products/${productInfo.category}`).add({
              name: productInfo.name,
              price: productInfo.price,
              image: results[0],
            });
            fs.unlinkSync(productImage.path);
          })
          .catch((e) => console.log(e));
      });
  }
  res.redirect("/add-product");
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
