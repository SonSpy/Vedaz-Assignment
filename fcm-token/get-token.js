const { GoogleAuth } = require("google-auth-library");
const path = require("path");

async function getAccessToken() {
  const keyPath = path.join("C:/Users/KIIT/Downloads/pushnoti-55e82-356efdec86a8.json");

  const auth = new GoogleAuth({
    keyFile: keyPath,
    scopes: "https://www.googleapis.com/auth/firebase.messaging",
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  console.log("Access Token:\n", accessToken.token);
}

getAccessToken().catch(console.error);
