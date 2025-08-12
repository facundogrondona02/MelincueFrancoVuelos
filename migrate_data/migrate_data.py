import json
import pymysql
import os

# --- Configuración de la base de datos ---
# ¡IMPORTANTE! Para ejecutar este script desde tu máquina local:
# 1. Tu instancia de Cloud SQL debe tener una IP pública habilitada.
# 2. Tu IP pública local debe estar autorizada en la configuración de "Conexiones" de tu instancia de Cloud SQL.
# 3. Una vez que la migración se complete y tu Cloud Run se conecte vía VPC,
#    es ALTAMENTE RECOMENDABLE deshabilitar la IP pública de Cloud SQL por seguridad.

DB_HOST = "35.247.200.78" # <-- REEMPLAZA con la IP pública de tu instancia de Cloud SQL
DB_USER = "root"                  # <-- REEMPLAZA con tu usuario de MySQL (generalmente 'root')
DB_PASSWORD = "Fabiana$2002"       # <-- REEMPLAZA con la contraseña de tu usuario de MySQL
DB_NAME = "vuelos_data"           # <-- REEMPLAZA con el nombre de la base de datos que creaste (ej. 'vuelos_data')

# --- Datos JSON proporcionados por el usuario ---
# Estos son los datos que quieres insertar en las tablas
destinos_json_data = [
    {
        "ciudad": "Cancun",
        "origenVuelta": "CUN",
        "maxDuracionIda": "15:00",
        "maxDuracionVuelta": "14:00",
        "horarioIdaEntre": "00:01",
        "horarioIdaHasta": "09:00",
        "horarioVueltaEntre": "11:00",
        "horarioVueltaHasta": "23:00",
        "stops": "1 escala"
    },
    {
        "ciudad": "Rio",
        "origenVuelta": "RIO",
        "maxDuracionIda": "7:00",
        "maxDuracionVuelta": "4:00",
        "horarioIdaEntre": "01:00",
        "horarioIdaHasta": "15:45",
        "horarioVueltaEntre": "11:00",
        "horarioVueltaHasta": "23:00",
        "stops": "Directo"
    }
]

codigos_iata_json_data = [
    {
        "ciudad": "Cancun",
        "codigoIATA": "CUN"
    },
    {
        "ciudad": "Rio",
        "codigoIATA": "RIO"
    }
]

def migrate_data():
    """
    Conecta a la base de datos MySQL e inserta los datos desde los JSON.
    Utiliza ON DUPLICATE KEY UPDATE para manejar inserciones y actualizaciones
    si los registros ya existen (basado en UNIQUE keys).
    """
    conn = None
    try:
        print(f"Intentando conectar a la base de datos {DB_NAME} en {DB_HOST}...")
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            cursorclass=pymysql.cursors.Cursor # Usar cursor básico para inserciones
        )
        print("Conexión a la base de datos exitosa.")
        cursor = conn.cursor()

        # --- Migrar datos a la tabla 'destinos' ---
        print("\nMigrando datos a la tabla 'destinos'...")
        for d in destinos_json_data:
            sql = """
            INSERT INTO destinos (ciudad, origenVuelta, maxDuracionIda, maxDuracionVuelta,
                                  horarioIdaEntre, horarioIdaHasta, horarioVueltaEntre,
                                  horarioVueltaHasta, stops)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                ciudad=VALUES(ciudad),
                maxDuracionIda=VALUES(maxDuracionIda),
                maxDuracionVuelta=VALUES(maxDuracionVuelta),
                horarioIdaEntre=VALUES(horarioIdaEntre),
                horarioIdaHasta=VALUES(horarioIdaHasta),
                horarioVueltaEntre=VALUES(horarioVueltaEntre),
                horarioVueltaHasta=VALUES(horarioVueltaHasta),
                stops=VALUES(stops);
            """
            try:
                cursor.execute(sql, (
                    d.get("ciudad"), d.get("origenVuelta"), d.get("maxDuracionIda"),
                    d.get("maxDuracionVuelta"), d.get("horarioIdaEntre"), d.get("horarioIdaHasta"),
                    d.get("horarioVueltaEntre"), d.get("horarioVueltaHasta"), d.get("stops")
                ))
                print(f"  Insertado/Actualizado destino: {d.get('ciudad')}")
            except pymysql.Error as e:
                print(f"  ❌ Error al insertar/actualizar destino {d.get('ciudad')}: {e}")
        conn.commit()
        print("Migración de destinos completada.")

        # --- Migrar datos a la tabla 'codigos_iata' ---
        print("\nMigrando datos a la tabla 'codigos_iata'...")
        for c in codigos_iata_json_data:
            sql = """
            INSERT INTO codigos_iata (ciudad, codigoIATA)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE
                codigoIATA=VALUES(codigoIATA);
            """
            try:
                cursor.execute(sql, (c.get("ciudad"), c.get("codigoIATA")))
                print(f"  Insertado/Actualizado código IATA: {c.get('ciudad')}")
            except pymysql.Error as e:
                print(f"  ❌ Error al insertar/actualizar código IATA {c.get('ciudad')}: {e}")
        conn.commit()
        print("Migración de códigos IATA completada.")

    except pymysql.Error as e:
        print(f"❌ Error general durante la migración: {e}")
    finally:
        if conn:
            conn.close()
            print("Conexión a la base de datos cerrada.")

if __name__ == "__main__":
    migrate_data()
