#!/usr/bin/env python3
"""Genera el SQL de la base de datos distribuida de PawSpace."""

import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ESQUEMA = os.path.join(RAIZ, "database", "schema.sql")
SALIDA = os.path.join(RAIZ, "database", "distribuida")

SIN_EDITAR = "GENERADO por devops/scripts/generar_sql.py -- no editar a mano"

NOMBRE_BD = "pawspace"

# Direcciones fijas dentro de la red red_bd (docker-compose.yml).
IPS = {"spider": "172.30.0.10", "dn_a": "172.30.0.11", "dn_b": "172.30.0.12",
       "rep_a": "172.30.0.13", "rep_b": "172.30.0.14"}

# Usuario con el que los nodos se conectan entre si.
USUARIO_REPL = "repl"
CLAVE_REPL = "replpw"

# ESPECIFICACION DE LA DISTRIBUCION

# HORIZONTAL: tablas fragmentadas por la paridad del dueno.
FRAGMENTADAS = [
    ("ME_GUSTA_PUBLICACION", "mascota_id"),    # el like que da una mascota
    ("ME_GUSTA_COMENTARIO", "mascota_id"),     # el like a un comentario
    ("ME_GUSTA_HISTORIA", "mascota_id"),       # el like a una historia
    ("HISTORIA_VISTA", "mascota_id"),          # la mascota que ve la historia
    ("NOTIFICACION", "destinatario_id"),       # la mascota que la recibe
]

# VERTICAL: satelites 1:1 con la misma clave primaria, mas una vista de lectura.
CORTES = [
    # (padre, satelite, columnas que se mueven, motivo)
    ("USUARIO", "USUARIO_CREDENCIALES", ["contrasena_hash"],
     "sensibilidad: el hash no debe viajar en cada listado de usuarios"),
    ("MASCOTA", "MASCOTA_PERFIL", ["biografia", "foto_perfil_url"],
     "columnas frias, de tamano variable, que no se filtran ni se ordenan"),
    ("PUBLICACION", "PUBLICACION_TEXTO", ["texto"],
     "el TEXT del post: la fila caliente del feed deja de arrastrarlo"),
]

# REPLICACION
PARCIAL = ("dn_b", "dn_a", "parcial")
TOTALES = [("rep_a", "dn_a"), ("rep_b", "dn_b")]

# PROCEDIMIENTOS del nodo spider para escribir en las tablas fragmentadas.
PROCEDIMIENTOS_H = [
    ("ME_GUSTA_PUBLICACION", "mascota_id", ["publicacion_id"], True, None),
    ("ME_GUSTA_COMENTARIO", "mascota_id", ["comentario_id"], True, None),
    ("ME_GUSTA_HISTORIA", "mascota_id", ["historia_id"], True, None),
    # HISTORIA_VISTA no tiene id propio: su clave es (historia_id, mascota_id).
    # Volver a ver la misma historia solo actualiza la fecha, no duplica la fila.
    ("HISTORIA_VISTA", "mascota_id", ["historia_id"], False,
     "ON DUPLICATE KEY UPDATE vista_en = NOW()"),
    ("NOTIFICACION", "destinatario_id",
     ["actor_id", "tipo", "publicacion_id", "comentario_id", "historia_id"],
     True, None),
]


# LECTURA DEL ESQUEMA

def leer_esquema(ruta):
    """Devuelve ([nombre, bloque], cola)."""
    with open(ruta, encoding="utf-8") as fh:
        lineas = fh.read().split("\n")

    tablas, i, ultimo_fin = [], 0, None
    while i < len(lineas):
        m = re.match(r"^CREATE TABLE (\w+) \($", lineas[i])
        if not m:
            i += 1
            continue
        bloque, i = [lineas[i]], i + 1
        while i < len(lineas) and not lineas[i].startswith(") ENGINE="):
            bloque.append(lineas[i])
            i += 1
        bloque.append(lineas[i])
        ultimo_fin = i
        i += 1
        tablas.append((m.group(1), bloque))
    cola = lineas[ultimo_fin + 1:] if ultimo_fin is not None else []
    return tablas, cola


def partir_entradas(bloque):
    """Separa el cuerpo de un CREATE TABLE en entradas (columnas y restricciones)."""
    entradas, actual, nivel = [], None, 0
    for ln in bloque[1:-1]:
        if ln.strip() == "":
            continue
        if actual is None:
            actual = [ln]
        elif re.match(r"^    \S", ln) and nivel == 0:
            entradas.append(actual)
            actual = [ln]
        else:
            actual.append(ln)
        nivel += ln.count("(") - ln.count(")")
    if actual:
        entradas.append(actual)
    return entradas


