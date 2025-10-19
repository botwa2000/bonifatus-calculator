import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-card p-8">
          <div className="mb-8">
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-semibold transition-colors duration-normal"
            >
              ← Back to Home
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-6">
            Privacy Policy
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              <strong>Last Updated:</strong> January 19, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                Coming Soon
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                We are currently finalizing our Privacy Policy. This document will explain how we
                collect, use, store, and protect your personal information, including compliance
                with GDPR and COPPA regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                Our Commitment to Privacy
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Bonifatus is committed to protecting your privacy and the privacy of your family. We
                will:
              </p>
              <ul className="list-disc pl-6 text-neutral-600 dark:text-neutral-400 space-y-2">
                <li>Never sell your personal data</li>
                <li>Use encryption to protect sensitive information</li>
                <li>Comply with GDPR and COPPA regulations</li>
                <li>Give you control over your data</li>
                <li>Be transparent about our data practices</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-4">
                Contact Information
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                If you have any questions about our Privacy Policy, please contact us at:{' '}
                <a
                  href="mailto:privacy@bonifatus.com"
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  privacy@bonifatus.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
