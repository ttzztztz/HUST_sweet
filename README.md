# HUST_SWEET 后端接口文档

### 一些鸽子

-   没有资金申请腾讯云/阿里云短信接口，暂时手机验证码功能，鸽了
-   username 是绑定 JWT 里的，修改 username 有点复杂，暂时鸽了

### 约定

-   每页元素数量 20，即 `PAGESIZE = 20`
-   登录 token 采用 `JWT` 方案，`ExpireTime = 86400s`，自签发 JWT 起计算

### 测试服务器

-   感谢杜主席的赞助！
    -   `http://206.189.42.213:8888/`
-   测试账号用户名 admin、密码 admin
-   admin 拥有管理员权限，可以用来创建任务，供后期测试

### 用户部分

-   注册账号

    -   POST
    -   URL `./user/reg`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
    -   请求体
        -   email
            -   电子邮箱（唯一）
            -   String
        -   mobile
            -   手机账号（唯一）
            -   ~~目前没有申请腾讯云/阿里云的发送短信接口，手机号码验证功能先鸽了~~
            -   String
        -   username
            -   用户名（唯一）
            -   String
        -   password
            -   密码（MD5 在前端加密后，传输的是加密以后的、小写、32 位）
            -   String
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   String
            -   如果注册成功，为 token
            -   如果注册失败，为失败原因
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI1YzczYTMyMDdjZjg2ZDQ5NWMxNGJmMTIiLCJ1c2VybmFtZSI6Imh6eXRxbCIsImlzQWRtaW4iOmZhbHNlLCJpYXQiOjE1NTEwODIyNzIsImV4cCI6MTU1MTE2ODY3Mn0.-Jv6BpxumbDt6ErzOQ_kr-YcwM1OUzpmGf77TLSuM8U"
    }
    ```

-   登录账号

    -   POST
    -   URL `./user/login`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
    -   请求体
        -   username
            -   用户名、手机号、邮箱，三选一，均可接受，服务端自动判断
            -   String
        -   password
            -   密码（MD5 在前端加密后，传输的是加密以后的、小写、32 位）
            -   String
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果注册成功，为 Object
                -   token
                    -   token
                -   username
                    -   用户名
                -   email
                    -   电子邮箱
                -   golds
                    -   金币数
                -   isAdmin
                    -   是否为管理员（拥有发布任务的权限）
            -   如果注册失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiI1YzczYTMyMDdjZjg2ZDQ5NWMxNGJmMTIiLCJ1c2VybmFtZSI6Imh6eXRxbCIsImlzQWRtaW4iOmZhbHNlLCJpYXQiOjE1NTEwODIzNzgsImV4cCI6MTU1MTE2ODc3OH0.03cACYRJzk243kDTTcvV3UPepYMNCVS0AIXTbWKJIP8",
            "username": "hzytql",
            "isAdmin": false,
            "golds": 0,
            "email": "hzytql@hzytql.top"
        }
    }
    ```

-   获取账号信息

    -   GET
    -   URL `./user/info/${username}`
        -   替换 username 为用户名
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
        -   Authorization
            -   登录时获得的 token
    -   请求体
        -   替换域名即可
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为 Object
                -   username
                    -   用户名
                -   email
                    -   电子邮箱
                -   golds
                    -   金币数
                -   isAdmin
                    -   是否为管理员（拥有发布任务的权限）
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": {
            "username": "hzytql",
            "isAdmin": false,
            "golds": 0,
            "email": "hzytql@hzytql.top"
        }
    }
    ```

-   更改密码

    -   POST
    -   URL `./user/pwd`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
        -   Authorization
            -   登录时获得的 token
    -   请求体
        -   oldPwd
            -   String
            -   旧密码的 MD5（前端 MD5 计算后的结果）
        -   newPwd
            -   String
            -   新密码的 MD5（前端 MD5 计算后的结果）
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为 空
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1
    }
    ```

-   更新资料

    -   GET
    -   URL `./user/update`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
        -   Authorization
            -   登录时获得的 token
    -   请求体
        -   mobile
            -   String
            -   手机号
        -   region
            -   String
            -   地区
        -   isDialect
            -   Boolean
            -   是否是方言
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为 空
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1
    }
    ```

### 任务部分

-   创建任务

    -   POST
    -   URL `./task/create`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
        -   Authorization
            -   登录时获得的 token
            -   必须是管理员账号
    -   请求体
        -   content
            -   String
            -   描述、介绍的内容
        -   readContent
            -   String
            -   要求用户阅读的内容
        -   bonus
            -   Number（最好是 Int）
            -   阅读完毕用户获得的金币奖励
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为 ObjectID
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": "5c73a8eae5033a4b80a4f460"
    }
    ```

