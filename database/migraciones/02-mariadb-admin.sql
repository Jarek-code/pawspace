-- PAWSPACE - MIGRACION 02 - CUENTAS DE ADMINISTRACION
--
-- Se aplica sobre el nodo maestro (dn_a), despues de 01-mariadb.sql.
--
--     docker exec -i pawspace-dn-a mariadb -uroot -p"$DB_ROOT_PASSWORD" \
--         < database/migraciones/02-mariadb-admin.sql
--
-- El rol vive en USUARIO porque se lee en cada peticion del panel; las columnas
-- de atribucion dicen quien resolvio cada caso.

USE pawspace;


-- AYUDAS DE MIGRACION

DROP PROCEDURE IF EXISTS sp_migracion_fk;

DELIMITER //

CREATE PROCEDURE sp_migracion_fk
(
    IN p_tabla VARCHAR(64),
    IN p_nombre VARCHAR(64),
    IN p_definicion TEXT
)
BEGIN
    IF (SELECT COUNT(*) FROM information_schema.table_constraints
         WHERE constraint_schema = DATABASE()
           AND table_name = p_tabla
           AND constraint_name = p_nombre) = 0 THEN
        SET @ddl = CONCAT('ALTER TABLE ', p_tabla,
                          ' ADD CONSTRAINT ', p_nombre, ' ', p_definicion);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DELIMITER ;


-- USUARIO

ALTER TABLE USUARIO
    ADD COLUMN IF NOT EXISTS rol ENUM(
        'TUTOR',
        'MODERADOR',
        'SOPORTE',
        'EDITOR',
        'ADMIN'
    ) NOT NULL DEFAULT 'TUTOR' AFTER plan;

CREATE INDEX IF NOT EXISTS idx_usuario_rol ON USUARIO (rol);


-- REPORTE

ALTER TABLE REPORTE
    ADD COLUMN IF NOT EXISTS resuelto_por_usuario_id BIGINT UNSIGNED NULL
        AFTER resolucion;

CREATE INDEX IF NOT EXISTS idx_reporte_resolutor
    ON REPORTE (resuelto_por_usuario_id);

CALL sp_migracion_fk('REPORTE', 'fk_reporte_resolutor',
    'FOREIGN KEY (resuelto_por_usuario_id) REFERENCES USUARIO(id)
     ON UPDATE CASCADE ON DELETE SET NULL');


-- REPORTE_APELACION

ALTER TABLE REPORTE_APELACION
    ADD COLUMN IF NOT EXISTS resuelto_por_usuario_id BIGINT UNSIGNED NULL
        AFTER resolucion;

CREATE INDEX IF NOT EXISTS idx_ra_resolutor
    ON REPORTE_APELACION (resuelto_por_usuario_id);

CALL sp_migracion_fk('REPORTE_APELACION', 'fk_ra_resolutor',
    'FOREIGN KEY (resuelto_por_usuario_id) REFERENCES USUARIO(id)
     ON UPDATE CASCADE ON DELETE SET NULL');


-- AYUDA_ARTICULO

ALTER TABLE AYUDA_ARTICULO
    ADD COLUMN IF NOT EXISTS autor_usuario_id BIGINT UNSIGNED NULL
        AFTER estado;

CREATE INDEX IF NOT EXISTS idx_aa_autor
    ON AYUDA_ARTICULO (autor_usuario_id);

CALL sp_migracion_fk('AYUDA_ARTICULO', 'fk_aa_autor',
    'FOREIGN KEY (autor_usuario_id) REFERENCES USUARIO(id)
     ON UPDATE CASCADE ON DELETE SET NULL');


-- PRIMERA CUENTA DE ADMINISTRACION

-- Cambiar por la cuenta que administra el panel. Si el correo no existe, el
-- UPDATE no hace nada y la comprobacion del final lo deja ver.
SET @admin_email = 'ana@example.com';

UPDATE USUARIO
   SET rol = 'ADMIN'
 WHERE email = @admin_email
   AND eliminada_en IS NULL;


DROP PROCEDURE IF EXISTS sp_migracion_fk;


-- COMPROBACION

SELECT id, nombre, email, rol, activo
  FROM USUARIO
 WHERE rol <> 'TUTOR'
 ORDER BY rol, id;

SELECT COUNT(*) AS columnas_de_atribucion
  FROM information_schema.columns
 WHERE table_schema = DATABASE()
   AND column_name IN ('resuelto_por_usuario_id', 'autor_usuario_id')
   AND table_name IN ('REPORTE', 'REPORTE_APELACION', 'AYUDA_ARTICULO');
