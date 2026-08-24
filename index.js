const { createBTC, formatBTC, BitcoinWallet, generateRandomBTC } = require('./bitcoin');

console.log('=== Bitcoin Money Generator ===\n');

// Create a wallet with initial balance
const myWallet = new BitcoinWallet(0.1);
console.log(`Wallet created with balance: ${myWallet.formatBalance()}`);

// Generate and deposit random Bitcoin
const randomAmount = generateRandomBTC(0.001, 0.01);
console.log(`\nGenerated random amount: ${formatBTC(randomAmount)}`);

myWallet.deposit(randomAmount);
console.log(`After deposit: ${myWallet.formatBalance()}`);

// Withdraw some Bitcoin
const withdrawAmount = createBTC(0.02);
try {
  myWallet.withdraw(withdrawAmount);
  console.log(`After withdrawal: ${myWallet.formatBalance()}`);
} catch (error) {
  console.log(`Withdrawal failed: ${error.message}`);
}

// Show final balance
console.log(`\nFinal balance: ${myWallet.formatBalance()}`);
