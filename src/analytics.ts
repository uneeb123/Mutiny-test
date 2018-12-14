import { ImpressionsModel, Impressions } from "./model";
import * as sequelize from "sequelize";
import { Promise } from "bluebird";

interface PageViewCount {
    url: string,
    total_count: number
}

interface PageAverageTime {
    url: string,
    avg_time: number
}

interface PageConversionRate {
    url: string,
    cvr_rate: number
}

export interface PageStats {
    highest_views: PageViewCount[],
    most_time: PageAverageTime[],
    highest_conversion: PageConversionRate[]
}

function pagesHighestViews(model: ImpressionsModel): Promise<any[]> {
    return model.findAll({
        attributes: ['url', [sequelize.fn('COUNT', sequelize.col('impression_token')), 'total_count']],
        group: ['url'],
        order: [[sequelize.fn('COUNT', sequelize.col('impression_token')), 'DESC']]
    });
}

function pagesMostTime(model: ImpressionsModel): Promise<any[]> {
    return model.findAll({
        attributes: ['url', [sequelize.fn('AVG', sequelize.col('elapsed_time')), 'avg_time']],
        group: ['url'],
        order: [[sequelize.fn('AVG', sequelize.col('elapsed_time')), 'DESC']]
    });
}

function pagesMostConversion(model: ImpressionsModel): Promise<any[]> {
    return model.findAll({
        attributes: ['url', [sequelize.literal('(SUM(`converted`)*1.0)/COUNT(*)'), 'cvr_rate']],
        group: ['url'],
        order: [sequelize.literal('(SUM(`converted`)*1.0)/COUNT(*) DESC')]
    });
}

export function getPageStats(model: ImpressionsModel): Promise<PageStats> {
    return Promise.all([pagesHighestViews(model), pagesMostTime(model), pagesMostConversion(model)])
    .spread((highest_views: any[], most_time: any[], most_conversion: any[]) => {
        const pageViewCount: PageViewCount[] = highest_views.map(res => res.dataValues).slice(0,10);
        const pageAverageTime: PageAverageTime[] = most_time.map(res => res.dataValues).slice(0,10);
        const pageConversionRate: PageConversionRate[] = most_conversion
            .map(res => res.dataValues).slice(0,10).map(({url, cvr_rate}) => {
                return {
                    url: url,
                    cvr_rate: parseFloat(cvr_rate.toFixed(4))
                }
            });
        return <PageStats>{
            highest_views: pageViewCount,
            most_time: pageAverageTime,
            highest_conversion: pageConversionRate
        };
    });
}

export interface VisitorStats {
    average_time_per_page: number,
    average_pages_per_session: number,
    average_time_per_session: number
}

function visitorAverageTimePerPage(model: ImpressionsModel): Promise<any[]> {
    return model.findAll({
        attributes: [[sequelize.fn('AVG', sequelize.col('elapsed_time')), 'average_time_per_page']],
    });
}

function visitorAveragePagesPerSession(model: ImpressionsModel): Promise<any[]> {
    return model.findAll({
        attributes: [[sequelize.fn('COUNT', sequelize.col('impression_token')), 'pages_per_session']],
        group: ['session_token']
    });
}

function visitorAverageTimePerSession(model: ImpressionsModel): Promise<any[]> {
    return model.findAll({
        attributes: [[sequelize.fn('SUM', sequelize.col('elapsed_time')), 'time_per_session']],
        group: ['session_token']
    });
}

export function getVisitorStats(model: ImpressionsModel): Promise<VisitorStats> {
    return Promise.all([visitorAverageTimePerPage(model), visitorAveragePagesPerSession(model), visitorAverageTimePerSession(model)])
    .spread((impressions1: any, impressions2: any[], impressions3: any[]) => {
        const result1: number = Math.floor(impressions1.map(x => x.dataValues.average_time_per_page)[0]);
        const len: number = impressions2.length;
        const sum_pages: number = impressions2.map(x => x.dataValues.pages_per_session)
                                    .reduce((sum, current) => sum+current);
        const result2: number = Math.floor(sum_pages/len);
        const sum_time: number = impressions3.map(x => x.dataValues.time_per_session)
                                    .reduce((sum, current) => sum+current);
        const result3: number = Math.floor(sum_time/len);
        return <VisitorStats>{
            average_time_per_page: result1,
            average_pages_per_session: result2,
            average_time_per_session: result3
        }
    });
}