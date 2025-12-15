import { useMemo } from 'react'

/**
 * Custom hook for Chart.js configuration with consistent theming
 */
export function useChart(type, data, options = {}) {
  const theme = useMemo(() => ({
    colors: {
      primary: '#6366F1',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
      purple: '#8B5CF6',
      pink: '#EC4899',
      gray: '#6B7280',
    },
    font: {
      family: "'Inter', sans-serif",
      size: 12,
      weight: 400,
    }
  }), [])

  const chartData = useMemo(() => {
    if (type === 'line' || type === 'bar') {
      return {
        ...data,
        datasets: data.datasets?.map((dataset, index) => ({
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
          borderWidth: 2,
          tension: 0.4,
          ...dataset,
        })) || []
      }
    }

    if (type === 'doughnut' || type === 'pie') {
      return {
        ...data,
        datasets: data.datasets?.map(dataset => ({
          backgroundColor: [
            theme.colors.primary,
            theme.colors.success,
            theme.colors.warning,
            theme.colors.danger,
            theme.colors.info,
            theme.colors.purple,
            theme.colors.pink,
          ],
          borderWidth: 0,
          ...dataset,
        })) || []
      }
    }

    return data
  }, [type, data, theme])

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: theme.font,
          padding: 15,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          ...theme.font,
          weight: 600,
        },
        bodyFont: theme.font,
      }
    },
    scales: (type === 'line' || type === 'bar') ? {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: theme.font,
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: theme.font,
        }
      }
    } : undefined,
    ...options,
  }), [type, options, theme])

  return {
    data: chartData,
    options: chartOptions
  }
}

/**
 * Hook for activity chart data
 */
export function useActivityChart(activityData = []) {
  return useMemo(() => {
    const labels = activityData.map(item => item.date)
    const values = activityData.map(item => item.count)

    return {
      labels,
      datasets: [
        {
          label: 'Activity',
          data: values,
          fill: true,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderColor: '#6366F1',
        }
      ]
    }
  }, [activityData])
}

/**
 * Hook for document status chart data
 */
export function useDocumentStatusChart(statusData = {}) {
  return useMemo(() => ({
    labels: Object.keys(statusData),
    datasets: [
      {
        data: Object.values(statusData),
      }
    ]
  }), [statusData])
}

export default useChart
