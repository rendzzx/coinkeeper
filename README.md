# CoinKeeper - Personal Finance Management App

Welcome to CoinKeeper, a personal finance management application designed to help you easily track your income, expenses, and budgets. This application runs entirely in your browser, ensuring your financial data remains private and under your control.

---
### Key Features

- **Automatic Data Saving**: All your data is automatically and securely stored in your browser using IndexedDB. Your progress is always saved, even if you close the tab or browser.
- **Interactive Dashboard**: Get a summary of your financial condition at a glance. Dashboard cards can be customized (shown/hidden) and rearranged to your liking.
- **Multi-Wallet Management**: Track balances from various fund sources like bank accounts, e-wallets, or cash.
- **Transaction Tracking**: Easily record income, expenses, and transfers between wallets.
- **Scheduled Transactions**: Set up recurring income or expenses (like salaries or bills) that are automatically recorded on their due date.
- **Debt & Loan Tracker**: Manage money you owe or that others owe you, and track payments linked to those debts.
- **Monthly & One-Time Budgets**: Set budgets for specific expense categories for a month or a custom period, and receive notifications when you approach or exceed the limit.
- **Visual Reports**: Analyze financial trends, expense distribution, and income sources through easy-to-read charts.
- **Full Customization**:
    - **Categories & Tags**: Create custom categories, subcategories, and tags to group your transactions.
    - **Appearance**: Choose between light, dark, or system themes. Customize the dashboard layout and sidebar menu order.
    - **Preferences**: Adjust currency, language (English & Indonesian), and number formats.
- **Secure Data Backup & Migration**: Back up your entire application data into a single, password-protected encrypted file to move it between devices or browsers.

---

### Application Flow

#### 1. Main Dashboard
When you open the application, you'll be greeted by the main dashboard. Here you can see a summary of your finances. You can press the pencil icon to enter **Edit Mode** and drag-and-drop cards to reorder them.

#### 2. Managing Wallets
- Visit the **Wallets** page to see all your fund sources.
- Press the **(+)** button to add a new wallet, such as a bank account or e-wallet.

#### 3. Recording Transactions
- The **Transactions** page is your central hub of activity.
- Use the **(+)** button to open the transaction form. You can choose to record an **Expense**, **Income**, or a **Transfer** between your wallets.

#### 4. Setting Budgets
- On the **Budgets** page, you can set a spending limit for a specific category or tag. Budgets can be **monthly** (recurring) or for a **one-time** custom period.
- The application will visually display your budget usage progress and notify you if you're near the limit.

#### 5. Scheduled Transactions
- The **Scheduled** page allows you to automate recurring transactions.
- You can set up schedules for bills, salary, or any regular payment. The app will automatically create the transaction on the specified date.

#### 6. Debt & Loan Tracker
- On the **Debts** page, you can manage money you've lent or borrowed.
- Add a new debt or loan, and then record payments against it. The app will track the remaining balance for you.

#### 7. Reports
- The **Reports** page provides an in-depth analysis of your financial health.
- Use the date filter to define the analysis period (e.g., the last 3 months or the entire year).

#### 8. Settings
On the **Settings** page, you can perform full customization of preferences, appearance, and data categories. This is also where the **Export/Import Data** feature is located for backups.

---

### Important: Data Storage & Security

This application is designed with **privacy as a top priority**.

- **Automatic Local Storage**: All your data (transactions, wallets, settings) is **automatically stored in your browser's IndexedDB database**. This means your data is persistent and will be there when you return. It is never sent to any server.

- **Data Privacy**: Because the data is stored only on your device, you have complete control. If you clear your browser's site data, all your CoinKeeper data will be erased.

- **Backup & Migration (Export/Import Feature)**:
    - **Purpose**: This feature serves as a manual **backup** and **restore** mechanism. It is ideal for creating save points or for migrating your data to a different browser or device.
    - **Encryption**: When you export, your entire application data is encrypted using an industry-standard (AES-GCM) with a key derived from the password you enter. The resulting `.coinkeeper` file cannot be read without the correct password.
    - **Flow**: To create a backup, **manually export your data** from the Settings page. To restore or migrate, use the **import** feature on the target device/browser and enter your password.

---