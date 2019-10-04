# Express (Starter Kit 04)

> A template to start using express

## <a name="contents"></a> Contents
 - [Dependencies](#dependencies)
 - [Feature](#feature)
 - [Prerequisite](#prerequisite)
 - [Installation](#installation)
 - [Usage](#usage)

## <a name="dependencies"></a> Dependencies
- [express](https://github.com/expressjs/express)
- [mongoose](https://github.com/Automattic/mongoose)
- [cors](https://github.com/expressjs/cors)
- [http-status](https://github.com/alexsasharegan/http-status)

## <a name="feature"></a> Feature

1.  authorization

## <a name="prerequisite"></a> Prerequisite

Docker mongo at port `27017`:  
```
docker run -d --name mongo -p 27017:27017 mongo
```
PM2
```
npm install -g pm2
```

## <a name="installation"></a> Installation

Install dependencies
```
npm install --save
```

Used following local setting for `.env` file:  
```
PORT=3000
MONGO_URL=mongodb://localhost:27017/express04
```
## <a name="usage"></a> Usage
Test server locally
```
npm start
```

Routes:

- `GET /user` - get all users
- `POST /user` - create a user
- `GET /user/:userId` - get a user
- `PATCH /user/:userId` - update a user
- `DELETE /user/:userId` - delete a user

## Table
These are example table for `README.md`

| Example | Description | Usage |
| ------- | ----------- | ----- |
| `Ex01` | Desc 01 | Test |
| `Ex02` | Desc 02 | Test |

> **Note:** This README.me can be use as guideline
```javascript
module.exports = {
  'Example': {

  }
}
```