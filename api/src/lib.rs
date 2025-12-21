use worker::*;

mod utils;

fn log_request(req: &Request) {
    console_log!(
        "{} - [{}], located at: {:?}, within: {}",
        Date::now().to_string(),
        req.path(),
        req.cf().coordinates().unwrap_or_default(),
        req.cf().region().unwrap_or_else(|| "unknown region".into())
    );
}

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: worker::Context) -> Result<Response> {
    log_request(&req);
    utils::set_panic_hook();

    let router = Router::new();

    router
        .get("/", |_, _| Response::ok("Hello from Bill Splitter API!"))
        .get("/api/health", |_, _| {
            Response::from_json(&serde_json::json!({
                "status": "healthy",
                "service": "bill-splitter-api",
                "timestamp": Date::now().to_string(),
                "version": "0.1.0"
            }))
        })
        .get("/api/ping", |_, _| Response::ok("pong"))
        .run(req, env)
        .await
}
