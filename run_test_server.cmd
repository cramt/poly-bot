docker run -d --rm --name my-test-db -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres postgres:11.3-alpine -c shared_buffers=500MB -c fsync=off
