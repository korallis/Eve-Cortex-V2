'use client'

import { motion } from 'framer-motion'
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'

export function CTASection() {
  return (
    <section className="section-padding relative overflow-hidden bg-gradient-cortex">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />

      {/* Animated Elements */}
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute left-10 top-10 h-32 w-32 rounded-full border border-white/10"
      />
      <motion.div
        animate={{
          rotate: [360, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute bottom-10 right-10 h-24 w-24 rounded-full border border-white/10"
      />

      <Container className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white"
          >
            <SparklesIcon className="h-4 w-4" />
            Ready to Dominate New Eden?
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="mb-6 text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
          >
            Start Optimizing Your EVE Experience Today
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mb-8 text-xl leading-relaxed text-white/90"
          >
            Join thousands of pilots who have already gained the competitive edge. Connect your EVE
            Online character and unlock personalized optimization recommendations in minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="xl"
              variant="secondary"
              className="group bg-white text-cortex-blue shadow-lg hover:bg-white/90"
            >
              Connect with ESI
              <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="xl"
              variant="ghost"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Learn More
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-8 text-sm text-white/70"
          >
            Free to use • No credit card required • Secure ESI authentication
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