-   任务列表

    -   GET
    -   URL `./task/list/${page}`
        -   将 page 替换为页码数，从 1 开始
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为 Object
                -   count
                    -   Number
                    -   所有的任务总数，用于计算分页（PAGESIZE）
                -   list
                    -   Array<Item>
                    -   当前页面每一个任务的简略信息（brief infomation）
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": {
            "list": [
                {
                    "_id": "5c73a8eae5033a4b80a4f460",
                    "content": "让我们一起来阅读：洪志远太强了",
                    "readContent": "洪志远太强了",
                    "bonus": "20",
                    "finishedCount": 0,
                    "createDate": "2019-02-25T08:35:54.595Z",
                    "finished": false
                }
            ],
            "count": 1
        }
    }
    ```

-   标注列表

    -   GET
    -   URL `./record/list/${page}`
        -   将 page 替换为页码数，从 1 开始
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为 Object
                -   count
                    -   Number
                    -   所有的任务总数，用于计算分页（PAGESIZE）
                -   list
                    -   Array<Item>
                    -   当前页面每一个任务的简略信息
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": {
            "list": [
                {
                    "_id": "5c73a8eae5033a4b80a4f460",
                    "uid": "5c73a8eae5033a4b80a4f977",
                    "tid": "5c73a8eae5033a4b80a9b855",
                    "status": "1",
                    "time": "2019-02-25T08:35:54.595Z"
                }
            ],
            "count": 1
        }
    }
    ```

-   任务提交

    -   POST
    -   URL `./task/commit`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
        -   Authorization
            -   登录时获得的 token
            -   必须已经登录
    -   请求体
        -   tid
            -   String
            -   任务 id
        -   fid
            -   String
            -   返回的文件 id
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为该数据库储存的新 Id
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": "5c73a8eae5033a4b80a4f460"
    }
    ```

-   任务详情

    -   POST
    -   URL `./task/item/${tid}`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
        -   Authorization
            -   登录时获得的 token
    -   请求体
        将\${tid}替换为对应的任务 Id 即可
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为 Object
            -   如果获取失败，为失败原因，为 String
            -   关于 `status` 状态问题
                -   只有提交过才会显示 `status` 参数
                -   审核中 0
                -   审核成功 1
                -   审核失败 -1
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": {
            "_id": "5c73a8eae5033a4b80a4f460",
            "content": "让我们一起来阅读：洪志远太强了",
            "readContent": "洪志远太强了",
            "bonus": "20",
            "finishedCount": 0,
            "createDate": "2019-02-25T08:35:54.595Z",
            "done": true,
            "finishDate": "2019-02-25T08:40:11.595Z",
            "recordDone": false,
            "status": 1
        }
    }
    ```

-   上传录音

    -   POST
    -   URL `./upload`
    -   请求头
        -   Content-Type
            -   multipart/form-data
        -   Authorization
            -   登录时获得的 token
            -   必须已经登录才能上传录音
    -   field
        -   attach
            -   上传的文件
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为 String，附件的 ID，需要保留
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": "5c73dced3c66210f3c527558"
    }
    ```

-   下载录音

    -   GET
    -   URL `./record/download/${id}`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
        -   Authorization
            -   登录时获得的 token
    -   请求体
        将\${id}替换为对应的录音 Id 即可
    -   返回值
        -   如果获取成功，则直接下载文件
        -   如果失败
            -   code
                -   Number
                -   一定是-1
            -   msg
                -   失败原因，为 String

-   标注提交

    -   POST
    -   URL `./record/commit`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
        -   Authorization
            -   登录时获得的 token
            -   必须已经登录
    -   请求体
        -   tid
            -   String
            -   任务 id
        -   points
            -   Array<Item>
            -   标注坐标信息
                -   每个 Item 的结构如下
                -   begin
                    -   Number
                    -   开始的时间
                -   end
                    -   Number
                    -   结束的时间
                -   text
                    -   String
                    -   标注的内容
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为该数据库储存的新 Id
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": "5c73a8eae5033a4b80a4f460"
    }
    ```

