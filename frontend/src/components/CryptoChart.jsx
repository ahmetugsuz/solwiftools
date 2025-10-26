import { useState, useEffect } from "react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";

const data = Array.from({ length: 30 }, (_, i) => ({
  name: i,
  value: Math.sin(i / 3) * 50 + 50 + Math.random() * 10,
}));

export default function CryptoChart() {
  const [ballPosition, setBallPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBallPosition((prev) => (prev + 1) % data.length);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="name" hide />
          <YAxis hide />
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF66CC" />
              <stop offset="50%" stopColor="#FF9966" />
              <stop offset="100%" stopColor="rgba(200, 139, 25, 0)" />
            </linearGradient>
          </defs>
          <Line
            type="monotone"
            dataKey="value"
            stroke="#FF66CC"
            strokeWidth={3}
            fill="url(#chartGradient)"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <motion.div
        className="absolute w-6 h-6 bg-pink-500 rounded-full shadow-xl"
        animate={{
          x: `${(ballPosition / data.length) * 100}%`,
          y: `${100 - data[ballPosition]?.value}%`,
        }}
        transition={{ type: "tween", ease: "linear", duration: 0.5 }}
      />
    </div>
  );
}
