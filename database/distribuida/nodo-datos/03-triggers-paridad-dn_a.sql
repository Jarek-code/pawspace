-- NODO DN_A - DISPARADORES DE PARIDAD
-- GENERADO por devops/scripts/generar_sql.py -- no editar a mano

USE pawspace;

DELIMITER //

CREATE TRIGGER trg_me_gusta_publicacion_par_insert
BEFORE INSERT ON ME_GUSTA_PUBLICACION
FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(255);

    IF MOD(NEW.mascota_id, 2) <> 0 THEN
        SET msg = CONCAT(
            'fragmento incorrecto: ME_GUSTA_PUBLICACION.mascota_id=', NEW.mascota_id,
            ': este nodo (dn_a) solo acepta duenos PAR; los ',
            IF(MOD(NEW.mascota_id, 2) = 0, 'PAR', 'IMPAR'), ' van a dn_b');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END//

CREATE TRIGGER trg_me_gusta_publicacion_par_update
BEFORE UPDATE ON ME_GUSTA_PUBLICACION
FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(255);

    IF MOD(NEW.mascota_id, 2) <> 0 THEN
        SET msg = CONCAT(
            'fragmento incorrecto: ME_GUSTA_PUBLICACION.mascota_id=', NEW.mascota_id,
            ': este nodo (dn_a) solo acepta duenos PAR; los ',
            IF(MOD(NEW.mascota_id, 2) = 0, 'PAR', 'IMPAR'), ' van a dn_b');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END//

CREATE TRIGGER trg_me_gusta_comentario_par_insert
BEFORE INSERT ON ME_GUSTA_COMENTARIO
FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(255);

    IF MOD(NEW.mascota_id, 2) <> 0 THEN
        SET msg = CONCAT(
            'fragmento incorrecto: ME_GUSTA_COMENTARIO.mascota_id=', NEW.mascota_id,
            ': este nodo (dn_a) solo acepta duenos PAR; los ',
            IF(MOD(NEW.mascota_id, 2) = 0, 'PAR', 'IMPAR'), ' van a dn_b');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END//

CREATE TRIGGER trg_me_gusta_comentario_par_update
BEFORE UPDATE ON ME_GUSTA_COMENTARIO
FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(255);

    IF MOD(NEW.mascota_id, 2) <> 0 THEN
        SET msg = CONCAT(
            'fragmento incorrecto: ME_GUSTA_COMENTARIO.mascota_id=', NEW.mascota_id,
            ': este nodo (dn_a) solo acepta duenos PAR; los ',
            IF(MOD(NEW.mascota_id, 2) = 0, 'PAR', 'IMPAR'), ' van a dn_b');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END//

CREATE TRIGGER trg_me_gusta_historia_par_insert
BEFORE INSERT ON ME_GUSTA_HISTORIA
FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(255);

    IF MOD(NEW.mascota_id, 2) <> 0 THEN
        SET msg = CONCAT(
            'fragmento incorrecto: ME_GUSTA_HISTORIA.mascota_id=', NEW.mascota_id,
            ': este nodo (dn_a) solo acepta duenos PAR; los ',
            IF(MOD(NEW.mascota_id, 2) = 0, 'PAR', 'IMPAR'), ' van a dn_b');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END//

CREATE TRIGGER trg_me_gusta_historia_par_update
BEFORE UPDATE ON ME_GUSTA_HISTORIA
FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(255);

    IF MOD(NEW.mascota_id, 2) <> 0 THEN
        SET msg = CONCAT(
            'fragmento incorrecto: ME_GUSTA_HISTORIA.mascota_id=', NEW.mascota_id,
            ': este nodo (dn_a) solo acepta duenos PAR; los ',
            IF(MOD(NEW.mascota_id, 2) = 0, 'PAR', 'IMPAR'), ' van a dn_b');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END//

CREATE TRIGGER trg_historia_vista_par_insert
BEFORE INSERT ON HISTORIA_VISTA
FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(255);

    IF MOD(NEW.mascota_id, 2) <> 0 THEN
        SET msg = CONCAT(
            'fragmento incorrecto: HISTORIA_VISTA.mascota_id=', NEW.mascota_id,
            ': este nodo (dn_a) solo acepta duenos PAR; los ',
            IF(MOD(NEW.mascota_id, 2) = 0, 'PAR', 'IMPAR'), ' van a dn_b');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END//

CREATE TRIGGER trg_historia_vista_par_update
BEFORE UPDATE ON HISTORIA_VISTA
FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(255);

    IF MOD(NEW.mascota_id, 2) <> 0 THEN
        SET msg = CONCAT(
            'fragmento incorrecto: HISTORIA_VISTA.mascota_id=', NEW.mascota_id,
            ': este nodo (dn_a) solo acepta duenos PAR; los ',
            IF(MOD(NEW.mascota_id, 2) = 0, 'PAR', 'IMPAR'), ' van a dn_b');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END//

CREATE TRIGGER trg_notificacion_par_insert
BEFORE INSERT ON NOTIFICACION
FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(255);

    IF MOD(NEW.destinatario_id, 2) <> 0 THEN
        SET msg = CONCAT(
            'fragmento incorrecto: NOTIFICACION.destinatario_id=', NEW.destinatario_id,
            ': este nodo (dn_a) solo acepta duenos PAR; los ',
            IF(MOD(NEW.destinatario_id, 2) = 0, 'PAR', 'IMPAR'), ' van a dn_b');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END//

CREATE TRIGGER trg_notificacion_par_update
BEFORE UPDATE ON NOTIFICACION
FOR EACH ROW
BEGIN
    DECLARE msg VARCHAR(255);

    IF MOD(NEW.destinatario_id, 2) <> 0 THEN
        SET msg = CONCAT(
            'fragmento incorrecto: NOTIFICACION.destinatario_id=', NEW.destinatario_id,
            ': este nodo (dn_a) solo acepta duenos PAR; los ',
            IF(MOD(NEW.destinatario_id, 2) = 0, 'PAR', 'IMPAR'), ' van a dn_b');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = msg;
    END IF;
END//

DELIMITER ;
