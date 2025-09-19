export type YesNo = 'yes' | 'no';
export type Pagination = {
    page?: number;
    per_page?: number;
};
export declare const UC_EVENT_TYPES: readonly ["administrative", "camp", "day camp", "class", "clinic", "coaching", "competition", "hat tournament", "function", "league", "meet", "other", "pickup", "race", "season", "tournament", "training", "tryout", "practice"];
export type UCEventType = (typeof UC_EVENT_TYPES)[number];
export declare const UC_EVENT_ORDER_BY: readonly ["date_desc", "date_asc", "name_asc", "start_date_asc"];
export declare const UC_EVENT_STATUS: readonly ["registering", "happening"];
export type UCEventStatus = (typeof UC_EVENT_STATUS)[number];
export declare const UC_GENDER: readonly ["men", "mixed", "open", "women"];
export type UCGender = (typeof UC_GENDER)[number];
export declare const UC_START_KEYWORDS: readonly ["all", "current", "future", "ongoing"];
export type UCStartKeyword = (typeof UC_START_KEYWORDS)[number];
export type UCDateString = string & {
    readonly __ucDateString: unique symbol;
};
export type UCStartParam = UCStartKeyword | UCDateString;
export declare function toUCDateString(value: string): UCDateString;
export declare function parseCsvEnum<T extends string>(csv: string, allowed: readonly T[]): T[];
export declare function parseOptionalInt(v?: string): number | undefined;
export declare function parseStart(value?: string): UCStartParam | undefined;
