

function hasRole(role){
    return async function (req, res, next) {
      if(role !== req.USER.userType){
          res.status(403).send("permission denied")
      }
      else{
        next();
      }
    };
}
module.exports = hasRole;