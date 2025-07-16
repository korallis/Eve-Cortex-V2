'use client'

import { motion } from 'framer-motion'
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-tertiary" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,102,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(107,70,193,0.1),transparent_50%)]" />

      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      <Container className="relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-cortex-blue/20 bg-cortex-blue/10 px-4 py-2 text-sm font-medium text-cortex-blue"
          >
            <SparklesIcon className="h-4 w-4" />
            AI-Powered EVE Online Optimization
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
          >
            Unlock Your <span className="text-gradient">Competitive Edge</span> in EVE Online
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-gray-300"
          >
            Eve-Cortex combines advanced AI with EVE Online's complex mechanics to deliver
            personalized ship fittings, optimal skill plans, and strategic market insights.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button size="lg" className="group">
              Get Started with ESI
              <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="ghost" size="lg">
              View Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid grid-cols-1 gap-8 border-t border-white/10 pt-16 sm:grid-cols-3"
          >
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-cortex-blue">10M+</div>
              <div className="text-gray-400">Ship Fittings Analyzed</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-neural-purple">50K+</div>
              <div className="text-gray-400">Skill Plans Generated</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold text-eve-gold">99.9%</div>
              <div className="text-gray-400">Calculation Accuracy</div>
            </div>
          </motion.div>
        </div>
      </Container>

      {/* Floating Elements */}
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute left-10 top-20 h-20 w-20 rounded-full bg-cortex-blue/10 blur-xl"
      />
      <motion.div
        animate={{
          y: [0, 10, 0],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-20 right-10 h-32 w-32 rounded-full bg-neural-purple/10 blur-xl"
      />
    </section>
  )
}
