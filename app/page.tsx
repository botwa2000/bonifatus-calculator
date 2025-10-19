export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm sticky top-0 z-sticky">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Bonifatus
            </h1>
            <nav className="flex gap-4 items-center">
              <a
                href="#features"
                className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors duration-normal"
              >
                Features
              </a>
              <a
                href="#benefits"
                className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors duration-normal"
              >
                Benefits
              </a>
              <a
                href="/login"
                className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors duration-normal"
              >
                Login
              </a>
              <a
                href="/register"
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal"
              >
                Sign Up
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-info-100 dark:bg-info-900/30 rounded-full">
            <span className="text-info-700 dark:text-info-300 text-sm font-medium">
              Coming Soon
            </span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-bold text-neutral-900 dark:text-white mb-6">
            Motivate Academic Excellence
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Through Smart Rewards
            </span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Bonifatus is a progressive web app that helps parents reward their children for academic
            achievement through a transparent, configurable bonus points system. Turn grades into
            motivation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold shadow-button hover:shadow-lg hover:scale-105 transition-all duration-normal">
              Get Started Free
            </button>
            <button className="px-8 py-4 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg font-semibold hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-normal">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white dark:bg-neutral-800/50 rounded-3xl my-12 shadow-card"
      >
        <div className="text-center mb-16">
          <h3 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">
            Powerful Features for Modern Families
          </h3>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            Everything you need to create a transparent and motivating reward system for academic
            achievement
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-info-50 to-info-100 dark:from-info-900/20 dark:to-info-800/20 hover:shadow-lg transition-shadow duration-normal duration-normal">
            <div className="w-12 h-12 bg-info-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Smart Bonus Calculator
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">
              Real-time calculation based on grades with customizable factors for class level, term
              type, and subject importance
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 hover:shadow-lg transition-shadow duration-normal duration-normal">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              International Support
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">
              Support for multiple grading systems (A-F, 1-6, percentages) and languages - perfect
              for families anywhere
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 hover:shadow-lg transition-shadow duration-normal">
            <div className="w-12 h-12 bg-success-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Progress Tracking
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">
              Visual analytics and historical tracking to celebrate improvements and identify areas
              for growth
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20 hover:shadow-lg transition-shadow duration-normal">
            <div className="w-12 h-12 bg-warning-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Multi-User Roles
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">
              Separate accounts for parents and children with appropriate permissions and privacy
              controls
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 hover:shadow-lg transition-shadow duration-normal">
            <div className="w-12 h-12 bg-accent-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Privacy & Security
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">
              GDPR and COPPA compliant with encryption, secure authentication, and complete data
              privacy
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20 hover:shadow-lg transition-shadow duration-normal">
            <div className="w-12 h-12 bg-secondary-600 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Progressive Web App
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">
              Works on all devices - install on your phone, tablet, or desktop with offline
              capability
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-6">
              Why Choose Bonifatus?
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                    Transparent Motivation
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Children understand exactly how their efforts translate into rewards, creating
                    clear goals and motivation
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                    Fully Customizable
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Adjust bonus factors to match your family values and your child&apos;s unique
                    learning journey
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                    Data-Driven Insights
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Track progress over time, identify strengths and weaknesses, and celebrate
                    improvements together
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
                    Child-Safe Platform
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Built with child safety in mind, COPPA and GDPR compliant with parental controls
                    and privacy protection
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-2xl p-8 h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
                100% Free
              </div>
              <p className="text-xl text-neutral-700 dark:text-neutral-300 mb-2">
                No credit card required
              </p>
              <p className="text-neutral-600 dark:text-neutral-400">Forever free for families</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Academic Motivation?
          </h3>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join families worldwide who are using Bonifatus to celebrate academic achievement and
            build positive learning habits
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200">
              Start Your Free Account
            </button>
            <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-all duration-200">
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-neutral-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
                Bonifatus
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Empowering families to celebrate academic achievement through transparent,
                motivating rewards.
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">
                Work in Progress - Coming Soon
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Product</h3>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  <a
                    href="#features"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#benefits"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Benefits
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Company</h3>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-neutral-600 dark:text-neutral-400 text-sm">
            <p>&copy; 2025 Bonifatus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
