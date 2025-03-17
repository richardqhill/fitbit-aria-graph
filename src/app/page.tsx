'use client'

import { useEffect, useState, PureComponent } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface WeightEntry {
  dateTime: string;
  value: number;
}

export default function WeightGraph() {
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [filteredWeightData, setFilteredWeightData] = useState<WeightEntry[]>([]);
  const [startRange, setStartRange] = useState("All Time")

  useEffect(() => {
    async function fetchWeightData() {
      try {
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
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_FITBIT_TOKEN}`, // TODO: use Client Secret to get Access Token
                "accept-language": 'en_US',
            }
          });
          const data = await response.json()
          allData = allData.concat(data["body-weight"]);

          currentStart = new Date(currentEnd);
          currentStart.setDate(currentStart.getDate() + 1);
        }
        
        setWeightData(allData);
      } catch (error) {
        console.error("Error fetching weight data:", error);
      }
    }
    fetchWeightData();
  }, []);

  useEffect(() => {
    if (startRange === "All Time") {
      setFilteredWeightData(weightData);
      return;
    }

    setFilteredWeightData(weightData.filter((x) => {
      const pointDate = new Date(x.dateTime)

      let startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      if (startRange === "Last 3 Months") {
        startDate.setMonth(startDate.getMonth() - 3);
      } else if (startRange === "Last 30 Days") {
        startDate.setDate(startDate.getDate() - 30);
      }
      
      return pointDate > startDate;
    }))
  }, [weightData, startRange]);


  class CustomizedAxisTick extends PureComponent {
    render() {
      const { x, y, payload } = this.props;
  
      return (
        <g transform={`translate(${x},${y})`}>
          <text x={0} y={0} dy={8} textAnchor="end" fill="#666" transform="rotate(-45)">
            {payload.value}
          </text>
        </g>
      );
    }
  }


  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Weight Tracker</h1>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
        {["All Time", "Last 3 Months", "Last 30 Days"].map((label, index) => (
          <button
            key={label}
            onClick={() => setStartRange(label)}
            style={{
              marginRight: index !== 2 ? 8 : 0, // No margin on the last button
              padding: "6px 12px",
              border: "2px solid black",
              borderRadius: 4
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={filteredWeightData} margin={{ bottom: 50 }}>
          <CartesianGrid strokeDasharray="1 1" />
          <XAxis dataKey="dateTime" height={60} tick={<CustomizedAxisTick />}/>
          <YAxis domain={([dataMin, dataMax]) => [Math.floor(dataMin - 10), Math.ceil(dataMax + 10)] }/>
          <Tooltip wrapperStyle={{ color: "black" }}/>
          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
