
const API_KEY="123456";
export default {
  async fetch(request, env) {
    const tasks = [];
    let url = new URL(request.url);
    const path = url.pathname;

    const authHeader = request.headers.get("authorization") || request.headers.get("x-api-key");
    const apiKey = authHeader?.startsWith("Bearer ")  ? authHeader.slice(7)  : null;

    if (API_KEY && apiKey !== API_KEY) {

      return new Response(JSON.stringify({
        error: {
            message: "Invalid API key. Use 'Authorization: Bearer your-api-key' header",
            type: "invalid_request_error",
            param: null,
            code: "invalid_api_key"
        }
      }), {
          status: 401,
          headers: {
              "Content-Type": "application/json",
          }
      });
    }

    if (path === "/v1/chat/completions") {
      const requestBody = await request.json();
       // messages - chat style input
      let chat = {
        messages: requestBody
      };
      let response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', requestBody);
      tasks.push({ inputs: chat, response });
      return new Response(JSON.stringify(Response.json(tasks)), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Allow CORS
        },
      });
    }
  }
};

return new Response(JSON.stringify(aiResponse), {
    status: 200,
    headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Allow CORS
    },
});