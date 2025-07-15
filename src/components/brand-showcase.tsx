'use client'

import React from 'react'
import Image from 'next/image'

export function BrandShowcase() {
  return (
    <div className="min-h-screen bg-dark-primary p-8 text-white">
      <div className="mx-auto max-w-6xl space-y-16">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-4 bg-gradient-cortex bg-clip-text text-6xl font-bold text-transparent">
            Eve-Cortex Brand System
          </h1>
          <p className="text-xl text-gray-400">
            Visual identity and design system for AI-powered EVE Online optimization
          </p>
        </div>

        {/* Logo Variations */}
        <section>
          <h2 className="mb-8 text-3xl font-bold text-cortex-blue">Logo Variations</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-gray-800 bg-dark-secondary p-8">
              <h3 className="mb-4 text-lg font-semibold">Primary Logo</h3>
              <div className="flex justify-center">
                <Image
                  src="/brand/logos/eve-cortex-logo.svg"
                  alt="Eve-Cortex Primary Logo"
                  width={200}
                  height={60}
                />
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-dark-secondary p-8">
              <h3 className="mb-4 text-lg font-semibold">Icon Only</h3>
              <div className="flex justify-center">
                <Image
                  src="/brand/logos/eve-cortex-icon.svg"
                  alt="Eve-Cortex Icon"
                  width={60}
                  height={60}
                />
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-dark-secondary p-8">
              <h3 className="mb-4 text-lg font-semibold">Horizontal</h3>
              <div className="flex justify-center">
                <Image
                  src="/brand/logos/eve-cortex-horizontal.svg"
                  alt="Eve-Cortex Horizontal Logo"
                  width={240}
                  height={50}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section>
          <h2 className="mb-8 text-3xl font-bold text-cortex-blue">Color Palette</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Primary Colors */}
            <div>
              <h3 className="mb-4 text-xl font-semibold">Primary Colors</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-lg bg-cortex-blue shadow-cortex"></div>
                  <div>
                    <p className="font-semibold">Cortex Blue</p>
                    <p className="text-sm text-gray-400">#0066FF</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-lg bg-neural-purple shadow-neural"></div>
                  <div>
                    <p className="font-semibold">Neural Purple</p>
                    <p className="text-sm text-gray-400">#6B46C1</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-lg bg-eve-gold shadow-eve"></div>
                  <div>
                    <p className="font-semibold">EVE Gold</p>
                    <p className="text-sm text-gray-400">#FFB800</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Colors */}
            <div>
              <h3 className="mb-4 text-xl font-semibold">Status Colors</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-lg bg-success"></div>
                  <div>
                    <p className="font-semibold">Success</p>
                    <p className="text-sm text-gray-400">#10B981</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-lg bg-warning"></div>
                  <div>
                    <p className="font-semibold">Warning</p>
                    <p className="text-sm text-gray-400">#F59E0B</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-lg bg-error"></div>
                  <div>
                    <p className="font-semibold">Error</p>
                    <p className="text-sm text-gray-400">#EF4444</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Theme Colors */}
            <div>
              <h3 className="mb-4 text-xl font-semibold">Dark Theme</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-lg border border-gray-700 bg-dark-primary"></div>
                  <div>
                    <p className="font-semibold">Primary</p>
                    <p className="text-sm text-gray-400">#0A0A0B</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-lg bg-dark-secondary"></div>
                  <div>
                    <p className="font-semibold">Secondary</p>
                    <p className="text-sm text-gray-400">#1A1A1C</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-lg bg-dark-tertiary"></div>
                  <div>
                    <p className="font-semibold">Tertiary</p>
                    <p className="text-sm text-gray-400">#2A2A2E</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="mb-8 text-3xl font-bold text-cortex-blue">Typography</h2>
          <div className="rounded-xl border border-gray-800 bg-dark-secondary p-8">
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm text-gray-400">Heading 1 - 60px</p>
                <h1 className="text-6xl font-bold">Strategic Advantage</h1>
              </div>
              <div>
                <p className="mb-2 text-sm text-gray-400">Heading 2 - 48px</p>
                <h2 className="text-5xl font-bold">Ship Optimization</h2>
              </div>
              <div>
                <p className="mb-2 text-sm text-gray-400">Heading 3 - 36px</p>
                <h3 className="text-4xl font-semibold">Skill Planning</h3>
              </div>
              <div>
                <p className="mb-2 text-sm text-gray-400">Body Large - 18px</p>
                <p className="text-lg">
                  Eve-Cortex leverages advanced AI algorithms to provide personalized optimization
                  recommendations for EVE Online players.
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm text-gray-400">Body Regular - 16px</p>
                <p className="text-base">
                  Our platform analyzes your character data, skills, and assets to deliver strategic
                  insights that give you a competitive edge.
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm text-gray-400">Monospace - Code</p>
                <code className="rounded bg-dark-tertiary px-3 py-1 font-mono text-cortex-blue">
                  const optimization = await analyzeShipFitting(character);
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Custom Icons */}
        <section>
          <h2 className="mb-8 text-3xl font-bold text-cortex-blue">Custom Icons</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="rounded-xl border border-gray-800 bg-dark-secondary p-6 text-center">
              <Image
                src="/brand/icons/ship-optimizer.svg"
                alt="Ship Optimizer"
                width={48}
                height={48}
                className="mx-auto mb-3"
              />
              <p className="text-sm font-medium">Ship Optimizer</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-dark-secondary p-6 text-center">
              <Image
                src="/brand/icons/skill-tree.svg"
                alt="Skill Tree"
                width={48}
                height={48}
                className="mx-auto mb-3"
              />
              <p className="text-sm font-medium">Skill Tree</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-dark-secondary p-6 text-center">
              <Image
                src="/brand/icons/market-analysis.svg"
                alt="Market Analysis"
                width={48}
                height={48}
                className="mx-auto mb-3"
              />
              <p className="text-sm font-medium">Market Analysis</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-dark-secondary p-6 text-center">
              <Image
                src="/brand/logos/eve-cortex-icon.svg"
                alt="Cortex Core"
                width={48}
                height={48}
                className="mx-auto mb-3"
              />
              <p className="text-sm font-medium">Cortex Core</p>
            </div>
          </div>
        </section>

        {/* Gradients */}
        <section>
          <h2 className="mb-8 text-3xl font-bold text-cortex-blue">Gradients</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex h-32 items-center justify-center rounded-xl bg-gradient-cortex">
              <p className="font-semibold text-white">Cortex Gradient</p>
            </div>
            <div className="flex h-32 items-center justify-center rounded-xl bg-gradient-neural">
              <p className="font-semibold text-white">Neural Gradient</p>
            </div>
          </div>
        </section>

        {/* Component Examples */}
        <section>
          <h2 className="mb-8 text-3xl font-bold text-cortex-blue">Component Examples</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Primary Button */}
            <button className="rounded-lg bg-cortex-blue px-6 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-cortex-blue/80 hover:shadow-cortex">
              Primary Button
            </button>

            {/* Secondary Button */}
            <button className="rounded-lg border-2 border-cortex-blue px-6 py-3 font-semibold text-cortex-blue transition-all duration-200 hover:bg-cortex-blue hover:text-white">
              Secondary Button
            </button>

            {/* Card */}
            <div className="rounded-xl border border-gray-800 bg-dark-secondary p-6 transition-all duration-200 hover:border-cortex-blue/50 hover:shadow-cortex">
              <h3 className="mb-2 text-lg font-semibold">Feature Card</h3>
              <p className="text-sm text-gray-400">
                Example card component with hover effects and brand styling.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
