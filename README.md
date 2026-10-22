MCCU Financial Calculators

A custom WordPress plugin that replaces legacy iFrame-based financial calculators with a modern, fast, and accessible React application. Built specifically to integrate seamlessly with Divi 5, this plugin encapsulates complex financial mathematics while protecting the global WordPress theme styles.

🚀 Features

Consolidated Math Engine: Uses pure, decoupled TypeScript functions to handle strict financial formulas without UI lockups.

Theme-Safe Styling: Tailwind CSS is scoped specifically to the calculator container. Preflight resets are intentionally disabled to prevent conflicts with Divi 5 global styles.

Single Shortcode Architecture: A lightweight PHP wrapper reads a type attribute and dynamically mounts the correct React component.

Fast & Lightweight: Compiles to a single IIFE JavaScript bundle (calculator.js) and a single CSS file. WordPress only enqueues these assets on pages where the shortcode is actually used.

🧮 Calculators Included

This plugin powers 6 different financial calculators using two core engines (Amortization and Compound Interest):

Calculate Your Loan Payment (loan-payment)

How Much Loan Can I Afford? (how-much-loan-can-i-afford)

Home Refinance Savings (home-refinance)

Bi-Weekly Mortgage Payment (bi-weekly-mortgage)

Build Your Savings (build-savings)

Future Value Interest (future-value-interest)

🛠️ Tech Stack

Front-End: React 18, TypeScript, Tailwind CSS v3

Build Tool: Vite (Configured for standard IIFE output, no code-splitting)

Data Visualization: Recharts

Back-End: PHP (WordPress Plugin API)

💻 Local Development Setup

To work on this plugin locally, you will need Node.js installed.

Clone the repository:

git clone https://github.com/your-username/mccu-calculators.git


Navigate into the directory and install dependencies:

cd mccu-calculators
npm install


Start the local development server to test the React UIs independently of WordPress:

npm run dev


📦 Production Build & Deployment

Because this is a WordPress plugin, you do not upload the src folder or node_modules to the live site. You must compile the code first.

Generate the production build:

npm run build


This command bundles everything into optimized files inside the dist/ directory.

Package for WordPress:

Create a ZIP archive containing only the mccu-calculators.php file and the dist/ folder.

Make sure the zipped folder is named mccu-calculators.

Install in WordPress:

Go to Plugins > Add New Plugin > Upload Plugin.

Upload mccu-calculators.zip and click Activate.

📝 Usage

Once the plugin is activated, you can drop the shortcode into any WordPress page, post, or Divi module. Use the type attribute to dictate which calculator renders.

Examples:

[mccu_calculator type="loan-payment"]

[mccu_calculator type="home-refinance"]

[mccu_calculator type="build-savings"]

⚠️ Important Notes for Future Developers

Tailwind Preflight: Do not re-enable Tailwind's preflight in tailwind.config.js. It will strip Divi's global margins, headings, and list styles across the entire page. Explicitly style your inputs and containers.

Asset Naming: vite.config.ts is strictly configured to output static names (calculator.js and style.css). Do not enable hashing, or the PHP wp_enqueue_script functions will break.
