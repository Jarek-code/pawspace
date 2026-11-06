//! Salida por consola: colores cuando hay terminal, tablas alineadas y JSON.

use std::io::IsTerminal;

/// Si el usuario admite color.
fn con_color() -> bool {
    std::env::var_os("NO_COLOR").is_none() && std::io::stdout().is_terminal()
}

fn pintar(codigo: &str, texto: &str) -> String {
    if con_color() {
        format!("\u{1b}[{codigo}m{texto}\u{1b}[0m")
    } else {
        texto.to_string()
    }
}

/// Texto en negrita.
pub fn negrita(texto: &str) -> String {
    pintar("1", texto)
}

/// Texto atenuado, para pistas.
pub fn tenue(texto: &str) -> String {
    pintar("2", texto)
}

/// Cabecera de sección.
pub fn titulo(texto: &str) -> String {
    pintar("1;36", texto)
}

/// Confirmación.
pub fn ok(texto: &str) {
    println!("{} {texto}", pintar("32", "✔"));
}

/// Aviso que no impide seguir.
pub fn aviso(texto: &str) {
    println!("{} {texto}", pintar("33", "!"));
}

/// Error, por la salida de error.
pub fn error(texto: &str) {
    eprintln!("{} {texto}", pintar("31", "✖"));
}

/// Pares «clave: valor» alineados.
pub fn clave_valor(pares: &[(&str, String)]) {
    let ancho = pares
        .iter()
        .map(|(clave, _)| clave.chars().count())
        .max()
        .unwrap_or(0);
    for (clave, valor) in pares {
        println!("{} {}", negrita(&format!("{clave:<ancho$}")), valor);
    }
}

/// Tabla con cabecera y separador.
pub fn tabla(cabeceras: &[&str], filas: &[Vec<String>]) {
    let mut anchos: Vec<usize> = cabeceras.iter().map(|c| c.chars().count()).collect();
    for fila in filas {
        for (indice, celda) in fila.iter().enumerate() {
            if let Some(ancho) = anchos.get_mut(indice) {
                *ancho = (*ancho).max(celda.chars().count());
            }
        }
    }
    let unir = |celdas: Vec<String>| celdas.join("  ");
    let cabecera: Vec<String> = cabeceras
        .iter()
        .enumerate()
        .map(|(indice, celda)| negrita(&rellenar(celda, anchos[indice])))
        .collect();
    println!("{}", unir(cabecera));
    let linea: Vec<String> = anchos.iter().map(|ancho| "─".repeat(*ancho)).collect();
    println!("{}", tenue(&unir(linea)));
    for fila in filas {
        let celdas: Vec<String> = fila
            .iter()
            .enumerate()
            .map(|(indice, celda)| rellenar(celda, *anchos.get(indice).unwrap_or(&0)))
            .collect();
        println!("{}", unir(celdas));
    }
}

fn rellenar(texto: &str, ancho: usize) -> String {
    let largo = texto.chars().count();
    format!("{texto}{}", " ".repeat(ancho.saturating_sub(largo)))
}
