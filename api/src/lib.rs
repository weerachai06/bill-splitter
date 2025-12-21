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
    // For Cloudflare Workers, true streaming with server-side delays
    // is challenging due to WASM limitations.
    // The best approach is to send data immediately or use client-side delays.

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
