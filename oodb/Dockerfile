# Servicio de la OODB: compila el workspace y deja sólo el binario.
FROM rust:1.99-slim AS construccion
WORKDIR /src
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
RUN cargo build --release -p pawspace-servicio

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=construccion /src/target/release/pawspace-oodb-servicio /usr/local/bin/pawspace-oodb-servicio
ENV OODB_RUTA=/datos/pawspace.redb \
    OODB_HOST=0.0.0.0 \
    OODB_PUERTO=8787
VOLUME ["/datos"]
EXPOSE 8787
ENTRYPOINT ["pawspace-oodb-servicio"]