def clase(entrada):
    t = " ".join(entrada).upper()
    if "FOREIGN KEY" in t:
        return "fk"
    if "PRIMARY KEY" in t:
        return "pk"
    if "UNIQUE" in t:
        return "unique"
    if "CHECK" in t:
        return "check"
    if re.match(r"^(INDEX|KEY|FULLTEXT|SPATIAL)\b", entrada[0].strip(), re.I):
        return "index"
    return "col"


def nombre_columna(entrada):
    return entrada[0].strip().split()[0]


def columnas_de_pk(entrada):
    m = re.search(r"PRIMARY KEY\s*\(([^)]*)\)", " ".join(entrada), re.I)
    return [c.strip() for c in m.group(1).split(",")] if m else []


def emitir(cabecera, entradas, cola, comentario=None):
    """Reconstruye el CREATE TABLE con las comas bien puestas."""
    cuerpo = []
    for k, e in enumerate(entradas):
        cuerpo.append("\n".join(e).rstrip().rstrip(",") +
                      ("," if k < len(entradas) - 1 else ""))
    salida = cabecera + "\n" + "\n".join(cuerpo) + "\n" + cola
    if comentario:
        salida += "\n  COMMENT='%s'" % comentario
    return salida + ";"


class Tabla:
    def __init__(self, nombre, bloque):
        self.nombre = nombre
        self.bloque = bloque
        self.entradas = partir_entradas(bloque)

    @property
    def cola(self):
        return self.bloque[-1]

    @property
    def pk(self):
        for e in self.entradas:
            if clase(e) == "pk":
                return e
        raise SystemExit("%s no tiene PRIMARY KEY" % self.nombre)

    @property
    def pk_columnas(self):
        """Columnas de la clave primaria."""
        return columnas_de_pk(self.pk)

    @property
    def columnas(self):
        return [nombre_columna(e) for e in self.entradas if clase(e) == "col"]

    def columna(self, nombre):
        for e in self.entradas:
            if clase(e) == "col" and nombre_columna(e) == nombre:
                return e
        return None

    def tipo_de(self, columna):
        # Ojo con la coma: el token es "AUTO_INCREMENT," y hay que quitarsela
        # antes de comparar, o el satelite se quedaria con AUTO_INCREMENT.
        toks = [t for t in " ".join(self.columna(columna)).split()[1:]
                if t.upper().rstrip(",") != "AUTO_INCREMENT"]
        return " ".join(toks).rstrip(",")

    def tipo_parametro(self, columna):
        """El tipo de una columna, sin los modificadores."""
        toks = []
        for t in self.tipo_de(columna).split():
            if t.upper() in ("NOT", "NULL", "DEFAULT", "AUTO_INCREMENT",
                             "ON", "UPDATE", "COMMENT"):
                break
            toks.append(t)
        tipo = " ".join(toks).rstrip(",")
        # El ENUM del esquema viene en varias lineas: se junta y se quitan los
        # espacios que deja el salto de linea.
        return re.sub(r"ENUM\( ", "ENUM(", re.sub(r" \)", ")", tipo))

    def columnas_obligatorias(self):
        """Las columnas que hay que dar al crear una fila: NOT NULL y sin."""
        fuera = []
        for e in self.entradas:
            if clase(e) != "col":
                continue
            texto = " ".join(e).upper()
            if "AUTO_INCREMENT" in texto or "PRIMARY KEY" in texto:
                continue
            if "NOT NULL" in texto and "DEFAULT" not in texto:
                fuera.append(nombre_columna(e))
        return fuera

    def sin_columnas(self, columnas):
        return [e for e in self.entradas
                if not (clase(e) == "col" and nombre_columna(e) in columnas)]

    def solo_columnas_y_pk(self, quitar=()):
        return [e for e in self.sin_columnas(quitar) if clase(e) in ("col", "pk")]

    def pk_ampliada(self, dueno):
        """Anade el dueno a la clave primaria."""
        columnas = self.pk_columnas
        if dueno in columnas:
            return self.entradas
        nombre = re.search(r"CONSTRAINT\s+(\S+)", self.pk[0]).group(1)
        nueva = ("    CONSTRAINT %s\n        PRIMARY KEY (%s)"
                 % (nombre, ", ".join(columnas + [dueno]))).split("\n")
        return [nueva if e is self.pk else e for e in self.entradas]


