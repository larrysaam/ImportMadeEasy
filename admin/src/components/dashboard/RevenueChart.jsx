import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const RevenueChart = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to adapt to container height
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 10, // Smaller legend boxes on mobile
          padding: 10,
          font: {
            size: 12, // Smaller font on mobile
          },
        },
      },
      title: {
        display: true,
        text: 'Monthly Revenue',
        font: {
          size: 14, // Smaller title on mobile
        },
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45, // Rotate labels for better mobile fit
          minRotation: 45,
          font: {
            size: 10, // Smaller axis labels on mobile
          },
        },
        grid: {
          display: false, // Hide x-axis grid for cleaner mobile view
        },
      },
      y: {
        ticks: {
          font: {
            size: 10, // Smaller axis labels on mobile
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)', // Lighter grid lines
        },
      },
    },
  }

  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(item => item.revenue),
        borderColor: 'rgb(75, 85, 99)',
        backgroundColor: 'rgba(75, 85, 99, 0.5)',
        pointRadius: 3, // Smaller points for mobile
        borderWidth: 2, // Thinner lines for mobile
        tension: 0.3, // Slight curve for better visual
      },
    ],
  }

  return (
    <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border">
      <div className="h-[300px] sm:h-[400px]"> {/* Fixed height container */}
        <Line options={options} data={chartData} />
      </div>
    </div>
  )
}

export default RevenueChart