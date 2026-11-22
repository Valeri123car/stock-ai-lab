# Izvajalna slika za Render. Aplikacije NE gradi: v CI job "build" ustvari app.jar,
# job "deploy" ga prenese kot artefakt in ga samo zapakira v to sliko.
FROM eclipse-temurin:21-jre

WORKDIR /app
COPY app.jar app.jar

# Render nastavi PORT; Spring ga prebere prek server.port=${PORT:8080}
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"

CMD ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