def filas_vertical(padre, satelite, columnas, motor, comentario=None, con_fk=True):
    """DDL de un satelite vertical."""
    clave = padre.nombre.lower() + "_id"
    l = ["CREATE TABLE %s (" % satelite,
         "    %s %s," % (clave, padre.tipo_de(padre.pk_columnas[0]))]
    for c in columnas:
        l.append("    " + " ".join(padre.columna(c)).strip().rstrip(",") + ",")
    l.append("    CONSTRAINT pk_%s" % satelite.lower())
    if con_fk:
        l.append("        PRIMARY KEY (%s)," % clave)
        l += ["    CONSTRAINT fk_%s_%s" % (satelite.lower(), padre.nombre.lower()),
              "        FOREIGN KEY (%s)" % clave,
              "        REFERENCES %s(%s)" % (padre.nombre, padre.pk_columnas[0]),
              "        ON UPDATE CASCADE",
              "        ON DELETE CASCADE"]
    else:
        l.append("        PRIMARY KEY (%s)" % clave)
    l.append(") ENGINE=%s" % motor)
    if comentario:
        l.append("  COMMENT='%s'" % comentario)
    return "\n".join(l) + ";"


PLANTILLA_DISPARADOR = """CREATE TRIGGER {trigger}
BEFORE {evento} ON {tabla}
FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(255);

    IF MOD(NEW.{dueno}, 2) <> {paridad} THEN
        SET msg = CONCAT(
            'fragmento incorrecto: {tabla}.{dueno}=', NEW.{dueno},
            ': este nodo ({nodo}) solo acepta duenos {que}; los ',
            IF(MOD(NEW.{dueno}, 2) = 0, 'PAR', 'IMPAR'), ' van a {otro}');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END//"""


def disparadores_paridad(nombre, dueno, paridad, nodo):
    """Los dos disparadores (INSERT y UPDATE) que defienden la paridad del nodo."""
    que = "PAR" if paridad == 0 else "IMPAR"
    otro = "dn_b" if paridad == 0 else "dn_a"
    partes = []
    for evento in ("INSERT", "UPDATE"):
        partes.append(PLANTILLA_DISPARADOR.format(
            trigger="trg_%s_%s_%s" % (nombre.lower(), que.lower(), evento.lower()),
            evento=evento, tabla=nombre, dueno=dueno, paridad=paridad,
            nodo=nodo, que=que, otro=otro))
    return "\n\n".join(partes)


def escribir(ruta_relativa, contenido):
    ruta = os.path.join(SALIDA, ruta_relativa)
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as fh:
        fh.write(contenido.rstrip("\n") + "\n")
    print("  database/distribuida/%-46s %7d bytes" % (ruta_relativa, len(contenido)))


# DATOS DE EJEMPLO

ESPECIES = ["Perro", "Gato", "Conejo", "Ave"]
RAZAS = [(1, "Labrador Retriever"), (1, "Pastor Aleman"), (1, "Mestizo"),
         (2, "Siames"), (2, "Persa"), (2, "Comun Europeo"),
         (3, "Enano"), (4, "Periquito")]
USUARIOS = [("Ana Garcia", "ana@example.com"),
            ("Luis Perez", "luis@example.com"),
            ("Marta Ruiz", "marta@example.com")]
MASCOTAS = [("Rocky", "rocky", 1, 1, "M", "2021-05-10"),
            ("Michi", "michi", 2, 4, "F", "2022-03-02"),
            ("Nube", "nube", 3, 7, "F", "2023-01-20"),
            ("Kira", "kira", 1, 2, "F", "2020-11-15")]
PERFILES = ["Le encanta correr y nadar.", "Gata tranquila, muy dormilona.",
            "Coneja curiosa.", "Pastora alemana guardian."]
TEXTOS = ["Primer dia en el parque", "Siesteando al sol",
          "Carrera con los amigos", "Mi juguete nuevo", "Tarde de lluvia",
          "Paseo por el rio", "Merendando", "Dormido en el sofa"]
FRAGMENTO_FILAS = {"ME_GUSTA_PUBLICACION": 12, "ME_GUSTA_COMENTARIO": 10,
                   "ME_GUSTA_HISTORIA": 8, "HISTORIA_VISTA": 12,
                   "NOTIFICACION": 14}


