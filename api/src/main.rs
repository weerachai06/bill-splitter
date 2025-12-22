use actix_web::{
    get, http::StatusCode, middleware::ErrorHandlers, web, App, HttpResponse, HttpServer,
    Responder, Result,
};
use serde_json::json;

#[get("/hello/{name}")]
async fn greet(name: web::Path<String>) -> impl Responder {
    format!("Hello {name}!")
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
        App::new().service(greet).wrap(
            ErrorHandlers::new()
                .handler(StatusCode::NOT_FOUND, generic_error_handler)
                .handler(StatusCode::INTERNAL_SERVER_ERROR, generic_error_handler),
        )
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