-   录音审核

    -   POST
    -   URL `./record/check`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
        -   Authorization
            -   登录时获得的 token
            -   必须拥有管理员权限
    -   请求体
        -   id
            -   String
            -   提交的 ID
        -   status
            -   审核状态
            -   -1 状态变更为失败
            -   0 状态变更为未审核
            -   1 状态变更为审核成功，并且赠送金币
    -   注意
        -   如果已经审核、或者重复提交相同状态的审核，会返回错误提示
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为该数据库储存的新 Id
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1
    }
    ```

-   标注审核

    -   POST
    -   URL `./record/check`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
        -   Authorization
            -   登录时获得的 token
            -   必须拥有管理员权限
    -   请求体
        -   rid
            -   String
            -   标注的 ID
        -   status
            -   审核状态
            -   -1 状态变更为失败
            -   0 状态变更为未审核
            -   1 状态变更为审核成功，并且赠送金币
    -   注意
        -   如果已经审核、或者重复提交相同状态的审核，会返回错误提示
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为该数据库储存的新 Id
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1
    }
    ```

-   任务的录音列表

    -   GET
    -   URL `./task/record/${tid}/${page}`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
        -   Authorization
            -   登录时获得的 token
    -   请求体
        -   将\${tid}替换为对应的任务 Id
        -   将\${page}替换为页码，从 1 开始
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为 Object
            -   如果获取失败，为失败原因，为 String
            -   关于 `status` 状态问题
                -   只有提交过才会显示 `status` 参数
                -   审核中 0
                -   审核成功 1
                -   审核失败 -1
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": {
            "list": [
                {
                    "_id": "5c73a8eae5033a4b80a4f460",
                    "uid": "5c73a8eae5033a4b80a4f977",
                    "tid": "5c73a8eae5033a4b80a9b855",
                    "status": "1",
                    "points": [{ "begin": 1.2, "end": 2.4, "text": "洪" }, { "begin": 2.4, "end": 2.9, "text": "志" }],
                    "time": "2019-02-25T08:35:54.595Z"
                }
            ],
            "count": 1
        }
    }
    ```

-   个人仪表盘

    -   GET
    -   URL `./user/dashboard`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
        -   Authorization
            -   登录时获得的 token
    -   请求体
        无
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为 Object
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": {
            "task": {
                "waiting": 2,
                "ok": 4,
                "failed": 1,
                "total": 7
            },
            "record": {
                "waiting": 2,
                "ok": 4,
                "failed": 1,
                "total": 7
            }
        }
    }
    ```

-   我的提交过的录音列表

    -   GET
    -   URL `./user/tasks/${page}`
        -   将 page 替换为页码数，从 1 开始
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为 Object
                -   count
                    -   Number
                    -   所有的任务总数，用于计算分页（PAGESIZE）
                -   list
                    -   Array<Item>
                    -   当前页面每一个任务的简略信息（brief infomation）
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": {
            "list": [
                {
                    "_id": "5c73a8eae5033a4b80a4f460",
                    "content": "让我们一起来阅读：洪志远太强了",
                    "readContent": "洪志远太强了",
                    "bonus": "20",
                    "finishedCount": 0,
                    "createDate": "2019-02-25T08:35:54.595Z",
                    "done": true,
                    "finishDate": "2019-02-25T08:40:11.595Z",
                    "recordDone": false,
                    "status": 1
                }
            ],
            "count": 1
        }
    }
    ```

-   我的提交过的标注列表

    -   GET
    -   URL `./user/records/${page}`
        -   将 page 替换为页码数，从 1 开始
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为 Object
                -   count
                    -   Number
                    -   所有的任务总数，用于计算分页（PAGESIZE）
                -   list
                    -   Array<Item>
                    -   当前页面每一个任务的简略信息（brief infomation）
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": {
            "list": [
                {
                    "_id": "5c73a8eae5033a4b80a4f460",
                    "uid": "5c73a8eae5033a4b80a4f977",
                    "tid": "5c73a8eae5033a4b80a9b855",
                    "status": "1",
                    "points": [{ "begin": 1.2, "end": 2.4, "text": "洪" }, { "begin": 2.4, "end": 2.9, "text": "志" }],
                    "time": "2019-02-25T08:35:54.595Z"
                }
            ],
            "count": 1
        }
    }
    ```

-   获取用户的头像

    -   GET
    -   URL `./user/avatar/${uid}`
        -   将 uid 替换为用户的 id
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
    -   返回值
        -   如果获取成功，直接可以下载文件
        -   如果获取失败
            -   code
                -   Number
                -   一定是-1
            -   msg
                -   失败理由

-   修改用户的头像

-   POST

    -   URL `./avatar`
    -   请求头
        -   Content-Type
            -   multipart/form-data
        -   Authorization
            -   登录时获得的 token
            -   必须已经登录才能上传录音
    -   field
        -   avatar
            -   上传的头像
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，不包含该字段
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1
    }
    ```

### HUST_SWEET 部署文档 docker，可轻松利用 k8s、rancher 等实现扩展、负载均衡

-   部署 docker-compose up -d

### redis 锁机制，减少数据竞争
