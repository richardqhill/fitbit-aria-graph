'use client'

import { useEffect, useState, PureComponent } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import { useSession } from "next-auth/react";

import Login from "@/components/Login";

import { LineEntry } from '@/types/api';

export default function WeightGraph() {
  const { data: session } = useSession();

  const [weightData, setWeightData] = useState<LineEntry[]>([]);
  const [filteredWeightData, setFilteredWeightData] = useState<LineEntry[]>([]);

  const [startRange, setStartRange] = useState("Last 30 Days")

  useEffect(() => {
    async function fetchWeights() {
      try {
        const res = await fetch('/api/weights');
        const data = await res.json();
        if (data.weightData) {
          setWeightData(data.weightData);
        } else {
          console.error('Failed to get weights');
        }
      } catch (error) {
        console.error('Error fetching weights:', error);
      }
    };
    fetchWeights();
  }, [session]);

  useEffect(() => {
    if (startRange === "All Time") {
      setFilteredWeightData(weightData)
      return;
    }

    setFilteredWeightData(weightData.filter((x) => {
      const pointDate = new Date(x.dateTime)
      const startDate = new Date();
      if (startRange === "Last 3 Months") {
        startDate.setMonth(startDate.getMonth() - 3);
      } else if (startRange === "Last 30 Days") {
        startDate.setDate(startDate.getDate() - 30);
      }
      
      return pointDate > startDate;
    }))
  }, [weightData, startRange]);

  class CustomizedAxisTick extends PureComponent<{ x: number; y: number; payload: { value: string | number } }> {
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
      <h1 className="text-xl font-bold mb-4">Fitbit Weights</h1>
      <Login/>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
        {["All Time", "Last 3 Months", "Last 30 Days"].map((label, index) => (
          <button
            key={label}
            onClick={() => setStartRange(label)}
            style={{
              marginRight: index !== 2 ? 8 : 0, // No margin on the last button
              padding: "8px 16px",
              border: "2px solid #6c757d", // Dark gray border for a subtle look
              borderRadius: 8,
              backgroundColor: startRange === label ? "#4c6e85" : "transparent", // Highlight selected date range
              color: "#d1d5db", // Light text for readability
              cursor: "pointer",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement; // Explicitly cast to HTMLButtonElement
              target.style.backgroundColor = "#2d3d4f"; // Hover effect
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement; // Explicitly cast to HTMLButtonElement
              target.style.backgroundColor = startRange === label ? "#4c6e85" : "transparent"; // Reset to original state
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={400} className="mt-6">
        <LineChart data={filteredWeightData} margin={{ top: 20, right: 40, left: 40, bottom: 50 }}>
          <CartesianGrid strokeDasharray="1 1" />
          <XAxis dataKey="dateTime" height={60}   tick={({ x, y, payload }) => <CustomizedAxisTick x={x} y={y} payload={payload} />}/>
          <YAxis domain={([dataMin, dataMax]) => [Math.floor(dataMin - 10), Math.ceil(dataMax + 10)] }/>
          <Tooltip
            wrapperStyle={{ color: "black" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const logWeightData = payload.find((p) => p.dataKey === "logWeight");
                if (logWeightData) {
                  return (
                    <div className="bg-white p-2 shadow-md rounded-md">
                      <p>{`Weight: ${logWeightData.value}`}</p>
                      <p>{`Date: ${logWeightData.payload.dateTime}`}</p>
                    </div>
                  );
                }
              }
              return null; // Hide tooltip for other lines
            }}
          />
          <Line type="monotone" dataKey="trendlineValue" stroke="#8884d8" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="logWeight" stroke="none" dot={startRange === "All Time" ? false : { stroke: 'white', strokeWidth: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
