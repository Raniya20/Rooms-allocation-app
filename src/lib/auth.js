    // src/lib/auth.ts
    import { jwtVerify } from 'jose';
    

    export async function verifyAuth(req) {
       const token =  getToken(req);

      if(!token) {
         return { error : "Missing Token"}
        }


      try {
        const verified = await jwtVerify(
          token,
          new TextEncoder().encode(process.env.JWT_SECRET)
        );
         // console.log('Verified Payload', verified.payload)
        return { user };
      } catch (error) {
        console.error("Token verification failed:", error);
        return { error: "Token is invalid" };
      }
    }


    function getToken(req) {
        try {
         if(req){
            const authHeader = req.headers.get("Authorization");

            if (authHeader && authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7);
             }
             return undefined
            }

        const cookieString = document.cookie;
        const cookies = cookieString.split(';').reduce((acc, cookie) => {
           const [key, value] = cookie.trim().split('=');
           acc[key] = value;
           return acc;
            }, {} );

        return cookies.token;
    } catch (e){
        return undefined
    }
    }
