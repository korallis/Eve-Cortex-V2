'use client'

import { motion } from 'framer-motion'
import { 
  CpuChipIcon, 
  ChartBarIcon, 
  CogIcon, 
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { Container } from '@/components/ui/container'

const features = [
  {
    icon: CpuChipIcon,
    title: 'AI-Powered Optimization',
    description: 'Advanced machine learning algorithms analyze your character data to provide personalized recommendations.',
    color: 'cortex-blue',
  },
  {
    icon: CogIcon,
    title: 'Ship Fitting Calculator',
    description: 'Precise Dogma-based calculations ensure accurate ship performance metrics and optimal module configurations.',
    color: 'neural-purple',
  },
  {
    icon: ChartBarIcon,
    title: 'Market Analysis',
    description: 'Real-time market data analysis identifies profitable opportunities and trading strategies.',
    color: 'eve-gold',
  },
  {
    icon: BoltIcon,
    title: 'Skill Planning',
    description: 'Intelligent skill queue optimization minimizes training time while maximizing character effectiveness.',
    color: 'success',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Mission Optimization',
    description: 'Analyze enemy damage types and recommend optimal fittings for specific mission types and factions.',
    color: 'warning',
  },
  {
    icon: GlobeAltIcon,
    title: 'ESI Integration',
    description: 'Seamless integration with EVE Online\'s API provides real-time character and market data.',
    color: 'info',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
}

export function FeaturesSection() {
  return (
    <section className="section-padding bg-dark-secondary/50">
      <Container>
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold mb-4"
          >
            Powerful Features for{' '}
            <span className="text-gradient">Every Pilot</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            From novice capsuleers to veteran fleet commanders, Eve-Cortex provides 
            the tools you need to dominate New Eden.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group card-hover"
            >
              <div className={`inline-flex p-3 rounded-lg bg-${feature.color}/10 mb-4 group-hover:bg-${feature.color}/20 transition-colors duration-300`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-cortex-blue transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}