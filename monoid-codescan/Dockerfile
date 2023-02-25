FROM gradle:7.6.0-jdk19-alpine AS build
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
RUN gradle install --no-daemon

FROM amazoncorretto:19-al2-full
RUN mkdir /app
COPY --from=build /home/gradle/src/app/build/install /app

ENTRYPOINT ["./app/app/bin/app"]
