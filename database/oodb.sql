-- PAWSPACE - APOYO A LA OODB DE ADJUNTOS
--
-- Este archivo crea la cola de pendientes y los
-- disparadores que la alimnnenttan. Se aplica una vez, como root.
--
--     docker compose exec -T spider mariadb -uroot -p"$DB_ROOT_PASSWORD" \
--         < database/oodb.sql

CREATE TABLE IF NOT EXISTS oodb_pendientes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tabla VARCHAR(16) NOT NULL,
    registro_id BIGINT UNSIGNED NOT NULL,
    accion ENUM('ANCLAR','BORRAR') NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    aplicado_en DATETIME NULL,

    CONSTRAINT pk_oodb_pendientes
        PRIMARY KEY (id),

    INDEX idx_oodb_pendientes (aplicado_en, id)
) ENGINE=InnoDB;