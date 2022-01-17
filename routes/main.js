const router = require("express").Router();
const { db, store, auth, fireStore } = require("../config/config_firebase");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const moment = require("moment");

router.get("/", (req, res) => {
  res.redirect("/manage-products/featureproduct");
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
                  price: Number(productInfo.price),
                  purchaseprice: Number(productInfo.purchaseprice),
                  description: productInfo.description,
                  quantily: Number(productInfo.quantity),
                  quantitydefault: Number(productInfo.quantity),
                  image: results[0],
                });
              fs.unlinkSync(productImage.path);
            })
            .catch((e) => console.log(e));
        });
    } else {
      await db
        .collection(`products/${outerId}/${type}`)
        .doc(id)
        .update({
          name: productInfo.name,
          price: Number(productInfo.price),
          purchaseprice: Number(productInfo.purchaseprice),
          description: productInfo.description,
          quantily: Number(productInfo.quantity),
          quantitydefault: Number(productInfo.quantity),
        });
    }
    res.redirect(`/manage-products/${type}`);
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
              price: Number(productInfo.price),
              purchaseprice: Number(productInfo.purchaseprice),
              description: productInfo.description,
              image: results[0],
              quantily: Number(productInfo.quantity),
              quantitydefault: Number(productInfo.quantity),
            });
            fs.unlinkSync(productImage.path);
          })
          .catch((e) => console.log(e));
      });
  }
  res.redirect("/add-product");
});

router.get("/manage-products/:type", async (req, res) => {
  const { type } = req.params;
  const Product = db.collection("products");
  const snapshot = await Product.get();
  let data = [];
  for (let i = 0; i < snapshot.docs.length; i++) {
    await db
      .collection(
        `products/${snapshot.docs[i].id}/${type ? type : "featureproduct"}`
      )
      .get()
      .then((snapshot2) => {
        data.push(
          ...snapshot2.docs.map((doc) => ({
            outerId: snapshot.docs[i].id,
            id: doc.id,
            type: type ? type : "featureproduct",
            ...doc.data(),
          }))
        );
      });
    // await db
    //   .collection(`products/${snapshot.docs[i].id}/newachives`)
    //   .get()
    //   .then((snapshot3) => {
    //     data.push(
    //       ...snapshot3.docs.map((doc) => ({
    //         outerId: snapshot.docs[i].id,
    //         id: doc.id,
    //         type: "newachives",
    //         ...doc.data(),
    //       }))
    //     );
    //   });
  }

  res.render("../pages/manage-products.ejs", { data: data });
});
var lastday = function (y, m) {
  return new Date(y, m + 1, 0).getDate();
};
router.get("/manage-orders", async (req, res) => {
  const date = new Date();
  const Order = db.collection("Order");

  const snapshot = await Order.orderBy("date").get();
  const orders = snapshot.docs.map((doc) => {
    let dateOrder = doc.data().date
      ? moment(doc.data().date._seconds * 1000).format("DD/MM/YYYY")
      : moment().format("DD/MM/YYYY");
    return {
      id: doc.id,
      dateOrder: dateOrder,
      ...doc.data(),
    };
  });
  let totalPriceMonth = 0;
  let totalPriceDateNow = 0;
  let totalPriceWeek = 0;
  let totalPriceYear = 0;

  var monday = moment().clone().weekday(1).format("X");
  var sunday = moment().clone().weekday(7).format("X");
  var monday2 = moment().clone().weekday(1).format("DD/MM/YYYY");
  var sunday2 = moment().clone().weekday(7).format("DD/MM/YYYY");
  for (let index = 0; index < orders.length; index++) {
    const element = orders[index];
    if (
      element.dateOrder.includes(moment().format("MM/YYYY")) &&
      element.status === "successfully"
    ) {
      totalPriceMonth += Number(element.TotalPrice);
    }
    if (
      element.dateOrder.includes(moment().format("DD/MM/YYYY")) &&
      element.status === "successfully"
    ) {
      totalPriceDateNow += Number(element.TotalPrice);
    }
    if (
      element.dateOrder.includes(moment().format("YYYY")) &&
      element.status === "successfully"
    ) {
      totalPriceYear += Number(element.TotalPrice);
    }
    if (
      new Date(
        `${element.dateOrder}`.split("/")[2],
        `${element.dateOrder}`.split("/")[1] - 1,
        `${element.dateOrder}`.split("/")[0]
      ).getTime() >
        monday * 1000 &&
      new Date(
        `${element.dateOrder}`.split("/")[2],
        `${element.dateOrder}`.split("/")[1] - 1,
        `${element.dateOrder}`.split("/")[0]
      ).getTime() <
        sunday * 1000 &&
      element.status === "successfully"
    ) {
      totalPriceWeek += Number(element.TotalPrice);
    }
  }

  res.render("../pages/manage-orders.ejs", {
    data: orders?.reverse(),
    totalPriceMonth,
    totalPriceDateNow,
    totalPriceWeek,
    monday2,
    sunday2,
    totalPriceYear,
  });
});

