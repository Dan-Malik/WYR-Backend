const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const token = req.header('x-auth-token');

    if (!token) {

        res.status(401).send({ message: "No token - unauthorized to access resource!" });

    }

    try {

        req.user = jwt.verify(token, process.env.JWT_SECRET);

    } catch (e) {

        return res.status(400).send({ message: "Invalid token!" })

    }

    next();
}

module.exports = auth;