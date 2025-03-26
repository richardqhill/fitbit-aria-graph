
import 'server-only';

import { NextResponse } from 'next/server';
import { getAuthSession } from "@/auth";

interface WeightEntry {
    dateTime: string;
    value: number;
  }
  
async function fetchWeightData() {
    try {
        const session = await getAuthSession();
        console.log(session?.accessToken)
        if (!session || !session.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }

        const MAX_DAYS = 1094;
        let currentStart = new Date("2014-01-01"); // TODO: fix hardcode all time start date
        const finalEnd = new Date();
        let allData: WeightEntry[] = [];

        while (currentStart < finalEnd) {
            let currentEnd = new Date(currentStart);
            currentEnd.setDate(currentEnd.getDate() + MAX_DAYS);
            if (currentEnd > finalEnd) {
                currentEnd = finalEnd;
            }

            /*
            https://api.fitbit.com/1/user/-/body/log/weight/date/YYYY-MM-DD/30d.json
                returns every value (including multiple measures per day)
                max 30 days at a time

            https://api.fitbit.com/1/user/-/body/weight/date/today/max.json
                returns one point per day (averaging multiple measures)
                max 1095 days (3 yrs) between time series start and end (e.g. ~4 requests to get all time data since 2014)
            */
    
            const response = await fetch(`https://api.fitbit.com/1/user/-/body/weight/date/${currentStart.toISOString().split('T')[0]}/${currentEnd.toISOString().split('T')[0]}.json`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${session.accessToken}`,
                "accept-language": 'en_US',
            }
            });
            const data = await response.json()
            allData = allData.concat(data["body-weight"]);

            currentStart = new Date(currentEnd);
            currentStart.setDate(currentStart.getDate() + 1);
        }
        
        return allData;
    } catch (error) {
      console.error("Error fetching weight data:", error);
    }
  }


export async function GET() {
    const weightData = await fetchWeightData();
    return NextResponse.json({ 
        weights: weightData,
    });
}