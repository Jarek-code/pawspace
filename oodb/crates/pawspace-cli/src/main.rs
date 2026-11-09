//! CLI de la OODB de PawSpace.

mod cli;
mod fuente;
mod salida;

use clap::Parser;

fn main() -> std::process::ExitCode {
    match cli::ejecutar(cli::Args::parse()) {
        Ok(()) => std::process::ExitCode::SUCCESS,
        Err(error) => {
            salida::error(&error);
            std::process::ExitCode::from(1)
        }
    }
}
