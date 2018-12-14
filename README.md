## Installation/Setup

SQLite database is used as the primary database. Please ensure that you have SQLite installed and running on your machine. The server assumes that the database exists at
```
db/database.sqlite
```
When running the server the first time, database file should get created automatically.

The server uses ExpressJS framework is implemented in Typescript. To download all the dependencies, do:
```
npm install
```

And then to start the server simply run

```
npm start
```

This should instantiate your server on port 8002. Now we are ready to simulate client tests in docker container.


## Database Schema

The database schema is very simplistic. There is a single `impressions` table that stores all the information.

```
CREATE TABLE IF NOT EXISTS `impressions` (
    `impression_token` UUID PRIMARY KEY,
    `session_token` UUID NOT NULL,
    `visitor_token` UUID NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `elapsed_time` INTEGER NOT NULL,
    `converted` TINYINT(1) NOT NULL DEFAULT 0,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL
);
```

### Design choice

A normalized database design is ideal when protecting data integrity and reducing redundancy. The downside of normalization is that you lose read performance. Denormalization is performed by grouping frequently accessed data together. We opted for a normalized database schema as we expect the queries to be of varied nature, but maintaining data integrity takes higher precendence.

### Further thoughts

To optimize reads on the database, one proposal is to introduce a NoSQL database can be populated by a worker service that constantly monitors for new data and acts as a caching layer. The design of this database is to optimize for specific queries. For example, for each URL, it can track the time spent as well as number of impressions on it. This way querying do not need to be recomputed whenever new data is inserted. NoSQL is ideal for this as it allows additional information to be easily added. The downside of this approach is that we would be relying on worker services to ensure the data is up-to date. At the same time, however, it is easy to spin up more instances of such worker services.