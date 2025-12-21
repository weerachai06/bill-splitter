use axum::{routing::get, Router};
use tokio_stream::StreamExt;
use tower_service::Service;
use worker::{ok::Ok, *};

fn router() -> Router {
    Router::new().route("/", get(root))
}

#[event(fetch)]
async fn fetch(
    req: HttpRequest,
    _env: Env,
    _ctx: Context,
) -> Result<axum::http::Response<axum::body::Body>> {
    Ok(router().call(req).await?)
}

pub async fn root() -> axum::body::Body {
    let stream = tokio_stream::iter(vec![0, 1, 2, 3, 4, 5])
        .map(|i| format!("Chunk {}\n", i))
        .map(|s| std::result::Result::<_, std::io::Error>::Ok(s.into_bytes()));

    axum::body::Body::from_stream(stream)
}
