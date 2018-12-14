import * as sequelize from 'sequelize';
import * as express from 'express';
import * as bodyParser from 'body-parser';

import { Impressions, ImpressionsAttrs, impressionsDatatypes } from './model';
import { ServerRequest, mainRouter } from './router';

const PORT = 8002;

const connection = new sequelize('schema','root','password', {
    dialect: 'sqlite',
    storage: 'db/database.sqlite'
});

const impressions = connection.define<Impressions, ImpressionsAttrs>('impressions', impressionsDatatypes);

connection.sync({
    force: true, // should not be used in production
    logging: console.log
})
.then(() => {
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(function (req: ServerRequest, _res: express.Response, next: express.NextFunction) {
        req.model = impressions;
        next();
    });
    app.use("/", mainRouter)
    app.listen(PORT, () => {
        console.log(`Server is now listening on ${PORT}`)
    });
})
.catch(err => console.error(err));