router.get("/statistical", async (req, res) => {
  const date = new Date();
  const Order = db.collection("Order");

  const snapshot = await Order.get();
  const orders = snapshot.docs.map((doc) => {
    let dateOrder = moment(doc.data().date?._seconds * 1000).format(
      "DD/MM/YYYY"
    );
    return {
      id: doc.id,
      dateOrder: dateOrder,
      ...doc.data(),
    };
  });
  let totalPriceMonth = 0;
  let totalPriceDateNow = 0;
  let totalPriceWeek = 0;
  let totalPriceYear = 0;

  var monday = moment().clone().weekday(1).format("X");
  var sunday = moment().clone().weekday(7).format("X");
  var monday2 = moment().clone().weekday(1).format("DD/MM/YYYY");
  var sunday2 = moment().clone().weekday(7).format("DD/MM/YYYY");
  for (let index = 0; index < orders.length; index++) {
    const element = orders[index];
    if (
      element.dateOrder.includes(moment().format("MM/YYYY")) &&
      element.status === "successfully"
    ) {
      totalPriceMonth += Number(element.TotalPrice);
    }
    if (
      element.dateOrder.includes(moment().format("DD/MM/YYYY")) &&
      element.status === "successfully"
    ) {
      totalPriceDateNow += Number(element.TotalPrice);
    }
    if (
      element.dateOrder.includes(moment().format("YYYY")) &&
      element.status === "successfully"
    ) {
      totalPriceYear += Number(element.TotalPrice);
    }
    if (
      new Date(
        `${element.dateOrder}`.split("/")[2],
        `${element.dateOrder}`.split("/")[1] - 1,
        `${element.dateOrder}`.split("/")[0]
      ).getTime() >
        monday * 1000 &&
      new Date(
        `${element.dateOrder}`.split("/")[2],
        `${element.dateOrder}`.split("/")[1] - 1,
        `${element.dateOrder}`.split("/")[0]
      ).getTime() <
        sunday * 1000 &&
      element.status === "successfully"
    ) {
      totalPriceWeek += Number(element.TotalPrice);
    }
  }
  const Product = db.collection("products");
  const snapshots = await Product.get();
  let data = [];
  for (let i = 0; i < snapshots.docs.length; i++) {
    await db
      .collection(`products/${snapshots.docs[i].id}/${"featureproduct"}`)
      .get()
      .then((snapshot2) => {
        data.push(
          ...snapshot2.docs.map((doc) => ({
            outerId: snapshots.docs[i].id,
            id: doc.id,
            type: "featureproduct",
            ...doc.data(),
          }))
        );
      });
    await db
      .collection(`products/${snapshots.docs[i].id}/newachives`)
      .get()
      .then((snapshot3) => {
        data.push(
          ...snapshot3.docs.map((doc) => ({
            outerId: snapshots.docs[i].id,
            id: doc.id,
            type: "newachives",
            ...doc.data(),
          }))
        );
      });
  }
  let totalCapital = 0;
  if (data.length) {
    for (let index = 0; index < data.length; index++) {
      let element = data[index];
      totalCapital += element.purchaseprice * element.quantitydefault;
    }
  }

  let hole = totalPriceYear - totalCapital;

  res.render("../pages/statistical.ejs", {
    totalPriceMonth,
    totalPriceDateNow,
    totalPriceWeek,
    monday2,
    sunday2,
    totalPriceYear,
    totalCapital,
    hole,
  });
});

router.post("/update-order-status", async (req, res) => {
  const orderInfo = req.body;
  const Product = db.collection("products");
  const snapshots = await Product.get();
  let data = [];
  for (let i = 0; i < snapshots.docs.length; i++) {
    await db
      .collection(`products/${snapshots.docs[i].id}/${"featureproduct"}`)
      .get()
      .then((snapshot2) => {
        data.push(
          ...snapshot2.docs.map((doc) => ({
            outerId: snapshots.docs[i].id,
            id: doc.id,
            type: "featureproduct",
            ...doc.data(),
          }))
        );
      });
    await db
      .collection(`products/${snapshots.docs[i].id}/newachives`)
      .get()
      .then((snapshot3) => {
        data.push(
          ...snapshot3.docs.map((doc) => ({
            outerId: snapshots.docs[i].id,
            id: doc.id,
            type: "newachives",
            ...doc.data(),
          }))
        );
      });
  }
  if (orderInfo) {
    await db
      .collection("Order")
      .doc(orderInfo.id)
      .update({ status: orderInfo.status })
      .then(() => {
        res.send({ status: true });

        let product = JSON.parse(orderInfo.product);
        for (let i = 0; i < data.length; i++) {
          let element = data[i];
          for (let index = 0; index < product.length; index++) {
            let element1 = product[index];
            if (element.name === element1.ProductName) {
              console.log("id", element.id);
              db.collection(`products/UhwQZY3X4WKjyr7LV8Sl/${element.type}`)
                .doc(element.id)
                .update({
                  quantily: element.quantily - element1.ProductQuetity,
                })
                .then(() => {
                  console.log("thanh cong");
                })
                .catch((error) => {
                  console.log("That bai", error);
                });
            }
          }
        }
      })
      .catch(() => {
        res.send({ status: false });
      });
  } else {
    res.send({ status: false });
  }
});

module.exports = router;
