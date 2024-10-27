# Overview

Web app to compare steam libraries

# Libraries
- Frontend
    - React
    - Typescript
    - Steam API: https://partner.steamgames.com/doc/webapi
- Backend
    - Python
    - Flask



## Note
- Assume 2 servers Frontend: 127.0.0.1:3000 and Backend:127.0.0.1; When endpoints are being called from Frontend to Backend, make sure: 
    - CORS is enabled on the backend server
    - if Cookies are being involved, make sure to allow credentials in the backend server and to include credentials on the frontend server.  