
import 'server-only';

import { NextResponse } from 'next/server';
import { getAuthSession } from "@/auth";

import { TrendlineEntry, LogEntry, LineEntry } from '@/types/api';

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const weightData = await getWeightData(session.accessToken);

        return NextResponse.json({ 
            weightData: weightData,
        });
    } catch(e) {
        console.error("Error fetching weight data:", e);
        return NextResponse.json({ error: "Error fetching weight data" }, { status: 500 });
    }    
}

async function getWeightData(accessToken: string) {
    const trendlineData = await getTrendlineData(accessToken);
    const logData = await getLogData(accessToken);

    // Merge and sort trendline and log data together
    const weightMap = new Map<string, LineEntry>();
    trendlineData.forEach(({ dateTime, value }) => {
        if (!weightMap.has(dateTime)) {
            weightMap.set(dateTime, { dateTime });
        }
        weightMap.get(dateTime)!.trendlineValue = value;
    });
    logData.forEach(({ date, weight, fat, time }) => {
        if (!weightMap.has(date)) {
            weightMap.set(date, { dateTime: date });
        }
        const entry = weightMap.get(date)!;
        entry.logWeight = weight;
        entry.fat = fat;
        entry.time = time;
    });

    return Array.from(weightMap.values()).sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );
}

async function getTrendlineData(accessToken: string) {
    /*
        https://api.fitbit.com/1/user/-/body/weight/date/today/max.json
        returns one point per day (averaging multiple measures)
        max 1095 days (3 yrs) between time series start and end (e.g. ~4 requests to get all time data since 2014)
    */

    const MAX_DAYS_PER_REQUEST = 1094;
    let currentStart = new Date("2014-01-01"); // TODO: fix hardcode all time start date
    const finalEnd = new Date();
    
    let allData: TrendlineEntry[] = [];
    while (currentStart < finalEnd) {
        let currentEnd = new Date(currentStart);
        currentEnd.setDate(currentEnd.getDate() + MAX_DAYS_PER_REQUEST);
        if (currentEnd > finalEnd) {
            currentEnd = finalEnd;
        }

        const response = await fetch(`https://api.fitbit.com/1/user/-/body/weight/date/${currentStart.toISOString().split('T')[0]}/${currentEnd.toISOString().split('T')[0]}.json`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "accept-language": 'en_US',
        }
        });
        const data = await response.json();
        allData = allData.concat(data["body-weight"]);

        currentStart = new Date(currentEnd);
        currentStart.setDate(currentStart.getDate() + 1);
    }
    return allData;
}

async function getLogData(accessToken: string) {
    /*
        https://api.fitbit.com/1/user/-/body/log/weight/date/YYYY-MM-DD/30d.json
        returns every value (including multiple measures per day)
        max 30 days at a time
    */
                
    const MAX_DAYS = 30;
    
    const finalEnd = new Date();
    let currentStart = new Date();
    currentStart.setDate(finalEnd.getDate() - MAX_DAYS * 3); // TODO: fix hardcode all time start date

    let allData: LogEntry[] = [];
    while (currentStart < finalEnd) {
        let currentEnd = new Date(currentStart);
        currentEnd.setDate(currentEnd.getDate() + MAX_DAYS);
        if (currentEnd > finalEnd) {
            currentEnd = finalEnd;
        }

        const response = await fetch(`https://api.fitbit.com/1/user/-/body/log/weight/date/${currentStart.toISOString().split('T')[0]}/${currentEnd.toISOString().split('T')[0]}.json`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "accept-language": 'en_US',
        }
        });
        const data = await response.json()
        allData = allData.concat(data["weight"]);

        currentStart = new Date(currentEnd);
        currentStart.setDate(currentStart.getDate() + 1);
    }

    allData = allData.map((x) => {
        return {
            ...x,
            dateTime: x.date,
        }
    })
    
    return allData;
}


