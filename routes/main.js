const router = require('express').Router();

router.get('/', (req, res) => {
    res.render("../index.ejs")
});

router.get('/manage-users', (req, res) => {
    res.render("../pages/manage-users.ejs");
})

router.get('/manage-users2', (req, res) => {
    res.render("../pages/tables/basic-table.ejs");
})

module.exports = router;