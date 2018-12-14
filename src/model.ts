import * as sequelize from 'sequelize';

export interface ImpressionsAttrs {
    impression_token: string,
    session_token: string,
    visitor_token: string,
    url: string,
    elapsed_time: number,
    converted?: boolean
}

export interface Models extends sequelize.Models {
    impressions: ImpressionsModel
}
export interface ImpressionsModel extends sequelize.Model<Impressions, ImpressionsAttrs> {}
export interface Impressions extends sequelize.Instance<ImpressionsAttrs> {}

export const impressionsDatatypes = {
    impression_token: { type: sequelize.UUID, primaryKey: true },
    session_token: { type: sequelize.UUID, allowNull: false },
    visitor_token: { type: sequelize.UUID, allowNull: false },
    url: {
        type: sequelize.STRING,
        allowNull: false,
        validate: {
            isUrl: true
        }
    },
    elapsed_time: { type: sequelize.INTEGER, allowNull: false },
    converted: { type: sequelize.BOOLEAN, defaultValue: false, allowNull: false }
};