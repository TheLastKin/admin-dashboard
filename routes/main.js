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
router.delete("/manage-users-delete/:id", async (req, res) => {
  let id = req.params.id;
  await db.collection("User").doc(id).delete();
  res.send({ ress: true });
});

router.get("/manage-users2", (req, res) => {
  res.render("../pages/tables/basic-table.ejs");
});

module.exports = router;
