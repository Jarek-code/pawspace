//! Arranque del servicio HTTP.

use std::sync::Arc;
use std::time::Duration;

use pawspace_servicio::config::Config;
use pawspace_servicio::mariadb::MariaDb;
use pawspace_servicio::revision;
use pawspace_servicio::{Estado, Relacional, SinRelacional, router};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config::desde_entorno()?;
    let db = oodb::Db::abrir(&config.ruta)?;
    let relacional: Arc<dyn Relacional> = match &config.base {
        Some(url) => {
            let adaptador = MariaDb::conectar(url)?;
            if let Err(error) = adaptador.asegurar_esquema() {
                eprintln!(
                    "aviso: no se pudo crear la tabla del outbox ({error}); aplica database/oodb.sql como root"
                );
            }
            Arc::new(adaptador)
        }
        None => Arc::new(SinRelacional),
    };
    let estado = Estado::nuevo(
        db,
        Arc::clone(&relacional),
        config.token.clone(),
        config.archivos.clone(),
        config.publica.clone(),
    );

    if config.intervalo > 0 {
        let estado = estado.clone();
        let intervalo = config.intervalo;
        tokio::spawn(async move {
            let mut reloj = tokio::time::interval(Duration::from_secs(intervalo));
            loop {
                reloj.tick().await;
                let relacional = estado.relacional();
                let base = estado.base();
                let resultado = tokio::task::spawn_blocking(move || {
                    let mut db = base.lock().map_err(|_| {
                        pawspace_servicio::Error::Relacional("almacén bloqueado".into())
                    })?;
                    revision::revisar(&mut db, relacional.as_ref())
                })
                .await;
                match resultado {
                    Ok(Ok(informe)) if informe.borrados + informe.aplicadas > 0 => {
                        println!("revisión: {informe:?}");
                    }
                    Ok(Ok(_)) => {}
                    Ok(Err(error)) => eprintln!("revisión fallida: {error}"),
                    Err(error) => eprintln!("revisión interrumpida: {error}"),
                }
            }
        });
    }

    let direccion = format!("{}:{}", config.host, config.puerto);
    let escucha = tokio::net::TcpListener::bind(&direccion).await?;
    println!(
        "pawspace-oodb-servicio en http://{direccion} · almacén {} · MariaDB {}",
        config.ruta.display(),
        if config.base.is_some() {
            "conectada"
        } else {
            "sin conexión"
        }
    );
    axum::serve(escucha, router(estado)).await?;
    Ok(())
}
