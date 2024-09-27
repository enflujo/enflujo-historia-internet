# Historia del Internet Tally

Wordpress local para desarrollo.

Crear el archivo `.env` en la misma carpeta donde está el `docker-compose.yml` para guardar las claves:

El archivo `.env` debe tener las siguientes variables.

```bash
WP_NOMBRE_BD=nombre
WP_USUARIO_BD=enflujo
WP_CLAVE_BD=clavesecreta
BD_CLAVE=otraclave
WP_PUERTO=4040
```

Con Docker instalado, iniciar contenedor con:

```bash
docker compose up
```

## Instalar paquetes

Estos son los paquetes que se usan.

### Instalar manualmente

Git Updater: Para actualizar temas y plugins que subimos a Github.

https://git-updater.com/

Descargar el .zip y subirlo manualmente para instalar.

### Estos se pueden instalar directamente desde WordPress

- WPGraphQL: para usar GraphQL.
- https://github.com/jsongerber/wp-sync-db
- https://github.com/jsongerber/wp-sync-db-media-files
