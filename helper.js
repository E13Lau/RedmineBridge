const https = require('https');
const config = require('./config')
const kRedmineApiKey = config.key
const kRedmineHostname = config.hostname
const kRedminePort = config.port


//  找 redmine id 找 进度 找 指派人
function getData(str) {
    const getIDpattern = /(?<=#)\d+(?==)/gm;
    const redmineID = getIDpattern.exec(str);
    if (redmineID == null) {
        return;
    }
    // console.log(`redmineID=${redmineID}`);

    const getlastStrPattern = /(?<==).*(?=;)/gm;
    const lastStringRex = getlastStrPattern.exec(str);
    if (lastStringRex == null) {
        return;
    }
    const lastString = lastStringRex[0];
    // console.log(`lastString=${lastString}`);

    const getUsername = /[a-zA-Z]+/gm;
    const username = getUsername.exec(lastString);
    if (username == null) {
        return;
    }
    // console.log(`username=${username}`);

    const getProgessPattern = /\d+/gm;
    const progress = getProgessPattern.exec(lastString);
    if (progress == null) {
        progress = 0;
    }
    // console.log(`progress=${progress}`);

    return [redmineID[0], username[0], progress[0]];
}

// 获取redmine用户的userID
function getUserID(username) {
    if (username == 'tt') {
        return '197'
    }
    if (username == 'qh') {
        return '226'
    }
    if (username == 'jh') {
        return '179'
    }
    if (username == 'll') {
        return '287'
    }
    if (username == 'xx') {
        return '223'
    }
    if (username == 'yoyo') {
        return '34'
    }
    if (username == 'nana') {
        return '237'
    }
    return null
}

// 扫描文本
function changeRedmineStatus(str) {
    console.log(`str=${str}`);
    const regex = /#\d+=[^ ].*?;/gm;
    let m;
    while ((m = regex.exec(str)) !== null) {
        console.log(`m.index=${m.index}`);
        // 这对于避免零宽度匹配的无限循环是必要的
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // 结果可以通过`m变量`访问。
        m.forEach((match, groupIndex) => {
            // match 内容等于 #36807=100/tt;

            // 找 redmine id,找 进度,找 指派人
            let array = getData(match);
            if (array != null) {
                console.log(array);
                const redmineID = array[0];
                const username = array[1];
                const progress = array[2];
                console.log('request will')
                getIssueTrackerID(redmineID, (data) => {
                    // console.log(data);
                    const json = JSON.parse(data);
                    if (json.issue.tracker.id == 1) {
                        console.log('tracker.id == 1');
                        // 判断assigned_to 是不是已经相等
                        putRedmineStatus(redmineID, username, progress, (data) => {
                            console.log(data);
                        })
                    } else {
                        console.log('tracker.id != 1');
                    }
                });
            }
        });
    }
}

// 根据进度获取状态id
function getStatusIDWith(progress) {
    if (progress == 100) {
        return '3'
    }
    return '2'
}

// 获取跟踪类型id
function getIssueTrackerID(issueID, callback) {
    const options = {
        hostname: kRedmineHostname,
        port: kRedminePort,
        path: '/issues/' + issueID + '.json',
        method: 'GET',
        headers: {
            'X-Redmine-API-Key': kRedmineApiKey,
        },
        rejectUnauthorized: false,
    };
    // console.log(options);
    getRequest(options, (data) => {
        callback(data);
    });
    return
}

function postRequest(options, data, callback) {
    const req = https.request(options, (res) => {
        console.log(`statusCode: ${res.statusCode}`);
        var data = '';
        res.on('data', (chunk) => {
            data += chunk.toString();
        });
        res.on('end', () => {
            callback(data);
        })
    });
    req.on('error', (e) => {
        console.log(e);
    });
    req.write(data);
    req.end();
}

function getRequest(options, callback) {
    const req = https.request(options, (res) => {
        console.log(`statusCode: ${res.statusCode}`);
        var data = '';
        res.on('data', (chunk) => {
            data += chunk.toString();
        })
        res.on('end', () => {
            callback(data);
        })
    });
    req.on('error', (e) => {
        console.error(e);
    });
    req.end();
}

function putRedmineStatus(redmineID, username, progress, callback) {
    const userID = getUserID(username);
    if (userID == null) {
        return
    }
    const statusID = getStatusIDWith(progress);
    const data = JSON.stringify({
        issue: {
            status_id: statusID,
            done_ratio: progress,
            assigned_to_id: userID,
        },
    })
    console.log(data);
    const options = {
        hostname: kRedmineHostname,
        port: kRedminePort,
        path: '/issues/' + redmineID + '.json',
        method: 'PUT',
        headers: {
            'X-Redmine-API-Key': kRedmineApiKey,
            'Content-Type': 'application/json',
            'Content-Length': data.length,
        },
        rejectUnauthorized: false,
    };
    // console.log(options);
    postRequest(options, data, (data) => {
        callback(data);
    });
    return
}

exports.changeRedmineStatus = changeRedmineStatus;