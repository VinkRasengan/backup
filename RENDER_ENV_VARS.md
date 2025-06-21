# 🔑 ENVIRONMENT VARIABLES FOR RENDER DASHBOARD

## 📋 Copy these EXACT values to API Gateway service on Render:

NODE_ENV=production
ALLOWED_ORIGINS=https://frontend-eklp.onrender.com,https://backup-zhhs.onrender.com,https://factcheck-frontend.onrender.com
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-factcheck-microservices-2024
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9ThjEoNlmvc1G\n3KmKda7H9SgaT9BGSL8tMI6DPcBJGOOWPCGGWaIFCUFzrivVf1IMHp6evPZ5HxYW\nejOA4VjJIJJDsaeMoMMED0NiPAC1nGJfOWzMHoBBPvZccDPBdeZDR/kvi3aIupHy\nsF/9VLgjkfyBYGCxJzyCWOfNamuVp1pViE0MD6DY5aw1WTQvIfVtCgauZ0lFIGjQ\nibsSkN4wWOup49mq4nEuHYK26coTmDUTaiamrAFYynLrnNprvA2JgAoZISw2e30m\nYSsjEWENcXahS4bUrCYrOOyZHgvR1XeQ9eaCAo5elhvM9dfZfXaOgL5ZTVTR7GCp\nMc/hYbvhAgMBAAECggEACOZReN/RmkhgWXO/y7wQt++99cJPubIrVk6vvU2x18eC\nBMepN58vCqFFNx2wPvgFBzLvhNAM672EpN3HXi7mvrcXitoUCElsvNwSPRDL/SQp\ncseCgCeLiSW44GuM+PKLEGaWkv/k1kFxLmS3PcCiuVdgZ91JIAlgb9KJ4uKDkgEI\niGXbRBdX3+lnRIEqB1JPYk/ZUBXqgf/gt24gpZAVv0ET6jpTcyc/4zdPMd9xPOfZ\nblqx4teHAIHoAzAFRGhuDus1I1L8QBe/Y3jjYynkacV0D89aOvIJfR5+HScnoQnw\n/HK+4B090lYDNE+QPFXPdp8LLoHxrfg5GqDKYypULQKBgQD5uLfI/gulpMQSV73T\nM+Jifk1ix9LZxYV+6htjpzoUBlvLshuwXfotfT3dott3/xjMMCJhfWaf/SVGjenc\nXJiCGIGp+TlEKthiPnBxQcA41yq437g9X7dgwoeJP2PmEJrYKM9M7gKO9dVSOZig\npRnR9WGnWAx7GNoU6ekTzUMRzQKBgQDCEIU3NvLH1n8V793/GaOP8IZSvKe0TpR1\n5CaWjyB1D7wglABn5ItAbrsxZ2hEapQYgOSeAs/21vf9e9p61+OsVQQ0Hkihxm7O\nesFuaSCAmbpRnpPHKWXrFK8CTr3EeanChmvk0GIY7XSDTkMVp1JhpZrbu8sWAsdz\nsBIwnjyOZQKBgBYwGmxKXkCOfjlfAGfGoWO88yVGue5NhYn8RQi6sAdddUSJA7rM\n7tCh4yBROwzTZqGl2TguSzMF7AzzyQaiV46fnM28biEnaWh5QcZeYDTssUgR4K3b\nVlDLl/1S245yhT+ViK2+LA4Fu7l9kpkbckrccZvLz/gUAjR/gA0ZXM81AoGAAXyK\n6K9dELbN5mcd9jRGEnYvMTcMuc7YSEblHMYf44WpVT6M+j6/6lBu0qQOImgGlmF2\nXtd6rFNdNu3Z8JLyxYEpNRT+TW7trls2XBgmDZYf3TwvuZjRlQllhckAnx6ndDv/\nW5NVDQfUmqTg0qujb+gK1aAMoDCJQpOYsBKmOBkCgYEA2FLpCjAdzggQ0lgqUKAg\nMqlWkwzPXc2bX7LESv2j4z9acpigcnyeYiX/r0lcC3RDoQYXEmnPOsZwYHk/6dQq\n6BuTSI2d0Ate1sRqV9sBNEtNThUf16ltgSmPZ4tfLVs8ZMN/unvjjOOEzkOWU0fW\nEBQnrBKraXzzY0AzgveHhUg=\n-----END PRIVATE KEY-----\n"
AUTH_SERVICE_URL=https://factcheck-auth.onrender.com
LINK_SERVICE_URL=https://factcheck-link.onrender.com
COMMUNITY_SERVICE_URL=https://factcheck-community.onrender.com
CHAT_SERVICE_URL=https://factcheck-chat.onrender.com
NEWS_SERVICE_URL=https://factcheck-news.onrender.com
ADMIN_SERVICE_URL=https://factcheck-admin.onrender.com
CRIMINALIP_SERVICE_URL=https://factcheck-criminalip.onrender.com
PHISHTANK_SERVICE_URL=https://factcheck-phishtank.onrender.com

## 🌐 For Frontend service on Render:

NODE_ENV=production
REACT_APP_API_URL=https://backup-zhhs.onrender.com
REACT_APP_FIREBASE_API_KEY=AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE
REACT_APP_FIREBASE_AUTH_DOMAIN=factcheck-1d6e8.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=factcheck-1d6e8

## 🚨 CRITICAL STEPS:

1. **API Gateway Service** - Go to Environment tab and add ALL variables above
2. **Frontend Service** - Go to Environment tab and add Frontend variables
3. **Deploy both services** after adding environment variables
4. **Check API Gateway health**: https://backup-zhhs.onrender.com/health

## ⚠️ IMPORTANT NOTES:

- The FIREBASE_PRIVATE_KEY must include the quotes and \n characters exactly as shown
- ALLOWED_ORIGINS is the most critical - it MUST include your frontend domain
- After adding env vars, you MUST redeploy the services

## 🔍 DEBUG STEPS if CORS still fails:

1. Check API Gateway logs on Render for CORS errors
2. Test API Gateway directly: https://backup-zhhs.onrender.com/info
3. Verify environment variables are actually set in Render dashboard
