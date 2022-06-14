const express = require('express')
const port = 12306
const helper = require('./helper')

const app = express()

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(express.json());

// 添加评论
app.post('/redmine/notes', (req, res) => {

});

// 改状态
app.post('/redmine/status', function (req, res) {
    helper.changeRedmineStatus(req.body.content)
    res.send(req.body)
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})