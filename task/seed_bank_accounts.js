const db = require("./app/models");
const BankAccount = db.bank_accounts;

const seedBankAccounts = async () => {
    try {
        // Check if any bank accounts already exist
        const count = await BankAccount.count();
        if (count > 0) {
            console.log("Bank accounts already exist. Skipping seed.");
            process.exit();
        }

        const accounts = [
            {
                bank_name: "Хаан Банк",
                account_number: "5003966526",
                account_name: "Tsaas.mn",
                is_active: true,
                display_order: 1,
                color_scheme: "green"
            },
            {
                bank_name: "Голомт Банк",
                account_number: "1105151525",
                account_name: "Tsaas.mn",
                is_active: true,
                display_order: 2,
                color_scheme: "blue"
            }
        ];

        await BankAccount.bulkCreate(accounts);
        console.log("Bank accounts seeded successfully!");
        process.exit();
    } catch (error) {
        console.error("Error seeding bank accounts:", error);
        process.exit(1);
    }
};

seedBankAccounts();
