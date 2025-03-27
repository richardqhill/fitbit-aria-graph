export interface TrendlineEntry {
    dateTime: string;
    value: number;
}

export interface LogEntry {
    logId: number;
    date: string;
    time: string;
    weight: number;
    bmi: number;
    fat: number;
}

export interface LineEntry {
    logId?: number;
    dateTime: string;
    time?: string;
    logWeight?: number;
    bmi?: number;
    fat?: number;
    trendlineValue?: number;
}