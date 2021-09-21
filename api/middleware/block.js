

const verifyBlock = (req, res, next) => {
    if(req.USER.blocked){
        res.status(403).send('You are blocked by the admin. Check your email for further details');
    }
    else{
        next();
    }
    
};

module.exports = verifyBlock;
