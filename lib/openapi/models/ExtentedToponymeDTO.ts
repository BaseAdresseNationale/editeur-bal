/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Position } from './Position';

export type ExtentedToponymeDTO = {
    _id: string;
    _created: string;
    _updated: string;
    _deleted: string;
    _bal: string;
    nom: string;
    commune: string;
    nomAlt: Record<string, any>;
    parcelles: Array<string>;
    positions: Array<Position>;
    nbNumeros: number;
    nbNumerosCertifies: number;
    isAllCertified: boolean;
    commentedNumeros: Array<string>;
    bbox: Record<string, any>;
};

