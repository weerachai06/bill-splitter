use std::time::Duration;

use actix_web::{
    get, http::StatusCode, middleware::ErrorHandlers, web, App, Error, HttpResponse, HttpServer,
    Responder, Result,
};

use futures::{future::ok, stream::once};
use serde_json::json;

#[get("/hello/{name}")]
async fn greet(name: web::Path<String>) -> impl Responder {
    format!("Hello {name}!")
}

#[get("/stream-delay")]
async fn stream_delay() -> HttpResponse {
    let tick_duration = Duration::from_millis(10);

    let body = async_stream::stream! {
        for i in 0..1000 {
            actix_web::rt::time::sleep(tick_duration).await;
            yield Ok::<_, Error>(web::Bytes::from(format!("data: {}\n\n", i)));
        }
    };

    HttpResponse::Ok()
        .content_type("text/event-stream")
        .streaming(body)
}

#[get("/stream")]
async fn my_stream() -> HttpResponse {
    let body = once(ok::<_, Error>(web::Bytes::from_static(b"test")));

    HttpResponse::Ok()
        .content_type("application/json")
        .streaming(body)
}

fn generic_error_handler<B>(
    res: actix_web::dev::ServiceResponse<B>,
) -> Result<actix_web::middleware::ErrorHandlerResponse<B>> {
    let status_code = res.status();
    let (error_message, description) = match status_code {
        StatusCode::NOT_FOUND => ("Not Found", "The requested resource was not found"),
        StatusCode::INTERNAL_SERVER_ERROR => {
            ("Internal Server Error", "An unexpected error occurred")
        }
        StatusCode::BAD_REQUEST => ("Bad Request", "The request was invalid"),
        _ => ("Error", "An error occurred"),
    };

    let response = HttpResponse::build(status_code).json(json!({
        "error": error_message,
        "message": description,
        "status": status_code.as_u16()
    }));

    Ok(actix_web::middleware::ErrorHandlerResponse::Response(
        res.into_response(response.map_into_right_body()),
    ))
}
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(greet)
            .service(my_stream)
            .service(stream_delay)
            .wrap(
                ErrorHandlers::new()
                    .handler(StatusCode::NOT_FOUND, generic_error_handler)
                    .handler(StatusCode::INTERNAL_SERVER_ERROR, generic_error_handler),
            )
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