def filas_fragmento(nombre, cuantas):
    """Filas de una tabla fragmentada: (id, dueno, columna_ajena)."""
    return [(k + 1, (k % 4) + 1, (k // 4) + 1) for k in range(cuantas)]


def insert(destino, columnas, filas, fila_fmt):
    cuerpo = ",\n    ".join(fila_fmt(f) for f in filas)
    return "INSERT INTO %s (%s) VALUES\n    %s;\n" % (destino, columnas, cuerpo)


def datos_dn_a():
    l = ["-- NODO dn_a - DATOS DE EJEMPLO",
         "-- %s" % SIN_EDITAR,
         "",
         "USE %s;" % NOMBRE_BD,
         "",
         "-- Catalogos",
         ""]
    l.append(insert("ESPECIE", "id, nombre", list(enumerate(ESPECIES, 1)),
                    lambda f: "(%d, '%s')" % f))
    l.append(insert("RAZA", "id, especie_id, nombre", list(enumerate(RAZAS, 1)),
                    lambda f: "(%d, %d, '%s')" % (f[0], f[1][0], f[1][1])))
    l.append("-- ---------------------------------------------------------------------------"
             "\n-- Usuarios. Corte vertical 1: contrasena_hash vive en USUARIO_CREDENCIALES"
             "\n-- ---------------------------------------------------------------------------\n")
    l.append(insert("USUARIO", "id, nombre, email", list(enumerate(USUARIOS, 1)),
                    lambda f: "(%d, '%s', '%s')" % (f[0], f[1][0], f[1][1])))
    l.append(insert("USUARIO_CREDENCIALES", "usuario_id, contrasena_hash",
                    list(enumerate(USUARIOS, 1)),
                    lambda f: "(%d, 'CAMBIA_ESTO_hash_de_prueba_%d')" % (f[0], f[0])))
    l.append("-- ---------------------------------------------------------------------------"
             "\n-- Mascotas: son el DUENO de la fragmentacion. Los ids 1 y 3 son impares"
             "\n-- (van a dn_b), los ids 2 y 4 son pares (van a dn_a)."
             "\n-- Corte vertical 2: biografia y foto_perfil_url viven en MASCOTA_PERFIL"
             "\n-- ---------------------------------------------------------------------------\n")
    l.append(insert("MASCOTA",
                    "id, nombre, nombre_usuario, especie_id, raza_id, sexo, fecha_nacimiento",
                    list(enumerate(MASCOTAS, 1)),
                    lambda f: "(%d, '%s', '%s', %d, %d, '%s', '%s')"
                    % (f[0], f[1][0], f[1][1], f[1][2], f[1][3], f[1][4], f[1][5])))
    l.append(insert("MASCOTA_PERFIL", "mascota_id, biografia, foto_perfil_url",
                    list(enumerate(PERFILES, 1)),
                    lambda f: "(%d, '%s', '/img/mascota%d.jpg')" % (f[0], f[1], f[0])))
    l.append(insert("USUARIO_MASCOTA", "usuario_id, mascota_id",
                    [(1, 1), (1, 4), (2, 2), (3, 3)], lambda f: "(%d, %d)" % f))
    l.append("-- ---------------------------------------------------------------------------"
             "\n-- Contenido"
             "\n-- Corte vertical 3: el texto del post vive en PUBLICACION_TEXTO"
             "\n-- ---------------------------------------------------------------------------\n")
    l.append(insert("PUBLICACION", "id, mascota_id, creado_en",
                    [(i, (i % 4) + 1) for i in range(1, 9)],
                    lambda f: "(%d, %d, '2026-01-%02d 10:00:00')" % (f[0], f[1], f[0])))
    l.append(insert("PUBLICACION_TEXTO", "publicacion_id, texto",
                    list(enumerate(TEXTOS, 1)), lambda f: "(%d, '%s')" % f))
    l.append(insert("COMENTARIO", "id, publicacion_id, mascota_id, texto, creado_en",
                    [(i, (i % 8) + 1, (i % 4) + 1) for i in range(1, 11)],
                    lambda f: "(%d, %d, %d, 'Comentario %d', '2026-01-%02d 11:00:00')"
                    % (f[0], f[1], f[2], f[0], f[0])))
    l.append(insert("HISTORIA", "id, mascota_id, creado_en, vence_en",
                    [(i, (i % 4) + 1) for i in range(1, 7)],
                    lambda f: "(%d, %d, '2026-02-%02d 08:00:00', '2026-02-%02d 20:00:00')"
                    % (f[0], f[1], f[0], f[0])))
    l.append("-- ---------------------------------------------------------------------------"
             "\n-- El fragmento de dn_a: SOLO duenos PARES"
             "\n-- ---------------------------------------------------------------------------\n")
    l.extend(bloque_fragmento(0))
    return "\n".join(l)


def datos_dn_b():
    l = ["-- NODO dn_b - DATOS DE EJEMPLO",
         "-- %s" % SIN_EDITAR,
         "",
         "USE %s;" % NOMBRE_BD,
         "",
         "-- Comprobacion de que la replicacion ya trajo lo que hace falta:",
         "SELECT COUNT(*) AS tablas_replicadas_que_necesitan_los_fragmentos",
         "  FROM information_schema.tables",
         " WHERE table_schema = '%s'" % NOMBRE_BD,
         "   AND table_name IN ('MASCOTA','PUBLICACION','COMENTARIO','HISTORIA');",
         "",
         "-- El fragmento de dn_b: SOLO duenos IMPARES",
         ""]
    l.extend(bloque_fragmento(1))
    return "\n".join(l)


def bloque_fragmento(paridad):
    """Los INSERT de la mitad de los fragmentos que le toca a una paridad."""
    cual = "PAR" if paridad == 0 else "IMPAR"
    l = []
    for nombre, dueno in FRAGMENTADAS:
        todas = filas_fragmento(nombre, FRAGMENTO_FILAS[nombre])
        mias = [f for f in todas if f[1] % 2 == paridad]
        ajeno = {"ME_GUSTA_PUBLICACION": "publicacion_id",
                 "ME_GUSTA_COMENTARIO": "comentario_id",
                 "ME_GUSTA_HISTORIA": "historia_id",
                 "HISTORIA_VISTA": "historia_id",
                 "NOTIFICACION": "publicacion_id"}[nombre]
        l.append("-- %s: dueno %s -> %d de las %d filas"
                 % (nombre, dueno, len(mias), len(todas)))
        if not mias:
            l.append("-- (esta paridad no tiene filas de %s)" % nombre)
            l.append("")
            continue
        if nombre == "HISTORIA_VISTA":
            l.append(insert(nombre, "historia_id, mascota_id, vista_en", mias,
                            lambda f: "(%d, %d, '2026-02-%02d 09:00:00')"
                            % (f[2], f[1], f[0])))
        elif nombre == "NOTIFICACION":
            l.append(insert(nombre,
                            "id, destinatario_id, actor_id, tipo, publicacion_id, creado_en",
                            mias,
                            lambda f: "(%d, %d, %d, 'LIKE_PUBLICACION', %d, '2026-02-%02d 09:00:00')"
                            % (f[0], f[1], (f[1] % 4) + 1, f[2], f[0])))
        else:
            l.append(insert(nombre, "id, %s, %s" % (dueno, ajeno), mias,
                            lambda f: "(%d, %d, %d)" % (f[0], f[1], f[2])))
    l.append("-- ---------------------------------------------------------------------------")
    l.append("-- Comprobacion: lo que hay en ESTE nodo (los fragmentos son %s)" % cual)
    l.append("-- ---------------------------------------------------------------------------\n")
    l.append("SELECT '%s' AS fragmento, COUNT(*) AS filas FROM %s"
             % (FRAGMENTADAS[0][0], FRAGMENTADAS[0][0]))
    for nombre, _ in FRAGMENTADAS[1:]:
        l.append("UNION ALL SELECT '%-22s', COUNT(*) FROM %s" % (nombre, nombre))
    l.append("UNION ALL SELECT 'MASCOTA (replicada)', COUNT(*) FROM MASCOTA")
    l.append("UNION ALL SELECT 'PUBLICACION (replicada)', COUNT(*) FROM PUBLICACION")
    l.append(";")
    return l


# PROCEDIMIENTOS DEL NODO SPIDER

def procedimiento(nombre, parametros, cuerpo, comentario):
    """Texto de un CREATE PROCEDURE, con sus parametros y su cuerpo."""
    l = []
    if comentario:
        l += [comentario]
    l.append("CREATE PROCEDURE %s" % nombre)
    l.append("(\n" + ",\n".join("    " + p for p in parametros) + "\n)")
    l.append(cuerpo.rstrip().rstrip(";") + ";")
    return "\n".join(l)


def procedimientos_vertical(tablas):
    """Los tres procedimientos que escriben en padre y satelite a la vez."""
    fuera = []
    for padre, satelite, columnas, motivo in CORTES:
        p = tablas[padre]
        # La clave del satelite se llama <padre>_id y es la misma que la del
        # padre: es una relacion 1:1.
        clave = padre.lower() + "_id"
        # Las columnas que se fueron al satelite NO se insertan en el padre: en
        # el esquema logico estan, pero el corte ya las movio de tabla.
        propias = [c for c in p.columnas_obligatorias() if c not in columnas]
        parametros = ["IN p_%s %s" % (c, p.tipo_parametro(c))
                      for c in propias + columnas]
        parametros.append("OUT p_id BIGINT UNSIGNED")
        cuerpo = (
            "BEGIN\n"
            "    -- Corte vertical: la fila vive en dos tablas y las dos escrituras\n"
            "    -- van juntas. Se escribe en la tabla del dato y en su satelite.\n"
            "    INSERT INTO %s (%s)\n"
            "    VALUES (%s);\n"
            "    SET p_id = LAST_INSERT_ID();\n"
            "    INSERT INTO %s (%s, %s)\n"
            "    VALUES (p_id%s);\n"
            "END"
            % (padre, ", ".join(propias),
               ", ".join("p_%s" % c for c in propias),
               satelite, clave, ", ".join(columnas),
               "".join(", p_%s" % c for c in columnas)))
        fuera.append((
            "sp_%s_crear" % padre.lower(), parametros, cuerpo,
            "-- %s + %s   (%s)\n-- %s" % (padre, satelite,
                                           ", ".join(columnas), motivo)))
    return fuera


def sql_procedimientos(tablas):
    l = ["-- NODO SPIDER - PROCEDIMIENTOS ALMACENADOS",
         "-- %s" % SIN_EDITAR,
         "",
         "USE %s;" % NOMBRE_BD,
         "",
         "-- 1. FRAGMENTACION HORIZONTAL",
         "",
         "DELIMITER //",
         ""]
    for nombre, dueno, otros, id_salida, extra in PROCEDIMIENTOS_H:
        t = tablas[nombre]
        cols = [dueno] + [c for c in otros if c != dueno]
        parametros = ["IN p_%s %s" % (c, t.tipo_parametro(c)) for c in cols]
        if id_salida:
            parametros.append("OUT p_id BIGINT UNSIGNED")
        valores = ", ".join("p_%s" % c for c in cols)
        cuerpo = ("BEGIN\n"
                  "    -- No se dice a que nodo va: lo decide la particion.\n"
                  "    INSERT INTO %s (%s) VALUES (%s)%s;\n"
                  "%s"
                  "END" % (nombre, ", ".join(cols), valores,
                           "\n    " + extra if extra else "",
                           "    SET p_id = LAST_INSERT_ID();\n" if id_salida else ""))
        l.append(procedimiento(
            "sp_%s" % nombre.lower(), parametros, cuerpo,
            "-- %s   (dueno = %s)" % (nombre, dueno)))
        l.append("//")
        l.append("")
    l += ["DELIMITER ;",
          "",
          "-- 2. FRAGMENTACION VERTICAL",
          "",
          "DELIMITER //",
          ""]
    for nombre, parametros, cuerpo, comentario in procedimientos_vertical(tablas):
        l.append(procedimiento(nombre, parametros, cuerpo, comentario))
        l.append("//")
        l.append("")
    l += ["DELIMITER ;",
          "",
          "-- 3. COMO SE USAN",
          ""]
    return "\n".join(l)


# MAIN

def main():
    if not os.path.exists(ESQUEMA):
        sys.exit("no encuentro el esquema: %s" % ESQUEMA)
    brutas, cola = leer_esquema(ESQUEMA)
    orden = [n for n, _ in brutas]
    tablas = {n: Tabla(n, b) for n, b in brutas}

    frag = [t for t, _ in FRAGMENTADAS]
    faltan = [t for t in frag if t not in tablas]
    if faltan:
        sys.exit("no estan en el esquema: %s" % faltan)
    for padre, _, cols, _ in CORTES:
        for c in cols:
            if tablas[padre].columna(c) is None:
                sys.exit("columna inexistente: %s.%s" % (padre, c))

    print("esquema : %s" % ESQUEMA)
    print("salida  : %s" % SALIDA)
    print("tablas  : %d   fragmentadas: %d   cortes verticales: %d"
          % (len(orden), len(frag), len(CORTES)))
    print()

    replicadas = [n for n in orden if n not in frag]
    quitadas = {padre: cols for padre, _, cols, _ in CORTES}
    print("esquema replicado: %d tablas + %d satelites = %d objetos"
          % (len(replicadas), len(CORTES), len(replicadas) + len(CORTES)))
    print()

    # ------------------------------------------------------------- datos
    escribir("nodo-datos/04-datos-dn_a.sql", datos_dn_a())
    escribir("nodo-datos/04-datos-dn_b.sql", datos_dn_b())

    # --------------------------------------------------- esquema de dn_a
    l = ["-- NODO dn_a - ESQUEMA REPLICADO (maestro de las tablas replicadas)",
         "-- %s" % SIN_EDITAR,
         ""]
    for padre, sat, cols, motivo in CORTES:
        l.append("--     %-12s -> %-21s (%s)" % (padre, sat, ", ".join(cols)))
        l.append("--       %s" % motivo)
    l += ["--",
          "",
          "DROP DATABASE IF EXISTS %s;" % NOMBRE_BD,
          "",
          "CREATE DATABASE %s" % NOMBRE_BD,
          "    CHARACTER SET utf8mb4",
          "    COLLATE utf8mb4_unicode_ci;",
          "",
          "USE %s;" % NOMBRE_BD,
          ""]
    for n in replicadas:
        q = quitadas.get(n, [])
        if q:
            l.append("-- %s: sin %s (viven en el satelite vertical)" % (n, ", ".join(q)))
        l.append(emitir("CREATE TABLE %s (" % n, tablas[n].sin_columnas(q),
                        tablas[n].cola))
        l.append("")
    for padre, sat, cols, motivo in CORTES:
        l += ["-- Satelite vertical: %s  <-  %s(%s)" % (sat, padre, ", ".join(cols)),
              ""]
        l.append(filas_vertical(tablas[padre], sat, cols, "InnoDB"))
        l.append("")
    l += ["-- Cola literal del schema.sql original",
          "",
          "\n".join(cola).strip("\n")]
    escribir("nodo-datos/01-esquema-replicado.sql", "\n".join(l))

    # ------------------------------------------------------- fragmentos
    l = ["-- NODOS DE DATOS (dn_a y dn_b) - FRAGMENTOS HORIZONTALES",
         "-- %s" % SIN_EDITAR,
         "",
         "USE %s;" % NOMBRE_BD,
         ""]
    for n, dueno in FRAGMENTADAS:
        pk = tablas[n].pk_columnas
        l += ["-- %s   dueno = %s" % (n, dueno)]
        if dueno in pk:
            l.append("--   la PK original (%s) ya incluye %s: no cambia" % (", ".join(pk), dueno))
        else:
            l.append("--   PRIMARY KEY (%s)  ->  PRIMARY KEY (%s)"
                     % (", ".join(pk), ", ".join(pk + [dueno])))
        l += ["-- ---------------------------------------------------------------------------", "",
              emitir("CREATE TABLE %s (" % n, tablas[n].pk_ampliada(dueno),
                     tablas[n].cola),
              ""]
    escribir("nodo-datos/02-fragmentos.sql", "\n".join(l))

    # -------------------------------------------- disparadores de paridad
    for nodo, paridad in (("dn_a", 0), ("dn_b", 1)):
        l = ["-- NODO %s - DISPARADORES DE PARIDAD" % nodo.upper(),
             "-- %s" % SIN_EDITAR,
             "",
             "USE %s;" % NOMBRE_BD,
             "",
             "DELIMITER //",
             ""]
        for n, dueno in FRAGMENTADAS:
            l.append(disparadores_paridad(n, dueno, paridad, nodo))
            l.append("")
        l.append("DELIMITER ;")
        escribir("nodo-datos/03-triggers-paridad-%s.sql" % nodo, "\n".join(l))

    # ------------------------------------------- nodo spider: replicadas
    l = ["-- NODO SPIDER - TABLAS REPLICADAS VISTAS DESDE EL NODO SPIDER",
         "-- %s" % SIN_EDITAR,
         "",
         "USE %s;" % NOMBRE_BD,
         ""]
    for n in replicadas:
        q = quitadas.get(n, [])
        if q:
            l.append("-- %s: sin %s (viven en el satelite vertical)" % (n, ", ".join(q)))
        l.append(emitir("CREATE TABLE %s (" % n, tablas[n].solo_columnas_y_pk(q),
                        ") ENGINE=SPIDER", comentario='wrapper "mysql", srv "dn_a"'))
        l.append("")
    escribir("nodo-spider/01-esquema-spider.sql", "\n".join(l))

    # ------------------------------------------ nodo spider: horizontal
    l = ["-- NODO SPIDER - FRAGMENTACION HORIZONTAL",
         "-- %s" % SIN_EDITAR,
         "",
         "USE %s;" % NOMBRE_BD,
         ""]
    for n, dueno in FRAGMENTADAS:
        t = tablas[n]
        cols = t.columnas
        # La clave de fragmento tiene que estar en la clave primaria TAMBIEN aqui:
        # MariaDB exige que toda clave unica incluya la funcion de particion.
        con_pk_ampliada = [e for e in t.pk_ampliada(dueno) if clase(e) != "fk"]
        cols_pk = t.pk_columnas if dueno in t.pk_columnas else t.pk_columnas + [dueno]
        solo_columnas = [e for e in t.entradas if clase(e) == "col"]
        solo_columnas.append(["    PRIMARY KEY (%s)" % ", ".join(cols_pk)])
        # El COMMENT del nodo spider va delante; las particiones, detras.
        tabla_particionada = emitir(
            "CREATE TABLE %s (" % n, con_pk_ampliada, ") ENGINE=SPIDER",
            comentario='wrapper "mysql", table "%s"' % n).replace(
                ";", "\nPARTITION BY HASH (%s)\n(\n"
                     "    PARTITION p0 COMMENT = 'srv \"dn_a\", table \"%s\"',\n"
                     "    PARTITION p1 COMMENT = 'srv \"dn_b\", table \"%s\"'\n);"
                     % (dueno, n, n))
        l += ["-- %s   (dueno = %s)" % (n, dueno),
              "",
              "-- 1) La tabla de uso normal: particionada por la paridad del dueno.",
              "--    p0 = MOD(%s,2)=0 -> dn_a    p1 = MOD(%s,2)=1 -> dn_b" % (dueno, dueno),
              tabla_particionada,
              ""]
        for sufijo, srv in (("NODO_A", "dn_a"), ("NODO_B", "dn_b")):
            l += ["-- 2) Solo la mitad de %s." % srv,
                  emitir("CREATE TABLE %s_%s (" % (n, sufijo), solo_columnas,
                         ") ENGINE=SPIDER",
                         comentario='wrapper "mysql", srv "%s", table "%s"' % (srv, n)),
                  ""]
        l += ["-- 3) La tabla original reconstruida.",
              "CREATE OR REPLACE VIEW %s_GLOBAL AS" % n,
              "SELECT %s FROM %s_NODO_A" % (", ".join(cols), n),
              "UNION ALL",
              "SELECT %s FROM %s_NODO_B;" % (", ".join(cols), n),
              ""]
    escribir("nodo-spider/02-horizontal.sql", "\n".join(l))

    # --------------------------------------------- nodo spider: vertical
    l = ["-- NODO SPIDER - FRAGMENTACION VERTICAL",
         "-- %s" % SIN_EDITAR,
         "",
         "USE %s;" % NOMBRE_BD,
         ""]
    vistas = []
    for padre, sat, cols, motivo in CORTES:
        p = tablas[padre]
        l += ["-- %s  <-  %s(%s)" % (sat, padre, ", ".join(cols)),
              ""]
        l.append(filas_vertical(p, sat, cols, "SPIDER", con_fk=False,
                                comentario='wrapper "mysql", srv "dn_a"'))
        l.append("")
        vistas.append((padre, sat, cols, padre.lower() + "_id"))
    l += ["-- Vistas de conveniencia: se lee como antes de fragmentar",
          ""]
    for padre, sat, cols, clave in vistas:
        p = tablas[padre]
        calientes = [c for c in p.columnas if c not in cols]
        l += ["CREATE OR REPLACE VIEW v%s AS" % padre,
              "SELECT %s," % ", ".join("p.%s" % c for c in calientes),
              "         %s" % ",\n         ".join("s.%s" % c for c in cols),
              "  FROM %s p" % padre,
              "  LEFT JOIN %s s ON s.%s = p.%s;" % (sat, clave, p.pk_columnas[0]),
              ""]
    escribir("nodo-spider/03-vertical.sql", "\n".join(l))

    # ----------------------------------------- nodo spider: procedimientos
    escribir("nodo-spider/05-procedimientos.sql", sql_procedimientos(tablas))

    # ------------------------------------------------ replicacion: parcial
    lista_filtros = "\n".join(
        "--     replicate-ignore-table = %s.%s" % (NOMBRE_BD, n) for n, _ in FRAGMENTADAS)
    l = ["-- REPLICACION ASINCRONA PARCIAL:  dn_a  ->  dn_b",
         "-- %s" % SIN_EDITAR,
         lista_filtros,
         "",
         "-- Arranca desde el principio del binlog: MASTER_LOG_FILE='' y MASTER_LOG_POS=0.",
         "",
         "CHANGE MASTER TO",
         "  MASTER_HOST='%s'," % IPS["dn_a"],
         "  MASTER_PORT=3306,",
         "  MASTER_USER='%s'," % USUARIO_REPL,
         "  MASTER_PASSWORD='%s'," % CLAVE_REPL,
         "  MASTER_LOG_FILE='',",
         "  MASTER_LOG_POS=0,",
         "  MASTER_CONNECT_RETRY=5;",
         "",
         "START SLAVE;",
         "",
         "-- Quien es este nodo y a quien sigue:",
         "SELECT @@server_id AS server_id, @@read_only AS solo_lectura;",
         "SHOW SLAVE STATUS\\G"]
    escribir("replicacion/dn_b-replica-parcial.sql", "\n".join(l))

    # --------------------------------------------------- replicacion: total
    for nodo, maestro in TOTALES:
        l = ["-- REPLICACION ASINCRONA TOTAL:  %s  ->  %s" % (maestro, nodo),
             "-- %s" % SIN_EDITAR,
             ""]
        if nodo == "rep_b":
            l += ["-- OJO: rep_b NO sigue a dn_a directamente, sigue a dn_b.", ""]
        l += ["-- Arranca desde el principio del binlog del maestro.",
              "",
              "CHANGE MASTER TO",
              "  MASTER_HOST='%s'," % IPS[maestro],
              "  MASTER_PORT=3306,",
              "  MASTER_USER='%s'," % USUARIO_REPL,
              "  MASTER_PASSWORD='%s'," % CLAVE_REPL,
              "  MASTER_LOG_FILE='',",
              "  MASTER_LOG_POS=0,",
              "  MASTER_CONNECT_RETRY=5;",
              "",
              "START SLAVE;",
              "",
              "SELECT @@server_id AS server_id, @@read_only AS solo_lectura;",
              "SHOW SLAVE STATUS\\G"]
        escribir("replicacion/%s-replica-total.sql" % nodo, "\n".join(l))

    print("\nlisto.")


if __name__ == "__main__":
    main()
