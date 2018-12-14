import * as express from "express";

import { ImpressionsModel, ImpressionsAttrs, Impressions } from "./model";
import { getVisitorStats, getPageStats, PageStats, VisitorStats } from './analytics';

export interface ServerRequest extends express.Request {
    model?: ImpressionsModel,
    body: ServerRequestBody
}
export interface ServerResponse extends express.Response {}

interface ServerRequestBody {
    visitor_token: string,
    event_type: 'page_view' | 'user_event',
    payload: PageViewEvent | UserEvent
}

interface PageViewEvent {
    url: string,
    impression_token: string,
    session_token: string,
    impression_type: 'personalized' | 'control',
    elapsed_time_in_ms: number,
}

interface UserEvent {
    impression_token: string,
    event_name: 'conversion'
}

function parseImpression(request: ServerRequestBody) : ImpressionsAttrs {
    return {
        impression_token: request.payload.impression_token,
        session_token: (<PageViewEvent>request.payload).session_token,
        visitor_token: request.visitor_token,
        url: (<PageViewEvent>request.payload).url,
        elapsed_time: (<PageViewEvent>request.payload).elapsed_time_in_ms
    }
}

function convertImpression(impression_token: string, model: ImpressionsModel): Promise<Impressions> {
    return model.findById(impression_token).then(instance => instance.update({converted: true}));
}

const router = express.Router();

router.post('/track', function(req: ServerRequest, res: ServerResponse) {
    const impressions: ImpressionsModel = req.model;
    switch (req.body.event_type) {
        case 'page_view':
            const attr: ImpressionsAttrs = parseImpression(req.body);
            const instance: Impressions = impressions.build(attr)
            instance.save()
            .then(() => {
                res.sendStatus(200);
            })
            .catch(e => res.sendStatus(500));
            break;
        case 'user_event':
            const impression_token: string = (<UserEvent>req.body.payload).impression_token;
            convertImpression(impression_token, impressions)
            .then(() => {
                res.sendStatus(200);
            })
            .catch(e => res.sendStatus(500));
            break;
        default:
            res.sendStatus(404)
    }
});

router.get('/reports/pages', function(req: ServerRequest, res: ServerResponse) {
    const impressions: ImpressionsModel = req.model;
    getPageStats(impressions)
    .then((pageStats: PageStats) => {
        res.status(200).json({pages: pageStats});
    })
    .catch(e => res.sendStatus(500));
});

router.get('/reports/visitors', function(req: ServerRequest, res: ServerResponse) {
    const impressions: ImpressionsModel = req.model;
    getVisitorStats(impressions)
    .then((vistorStats: VisitorStats) => {
        res.status(200).json({visitors: vistorStats});
    })
    .catch(e => res.sendStatus(500));
});

export const mainRouter = router;