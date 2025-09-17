import{validateToken} from "../Service/auth.js"

export default function checkForAuthenticationCookie(cookieName){
    return (req,res, next)=>{
        const tokenCookieValue = req.cookies[cookieName];
        if(!tokenCookieValue){
          return  next();
        }

        try {
            const userPayload = validateToken(tokenCookieValue);
            req.user = userPayload;
        } catch (error) {
        }
       return next();
    }
}
export function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
}
