/** @param {{request: Request}} context */
export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const { method, params, id } = body;

    let result;

    switch (method) {
      case "tools/list":
        result = {
          tools: [
            {
              name: "fetch_reviews",
              description: "Fetch customer reviews and testimonials for Optikal Bahari.",
              inputSchema: {
                type: "object",
                properties: {
                  limit: { type: "integer", description: "Number of reviews to fetch", default: 10 }
                }
              }
            },
            {
              name: "get_site_info",
              description: "Get detailed information about Optikal Bahari's services.",
              inputSchema: { type: "object", properties: {} }
            }
          ]
        };
        break;

      case "tools/call":
        const { name, arguments: args } = params;
        if (name === "fetch_reviews") {
          const reviewsResponse = await fetch(new URL("/api/reviews.json", request.url).toString());
          const reviews = await reviewsResponse.json();
          const limit = args?.limit || 10;
          result = {
            content: [{ type: "text", text: JSON.stringify(reviews.slice(0, limit), null, 2) }]
          };
        } else if (name === "get_site_info") {
          const infoResponse = await fetch(new URL("/llms.txt", request.url).toString());
          const info = await infoResponse.text();
          result = {
            content: [{ type: "text", text: info }]
          };
        } else {
          return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } }), {
            headers: { "Content-Type": "application/json" }
          });
        }
        break;

      case "resources/list":
        result = { resources: [] };
        break;

      case "prompts/list":
        result = { prompts: [] };
        break;

      default:
        return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } }), {
          headers: { "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" } }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
