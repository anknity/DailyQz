import { motion } from 'framer-motion'

/**
 * StatCard Component
 * Displays a single statistic with modern card design
 */
const StatCard = ({ 
  icon, 
  label, 
  value, 
  subtext,
  color = 'primary',
  delay = 0 
}) => {
  const colorClasses = {
    primary: { 
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    },
    green: { 
      bg: 'bg-green-50 dark:bg-green-900/20',
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      textColor: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800'
    },
    orange: { 
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
      textColor: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800'
    },
    red: { 
      bg: 'bg-red-50 dark:bg-red-900/20',
      iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
      textColor: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800'
    },
    purple: { 
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-600',
      textColor: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800'
    },
    blue: { 
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    },
  }

  const colors = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: "spring" }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`${colors.bg} rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 border-2 ${colors.border} relative overflow-hidden group`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
      
      <div className="relative flex flex-col gap-4">
        {/* Icon */}
        <div className={`${colors.iconBg} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300`}>
          <div className="text-white text-xl">
            {icon}
          </div>
        </div>
        
        {/* Content */}
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-2 uppercase tracking-wide">
            {label}
          </p>
          <p className={`text-4xl font-bold ${colors.textColor} mb-1`}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default StatCard
