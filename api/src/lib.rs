use serde::{Deserialize, Serialize};
use worker::*;

#[derive(Debug, Deserialize, Serialize)]
struct GenericResponse {
    status: u16,
    message: String,
}

#[event(fetch)]
async fn main(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    Router::new()
        .get_async("/foo", handle_get)
        .post_async("/bar", handle_post)
        .delete_async("/baz", handle_delete)
        .get_async("/stream", handle_stream)
        .get_async("/ai", |_req, ctx| {
            let env = ctx.env.clone();
            async move {
                let ai_response = get_ai_response(env).await?;
                Response::from_json(&GenericResponse {
                    status: 200,
                    message: ai_response,
                })
            }
        })
        .run(req, env)
        .await
}

pub async fn handle_get(_: Request, _ctx: RouteContext<()>) -> worker::Result<Response> {
    Response::from_json(&GenericResponse {
        status: 200,
        message: "You reached a GET route!".to_string(),
    })
}

pub async fn handle_post(_: Request, _ctx: RouteContext<()>) -> worker::Result<Response> {
    Response::from_json(&GenericResponse {
        status: 200,
        message: "You reached a POST route!".to_string(),
    })
}

pub async fn handle_delete(_: Request, _ctx: RouteContext<()>) -> worker::Result<Response> {
    Response::from_json(&GenericResponse {
        status: 200,
        message: "You reached a DELETE route!".to_string(),
    })
}

pub async fn handle_stream(_: Request, _ctx: RouteContext<()>) -> worker::Result<Response> {
    let chunks = (1..=5)
        .map(|i| {
            worker::console_log!("Generated chunk {}", i);
            format!("data: Message #{} arrived\n\n", i)
        })
        .collect::<String>();

    let headers = worker::Headers::new();
    headers.set("Content-Type", "text/event-stream")?;
    headers.set("Cache-Control", "no-cache")?;
    headers.set("Connection", "keep-alive")?;
    headers.set("Access-Control-Allow-Origin", "*")?;

    Ok(Response::ok(chunks)?.with_headers(headers))
}

// ...existing code...

pub async fn get_ai_response(env: Env) -> worker::Result<String> {
    // Get environment variables with better error handling
    let account_id = match env.var("CLOUDFLARE_ACCOUNT_ID") {
        Ok(val) => val.to_string(),
        Err(_) => {
            return Ok("Error: CLOUDFLARE_ACCOUNT_ID environment variable not set".to_string())
        }
    };

    let api_token = match env.var("CLOUDFLARE_API_TOKEN") {
        Ok(val) => val.to_string(),
        Err(_) => return Ok("Error: CLOUDFLARE_API_TOKEN environment variable not set".to_string()),
    };

    let url = format!(
        "https://api.cloudflare.com/client/v4/accounts/{}/ai/run/@cf/meta/llama-3.1-8b-instruct",
        account_id
    );

    let payload = serde_json::json!({
        "prompt": "Where did the phrase Hello World come from"
    });

    let headers = Headers::new();
    headers.set("Authorization", &format!("Bearer {}", api_token))?;
    headers.set("Content-Type", "application/json")?;

    let mut request = RequestInit::new();
    request.with_method(Method::Post);
    request.with_headers(headers);
    request.with_body(Some(wasm_bindgen::JsValue::from_str(&payload.to_string())));

    let request = Request::new_with_init(&url, &request)?;
    let mut response = Fetch::Request(request).send().await?;

    if response.status_code() == 200 {
        let response_text = response.text().await?;

        // Parse the JSON response
        match serde_json::from_str::<serde_json::Value>(&response_text) {
            Ok(json) => {
                // Try to extract the result from the response
                if let Some(result) = json.get("result") {
                    if let Some(response_text) = result.get("response").and_then(|v| v.as_str()) {
                        Ok(response_text.to_string())
                    } else {
                        Ok(format!("AI Response: {}", result))
                    }
                } else {
                    Ok(format!("Full API Response: {}", json))
                }
            }
            Err(_) => Ok(response_text),
        }
    } else {
        let error_text = response.text().await?;
        Ok(format!(
            "API request failed with status {}: {}",
            response.status_code(),
            error_text
        ))
    }
}
