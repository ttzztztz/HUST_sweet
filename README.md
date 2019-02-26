# HUST_SWEET 后端接口文档

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
            -   电子邮箱
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
            -   用户名
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
                    "createDate": "2019-02-25T08:35:54.595Z"
                }
            ],
            "count": 1
        }
    }
    ```

-   任务详情

    -   GET
    -   URL `./task/commit`
    -   请求头
        -   Content-Type
            -   application/x-www-form-urlencoded
        -   Authorization
            -   登录时获得的 token
            -   必须已经登录
    -   返回值
        -   code
            -   Number
            -   状态信息
            -   1 为成功，其余均为失败
        -   msg
            -   如果获取成功，为 空（不含该字段）
            -   如果获取失败，为失败原因，为 String
    -   样例输出

    ```json
    {
        "code": 1,
        "msg": "5c73a8eae5033a4b80a4f460"
    }
    ```

-   任务提交

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

### HUST_SWEET 部署文档 docker，可轻松利用 k8s、rancher 等实现扩展、负载均衡

-   部署 docker-compose up -d

### redis 锁机制，减少数据竞争
