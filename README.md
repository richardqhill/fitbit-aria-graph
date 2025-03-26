## Fitbit Weight Graph

I got annoyed that Google stopped providing a web dashboard to view scale weigh-ins, instead forcing users to use the Fitbit app.

Here's a next.js app that lets you view your weigh-ins

TODO:  
[] deploy to vercel  
[] better webpage styling  
[] use fitbit log route to get actual values instead of trendline (database?)  

## Getting Started
Create your fitbit app at https://dev.fitbit.com/apps/  

Redirect URL format:
`http://localhost:3000/api/auth/callback/fitbit`

## .env file
```bash
FITBIT_CLIENT_ID=XXXXX
FITBIT_CLIENT_SECRET=XXXXX
NEXTAUTH_SECRET=XXXXX
```  


