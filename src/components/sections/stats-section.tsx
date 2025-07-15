'use client'

import { motion } from 'framer-motion'
import { Container } from '@/components/ui/container'

const stats = [
  {
    value: '10M+',
    label: 'Ship Fittings Analyzed',
    description: 'Comprehensive analysis of ship configurations across all ship classes',
  },
  {
    value: '50K+',
    label: 'Skill Plans Generated',
    description: 'Optimized training paths for pilots of all experience levels',
  },
  {
    value: '99.9%',
    label: 'Calculation Accuracy',
    description: 'Precise Dogma-based calculations for reliable performance metrics',
  },
  {
    value: '24/7',
    label: 'Market Monitoring',
    description: 'Continuous tracking of market trends and opportunities',
  },
]

export function StatsSection() {
  return (
    <section className="section-padding bg-gradient-to-br from-dark-primary to-dark-secondary">
      <Container>
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold mb-4"
          >
            Trusted by{' '}
            <span className="text-neural-gradient">Thousands</span>{' '}
            of Pilots
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            Join the growing community of pilots who have gained the competitive edge 
            with Eve-Cortex's advanced optimization tools.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 + 0.2 }}
                  viewport={{ once: true }}
                  className="text-4xl sm:text-5xl font-bold text-cortex-blue mb-2 group-hover:text-neural-purple transition-colors duration-300"
                >
                  {stat.value}
                </motion.div>
                <div className="absolute inset-0 bg-cortex-blue/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-cortex-blue transition-colors duration-300">
                {stat.label}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}