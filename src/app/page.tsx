'use client'

import { useEffect, useState, PureComponent } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

import { useSession } from "next-auth/react";

import Login from "@/components/Login";

interface WeightEntry {
  dateTime: string;
  value: number;
}

export default function WeightGraph() {
  const { data: session } = useSession();

  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [filteredWeightData, setFilteredWeightData] = useState<WeightEntry[]>([]);
  const [startRange, setStartRange] = useState("All Time")

  useEffect(() => {
    async function fetchWeights() {
      if (session?.accessToken) {
        try {
          const res = await fetch('/api/weights');
          const data = await res.json();
          if (data.weights) {
            setWeightData(data.weights);
          } else {
            console.error('Failed to get weights');
          }
        } catch (error) {
          console.error('Error fetching weights:', error);
        }
      }
    };
    fetchWeights();
  }, [session]);

  useEffect(() => {
    if (startRange === "All Time") {
      setFilteredWeightData(weightData);
      return;
    }

    setFilteredWeightData(weightData.filter((x) => {
      const pointDate = new Date(x.dateTime)

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
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
      <h1 className="text-xl font-bold mb-4">Weight Tracker</h1>
      <Login/>
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
          <XAxis dataKey="dateTime" height={60} tick={({ x, y, payload }) => <CustomizedAxisTick x={x} y={y} payload={payload} />}/>
          <YAxis domain={([dataMin, dataMax]) => [Math.floor(dataMin - 10), Math.ceil(dataMax + 10)] }/>
          <Tooltip wrapperStyle={{ color: "black" }}/>
          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
